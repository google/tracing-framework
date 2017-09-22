# Description:
#  Browser tracing HUD.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("//builddefs:less_rules.bzl", "less_css_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_template_library")

closure_js_library(
    name = "hud",
    srcs = [
        "exports.js",
        "hud.js",
        "livegraph.js",
        "overlay.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":overlay_template",
        "//src/wtf/addon",
        "//src/wtf/events",
        "//src/wtf/io",
        "//src/wtf/ipc",
        "//src/wtf/trace",
        "//src/wtf/trace:util",
        "//src/wtf/ui:control",
        "//src/wtf/ui:errordialog",
        "//src/wtf/ui:icons",
        "//src/wtf/ui:settingsdialog",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

less_css_library(
    name = "hud_styles",
    srcs = [
        "livegraph.less",
        "overlay.less",
    ],
    includes = ["src"],
    main_srcs = ["hud.less"],
    deps = [
        "//src/wtf/ui:ui_styles",
        "//src/wtf/ui/styles",
    ],
)

closure_js_template_library(
    name = "overlay_template",
    srcs = ["overlay.soy"],
)
