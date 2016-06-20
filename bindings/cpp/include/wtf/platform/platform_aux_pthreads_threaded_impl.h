#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_IMPL_H_

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

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREADS_THREADED_IMPL_H_
