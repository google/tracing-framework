// Platform specific functionality.
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_

#include <stdint.h>

namespace wtf {

// Forward declare the event buffer.
class EventBuffer;

// Initializes platform specific machinery.
void PlatformInitialize();

// Called by the Runtime to initialize the platform. Internally calls
// PlatformInitialize() if needed.
void PlatformInitializeThreading();

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
// This must match the checks in platform.cc.
#if defined(__myriad__) && defined(__sparc__)
#include "wtf/platform/platform_myriad2sparc_inl.h"
#else
// Default POSIX platform.
#include "wtf/platform/platform_default_inl.h"
#endif

// Select threading library.
#if defined(WTF_SINGLE_THREADED)
// Process is single threaded so avoid TLS.
#include "wtf/platform/platform_aux_single_threaded_inl.h"
#elif defined(WIN32)
// Modern VC++ supports C++11 std threading.
#include "wtf/platform/platform_aux_std_threaded_inl.h"
#else
// Other platforms default to pthreads.
#include "wtf/platform/platform_aux_pthreads_threaded_inl.h"
#endif

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_
