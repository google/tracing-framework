#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_IMPL_H_

#include <functional>
#include <mutex>

#include "wtf/buffer.h"

namespace wtf {

std::once_flag initialize_once_;

thread_local struct ThreadLocalStorage {
  ThreadLocalStorage() = default;
  ~ThreadLocalStorage() {
    if (event_buffer) {
      event_buffer->MarkOutOfScope();
    }
  }

  EventBuffer* event_buffer = nullptr;
} storage_;

EventBuffer* PlatformGetThreadLocalEventBuffer() {
  return storage_.event_buffer;
}

void PlatformInitializeThreading() {
  std::call_once(initialize_once_, PlatformInitialize);
}

void PlatformSetThreadLocalEventBuffer(EventBuffer* event_buffer) {
  std::call_once(initialize_once_, PlatformInitialize);
  storage_.event_buffer = event_buffer;
}

std::string PlatformGetThreadName() {
  // Note: Many platforms have richer APIs for getting friendly thread
  // names. Feel free to add platform specific conditionals prior to this
  // fallback.
  return std::to_string(
      std::hash<std::thread::id>{}(std::this_thread::get_id()));
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_IMPL_H_
