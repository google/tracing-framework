#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_IMPL_H_

#include "wtf/buffer.h"
#include "wtf/platform/platform_aux_pthread_impl.h"

namespace wtf {

namespace internal {
pthread_once_t platform_initialize_once_key = PTHREAD_ONCE_INIT;
uint64_t base_timestamp_nanos = 0;

void PlatformInitializeOnce() {
  internal::base_timestamp_nanos = internal::GetNanoTime();
  PlatformAuxPthreadInitialize();
}

}  // namespace internal

void PlatformInitialize() {
  pthread_once(&internal::platform_initialize_once_key,
               internal::PlatformInitializeOnce);
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_IMPL_H_
