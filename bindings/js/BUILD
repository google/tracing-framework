# Description:
#  WTF Javascript bindings.

package(default_visibility = ["//:internal"])

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_css_binary")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_binary")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_deps")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("//builddefs:config.bzl", "SHARED_CSS_FLAGS")
load("//builddefs:config.bzl", "SHARED_JS_FLAGS")
load("//builddefs:file_rules.bzl", "concat_files", "embed_files")
load("//builddefs:packaging_rules.bzl", "pkg_zip")

# ------------------------------------------------------------------------------
# JavaScript
# ------------------------------------------------------------------------------

# third_party js
filegroup(
    name = "third_party_js",
    srcs = [
        "//third_party/d3:colorbrewer",
    ],
)

# ------------------------------------------------------------------------------
# JavaScript : node
# ------------------------------------------------------------------------------

closure_js_binary(
    name = "wtf_node_js_compiled",
    compilation_level = "ADVANCED",
    defs = SHARED_JS_FLAGS + [
        "--define=goog.DEBUG=false",
        "--define=goog.asserts.ENABLE_ASSERTS=false",
        "--define=wtf.NODE=true",
        "--define=wtf.db.exports.ENABLE_EXPORTS=true",
        "--define=wtf.trace.exports.ENABLE_EXPORTS=true",
    ],
    dependency_mode = "STRICT",
    entry_points = [
        "wtf.db.exports",
        "wtf.db.node",
        "wtf.trace.exports",
        "wtf.trace.node",
    ],
    language = "ECMASCRIPT5_STRICT",
    output_wrapper = "module.exports = (function(exports){%output%;return this.wtf;}).call(global); delete global.wtf;",
    deps = [
        "//src/wtf/db:node",
        "//src/wtf/trace:node",
        "@io_bazel_rules_closure//closure/library",
    ],
)

# ------------------------------------------------------------------------------
# JavaScript : web (minimal)
# ------------------------------------------------------------------------------

closure_js_binary(
    name = "wtf_trace_min_js_compiled",
    compilation_level = "ADVANCED",
    defs = SHARED_JS_FLAGS + [
        "--define=wtf.MIN_BUILD=true",
        "--define=wtf.trace.exports.ENABLE_EXPORTS=true",
    ],
    dependency_mode = "STRICT",
    entry_points = [
        "wtf.trace.exports",
    ],
    language = "ECMASCRIPT5_STRICT",
    output_wrapper = "if(!this.wtf){(function(){%output%}).call(this);}",
    deps = [
        "//src/wtf/trace",
        "@io_bazel_rules_closure//closure/library",
    ],
)

# ------------------------------------------------------------------------------
# JavaScript : web (minimal with prod flag)
# ------------------------------------------------------------------------------

closure_js_binary(
    name = "wtf_trace_prod_js_compiled",
    compilation_level = "ADVANCED",
    defs = SHARED_JS_FLAGS + [
        "--define=wtf.MIN_BUILD=true",
        "--define=wtf.PROD_BUILD=true",
        "--define=wtf.trace.exports.ENABLE_EXPORTS=true",
    ],
    dependency_mode = "STRICT",
    entry_points = [
        "wtf.trace.exports",
    ],
    language = "ECMASCRIPT5_STRICT",
    output_wrapper = "if(!this.wtf){(function(){%output%}).call(this);}",
    deps = [
        "//src/wtf/trace",
        "@io_bazel_rules_closure//closure/library",
    ],
)

# ------------------------------------------------------------------------------
# JavaScript : web (with HUD)
# ------------------------------------------------------------------------------

WTF_TRACE_WEB_JS_DEPS = [
    "//src/wtf/addon",
    "//src/wtf/hud",
    "//src/wtf/remote",
    "//src/wtf/trace",
    "@io_bazel_rules_closure//closure/library",
]

closure_js_deps(
    name = "wtf_trace_web_js_uncompiled",
    deps = WTF_TRACE_WEB_JS_DEPS,
)

closure_js_binary(
    name = "wtf_trace_web_js_compiled_head",
    css = ":wtf_trace_web_css_compiled",
    defs = SHARED_JS_FLAGS + [
        "--define=wtf.hud.exports.ENABLE_EXPORTS=true",
        "--define=wtf.remote.exports.ENABLE_EXPORTS=true",
        "--define=wtf.trace.exports.ENABLE_EXPORTS=true",
    ],
    dependency_mode = "STRICT",
    entry_points = [
        "wtf.addon",
        "wtf.hud.exports",
        "wtf.remote.exports",
        "wtf.trace.exports",
    ],
    language = "ECMASCRIPT5_STRICT",
    output_wrapper = "if(!this.wtf){(function(){%output%}).call(this);}",
    deps = WTF_TRACE_WEB_JS_DEPS,
)

closure_css_binary(
    name = "wtf_trace_web_css_compiled",
    defs = SHARED_CSS_FLAGS,
    renaming = False,
    deps = ["//src/wtf/hud:hud_styles"],
)

STYLES_WRAPPER = "".join([
    "if(this.window && !window.wtf_styles){window.wtf_styles=1;\n",
    "var style = document.createElement('style');\n",
    "style.innerHTML = '%output%';\n",
    "(document.documentElement || document.head).appendChild(style);\n",
    "}\n",
])

embed_files(
    name = "wtf_trace_web_css_compiled_js",
    srcs = [":wtf_trace_web_css_compiled.css"],
    out = "wtf_trace_web_css_compiled.js",
    wrapper = STYLES_WRAPPER,
)

concat_files(
    name = "wtf_trace_web_js_compiled",
    parts = [
        # Order matters; JS must go first.
        ":wtf_trace_web_js_compiled_head.js",
        ":wtf_trace_web_css_compiled_js",
        "//assets:hud_icons",
    ],
    out = "wtf_trace_web_js_compiled.js",
)

pkg_zip(
    name = "wtf-trace-web-api",
    srcs = [
        ":wtf_trace_web_js_compiled",
        "wtf-trace-closure.js",
        "wtf-trace-disabled.js",
        "wtf-trace.js",
    ],
    path_mapping = {
        "bindings/js/wtf-trace-closure.js": "shims/wtf-trace-closure.js",
        "bindings/js/wtf-trace-disabled.js": "shims/wtf-trace-disabled.js",
        "bindings/js/wtf-trace.js": "shims/wtf-trace.js",
        "bindings/js/wtf_trace_web_js_compiled.js": "wtf_trace_web_js_compiled.js",
    },
)

filegroup(
    name = "js",
    srcs = select({
        "//:dbg": [
            # TODO(benvanik): exploded.
            ":wtf_trace_web_css_compiled",
            ":wtf_trace_web_js_uncompiled",
        ],
        "//:fastbuild": [
            ":wtf_trace_web_js_compiled",
        ],
        "//:opt": [
            ":wtf_trace_web_js_compiled",
        ],
    }),
    visibility = ["//visibility:public"],
)
