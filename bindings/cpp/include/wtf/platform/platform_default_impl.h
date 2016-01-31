#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_IMPL_H_

#include "wtf/buffer.h"

namespace wtf {

namespace internal {
uint64_t base_timestamp_nanos = 0;
}  // namespace internal

void PlatformInitialize() {
  internal::base_timestamp_nanos = internal::GetNanoTime();
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_DEFAULT_IMPL_H_
