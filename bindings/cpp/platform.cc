#include "wtf/platform.h"

// Branch to for specific platform implementations.
#if defined(WTF_SINGLE_THREADED)
#include "wtf/platform/platform_single_threaded_impl.h"

namespace wtf {
class EventBuffer;

namespace internal {
EventBuffer* event_buffer = nullptr;
}  // namespace internal
}  // namespace wtf

#elif defined(__myriad2__)
#include "wtf/platform/platform_myriad2_impl.h"
#else
// Default POSIX platform.
#include "wtf/platform/platform_default_impl.h"
#endif
