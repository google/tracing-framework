# Description:
#  Common UI utilities and support.
#  App UI lives under //src/wtf/app.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("//builddefs:less_rules.bzl", "less_css_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_template_library")

# TODO(benvanik): split up.
less_css_library(
    name = "ui_styles",
    srcs = [
        "dialog.less",
        "errordialog.less",
        "progressdialog.less",
        "settingsdialog.less",
        "tooltip.less",
        "virtualtable.less",
    ],
    includes = ["src"],
    main_srcs = ["ui.less"],
    deps = [
        "//src/wtf/ui/styles",
    ],
)

closure_js_library(
    name = "color",
    srcs = [
        "color/color.js",
        "color/palette.js",
        "//third_party/d3:colorbrewer",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "control",
    srcs = [
        "control.js",
        "painter.js",
        "resizablecontrol.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":tooltip",
        "//src/wtf/events",
        "//src/wtf/events:eventemitter",
        "//src/wtf/timing",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "dialog",
    srcs = [
        "dialog.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":control",
        "//src/wtf/events",
        "//src/wtf/timing",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "errordialog",
    srcs = ["errordialog.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":dialog",
        ":errordialog_template",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_template_library(
    name = "errordialog_template",
    srcs = ["errordialog.soy"],
)

closure_js_library(
    name = "icons",
    srcs = ["icons.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "gridpainter",
    srcs = ["gridpainter.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":control",
        ":timepainter",
        "//src/wtf/math",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "progressdialog",
    srcs = ["progressdialog.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":dialog",
        ":progressdialog_template",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_template_library(
    name = "progressdialog_template",
    srcs = ["progressdialog.soy"],
)

closure_js_library(
    name = "rangepainter",
    srcs = [
        "rangepainter.js",
        "rangerenderer.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":control",
        ":timepainter",
        "//src/wtf/math",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "rulerpainter",
    srcs = ["rulerpainter.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":control",
        ":timepainter",
        "//src/wtf/db:unit",
        "//src/wtf/math",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "searchcontrol",
    srcs = ["searchcontrol.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":control",
        "//src/wtf/events",
        "//src/wtf/events:eventemitter",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "settingsdialog",
    srcs = ["settingsdialog.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":dialog",
        ":settingsdialog_template",
        "//src/wtf/trace:util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_template_library(
    name = "settingsdialog_template",
    srcs = ["settingsdialog.soy"],
)

closure_js_library(
    name = "timepainter",
    srcs = ["timepainter.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":control",
        "//src/wtf/db:unit",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "tooltip",
    srcs = ["tooltip.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "virtualtable",
    srcs = [
        "virtualtable.js",
        "virtualtablesource.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":control",
        ":tooltip",
        ":virtualtable_template",
        "//src/wtf/events",
        "//src/wtf/events:eventemitter",
        "//src/wtf/math",
        "//src/wtf/timing",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_template_library(
    name = "virtualtable_template",
    srcs = ["virtualtable.soy"],
)

closure_js_library(
    name = "zoom",
    srcs = [
        "zoom/element.js",
        "zoom/itarget.js",
        "zoom/spring.js",
        "zoom/viewport.js",
        "zoom/zoom.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "//src/wtf/events",
        "//src/wtf/events:eventemitter",
        "//src/wtf/timing",
        "@io_bazel_rules_closure//closure/library",
    ],
)
