# Description:
#  Tracing support.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "trace",
    srcs = [
        "builtinevents.js",
        "eventregistry.js",
        "events.js",
        "eventsessioncontext.js",
        "eventtarget.js",
        "eventtype.js",
        "eventtypebuilder.js",
        "exports.js",
        "flow.js",
        "instrument.js",
        "prepare.js",
        "provider.js",
        "scope.js",
        "session.js",
        "trace.js",
        "tracemanager.js",
        "zone.js",

        # TODO(benvanik): conditional on build type?
        "providers/chromedebugprovider.js",
        "providers/consoleprovider.js",
        "providers/domprovider.js",
        "providers/firefoxdebugprovider.js",
        "providers/imageprovider.js",
        "providers/providers.js",
        "providers/replayprovider.js",
        "providers/timingprovider.js",
        "providers/webglprovider.js",
        "providers/websocketprovider.js",
        "providers/webworkerprovider.js",
        "providers/xhrprovider.js",
        "sessions/nullsession.js",
        "sessions/snapshottingsession.js",
        "sessions/streamingsession.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":util",
        "//src/wtf",
        "//src/wtf/data",
        "//src/wtf/events:eventemitter",
        "//src/wtf/io",
        "//src/wtf/io/cff",
        "//src/wtf/ipc",
        "//src/wtf/math",
        "//src/wtf/pal",
        "//src/wtf/timing",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "node",
    srcs = ["node.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":trace",
        "//src/wtf",
    ],
)

closure_js_library(
    name = "util",
    srcs = ["util.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "@io_bazel_rules_closure//closure/library",
    ],
)
