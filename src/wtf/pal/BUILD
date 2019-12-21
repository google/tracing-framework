# Description:
#  Platform abstraction layer for supporting browser and non-browser runtimes.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "pal",
    srcs = [
        "browserplatform.js",
        "chromeplatform.js",
        "iplatform.js",
        "nodeplatform.js",
        "pal.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "@io_bazel_rules_closure//closure/library",
    ],
)
