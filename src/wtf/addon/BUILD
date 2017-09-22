# Description:
#  Add-on API.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "addon",
    srcs = [
        "addon.js",
        "appaddon.js",
        "manifest.js",
        "registry.js",
        "traceaddon.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf/events:eventemitter",
        "@io_bazel_rules_closure//closure/library",
    ],
)
