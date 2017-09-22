# Description:
#  Javascript and C++ instrumentation-based profiling tools.
#  https://github.com/google/tracing-framework

package(default_visibility = ["//visibility:public"])

licenses(["notice"])  # BSD 3-clause

exports_files(["LICENSE"])

# Restricts most packages to use by WTF only.
# Selective rules we wish to support to external users are set to
# //visibility:public.
package_group(
    name = "internal",
    packages = [
        "//addons/...",
        "//app/...",
        "//assets/...",
        "//bin/...",
        "//bindings/...",
        "//extensions/...",
        "//externs/...",
        "//src/...",
        "//test/...",
        "//third_party/...",
    ],
)

# Exported for nodejs rules.
filegroup(
    name = "node_modules",
    srcs = glob(["node_modules/**/*"]),
)

# Debug; all runtime checks, verbose logging, and debug symbols.
#
# $ bazel build -c dbg ...
config_setting(
    name = "dbg",
    values = {"compilation_mode": "dbg"},
)

# Fast build; some runtime checks, detailed logging, and debug symbols.
# This is the default and will likely be what you want to use unless profiling.
#
# $ bazel build -c fastbuild ...
config_setting(
    name = "fastbuild",
    values = {"compilation_mode": "fastbuild"},
)

# Optimized; no runtime checks and terse logging.
#
# $ bazel build -c opt ...
config_setting(
    name = "opt",
    values = {"compilation_mode": "opt"},
)
