// Platform specific functionality.
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_

#include <stdint.h>

namespace wtf {

// Forward declare the event buffer.
class EventBuffer;

// Initializes platform specific machinery.
void PlatformInitialize();

// Gets the timestamp in micro-seconds from the epoch start time that results
// from the call to PlatformSetTimestampEpoch().
uint32_t PlatformGetTimestampMicros32();

// Gets the EventBuffer* for a thread (which may be nullptr).
EventBuffer* PlatformGetThreadLocalEventBuffer();

// Sets the thread local event buffer for the current thread. The runtime
// must arrange that the EventBuffer* outlives the thread. This is typically
// true because EventBuffers are never deleted.
void PlatformSetThreadLocalEventBuffer(EventBuffer* event_buffer);

}  // namespace wtf

// Branch to for specific platform implementations.
#if defined(__myriad2__)
#include "wtf/platform/platform_myriad2_inl.h"
#else
// Default POSIX platform.
#include "wtf/platform/platform_default_inl.h"
#endif

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_
