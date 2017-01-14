#include <algorithm>
#include <atomic>
#include <iostream>
#include <sstream>
#include <thread>

#include "wtf/macros.h"

#ifndef TMP_PREFIX
#define TMP_PREFIX ""
#endif

std::atomic<bool> had_error;
std::atomic<bool> stop;

void SaveThread() {
  WTF_AUTO_THREAD_ENABLE();
  wtf::Runtime::SaveCheckpoint checkpoint;
  for (int i = 0; i < 1001; i++) {
    if (i > 0 && (i % 250) == 0) {
      // Actually save to a file.
      WTF_SCOPE("SaveThread#ToFile: i", int32_t)(i);
      std::stringstream name;
      name << TMP_PREFIX "tmp_threaded_torture_test_streamed.wtf-trace";
      if (!wtf::Runtime::GetInstance()->SaveToFile(
              name.str(),
              wtf::Runtime::SaveOptions::ForStreamingFile(&checkpoint))) {
        std::cerr << "SaveToFile() failed" << std::endl;
        had_error = true;
      }
      std::cerr << "Saved " << name.str() << std::endl;
    } else {
      // Dummy save.
      WTF_SCOPE("SaveThread#Dummy: i", int32_t)(i);
      std::stringstream out;
      if (!wtf::Runtime::GetInstance()->Save(&out)) {
        std::cerr << "Save() failed" << std::endl;
        had_error = true;
      }
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }

  stop = true;
}

void NoiseMaker1(int thread_number) {
  for (int i = 0;; i++) {
    WTF_TASK("NoiseMaker");

    WTF_EVENT("NoiseMaker1#Loop: thread_number, i", int32_t, int32_t)
    (thread_number, i);
    std::this_thread::sleep_for(std::chrono::microseconds(5));
    if ((i % 100) == 0) {
      WTF_SCOPE("NoiseMaker1#Scope100: thread_number, i", int32_t, int32_t)
      (thread_number, i);
      std::this_thread::sleep_for(std::chrono::microseconds(10));
      if ((i % 400) == 0) {
        WTF_SCOPE("NoiseMaker1#Scope400: thread_number, i", int32_t, int32_t)
        (thread_number, i);
        std::this_thread::sleep_for(std::chrono::microseconds(10));
        if ((i % 1600) == 0) {
          WTF_SCOPE("NoiseMaker1#Scope1600: thread_number, i", int32_t, int32_t)
          (thread_number, i);
          std::this_thread::sleep_for(std::chrono::microseconds(10));
        }
      }
    }
    if (stop) {
      break;
    }
  }
}

extern "C" int main(int argc, char** argv) {
  std::thread save_thread(SaveThread);

  std::vector<std::thread> threads;
  int thread_count = std::min(std::thread::hardware_concurrency(), 4u);
  if (thread_count > 1) {
    thread_count -= 1;  // Give one to the save thread if we have it.
  }
  std::cerr << "Running with " << thread_count << " threads." << std::endl;
  for (int i = 0; i < thread_count; i++) {
    threads.emplace_back(NoiseMaker1, i);
  }

  save_thread.join();
  for (auto& thread : threads) {
    thread.join();
  }
  if (had_error) {
    std::cerr << "Error was reported!" << std::endl;
    return 1;
  }
  return 0;
}
