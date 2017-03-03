// Provides the PlatformGetThreadLocalEventBuffer() function by using
// pthread keys. This should work for all POSIX platforms.
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_INL_H_

#include <pthread.h>

#include <atomic>
#include <mutex>

namespace wtf {

// On this platform, use the standard-library versions of atomics and mutexes.
namespace platform {
using mutex = std::mutex;

template <typename T>
using lock_guard = std::lock_guard<T>;

template <typename T>
using atomic = std::atomic<T>;

// Since memory_order is an old-school enum, it needs to be imported
// individually.
using std::memory_order;
using std::memory_order_relaxed;
using std::memory_order_consume;
using std::memory_order_acquire;
using std::memory_order_release;
using std::memory_order_acq_rel;
using std::memory_order_seq_cst;

using once_flag = struct {
    pthread_once_t flag {PTHREAD_ONCE_INIT};
};

template <class T>
inline void call_once(once_flag& once, T func) {
    pthread_once(&once.flag, func);
}

}  // namespace platform

namespace internal {
extern pthread_key_t event_buffer_key;
extern pthread_once_t initialize_threading_once;

void InitializeThreadingOnce();

}  // namespace internal

inline EventBuffer* PlatformGetThreadLocalEventBuffer() {
  pthread_once(&internal::initialize_threading_once,
               internal::InitializeThreadingOnce);
  return static_cast<EventBuffer*>(
      pthread_getspecific(internal::event_buffer_key));
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_INL_H_
