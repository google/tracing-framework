# Description:
#  Math utilities.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "math",
    srcs = [
        "math.js",
        "mersennetwister.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
)
