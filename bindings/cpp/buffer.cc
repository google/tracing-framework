#include "wtf/buffer.h"

namespace wtf {

OutputBuffer::OutputBuffer(std::ostream* out) : out_{out} {}

void OutputBuffer::StartChunk(ChunkHeader header, PartHeader* parts,
                              size_t part_count) {
  static constexpr size_t kChunkHeaderSize = 6 * sizeof(uint32_t);
  static constexpr size_t kPartHeaderSize = 3 * sizeof(uint32_t);

  // Compute layout.
  uint32_t chunk_length = kChunkHeaderSize + part_count * kPartHeaderSize;
  uint32_t part_offset = 0;
  for (size_t i = 0; i < part_count; i++) {
    PartHeader* part = &parts[i];
    part->offset = part_offset;

    // Compute aligned length.
    uint32_t aligned_length = part->length;
    uint32_t rem = aligned_length % kAlignment;
    if (rem) {
      aligned_length += kAlignment - rem;
    }

    chunk_length += aligned_length;
    part_offset += aligned_length;
  }

  // Write out chunk header.
  AppendUint32(header.id);
  AppendUint32(header.type);
  AppendUint32(chunk_length);
  AppendUint32(header.start_time);
  AppendUint32(header.end_time);
  AppendUint32(part_count);

  // Write out each part snapshot.
  for (size_t i = 0; i < part_count; i++) {
    PartHeader* part = &parts[i];
    AppendUint32(part->type);
    AppendUint32(part->offset);
    AppendUint32(part->length);
  }
}

StringTable::StringTable() = default;

int StringTable::GetStringId(const std::string& str) {
  if (str.empty()) {
    return kEmptyStringId;
  }

  platform::lock_guard<platform::mutex> lock{mu_};
  auto it = strings_to_id_.find(str);
  if (it == strings_to_id_.end()) {
    // New string.
    int id = strings_.size();
    strings_.push_back(str);
    strings_to_id_[str] = id;
    return id;
  } else {
    return it->second;
  }
}

void StringTable::PopulateHeader(OutputBuffer::PartHeader* header) {
  platform::lock_guard<platform::mutex> lock{mu_};

  // Compute size.
  size_t raw_length = 0;
  for (const auto& s : strings_) {
    raw_length += s.size() + 1;
  }

  header->type = 0x30000;
  header->offset = 0;
  header->length = raw_length;
}

bool StringTable::WriteTo(OutputBuffer::PartHeader* header,
                          OutputBuffer* output_buffer) {
  platform::lock_guard<platform::mutex> lock{mu_};

  // Output up to the previously noted size.
  size_t raw_length = 0;
  size_t expected_raw_length = header->length;
  for (const auto& s : strings_) {
    raw_length += s.size() + 1;
    if (raw_length <= expected_raw_length) {
      output_buffer->Append(s.c_str(), s.size() + 1);  // Write null term.
      if (raw_length == expected_raw_length) {
        // Clean end.
        break;
      }
    } else {
      return false;
    }
  }
  output_buffer->Align();
  return true;
}

void StringTable::Clear() {
  platform::lock_guard<platform::mutex> lock{mu_};
  strings_.clear();
  strings_to_id_.clear();
}

EventBuffer::EventBuffer(size_t chunk_size_bytes) {
  if (chunk_size_bytes < kMinimumChunkSizeBytes) {
    chunk_size_bytes = kMinimumChunkSizeBytes;
  }
  chunk_limit_ = chunk_size_bytes / sizeof(uint32_t);

  head_ = current_ = new Chunk(chunk_limit_);
}

EventBuffer::~EventBuffer() {
  Chunk* chunk = head_;
  while (chunk) {
    Chunk* next_chunk = chunk->next;
    delete chunk;
    chunk = next_chunk;
  }
}

void EventBuffer::FreezePrefixSlots() {
  Chunk* chunk = current_;
  frozen_prefix_slots_.resize(chunk->size);
  for (size_t i = 0; i < frozen_prefix_slots_.size(); i++) {
    frozen_prefix_slots_[i] = chunk->slots[i];
  }
  chunk->size = 0;
  chunk->published_size = 0;
}

uint32_t* EventBuffer::ExpandAndAddSlots(size_t count) {
  // Publish the final size of the old chunk.
  Flush();

  // Publish that we have a new 'count' sized chunk.
  // This must come after the store to published_size as it signifies that no
  // further updates will be made to published_size.
  Chunk* new_chunk = new Chunk(chunk_limit_);
  new_chunk->size = count;
  current_->next.store(new_chunk, platform::memory_order_release);

  // Make new chunk current (does not modify shared state).
  current_ = new_chunk;

  return new_chunk->slots;
}

void EventBuffer::PopulateHeader(OutputBuffer::PartHeader* header) {
  size_t published_slot_count = 0;
  Chunk* chunk = head_;
  while (chunk) {
    // The next chunk must be loaded prior to loading the published size of
    // the current chunk, otherwise, there is the potential for an asynchronous
    // writer to overflow to the next chunk in a way that the reader skips
    // final updates to published_size on this chunk prior to that being
    // visible.
    Chunk* next_chunk = chunk->next.load(platform::memory_order_acquire);
    published_slot_count +=
        chunk->published_size.load(platform::memory_order_acquire) -
        chunk->skip_count;

    chunk = next_chunk;
  }

  header->type = 0x20002;
  header->offset = 0;
  header->length =
      (frozen_prefix_slots().size() + published_slot_count) * sizeof(uint32_t);
}

bool EventBuffer::WriteTo(OutputBuffer::PartHeader* header,
                          OutputBuffer* output_buffer,
                          bool clear_written_data) {
  Chunk* chunk = head_;
  size_t count = header->length / sizeof(uint32_t);

  // Write the frozen prefix.
  if (count < frozen_prefix_slots_.size()) {
    return false;
  }
  count -= frozen_prefix_slots_.size();
  for (uint32_t prefix_value : frozen_prefix_slots_) {
    if (output_buffer) {
      output_buffer->AppendUint32(prefix_value);
    }
  }

  // Write the main part of the buffer chunk by chunk.
  while (count > 0) {
    if (!chunk) {
      // Size mismatch.
      return false;
    }

    // Load the next chunk in the list early. If this is not null, it is
    // absolutely guaranteed that the writer will not make any further
    // updates to this chunk. Switching these loads weakens the guarantee.
    Chunk* next_chunk = chunk->next.load(platform::memory_order_acquire);
    size_t published_size =
        chunk->published_size.load(platform::memory_order_acquire);

    size_t skip_count = chunk->skip_count;
    size_t remaining = published_size - skip_count;
    if (remaining > count) {
      remaining = count;
    }

    // Write the remaining slots.
    for (size_t i = 0; i < remaining; i++) {
      if (output_buffer) {
        output_buffer->AppendUint32(chunk->slots[skip_count + i]);
      }
    }
    count -= remaining;

    // Clear data and reset head if applicable.
    if (clear_written_data) {
      chunk->skip_count += remaining;
      // If the writer is done with this one (next_chunk != nullptr),
      // we are moving on to the next chunk (count > 0), and we are on the
      // head_, then kill it and reset the head.
      if (next_chunk && count > 0 && chunk == head_) {
        // TODO(laurenzo): Put these back into a thread local pool and re-use
        // them.
        delete head_;
        head_ = next_chunk;
      }
    }

    chunk = next_chunk;
  }
  return true;
}

}  // namespace wtf
