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
//
// Saving:
// -------
// The most common interaction that most parties will have with the Runtime
// class will be to save trace files. There are several ways that this can
// be done.
//
// Saving a Full File:
// -------------------
// Save and do not clear:
//   assert(Runtime::GetRuntime()::SaveToFile("filename.wtf-trace"));
// Save and and clear:
//   assert(Runtime::GetRuntime()::SaveToFile("filename.wtf-trace"),
//              Runtime::SaveOptions::ForClear());
//
// Incrementally Saving:
// ---------------------
// In this mode, something in the process is expected to repeatedly call
// SaveToFile in a way that causes it to append new data. Internal state is
// recorded in a SaveCheckpoint so that writing can resume with a minimum
// of repeated data on the next call to save.
//
// In this mode, thread data is destructively cleared upon write and only new
// metadata will be written on each call to save. If using SaveToFile()
// (versus passing an ostream directly), the system will detect if the file
// exists. If so, it assumes that it is continuing a save. If not, it will
// reset its checkpoint, starting a new file. In this way, the file can be
// externally deleted without further intervention.
//
// Example:
//   Runtime::SaveCheckpoint checkpoint;
//   while (true) {
//     assert(Runtime::GetRuntime()::SaveToFile(
//                "streaming.wtf-trace",
//                Runtime::SaveOptions::ForStreamingFile(&checkpoint)));
//     sleep(5);
//   }
class Runtime {
 public:
  // A pointer to a SaveCheckpoint can be set in SaveOptions. Passing the
  // SaveCheckpoint from a previous save iteration to a future one will cause
  // only updates to be streamed out. This is really only valid when appending
  // or concatenating output trace files since subsequent chunks do not have
  // all data that they need to function.
  class SaveCheckpoint {
   public:
    SaveCheckpoint() = default;

   private:
    // Whether this is still the first save operation.
    bool needs_file_header = true;

    // The index of the first event definition that needs to be written out.
    size_t event_definition_from_index_ = 0;

    // The index of the first zone registration that needs to be written out.
    size_t zone_definition_from_index_ = 0;

    friend class Runtime;
  };

  // Options controlling save.
  struct SaveOptions {
    static const SaveOptions kDefault;

    SaveOptions() = default;

    // Creates options configured to clear thread data on save.
    static SaveOptions ForClear() {
      SaveOptions options;
      options.clear_thread_data = true;
      return options;
    }

    // Creates options configured for streaming to a single file that is
    // opened for append.
    // The checkpoint should be retained until the file is no longer being
    // saved to.
    static SaveOptions ForStreamingFile(SaveCheckpoint* checkpoint) {
      SaveOptions options;
      options.checkpoint = checkpoint;
      options.clear_thread_data = true;
      options.open_mode = std::ios_base::app;
      return options;
    }

    // Creates options configured for streaming to multiple files that will
    // be externally concatenated in some way.
    // The checkpoint should be retained until the file is no longer being
    // saved to.
    static SaveOptions ForStreamingMulti(SaveCheckpoint* checkpoint) {
      SaveOptions options;
      options.checkpoint = checkpoint;
      options.clear_thread_data = true;
      return options;
    }

    // If set, a checkpointed save will be done. Only updates from the last
    // save will be written and this field will be updated to reflect the
    // current state. This implies clear_thread_data and is generally best
    // used with open_for_append.
    SaveCheckpoint* checkpoint = nullptr;

    // Clear saved thread data. Note that this will not clear shared data,
    // which currently includes the string table and event registration buffers.
    bool clear_thread_data = false;

    // The open mode to use if a file is being opened. Defaults to trunc.
    // out is implied.
    std::ios_base::openmode open_mode = std::ios_base::trunc;
  };

  // Gets the singleton instance.
  // Note that calling through to the instance is reserved for "heavy-weight"
  // operations. Logging events happens without involving this instance.
  static Runtime* GetInstance();

  // Enables the current thread for WTF data collection. This no-ops if
  // already enabled.
  void EnableCurrentThread(const char* thread_name, const char* type = nullptr,
                           const char* location = nullptr);

  // Registers an external thread returning an EventBuffer that will be
  // retained for the life of the Runtime. This is useful for merging
  // event-like constructs from entities other than threads (other cores, ISR,
  // etc). With great power comes great responsibility: it is up to you to
  // obey all of the rules of writing to an EventBuffer, the most important
  // of which is to only write from one thread concurrently. You must also
  // make sure that any timestamps or event ids that you add are consistent
  // with the overall system.
  EventBuffer* RegisterExternalThread(const char* thread_name,
                                      const char* type = nullptr,
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
            const SaveOptions& save_options = SaveOptions::kDefault);

  // Shortcut to Save(ostream) that saves to a file.
  // Returns: Whether the trace was saved properly (covers both logical and
  // IO errors).
  bool SaveToFile(const std::string& file_name,
                  const SaveOptions& save_options = SaveOptions::kDefault);

  // Asynchronously clears thread data. This is similar to passing
  // a clear_thread_data option to a Save() method, except that when doing it
  // at save time, only the saved data is cleared.
  void ClearThreadData();

  // Resets the WTF runtime state. This is intended for testing and may fail
  // or cause crashes if called when asynchronous logging is not quiesced.
  void ResetForTesting();

  // Pops an idle EventBuffer for the given task and then returns it when
  // done. Typically used via the ScopedTask class.
  EventBuffer* PopTaskEventBuffer(const std::string& name);
  void PushTaskEventBuffer(const std::string& name, EventBuffer* event_buffer);

 private:
  // Each named task has an info descriptor with the idle event buffers.
  struct TaskDefinition {
    int next_instance_id = 0;
    std::deque<EventBuffer*> idle_event_buffers;
  };

  Runtime();
  Runtime(const Runtime&) = delete;
  void operator=(const Runtime&) = delete;

  // Creates an EventBuffer bound for a thread local, and adds it to the list
  // of owned instances.
  EventBuffer* CreateThreadEventBuffer();

  platform::mutex mu_;
  std::vector<std::unique_ptr<EventBuffer>> thread_event_buffers_;
  std::unordered_map<std::string, TaskDefinition> tasks_;
  int uniquifier_ = 0;
};

// Represents a temporary assignment of an EventBuffer to a thread.
// The previous state is restored when the ScopedTask goes out of
// scope.
template <bool kEnable>
class ScopedTaskIf {
 public:
  explicit ScopedTaskIf(std::string name)
      : name_(std::move(name)),
        previous_event_buffer_(PlatformGetThreadLocalEventBuffer()) {
    PlatformSetThreadLocalEventBuffer(
        Runtime::GetInstance()->PopTaskEventBuffer(name_));
  }
  ~ScopedTaskIf() {
    Runtime::GetInstance()->PushTaskEventBuffer(
        name_, PlatformGetThreadLocalEventBuffer());
    PlatformSetThreadLocalEventBuffer(previous_event_buffer_);
  }
  ScopedTaskIf(const ScopedTaskIf&) = delete;
  void operator=(const ScopedTaskIf&) = delete;

 private:
  std::string name_;
  EventBuffer* previous_event_buffer_;
};

// Explicit disabled instantiation of ScopedTaskIf.
template <>
class ScopedTaskIf<false> {
 public:
  explicit ScopedTaskIf(std::string name) {}
  ~ScopedTaskIf() = default;
  ScopedTaskIf(const ScopedTaskIf&) = delete;
  void operator=(const ScopedTaskIf&) = delete;
};

using ScopedTask = ScopedTaskIf<kMasterEnable>;
using ScopedTaskEnabled = ScopedTaskIf<true>;

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_RUNTIME_H_
