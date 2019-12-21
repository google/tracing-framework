# Description:
#  Utilities.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "util",
    srcs = [
        "canvas.js",
        "functionbuilder.js",
        "options.js",
        "util.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf/events:eventemitter",
        "@io_bazel_rules_closure//closure/library",
    ],
)
