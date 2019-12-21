# Description:
#  IPC utilities for communicating with remote code (like the extension).

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "ipc",
    srcs = [
        "channel.js",
        "ipc.js",
        "messagechannel.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf/events:eventemitter",
        "//src/wtf/timing",
        "//src/wtf/trace:util",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)
