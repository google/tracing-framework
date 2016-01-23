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
  std::lock_guard<std::mutex> lock{mu_};
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
  std::lock_guard<std::mutex> lock{mu_};

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
  std::lock_guard<std::mutex> lock{mu_};

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
  std::lock_guard<std::mutex> lock{mu_};
  strings_.clear();
  strings_to_id_.clear();
}

EventBuffer::EventBuffer(StringTable* string_table)
    : string_table_(string_table) {
  entries_.clear();
}

void EventBuffer::PopulateHeader(OutputBuffer::PartHeader* header) {
  header->type = 0x20002;
  header->offset = 0;
  header->length = entries_.size() * sizeof(uint32_t);
}

bool EventBuffer::WriteTo(OutputBuffer::PartHeader* header,
                          OutputBuffer* output_buffer) {
  size_t count = header->length / sizeof(uint32_t);
  for (size_t i = 0; i < count; i++) {
    output_buffer->AppendUint32(entries_[i]);
  }
  return true;
}

}  // namespace wtf
