# WTF C++ Bindings

This directory contains C++ bindings for generating wtf-traces from your
C++ codebase. APIs and macros exist for:

* Standalone events
* Scopes
* Arbitrary arguments
* Enabling WTF for threads
* Saving traces to files or memory

## General Usage By Example

See comments in macro.h and runtime.h. Some brief examples are below.

```
#include <wtf/macros.h>

// Enable tracing for a thread. This usually goes at the top of your thread's
// Run() method.
WTF_THREAD_ENABLE("MyThreadName");

// Trace a scope. This will nest properly and show up as a horizontal bar for
// the duration. We also log a singleton event at the mid point of some work.
void ClassName::Process() {
  WTF_SCOPE0("ClassName#Process");
  for (int i = 0; i < 5; i++) {
    if (i == 3) {
      WTF_EVENT0("ClassName#ProcessMidPoint");
    }
  }
}

// The above outputs a scope with no arguments. If you have simple arguments,
// they are sometimes useful in a trace. We also want to log a singleton
// event when something goes wrong.
void ClassName::ProcessRange(int start, int end) {
  WTF_SCOPE("ClassName#ProcessRange: start, end", int32_t, int32_t)(start, end);
  for (int i = start; i <= end; i++) {
    if (!ProcessFrame(i)) {
      WTF_EVENT("ClassName#ProcessFrameFailed: index", int32_t)(i);
    }
  }
}

// Save a trace.
if (!wtf::Runtime::GetInstance()->SaveToFile(local_file_name)) {
  std::cerr << "Error saving file: " << local_file_name;
  return;
}
```

## Installing

### Prerequisites

In order to build the bindings, you need a functioning C++ compiler and GNU
make. The compiler must be relatively recent, as non trivial template and
atomics are used (as introduced in C++11).

In addition to a C++ compiler and GNU make, the following libraries are
required:

* gtest (for building tests only)

*On Ubuntu:*

```
# Install library prerequisites.
sudo apt-get install libgtest-dev

# Install clang.
sudo apt-get install clang

# Or gcc, if you prefer.
sudo apt-get install g++
```

### Building

```
# Makes all library targets. This does not build testing targets.
make all

#Builds and runs testing targets. gtest must be found.
make test

# Installs headers and libraies to PREFIX
make install [PREFIX=/usr/local]

# Cleans all generated files.
make clean
```

### Switching Compilers

Standard GNU make configuration variables drive compiler selection. Change
the value of CXX to customize:

```
# Select clang.
export CXX=clang++

# Select gcc.
export CXX=g++

# Override on the command line.
make test CXX=clang++
```

### Testing

#### Linux/GCC:

```
make clean && make test THREADING=pthread CXX=g++
make clean && make test THREADING=single CXX=g++
```

#### Linux/clang:

```
make clean && make test THREADING=pthread CXX=clang++
make clean && make test THREADING=single CXX=clang++
```

TODO: The following is hoaky but is where we are at while building out the
test suite:

* Make sure to load the tmptestbuf.wtf-trace file in the viewer and ensure it
works.
* If running a threaded build, load the largest of the
tmp_threaded_torture_test*.wtf-trace files you can and verify that the
SaveToFile scope looks reasonable.

### Threading

By default, the library builds with threading enabled, using the C++11 std::thread
facilities. If this works for your target platform, it is the preferred setting.
This should work on modern:

* Windows
* Linux
* OSX/iOS (needs further verification)

As of February 2017, it is known to not work on:

* Android (specifically, C++11 thread local support is severely limited/broken)
* Myriad2 (with vendor provided libraries)

The threading library can be changed when building via the makefile by passing:

* ```THREADING=pthread``` : Compiles with support for vanilla pthread. Does not use
  any threading extensions added as part of the C++11 standard. Corresponds to
  ```-DWTF_PTHREAD_THREADED``` in sources.
* ```THREADING=single``` : Disables threading. No synchronization is done. There must
  never be more than one concurrent stream of execution. Suitable for some embedded
  scenarios. Corresponds to ```-DWTF_SINGLE_THREADED``` in sources.
* ```THREADING=std``` : Default. Uses the C++11 standard threading facilities.

### Integrations

The bindings have no dependencies outside of the standard library, and the Makefile
should be taken as the canonical way to integrate it into your project. For simple
integrations, it should be sufficient to simply include all of the ```LIBRARY_SOURCES```
files in whatever you are compiling and add a ```-I``` include directory to
include ```bindings/cpp/include```. If building with a non-standard threading
library, you must make sure that the appropriate macro is defined for anything that
includes the headers (```-DWTF_PTHREAD_THREADED``` or ```-DWTF_SINGLE_THREADED```).
Failing to do this part will result in undefined symbols at link time.

You are also free to use the Makefile as-is if it suits your needs. We are open to
contributions which add a real build system, but honestly, everywhere that the authors
use WTF, the build system is different and it has been more expedient to keep the sources
so simple as to not require anything exotic.

#### Myriad2 (compile only - still a work in progress):

```
export MDK_HOME=...

make clean && make libwtf.a \
  THREADING=single \
  CXX="$(which $MDK_HOME/tools/*/linux64/sparc-myriad-elf-*/bin/sparc-myriad-elf-g++)" \
  CPPFLAGS+=-DMA2150 \
  CPPFLAGS+=-U__STRICT_ANSI__ \
  CPPFLAGS+=-I$MDK_HOME/mdk/common/drivers/myriad2/socDrivers/leon/bm/include \
  CPPFLAGS+=-I$MDK_HOME/mdk/common/drivers/myriad2/socDrivers/leon/bm/arch/ma2x5x/include \
  CPPFLAGS+=-I$MDK_HOME/mdk/common/shared/include
```

### Customizing

See the variables at the top of the Makefile for what can be overriden.
Overriding can be done by appending VAR=value to the make command line.
