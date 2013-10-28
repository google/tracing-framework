ifeq ($(src),)
src := *.cc
endif

obj := $(patsubst %.cc,%.o,$(wildcard $(src)))

.PHONY: all clean
all: exec $(obj)

clean:
	rm -f $(obj)

exec: $(obj)
	$(CXX) $(obj) $(LDFLAGS)

%.o: %.cc
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -c $< -o $@
