#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_IMPL_H_

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

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_IMPL_H_
