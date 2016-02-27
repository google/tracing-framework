# Usage:
#   make all
#     Makes all library targets. This does not build testing targets.
#   make test
#     Builds and runs testing targets. gtest must be found.
#   make install [PREFIX=/usr/local]
#     Installs headers and libraies to PREFIX
#   make clean
#     Cleans all generated files.

# Flag defaults. Can be overriden.
THREADING = multi
CXXFLAGS = -std=c++11 -Wall -Werror -O3 -fPIC
LDLIBS =
SOEXT = so
GTEST_DIR = /usr/src/gtest
GTEST_ALL_CC = $(GTEST_DIR)/src/gtest-all.cc
PREFIX=/usr/local
INSTALL=install

# Threading customizations.
ifeq "$(THREADING)" "multi"
override CPPFLAGS += -DGTEST_HAS_PTHREAD=1
override LDLIBS += -pthread
else ifeq "$(THREADING)" "single"
override CPPFLAGS += -DGTEST_HAS_PTHREAD=0
override CPPFLAGS += -DWTF_SINGLE_THREADED
.PHONY: threaded_torture_test
else
$(error Expected value of THREADING to be "single" or "multi")
endif

# Required flag customizations.
override CPPFLAGS += -Iinclude
override CPPFLAGS += -I$(GTEST_DIR)/include
	# If system installed, headers will come from system include paths.

LIBRARY_HEADERS := \
	include/wtf/buffer.h \
	include/wtf/config.h \
	include/wtf/event.h \
	include/wtf/macros.h \
	include/wtf/platform.h \
	include/wtf/runtime.h \

PLATFORM_HEADERS := \
  include/wtf/platform/platform_aux_pthread_impl.h \
	include/wtf/platform/platform_aux_pthread_inl.h \
	include/wtf/platform/platform_default_impl.h \
	include/wtf/platform/platform_default_inl.h \
	include/wtf/platform/platform_myriad2_impl.h \
	include/wtf/platform/platform_myriad2_inl.h

ALL_HEADERS := $(LIBRARY_HEADERS) $(PLATFORM_HEADERS)

LIBRARY_SOURCES := \
	buffer.cc \
	event.cc \
	platform.cc \
	runtime.cc

TEST_SOURCES := \
	buffer_test.cc \
	macros_test.cc \
	runtime_test.cc \
	threaded_torture_test.cc

LIBRARY_OBJECTS := $(LIBRARY_SOURCES:%.cc=%.o)

.PHONY: clean all test

all: libwtf.a libwtf.$(SOEXT)

### RULES (for full compatibility with Make<3.8.2, most specific must come
### first and additional dependencies cannot be introduced.
%_test.o: %_test.cc
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) -DWTF_ENABLE -o $@ -c $<

%.o: %.cc
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) -o $@ -c $<

### LIBRARIES.
libwtf.a: $(LIBRARY_OBJECTS)
	$(AR) rcs $@ $+

libwtf.$(SOEXT): $(LIBRARY_OBJECTS)
	$(CXX) -shared -o $@ $+ $(LDLIBS)

### CLEAN.
clean:
	rm -f \
		$(LIBRARY_SOURCES:%.cc=%.o) \
		$(TEST_SOURCES:%.cc=%.o) \
		$(TEST_SOURCES:%.cc=%) \
		gtest.o \
		libwtf.a libwtf.$(SOEXT) \
		$(wildcard tmp*.wtf-trace)

### TESTING.
test: buffer_test macros_test runtime_test threaded_torture_test
	@echo "Running buffer_test"
	./buffer_test
	@echo "Running macros_test"
	./macros_test
	@echo "Running runtime_test"
	./runtime_test
ifeq "$(THREADING)" "multi"
	@echo "Running threaded_torture_test"
	time ./threaded_torture_test
endif

gtest.o: $(GTEST_ALL_CC)
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) -Wno-unused-private-field \
		-iquote $(GTEST_DIR) -o $@ -c $+

buffer_test: buffer_test.o gtest.o libwtf.a
	$(CXX) -o $@ $+ $(LDLIBS)

macros_test: macros_test.o gtest.o libwtf.a
	$(CXX) -o $@ $+ $(LDLIBS)

runtime_test: runtime_test.o gtest.o libwtf.a
	$(CXX) -o $@ $+ $(LDLIBS)

### THREADED TORTURE TEST
ifeq "$(THREADING)" "multi"
threaded_torture_test: threaded_torture_test.o libwtf.a
	$(CXX) -o $@ $+ $(LDLIBS)
endif

### INSTALL.
install: libwtf.a libwtf.$(SOEXT)
	$(INSTALL) -d $(PREFIX)/include/wtf
	$(INSTALL) -d $(PREFIX)/include/wtf/platform
	$(INSTALL) -d $(PREFIX)/lib
	$(INSTALL) $(LIBRARY_HEADERS) $(PREFIX)/include/wtf
	$(INSTALL) $(PLATFORM_HEADERS) $(PREFIX)/include/wtf/platform
	$(INSTALL) libwtf.a libwtf.$(SOEXT) $(PREFIX)/lib
