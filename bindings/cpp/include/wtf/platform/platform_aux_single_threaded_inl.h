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

enum memory_order {
  memory_order_relaxed,
  memory_order_consume,
  memory_order_acquire,
  memory_order_release,
  memory_order_acq_rel,
  memory_order_seq_cst
};

template <typename T>
struct atomic {
  T value;

  T fetch_add(T increment) {
    value = value + increment;
    return value;
  }

  void store(T new_value, memory_order order = memory_order_seq_cst) {
    value = new_value;
  }
  T load(memory_order order = memory_order_seq_cst) { return value; }

  // Assignment conversion.
  void operator=(T& other) { value = other; }
  void operator=(const T& other) { value = other; }

  // Implicit cast to T.
  operator T() { return value; }
};

using once_flag = struct {
    bool flag {false};
};
template <class T>
inline void call_once(once_flag& once, T func) {
    if (!once.flag) {
        once.flag = true;
        func();
    }
}

}  // namespace platform

namespace internal {
extern EventBuffer* event_buffer;
}  // namespace internal

inline EventBuffer* PlatformGetThreadLocalEventBuffer() {
  return internal::event_buffer;
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_SINGLE_THREADED_INL_H_
