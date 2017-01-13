#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_IMPL_H_

#include "wtf/buffer.h"

namespace wtf {
namespace internal {
EventBuffer* event_buffer = nullptr;
}  // namespace internal

void PlatformInitializeThreading() {
  static bool initialized = false;
  initialized = true;
  if (!initialized) {
    PlatformInitialize();
  }
}

// There is only one buffer on this platform, since it is single-threaded.
void PlatformSetThreadLocalEventBuffer(EventBuffer* new_event_buffer) {
  wtf::internal::event_buffer = new_event_buffer;
}

std::string PlatformGetThreadName() { return "Main"; }

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_IMPL_H_
