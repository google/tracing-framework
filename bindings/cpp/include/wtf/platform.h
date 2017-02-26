// Platform specific functionality.
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_

#include <stdint.h>

#include <string>

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

// Uses platform specific means to get a thread name for the current thread.
// Depending on platform, this name may be synthetic or completely non-unique.
std::string PlatformGetThreadName();

}  // namespace wtf

// Branch to for specific platform implementations.
// This must match the checks in platform.cc.
#if defined(__myriad__) && defined(__sparc__)
#include "wtf/platform/platform_myriad2sparc_inl.h"
#else
// Default POSIX platform.
#include "wtf/platform/platform_default_inl.h"
#endif

#if !defined(WTF_SINGLE_THREADED) && !defined(WTF_PTHREAD_THREADED) && !defined(WTF_STD_THREADED)
#warning "Neither of WTF_SINGLE_THREADED, WTF_PTHREAD_THREADED, WTF_STD_THREADED was defined, defaulting to pthread"
#define WTF_PTHREAD_THREADED
#endif

// Select threading library.
#if defined(WTF_SINGLE_THREADED)
// Process is single threaded so avoid TLS.
#include "wtf/platform/platform_aux_single_threaded_inl.h"
#elif defined(WTF_PTHREAD_THREADED)
// Explicitly use pthreads instead of std::thread.
#include "wtf/platform/platform_aux_pthreads_threaded_inl.h"
#elif defined(WTF_STD_THREADED)
// Use std::thread and friends.
#include "wtf/platform/platform_aux_std_threaded_inl.h"
#else
#error "No threading platform is defined. This should never happen."
#endif

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_H_
