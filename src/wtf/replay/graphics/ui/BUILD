# Description:
#  Graphics replay UI.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("//builddefs:less_rules.bzl", "less_css_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_template_library")

closure_js_library(
    name = "ui",
    srcs = [
        "argumentsdialog.js",
        "canvasarea.js",
        "contextbox.js",
        "eventnavigator.js",
        "eventnavigatorsource.js",
        "eventnavigatortoolbar.js",
        "graphicspanel.js",
        "graphicstoolbar.js",
        "rangeseeker.js",
        "replayframepainter.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":ui_templates",
        "//src/wtf/db",
        "//src/wtf/events",
        "//src/wtf/events:eventemitter",
        "//src/wtf/math",
        "//src/wtf/replay/graphics:graphics_library",
        "//src/wtf/timing",
        "//src/wtf/ui:control",
        "//src/wtf/ui:dialog",
        "//src/wtf/ui:errordialog",
        "//src/wtf/ui:searchcontrol",
        "//src/wtf/ui:tooltip",
        "//src/wtf/ui:virtualtable",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_template_library(
    name = "ui_templates",
    srcs = [
        "argumentsdialog.soy",
        "canvasarea.soy",
        "contextbox.soy",
        "eventnavigator.soy",
        "eventnavigatortoolbar.soy",
        "graphicspanel.soy",
        "graphicstoolbar.soy",
        "rangeseeker.soy",
    ],
)

less_css_library(
    name = "graphics_styles",
    srcs = [
        "argumentsdialog.less",
        "canvasarea.less",
        "contextbox.less",
        "eventnavigator.less",
        "eventnavigatortoolbar.less",
        "graphicspanel.less",
        "graphicstoolbar.less",
        "rangeseeker.less",
    ],
    includes = ["src"],
    main_srcs = ["graphics.less"],
    deps = [
        "//src/wtf/ui:ui_styles",
        "//src/wtf/ui/styles",
    ],
)
