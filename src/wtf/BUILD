# Description:
#  Shared macros and versioning rules.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "wtf",
    srcs = [
        "version.js",
        "wtf.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//externs",
    ],
)
