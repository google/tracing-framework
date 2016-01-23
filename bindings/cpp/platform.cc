#include "wtf/platform.h"

// Branch to for specific platform implementations.
#if defined(__myriad2__)
#include "wtf/platform/platform_myriad2_impl.h"
#else
// Default POSIX platform.
#include "wtf/platform/platform_default_impl.h"
#endif
