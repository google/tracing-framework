# Description:
#  Graphics replay.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "graphics",
    srcs = [
        "exports.js",
        "graphics.js",
        "session.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":graphics_library",
        "//src/wtf",
        "//src/wtf/db",
        "//src/wtf/events",
        "//src/wtf/events:eventemitter",
        "//src/wtf/replay/graphics/ui",
        "//src/wtf/timing",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "graphics_library",
    srcs = [
        "contextpool.js",
        "drawcallvisualizer.js",
        "experiment.js",
        "extensionmanager.js",
        "frameoverdrawvisualizer.js",
        "frametimevisualizer.js",
        "highlightvisualizer.js",
        "offscreensurface.js",
        "overdrawsurface.js",
        "overdrawvisualizer.js",
        "playback.js",
        "program.js",
        "replayframe.js",
        "skipcallsvisualizer.js",
        "step.js",
        "visualizer.js",
        "webglstate.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "//src/wtf/db",
        "//src/wtf/events",
        "//src/wtf/events:eventemitter",
        "//src/wtf/timing",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)
