#include "wtf/platform.h"

// Branch to for specific platform implementations.
#if defined(__myriad__) && defined(__sparc__)
#include "wtf/platform/platform_myriad2sparc_impl.h"
#else
// Default POSIX platform.
#include "wtf/platform/platform_default_impl.h"
#endif

// Select threading library.
#if defined(WTF_SINGLE_THREADED)
#include "wtf/platform/platform_aux_single_threaded_impl.h"
#elif defined(WTF_PTHREAD_THREADED)
#include "wtf/platform/platform_aux_pthreads_threaded_impl.h"
#else
#include "wtf/platform/platform_aux_std_threaded_impl.h"
#endif
