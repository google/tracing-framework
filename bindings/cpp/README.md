# WTF C++ Bindings

This directory contains C++ bindings for generating wtf-traces from your
C++ codebase. APIs and macros exist for:

* Standalone events
* Scopes
* Arbitrary arguments
* Enabling WTF for threads
* Saving traces to files or memory

## Installing

### Prerequisites

In order to build the bindings, you need a functioning C++ compiler and GNU
make. The compiler must be relatively recent, as non trivial template and
atomics are used (as introduced in C++11).

In addition to a C++ compiler and GNU make, the following libraries are
required:

* libjsoncpp:
* gtest (for building tests only):

*On Ubuntu:*

```
sudo apt-get install libjsoncpp-dev libgtest-dev
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

### Customizing

See the variables at the top of the Makefile for what can be overriden.
Overriding can be done by appending VAR=value to the make command line.

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
      WTF_SCOPE0("ClassName#ProcessMidPoint");
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
