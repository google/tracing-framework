# Description:
#  WTF chunked file format reading/writing.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "cff",
    srcs = [
        "binarystreamsource.js",
        "binarystreamtarget.js",
        "chunk.js",
        "chunks/eventdatachunk.js",
        "chunks/fileheaderchunk.js",
        "chunktype.js",
        "jsonstreamsource.js",
        "jsonstreamtarget.js",
        "part.js",
        "parts/binaryeventbufferpart.js",
        "parts/fileheaderpart.js",
        "parts/jsoneventbufferpart.js",
        "parts/legacyeventbufferpart.js",
        "parts/resourcepart.js",
        "parts/stringtablepart.js",
        "parttype.js",
        "streambase.js",
        "streamsource.js",
        "streamtarget.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "//src/wtf/data",
        "//src/wtf/events:eventemitter",
        "//src/wtf/io",
        "@io_bazel_rules_closure//closure/library",
    ],
)
