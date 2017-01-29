#include "wtf/macros.h"

#include <fstream>

#include "gtest/gtest.h"

#ifndef TMP_PREFIX
#define TMP_PREFIX ""
#endif

namespace wtf {
namespace {

class MacrosTest : public ::testing::Test {
 protected:
  void TearDown() override {
    Runtime::GetInstance()->DisableCurrentThread();
    Runtime::GetInstance()->ResetForTesting();
  }

  void ClearEventBuffer() {
    auto event_buffer = PlatformGetThreadLocalEventBuffer();
    if (event_buffer) {
      event_buffer->clear();
    }
  }

  bool EventsHaveBeenLogged() {
    auto event_buffer = PlatformGetThreadLocalEventBuffer();
    if (!event_buffer) {
      return false;
    }
    return !event_buffer->empty();
  }

  bool PrefixEventsHaveBeenLogged() {
    auto event_buffer = PlatformGetThreadLocalEventBuffer();
    if (!event_buffer) {
      return false;
    }
    return !event_buffer->frozen_prefix_slots().empty();
  }
};

TEST_F(MacrosTest, AssertMasterEnabled) {
  ASSERT_TRUE(kMasterEnable)
      << "The WTF_ENABLE define must be set for this test.";
}

namespace disabled {
WTF_NAMESPACE_DISABLE();

class AutoFunctionTestClassDisabled {
public:
    static void f() {
        WTF_AUTO_FUNCTION();
        const int32_t kLimit = 10;
        for (int32_t i = 0; i < kLimit; i++) {
            usleep(10);
        }
    }
};

TEST_F(MacrosTest, AutoFunctionTestShouldBeDisabled) {
    ClearEventBuffer();
    const int32_t kLimit = 10;

    for (int32_t i = 0; i < kLimit; i++) {
        AutoFunctionTestClassDisabled::f();
        usleep(1);
    }
    EXPECT_FALSE(EventsHaveBeenLogged());

    ClearEventBuffer();
}

TEST_F(MacrosTest, ThreadShouldBeDisabled) {
  WTF_THREAD_ENABLE("ShouldBeDisabled");
  // Enabling a thread scribbles into the buffer.
  EXPECT_FALSE(EventsHaveBeenLogged());
}

TEST_F(MacrosTest, AutoThreadShouldBeDisabled) {
  WTF_AUTO_THREAD_ENABLE();
  // Enabling a thread scribbles into the buffer.
  EXPECT_FALSE(EventsHaveBeenLogged());
}

TEST_F(MacrosTest, EventsShouldBeDisabled) {
  WTF_THREAD_ENABLE_IF(true, "ShouldBeDisabled");
  EXPECT_TRUE(PrefixEventsHaveBeenLogged());

  WTF_EVENT0(
      "ShouldBeDisabled#Dup1");  // Make sure can exist in the same scope.
  WTF_EVENT("ShouldBeDisalbed#Dup1", int32_t)(0);
  WTF_SCOPE0("ShouldBeDisabled#Dup1");
  WTF_SCOPE("ShouldBeDisabled#Dup1", int32_t)(1);

  WTF_EVENT0("ShouldBeDisabled#E0");
  WTF_EVENT("ShouldBeDisalbed#E1", int32_t)(0);
  { WTF_SCOPE0("ShouldBeDisabled#InnerLoop0"); }
  { WTF_SCOPE("ShouldBeDisabled#InnerLoop1", int32_t)(1); }
  EXPECT_FALSE(EventsHaveBeenLogged());
}

namespace enabled {
WTF_NAMESPACE_ENABLE();

class AutoFunctionTestClass {
public:
    static void f() {
        WTF_AUTO_FUNCTION();
        const int32_t kLimit = 10;
        for (int32_t i = 0; i < kLimit; i++) {
            usleep(10);
        }
    }
};

TEST_F(MacrosTest, AutoFunctionTest) {
    Runtime::GetInstance()->DisableCurrentThread();
    ClearEventBuffer();

    const int32_t kLimit = 10;

    for (int32_t i = 0; i < kLimit; i++) {
        AutoFunctionTestClass::f();
        usleep(1);
    }
    EXPECT_TRUE(EventsHaveBeenLogged());

    EXPECT_TRUE(
        Runtime::GetInstance()->SaveToFile(TMP_PREFIX "tmpautofuncbuf.wtf-trace"));
    ClearEventBuffer();
}

TEST_F(MacrosTest, ThreadShouldBeEnabled) {
  WTF_THREAD_ENABLE("ShouldBeEnabled");
  // Enabling a thread scribbles into the buffer.
  EXPECT_TRUE(PrefixEventsHaveBeenLogged());
}

TEST_F(MacrosTest, AutoThreadShouldBeEnabled) {
  WTF_AUTO_THREAD_ENABLE();
  // Enabling a thread scribbles into the buffer.
  EXPECT_TRUE(PrefixEventsHaveBeenLogged());
}

TEST_F(MacrosTest, EventsShouldBeEnabled) {
  WTF_THREAD_ENABLE_IF(true, "ShouldBeEnabled");
  // Enabling a thread should only write prefix events.
  EXPECT_TRUE(PrefixEventsHaveBeenLogged());
  EXPECT_FALSE(EventsHaveBeenLogged());

  WTF_EVENT0("ShouldBeEnabled#E0");
  EXPECT_TRUE(EventsHaveBeenLogged());
  ClearEventBuffer();

  WTF_EVENT("ShouldBeEnabled#E1", int32_t)(0);
  EXPECT_TRUE(EventsHaveBeenLogged());
  ClearEventBuffer();

  { WTF_SCOPE0("ShouldBeEnabled#InnerLoop0"); }
  EXPECT_TRUE(EventsHaveBeenLogged());
  ClearEventBuffer();

  { WTF_SCOPE("ShouldBeEnabled#InnerLoop1", uint32_t)(1); }
  EXPECT_TRUE(EventsHaveBeenLogged());
  ClearEventBuffer();
}

}  // namespace enabled
}  // namespace disabled

TEST_F(MacrosTest, TypeAliases) {
  WTF_THREAD_ENABLE_IF(true, "ShouldBeEnabled");

  ClearEventBuffer();
  Event<> ev0{"Foo#Bar"};
  ev0.Invoke();
  EXPECT_TRUE(EventsHaveBeenLogged());

  ClearEventBuffer();
  ScopedEvent<> ev1{"Foo#Bar"};
  ev1.Enter();
  ev1.Leave();
  EXPECT_TRUE(EventsHaveBeenLogged());

  ClearEventBuffer();
  {
    ScopedEvent<> ev2{"Foo#Bar"};
    AutoScope<> s1{ev2};
    s1.Enter();
  }
  EXPECT_TRUE(EventsHaveBeenLogged());
}

TEST_F(MacrosTest, BasicEndToEnd) {
  static const char* kThreadNames[] = {
      "TestThread", "TestThread2", "TestThread3",
  };

  for (int k = 0; k < 3; k++) {
    Runtime::GetInstance()->DisableCurrentThread();
    WTF_THREAD_ENABLE(kThreadNames[k]);
    const int32_t kLimit = 10;
    for (int32_t i = 0; i < kLimit; i++) {
      WTF_SCOPE("MacrosTest#Loop: i, limit", int32_t, int32_t)(i, kLimit);
      usleep(10);
      if ((i % 3) == 0) {
        usleep(2);
        WTF_EVENT("MacrosTest#EveryThird: i", int32_t)(i);
        usleep(2);
      }

      for (int32_t j = 0; j < 5; j++) {
        WTF_SCOPE0("MacrosTest#InnerLoop");
        usleep(25);
        if ((j % 2) == 0) {
          WTF_EVENT0("MacrosTest#InnerEveryOther");
        }
        usleep(25);
      }

      usleep(5);
    }
    EXPECT_TRUE(EventsHaveBeenLogged());
  }

  EXPECT_TRUE(
      Runtime::GetInstance()->SaveToFile(TMP_PREFIX "tmpmacrobuf.wtf-trace"));
}

}  // namespace
}  // namespace wtf

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
