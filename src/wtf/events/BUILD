# Description:
#  Eventing and common app event types.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "events",
    srcs = [
        "commandmanager.js",
        "events.js",
        "keyboard.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":eventemitter",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "eventemitter",
    srcs = [
        "eventemitter.js",
        "eventfullist.js",
        "eventfulmap.js",
        "eventtype.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "@io_bazel_rules_closure//closure/library",
    ],
)
