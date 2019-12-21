# Description:
#  Time-travel replay.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("//builddefs:less_rules.bzl", "less_css_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_template_library")

closure_js_library(
    name = "timetravel",
    srcs = [
        "controller.js",
        "exports.js",
        "replaysession.js",
        "timetravel.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":controller_template",
        "//src/wtf",
        "//src/wtf/data",
        "//src/wtf/db",
        "//src/wtf/events:eventemitter",
        "//src/wtf/io",
        "//src/wtf/io/cff",
        "//src/wtf/math",
        "//src/wtf/ui:control",
        "//src/wtf/ui:dialog",
        "//src/wtf/ui:errordialog",
        "//src/wtf/ui:progressdialog",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_template_library(
    name = "controller_template",
    srcs = ["controller.soy"],
)

less_css_library(
    name = "timetravel_styles",
    srcs = [
        "controller.less",
    ],
    includes = ["src"],
    main_srcs = ["timetravel.less"],
    deps = [
        "//src/wtf/ui:ui_styles",
        "//src/wtf/ui/styles",
    ],
)
