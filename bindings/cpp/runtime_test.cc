#include "wtf/runtime.h"

#include <fstream>

#include "gtest/gtest.h"

#ifndef TMP_PREFIX
#define TMP_PREFIX ""
#endif

namespace wtf {
namespace {

class RuntimeTest : public ::testing::Test {
 protected:
  void TearDown() override {
    Runtime::GetInstance()->DisableCurrentThread();
    Runtime::GetInstance()->ResetForTesting();
  }
};

TEST_F(RuntimeTest, BasicEndToEnd) {
  Runtime::GetInstance()->EnableCurrentThread("TestThread");
  Event<uint32_t, uint16_t> event1{"foo#bar: a, b"};
  event1.Invoke(2, 2);

  ScopedEvent<uint32_t> s{"bar#scope: iteration"};
  for (int i = 0; i < 10; i++) {
    usleep(50);
    s.Enter(i);
    usleep(20);
    event1.Invoke(3, i);
    usleep(20);
    s.Leave();
  }

  std::fstream out;
  out.open(TMP_PREFIX "tmptestbuf.wtf-trace",
           std::ios_base::out | std::ios_base::trunc);
  Runtime::GetInstance()->Save(&out);
  out.close();
}

// Tests asynchronous save and clear. The before and after files should be
// completely disjoint.
TEST_F(RuntimeTest, SaveAndClear) {
  Runtime::GetInstance()->EnableCurrentThread("TestThread");
  static Event<uint32_t, uint32_t> event1{"#OuterEvent: a, b"};

  // Let's make sure to fill up a few chunks of data.
  event1.Invoke(1, 1);
  for (size_t i = 0; i < 13333; i++) {
    static ScopedEvent<uint32_t> s{"#Scope1: iteration"};
    s.Enter(i);
    usleep(1);
    event1.Invoke(3, i);
    s.Leave();
  }
  EXPECT_TRUE(Runtime::GetInstance()->SaveToFile(
      TMP_PREFIX "tmptestbuf_clearbefore.wtf-trace",
      Runtime::SaveOptions::ForClear()));

  // And fill it up again with some different values.
  event1.Invoke(2, 2);
  for (size_t i = 0; i < 13333; i++) {
    static ScopedEvent<uint32_t> s{"#Scope2: iteration"};
    s.Enter(i);
    usleep(1);
    event1.Invoke(3, i);
    s.Leave();
  }
  EXPECT_TRUE(Runtime::GetInstance()->SaveToFile(
      TMP_PREFIX "tmptestbuf_clearafter.wtf-trace",
      Runtime::SaveOptions::ForClear()));
}

}  // namespace
}  // namespace wtf

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
