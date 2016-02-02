#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_INL_H_

#include <chrono>

namespace wtf {

namespace internal {
extern uint64_t base_timestamp_nanos;

inline uint64_t GetNanoTime() {
  auto duration = std::chrono::steady_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(duration).count();
}

}  // namespace internal

inline uint32_t PlatformGetTimestampMicros32() {
  return (internal::GetNanoTime() - internal::base_timestamp_nanos) / 1000;
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_INL_H_
