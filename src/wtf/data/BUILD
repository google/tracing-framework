# Description:
#  Event data types.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "data",
    srcs = [
        "contextinfo.js",
        "eventclass.js",
        "eventflag.js",
        "formats.js",
        "variable.js",
        "webidl.js",
        "zonetype.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "@io_bazel_rules_closure//closure/library",
    ],
)
