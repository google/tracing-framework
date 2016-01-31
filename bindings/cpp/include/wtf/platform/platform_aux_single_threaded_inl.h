#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_SINGLE_THREADED_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_SINGLE_THREADED_INL_H_

namespace wtf {

// In this configuration, we provide skeletons of atomics and mutexes that
// no-op.
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

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_SINGLE_THREADED_INL_H_
