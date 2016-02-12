#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_RUNTIME_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_RUNTIME_H_

#include <iostream>
#include <memory>
#include <vector>

#include "wtf/buffer.h"
#include "wtf/event.h"
#include "wtf/platform.h"

namespace wtf {

// Singleton runtime class, which serves as the main entry point to WTF
// functionality.
//
// All functionality of this class is thread safe.
class Runtime {
 public:
  // Options controlling save.
  struct SaveOptions {
    SaveOptions() : clear_thread_data(false) {}
    SaveOptions(bool clear_thread_data)
        : clear_thread_data(clear_thread_data) {}

    // Clear saved thread data. Note that this will not clear shared data,
    // which currently includes the string table and event registration buffers.
    bool clear_thread_data;
  };

  // Default save options.
  static const SaveOptions kSaveOptionsDefault;

  // Save options that clear thread data.
  static const SaveOptions kSaveOptionsClearThreadData;

  // Gets the singleton instance.
  // Note that calling through to the instance is reserved for "heavy-weight"
  // operations. Logging events happens without involving this instance.
  static Runtime* GetInstance();

  // Enables the current thread for WTF data collection. This no-ops if
  // already enabled.
  void EnableCurrentThread(const char* thread_name, const char* type = nullptr,
                           const char* location = nullptr);

  // Disables WTF data collection for this thread. Note that any collected
  // data will still be present. This is largely intended for testing.
  void DisableCurrentThread();

  // Saves the current WTF trace file for all threads. This is mostly non
  // disruptive to concurrent operations, but there are a couple of sync
  // points that are unavoidable.
  // Returns: Whether the trace was saved properly (covers both logical and
  // IO errors).
  bool Save(std::ostream* out,
            const SaveOptions& save_options = kSaveOptionsDefault);

  // Shortcut to Save(ostream) that saves to a file.
  // Returns: Whether the trace was saved properly (covers both logical and
  // IO errors).
  bool SaveToFile(const std::string& file_name,
                  const SaveOptions& save_options = kSaveOptionsDefault);

  // Asynchronously clears thread data. This is similar to passing
  // a clear_thread_data option to a Save() method, except that when doing it
  // at save time, only the saved data is cleared.
  void ClearThreadData();

  // Resets the WTF runtime state. This is intended for testing and may fail
  // or cause crashes if called when asynchronous logging is not quiesced.
  void ResetForTesting();

 private:
  Runtime();
  Runtime(const Runtime&) = delete;
  void operator=(const Runtime&) = delete;

  // Creates an EventBuffer bound for a thread local, and adds it to the list
  // of owned instances.
  EventBuffer* CreateThreadEventBuffer();

  // Writes the header chunk.
  void WriteHeaderChunk(OutputBuffer* output_buffer);

  platform::mutex mu_;
  StringTable shared_string_table_;
  std::vector<std::unique_ptr<EventBuffer>> thread_event_buffers_;
};

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_RUNTIME_H_
