# Description:
#  Trace database loading and querying.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "db",
    srcs = [
        "database.js",
        "datasource.js",
        "datasourceinfo.js",
        "db.js",
        "eventindex.js",
        "eventiterator.js",
        "eventlist.js",
        "eventstatistics.js",
        "eventstruct.js",
        "eventtype.js",
        "eventtypebuilder.js",
        "eventtypetable.js",
        "exports.js",
        "filter.js",
        "filterparser.js",
        "frame.js",
        "framelist.js",
        "healthinfo.js",
        "mark.js",
        "marklist.js",
        "queryresult.js",
        "sources/callsdatasource.js",
        "sources/chunkeddatasource.js",
        "sources/cpuprofiledatasource.js",
        "timerange.js",
        "timerangelist.js",
        "zone.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":unit",
        "//src/wtf",
        "//src/wtf/data",
        "//src/wtf/events:eventemitter",
        "//src/wtf/io",
        "//src/wtf/io/cff",
        "//src/wtf/pal",
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "node",
    srcs = ["node.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        ":db",
        "//src/wtf/pal",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_library(
    name = "unit",
    srcs = ["unit.js"],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf/util",
        "@io_bazel_rules_closure//closure/library",
    ],
)
