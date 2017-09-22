# Description:
#  Remote tracing support.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "remote",
    srcs = [
        "client.js",
        "exports.js",
        "remote.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf/data",
        "//src/wtf/events",
        "//src/wtf/io",
        "//src/wtf/trace",
        "@io_bazel_rules_closure//closure/library",
    ],
)
