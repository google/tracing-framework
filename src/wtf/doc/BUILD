# Description:
#  Abstract loaded trace document.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "doc",
    srcs = [
        "comment.js",
        "commentscope.js",
        "document.js",
        "profile.js",
        "profilescope.js",
        "view.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "//src/wtf/db",
        "//src/wtf/events:eventemitter",
        "@io_bazel_rules_closure//closure/library",
    ],
)
