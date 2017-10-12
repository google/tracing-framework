#ifndef POSIX_UTILS_H
#define POSIX_UTILS_H

namespace wtf {
namespace posix_utils {

    void InstallSignalHandler(int number, char const* filename);

} // namespace posix_utils
} // namespace wtf

#endif // POSIX_UTILS_H
