#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_INL_H_

#include <time.h>

namespace wtf {

namespace internal {
extern uint64_t base_timestamp_nanos;
static const uint64_t kNanosecondsPerSecond = 1000000000;

inline uint64_t GetNanoTime() {
  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);

  return static_cast<uint64_t>(ts.tv_sec) * kNanosecondsPerSecond +
         static_cast<uint64_t>(ts.tv_nsec);
}

}  // namespace internal

inline uint32_t PlatformGetTimestampMicros32() {
  return (internal::GetNanoTime() - internal::base_timestamp_nanos) / 1000;
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_INL_H_
