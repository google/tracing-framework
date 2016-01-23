// Provides the PlatformGetThreadLocalEventBuffer() function by using
// pthread keys. This should work for all POSIX platforms, but will need
// to be different for Windows.
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREAD_INL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREAD_INL_H_

#include <pthread.h>

namespace wtf {

namespace internal {
extern pthread_key_t event_buffer_key;
extern pthread_once_t event_buffer_key_init;

void EventBufferKeyCreate();

}  // namespace internal

// Must be called during platform specific initialization if using pthreads.
void PlatformAuxPthreadInitialize();

inline EventBuffer* PlatformGetThreadLocalEventBuffer() {
  pthread_once(&internal::event_buffer_key_init,
               internal::EventBufferKeyCreate);
  return static_cast<EventBuffer*>(
      pthread_getspecific(internal::event_buffer_key));
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREAD_INL_H_
