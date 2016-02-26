#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_BUFFER_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_BUFFER_H_

#include <deque>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

#include "wtf/platform.h"

namespace wtf {

// Wraps an ostream with facilities needed for generating WTF output.
class OutputBuffer {
 public:
  static constexpr size_t kAlignment = 4;

  // Layout of parts within a chunk is done by first getting a snapshot for
  // each part, then computing order and offsets, and then writing out data.
  struct PartHeader {
    // The WTF wire protocol calls for these three fields to be written
    // in the header section for each part.
    uint32_t type;
    uint32_t offset;
    uint32_t length;
  };

  // Parameters that define a chunk.
  struct ChunkHeader {
    uint32_t id;
    uint32_t type;
    uint32_t start_time;
    uint32_t end_time;
  };

  // Disallow copy/assignment.
  OutputBuffer(const OutputBuffer&) = delete;
  void operator=(const OutputBuffer&) = delete;

  explicit OutputBuffer(std::ostream* out);
  void Append(const void* m, size_t len) {
    out_->write(static_cast<const char*>(m), len);
    written_ += len;
  }

  void AppendUint32(uint32_t value) {
    // TODO(laurenzo): Byte swap BE.
    Append(static_cast<void*>(&value), sizeof(uint32_t));
  }

  void Align() {
    static const char kNulls[kAlignment] = {0};
    size_t rem = written_ % kAlignment;
    if (rem) {
      rem = kAlignment - rem;
      out_->write(kNulls, rem);
      written_ += rem;
    }
  }

  // Writes a chunk header where the chunk will consist of the given list
  // of PartSnapshots. Actual offsets of each part will be computed and
  // updated by this method assuming that parts will be written in order
  // with proper alignment.
  void StartChunk(ChunkHeader header, PartHeader* parts, size_t part_count);

 private:
  size_t written_ = 0;
  std::ostream* out_;
};

// Maintains canonical strings.
//
// There should be one shared StringTable for all threads. This class is thread
// safe.
//
// Strings in WTF are common in metadata and are technically allowed in
// regular events. Their use, however, is not optimized for the latter case.
class StringTable {
 public:
  // Disallow copy/assignment.
  StringTable(const StringTable&) = delete;
  void operator=(const StringTable&) = delete;

  static constexpr int kEmptyStringId = -1;
  StringTable();

  // Get the id for a string.
  int GetStringId(const std::string& str);

  // Populate the part header for this part.
  // Note that this should be called *after* any bits that may have contributed
  // to the table so that it includes at least as many strings as have been
  // referenced.
  void PopulateHeader(OutputBuffer::PartHeader* header);

  // Writes the string table to the OutputBuffer using a header previously
  // computed via PopulateHeader. Note that the table may have grown since
  // then and only the amount noted will be written.
  // Returns: Whether the table was serialized properly.
  bool WriteTo(OutputBuffer::PartHeader* header, OutputBuffer* output_buffer);

  // Clears the string table. Intended for testing.
  void Clear();

 private:
  platform::mutex mu_;
  std::vector<std::string> strings_;
  std::unordered_map<std::string, int> strings_to_id_;
};

// Buffer for raw event data.
// These buffers are safe for at most one thread to write and one thread to
// read.
class EventBuffer {
 public:
  // Default and minimum chunk sizes in bytes. We set the minimum conservatively
  // as it is impossible to write a single transaction that spans chunks (i.e.
  // an event with lots of arguments).
  static constexpr size_t kDefaultChunkSizeBytes = 16 * 1024;
  static constexpr size_t kMinimumChunkSizeBytes = 1024;

  // The maximum number of slots that can be satisfied by a call to AddSlots().
  static constexpr size_t kMaximumAddSlotsCount =
      kMinimumChunkSizeBytes / sizeof(uint32_t);

  // Singly linked list of chunks. A chunk is a sequence of 32bit slots that
  // keeps track of its fill level. Writing is always assumed to happen from
  // a single thread. Reading is expected to happen from at most one thread
  // at a time and can only "see" as far into the linked list as is published
  // in the shared reader_chunk_slots_available_.
  struct Chunk {
    explicit Chunk(size_t limit) : limit(limit), slots(new uint32_t[limit]) {}
    ~Chunk() { delete[] slots; }

    // The number of slots that are allocated.
    // Access: Any thread.
    const size_t limit;

    // The number of slots that have been filled.
    // Access: Writer thread only.
    size_t size = 0;

    // The array of slots (allocated 'limit' entries).
    // Access: Reader and writer threads.
    // Guarantees: All indices reported by published_size are consistent for
    // access from the reader thread.
    uint32_t* slots;

    // The size as visible to readers.
    // Access: Written by writer, read by reader.
    platform::atomic<size_t> published_size{0};

    // The next chunk, if any.
    // Access: Written by writer as the last step of initializing a new
    // chunk. Read by reader when dumping the buffer.
    platform::atomic<Chunk*> next{nullptr};

    // The number of slots that the reader should skip.
    // Access: Read and written by reader.
    size_t skip_count = 0;
  };

  // Disallow copy/assignment.
  EventBuffer(const EventBuffer&) = delete;
  void operator=(const EventBuffer&) = delete;

  // Initializes with a custom chunk size, which specifies how much space
  // is reserved and how much the buffer expands by on overflow.
  explicit EventBuffer(size_t chunk_size_bytes);

  // Initialize with a StringTable and defaults.
  EventBuffer() : EventBuffer(kDefaultChunkSizeBytes) {}
  ~EventBuffer();

  // Gets a pointer to a location where 'count' slots can be written, increasing
  // the writer-visible size accordingly. It is expected that the caller
  // populate the slots prior to calling Flush() or performing another call
  // to WriteSlots().
  // Note that it is expected that this function will be inlined in many
  // contexts. We bail to an opaque function call for exceptional cases.
  // It is illegal to call with count > kMaximumAddSlotsCount.
  // Access: Writer thread.
  uint32_t* AddSlots(size_t count) {
    Chunk* chunk = current_;
    size_t new_size = chunk->size + count;
    if (new_size > chunk->limit) {
      return ExpandAndAddSlots(count);
    }
    uint32_t* slots = chunk->slots + chunk->size;
    chunk->size = new_size;
    return slots;
  }

  // To be called after initial slots have been added. They will be transferred
  // to frozen_prefix_slots_ and cleared from the EventBuffer proper. This
  // must be done prior to ordinary use of the EventBuffer. It is not possible
  // to freeze a prefix that spans beyond one chunk.
  void FreezePrefixSlots();

  // Gets the frozen prefix slots that must be appended whenever the EventBuffer
  // is serialized.
  const std::vector<uint32_t>& frozen_prefix_slots() {
    return frozen_prefix_slots_;
  }

  // Flushes all pending calls to WriteSlots once data has been written. Note
  // that certain operations (i.e. chunk overflow) can cause flushing to
  // happen earlier.
  void Flush() {
    // Publish the size.
    current_->published_size.store(current_->size,
                                   platform::memory_order_release);
  }

  // Gets the string table for this buffer.
  StringTable* string_table() { return &string_table_; }

  // When the thread owning an EventBuffer dies, it may call this method,
  // which will allow the system to release the EventBuffer.
  void MarkOutOfScope() { out_of_scope_.store(true); }

  // Populate the part header for this part.
  void PopulateHeader(OutputBuffer::PartHeader* header);

  // Writes the EventBuffer to the OutputBuffer using a header previously
  // populated via PopulateHeader(). Note that the buffer may have grown
  // since the time of PopulateHeader() and only the amount noted there will
  // be written.
  // This method can optionally clear data as it is writing. In this mode,
  // it is valid to pass output_buffer == nullptr, which does a dummy write
  // and clears.
  // NOTE: No verification is done to ensure that the buffer is in a
  // consistent state. In general, it should be assumed that full transactions
  // are present but there may be unbalanced enter/leaves.
  // Returns: Whether the buffer was serialized properly.
  bool WriteTo(OutputBuffer::PartHeader* header, OutputBuffer* output_buffer,
               bool clear_written_data);

  // Whether the event buffer is empty. It is only valid to call this from the
  // hosting thread.
  // Access: Testing only.
  bool empty() { return head_->size == 0; }

  // Clears the event buffer. This will most likely corrupt the WTF output
  // but can be useful for testing.
  // Access: Testing Only.
  void clear() {
    for (Chunk* chunk = head_; chunk; chunk = chunk->next) {
      chunk->size = 0;
      chunk->published_size = 0;
    }
  }

 private:
  // Expands the buffer by adding a new chunk and returning 'count' slots
  // from it. This has the side effect of publishing the current buffer.
  // This is only called in the overflow case of AddSlots().
  uint32_t* ExpandAndAddSlots(size_t count);

  StringTable string_table_;
  size_t chunk_limit_;
  platform::atomic<bool> out_of_scope_{false};

  // Frozen slots that must be prepended whenever the EventBuffer is written
  // out. This contains any setup events that are needed when writing out
  // an EventBuffer and will be set at initialization time.
  std::vector<uint32_t> frozen_prefix_slots_;

  // The head chunk. This is set at allocation time prior to the instance
  // becoming shared. The last chunk in the list is the only one that will
  // ever be touched by the writer thread.
  // Access: Reader thread.
  Chunk* head_;

  // The current chunk that is being written.
  // Access: Writer thread only.
  Chunk* current_;
};

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_BUFFER_H_
