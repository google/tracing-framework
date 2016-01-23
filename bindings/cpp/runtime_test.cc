#include "wtf/runtime.h"

#include <fstream>

#include "gtest/gtest.h"

namespace wtf {
namespace {

class RuntimeTest : public ::testing::Test {
 protected:
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
  out.open("tmptestbuf.wtf-trace", std::ios_base::out | std::ios_base::trunc);
  Runtime::GetInstance()->Save(&out);
  out.close();
}

}  // namespace
}  // namespace wtf

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
