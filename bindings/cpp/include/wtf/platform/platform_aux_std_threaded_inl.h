// Provides the PlatformGetThreadLocalEventBuffer() function by using
// C++11 thread_local variables. Should work on most modern platforms (besides
// iOS).
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_INL_H_

#include <atomic>
#include <mutex>
#include <thread>

namespace wtf {

// On this platform, use the standard-library versions of atomics and mutexes.
namespace platform {
using mutex = std::mutex;

template <typename T>
using lock_guard = std::lock_guard<T>;

template <typename T>
using atomic = std::atomic<T>;

using once_flag = std::once_flag;
template <class Callable>
inline void call_once(once_flag& flag, Callable&& f) {
    std::call_once(flag, std::move(f));
}

// Since memory_order is an old-school enum, it needs to be imported
// individually.
using std::memory_order;
using std::memory_order_relaxed;
using std::memory_order_consume;
using std::memory_order_acquire;
using std::memory_order_release;
using std::memory_order_acq_rel;
using std::memory_order_seq_cst;
}  // namespace platform

EventBuffer* PlatformGetThreadLocalEventBuffer();

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_STD_THREADED_INL_H_
