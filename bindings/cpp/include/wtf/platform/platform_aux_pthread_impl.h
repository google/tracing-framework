#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREAD_IMPL_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREAD_IMPL_H_

#include "wtf/buffer.h"

namespace wtf {

namespace internal {
pthread_key_t event_buffer_key;
pthread_once_t event_buffer_key_init = PTHREAD_ONCE_INIT;

void EventBufferDtor(void* event_buffer) {
  static_cast<EventBuffer*>(event_buffer)->MarkOutOfScope();
}

void EventBufferKeyCreate() {
  pthread_key_create(&event_buffer_key, EventBufferDtor);
}
}  // namespace internal

void PlatformAuxPthreadInitialize() {
  pthread_once(&internal::event_buffer_key_init,
               internal::EventBufferKeyCreate);
}

void PlatformSetThreadLocalEventBuffer(EventBuffer* event_buffer) {
  pthread_once(&internal::event_buffer_key_init,
               internal::EventBufferKeyCreate);
  pthread_setspecific(internal::event_buffer_key, event_buffer);
}

}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_PLATFORM_AUX_PTHREAD_IMPL_H_
