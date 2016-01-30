#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_INL_H_

#include "wtf/platform/platform_default_inl.h"

namespace wtf {

// On this single-threaded platform, atomics and mutexes are no-ops.
namespace platform {
struct mutex {};

template <typename T>
struct lock_guard {
  ~lock_guard() {}

  T& mutex;
};

template <typename T>
struct atomic {
  T fetch_add(T increment) {
    value = value + increment;
    return value;
  }

  void store(T new_value) { value = new_value; }

  T value;
};
}  // namespace platform

namespace internal {
extern EventBuffer* event_buffer;
}  // namespace internal

inline EventBuffer* PlatformGetThreadLocalEventBuffer() {
  return internal::event_buffer;
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_INL_H_
