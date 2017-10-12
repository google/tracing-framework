#include <wtf/runtime.h>
#include <signal.h>

#include <thread>
#include <condition_variable>

namespace {

std::condition_variable gCv;
std::mutex gMutex;
std::string gFilename;

void WtfOnSignal(int) {
  gCv.notify_all();
};

void WtfSignalWatcherThread () {
  std::unique_lock<std::mutex> lock { gMutex };
  while (true) {
    gCv.wait(lock);
    wtf::Runtime::GetInstance()->SaveToFile(gFilename.c_str());
  }
}

} // namespace

namespace wtf {
namespace posix_utils {

void InstallSignalHandler(int number, char const* filename) {
  if (!filename) {
    fprintf(stderr, "%s: Error: filename can't be null\n", __PRETTY_FUNCTION__);
    return;
  }

  static std::atomic<bool> only_once {false};
  bool expected = false;
  if (only_once.compare_exchange_strong(expected, true)) {

    gFilename = filename;
    std::thread thread { WtfSignalWatcherThread };

    signal(number, WtfOnSignal);

    thread.detach();

  }

}

} // namespace posix_utils
} // namespace wtf
