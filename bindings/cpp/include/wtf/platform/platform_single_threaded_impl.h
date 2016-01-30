#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_IMPL_H_

#include "wtf/buffer.h"

namespace wtf {
namespace internal {
uint64_t base_timestamp_nanos = 0;
}  // namespace internal

void PlatformInitialize() {}

// There is only one buffer on this platform, since it is single-threaded.
void PlatformSetThreadLocalEventBuffer(EventBuffer* new_event_buffer) {
	wtf::internal::event_buffer = new_event_buffer;
}


}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_SINGLE_THREADED_IMPL_H_
