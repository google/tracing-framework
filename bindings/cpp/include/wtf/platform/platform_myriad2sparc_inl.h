// The Myriad platform minimally works with one core using the default
// platform support, but this implementation is provided for the following
// reasons:
//   - The cycle timer is lower overhead and more precise than the Posix
//     time APIs.
//   - This implementation can be extended to support tracing buffers on
//     SHAVEs.
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_MYRIAD2SPARC_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_MYRIAD2SPARC_INL_H_

#include <DrvRegUtils.h>
#include <registersMyriad.h>
#include <stdint.h>

namespace wtf {

namespace internal {
extern uint64_t base_ticks;
extern uint64_t sysclks_per_us;

__attribute__((always_inline)) inline uint64_t PlatformGetTickCount64() {
  // TODO(laurenzo): Detect core and use an appropriate timer. This is only
  // valid for LOS.
  // Note that the first read latches the second. There is a small hazzard of
  // error if pre-empted between these two but we ignore it for the sake of
  // expediency.
  // TODO(laurenzo): The datasheet is silent on the point, but a 64 bit load
  // would likely satisfy the constraints of the hardware and avoid the hazzard.
  uint32_t upper = GET_REG_WORD_VAL(TIM0_BASE_ADR + TIM_FREE_CNT1_OFFSET);
  uint32_t lower = GET_REG_WORD_VAL(TIM0_BASE_ADR + TIM_FREE_CNT0_OFFSET);

  return (static_cast<uint64_t>(upper) << 32) | static_cast<uint64_t>(lower);
}

}  // namespace internal

__attribute__((always_inline)) inline uint32_t PlatformGetTimestampMicros32() {
  uint64_t ticks = internal::PlatformGetTickCount64() - internal::base_ticks;
  return static_cast<uint32_t>(ticks / internal::sysclks_per_us);
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_MYRIAD2SPARC_INL_H_
