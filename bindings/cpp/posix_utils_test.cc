#include <unistd.h>
#include <sys/stat.h>

#include "wtf/posix_utils.h"
#include "wtf/macros.h"

#include "gtest/gtest.h"

const char kSignalWatcherFilename[] { "./tmptstsignal_watcher.wtf-trace" };

namespace wtf {

class PosixUtilsTest : public ::testing::Test {
protected:
  void TearDown() override {
    wtf::Runtime::GetInstance()->DisableCurrentThread();
    wtf::Runtime::GetInstance()->ResetForTesting();
  }

};


TEST_F(PosixUtilsTest, SignalWatcher) {
  unlink(kSignalWatcherFilename);
  // watch SIGALRM
  wtf::posix_utils::InstallSignalHandler(14, kSignalWatcherFilename);
  WTF_EVENT0("MacrosTest#SignalWatcher");

  alarm(1);

  const int second = 1000;
  usleep(5000 * second);

  alarm(0);
  // allow the thread to finish it's work
  usleep(1000 * second);
  struct stat buffer;

  EXPECT_TRUE(stat(kSignalWatcherFilename, &buffer) == 0);
  EXPECT_TRUE(buffer.st_size > 0);
}
} // namespace wtf

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
