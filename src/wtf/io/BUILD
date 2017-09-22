# Description:
#  IO subsystem for basic IO operations and the WTF file formats.

package(default_visibility = ["//:internal"])

load("//builddefs:config.bzl", "COMMON_JS_SUPPRESSIONS")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")

closure_js_library(
    name = "io",
    srcs = [
        "blob.js",
        "buffer.js",
        "bufferview.js",
        "drive.js",
        "eventtype.js",
        "io.js",
        "readtransport.js",
        # TODO(benvanik): figure out if I lost this code.
        #"streaminghttpwritestream.js",
        "stringtable.js",
        "writetransport.js",
        "transports/blobreadtransport.js",
        "transports/blobwritetransport.js",
        "transports/filereadtransport.js",
        "transports/filewritetransport.js",
        "transports/memoryreadtransport.js",
        "transports/memorywritetransport.js",
        "transports/nullwritetransport.js",
        "transports/xhrreadtransport.js",
        "transports/xhrwritetransport.js",
    ],
    suppress = COMMON_JS_SUPPRESSIONS,
    deps = [
        "//src/wtf",
        "//src/wtf/events:eventemitter",
        "//src/wtf/pal",
        "//src/wtf/timing",
        "@io_bazel_rules_closure//closure/library",
    ],
)
