#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_BUFFER_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_BUFFER_H_

#include <deque>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

// FIXME stuff in platform.h needs to know about StringTable and EventBuffer,
// but this file needs to know about stuff in the platform, like mutexes.
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
// These buffers are not thread safe: It is expected that there will be one
// per thread.
class EventBuffer {
 public:
  // Disallow copy/assignment.
  EventBuffer(const EventBuffer&) = delete;
  void operator=(const EventBuffer&) = delete;

  // Initialize the EventBuffer with a shared string table (must remain valid
  // through the life of the instance).
  explicit EventBuffer(StringTable* string_table);

  // Adds an entry to the end of the deque.
  // TODO(laurenzo): This will need to change to an atomic operation/data
  // structure before it is useful for any level of concurrency without
  // hazzards trying to dump the data.
  void AddEntry(uint32_t entry) { entries_.push_back(entry); }

  // Gets the string table for this buffer.
  StringTable* string_table() { return string_table_; }

  // When the thread owning an EventBuffer dies, it may call this method,
  // which will allow the system to release the EventBuffer.
  void MarkOutOfScope() { out_of_scope_.store(true); }

  // Populate the part header for this part.
  void PopulateHeader(OutputBuffer::PartHeader* header);

  // Writes the EventBuffer to the OutputBuffer using a header previously
  // populated via PopulateHeader(). Note that the buffer may have grown
  // since the time of PopulateHeader() and only the amount noted there will
  // be written.
  // NOTE: No verification is done to ensure that the buffer is in a
  // consistent state. In general, it should be assumed that full transactions
  // are present but there may be unbalanced enter/leaves.
  // Returns: Whether the buffer was serialized properly.
  bool WriteTo(OutputBuffer::PartHeader* header, OutputBuffer* output_buffer);

  // Whether the event buffer is empty. It is only valid to call this from the
  // hosting thread. Mainly for testing.
  bool empty() { return entries_.empty(); }

  // Clears the event buffer. This will most likely corrupt the WTF output
  // but can be useful for testing. It is only valid to call this from the
  // hosting thread.
  void clear() { entries_.clear(); }

 private:
  static constexpr size_t kInitialSize = 1024;
  StringTable* string_table_;
  std::deque<uint32_t> entries_{kInitialSize};
  platform::atomic<bool> out_of_scope_{false};
};

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_BUFFER_H_
