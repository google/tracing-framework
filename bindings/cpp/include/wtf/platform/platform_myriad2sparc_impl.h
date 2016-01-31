#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_MYRIAD2SPARC_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_MYRIAD2SPARC_IMPL_H_

#include <DrvCpr.h>

#include "wtf/buffer.h"

namespace wtf {

namespace internal {
pthread_once_t platform_initialize_once_key = PTHREAD_ONCE_INIT;
uint64_t base_ticks = 0;
uint64_t sysclks_per_us = 1;  // Avoid divide by zero.

void PlatformInitializeOnce() {
  // Initialize timer.
  // TODO(laurenzo): This does not support a changing clock speed. Fall back
  // to POSIX time if this is an issue.
  internal::base_ticks = internal::PlatformGetTickCount64();
  internal::sysclks_per_us = DrvCprGetSysClocksPerUs();
  if (internal::sysclks_per_us == 0) {
    // Avoid divide by zero.
    internal::sysclks_per_us = 1;
  }
  PlatformAuxInitializeThreading();
}

}  // namespace internal

void PlatformInitialize() {
  pthread_once(&internal::platform_initialize_once_key,
               internal::PlatformInitializeOnce);
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_MYRIAD2_SPARC_IMPL_H_
