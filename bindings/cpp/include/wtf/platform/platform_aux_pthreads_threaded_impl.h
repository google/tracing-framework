#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_IMPL_H_

#include <algorithm>
#include <cstring>
#include <sstream>

#include "wtf/buffer.h"

namespace wtf {

namespace internal {
pthread_key_t event_buffer_key;
pthread_once_t initialize_threading_once = PTHREAD_ONCE_INIT;

void EventBufferDtor(void* event_buffer) {
  static_cast<EventBuffer*>(event_buffer)->MarkOutOfScope();
}

void InitializeThreadingOnce() {
  pthread_key_create(&event_buffer_key, EventBufferDtor);
  PlatformInitialize();
}
}  // namespace internal

void PlatformInitializeThreading() {
  pthread_once(&internal::initialize_threading_once,
               internal::InitializeThreadingOnce);
}

void PlatformSetThreadLocalEventBuffer(EventBuffer* event_buffer) {
  pthread_once(&internal::initialize_threading_once,
               internal::InitializeThreadingOnce);
  pthread_setspecific(internal::event_buffer_key, event_buffer);
}

std::string PlatformGetThreadName() {
  // The ultimate fallback mechanism for getting a thread id involves bit
  // casting pthread_self() to an integer. This sucks but is portable.
  // Add platform-specific special cases above.
  pthread_t current = pthread_self();
  uintptr_t result = 0;
  std::memcpy(&result, &current, std::min(sizeof(current), sizeof(result)));

  // Note that as of Jan 2017, std::to_string is missing on some platforms 
  // and we take the coward's way out and just use an ostringstream. If this 
  // ever improves, switch to to_string.
  std::ostringstream sout;
  sout << result;
  return sout.str();
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_IMPL_H_
