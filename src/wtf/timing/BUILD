# Description:
#  Timers and time queries.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "timing",
    srcs = [
        "browserinterval.js",
        "handle.js",
        "renderinterval.js",
        "rendertimer.js",
        "timing.js",
        "util.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "@io_bazel_rules_closure//closure/library",
    ],
)
