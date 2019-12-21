# Description:
#  WTF Javascript app UI.

package(default_visibility = ["//:internal"])

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_css_binary")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_binary")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("//builddefs:config.bzl", "SHARED_CSS_FLAGS")
load("//builddefs:config.bzl", "SHARED_JS_FLAGS")
load("//builddefs:packaging_rules.bzl", "pkg_zip")

filegroup(
    name = "icons",
    srcs = glob(["icons/**"]),
)

closure_js_binary(
    name = "wtf_ui_js_compiled",
    defs = SHARED_JS_FLAGS + [
        "--define=wtf.app.exports.ENABLE_EXPORTS=true",
        "--define=wtf.db.exports.ENABLE_EXPORTS=true",
        "--define=wtf.replay.graphics.exports.ENABLE_EXPORTS=true",
        "--define=wtf.replay.timeTravel.exports.ENABLE_EXPORTS=true",
    ],
    dependency_mode = "STRICT",
    entry_points = [
        "wtf.app.exports",
        "wtf.db.exports",
        "wtf.replay.graphics.exports",
        "wtf.replay.timeTravel.exports",
    ],
    language = "ECMASCRIPT5_STRICT",
    output_wrapper = "(function(){%output%}).call(window)",
    deps = [
        "//src/wtf/addon",
        "//src/wtf/app",
        "//src/wtf/db",
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_css_binary(
    name = "wtf_ui_styles",
    defs = SHARED_CSS_FLAGS,
    renaming = False,
    deps = ["//src/wtf/app:app_styles"],
)

filegroup(
    name = "app",
    srcs = select({
        "//:dbg": [
            # TODO(benvanik): exploded mode.
            "maindisplay-debug.html",
            "scripts/debug-prefix.js",
            "scripts/debug-postfix-maindisplay.js",
            "//third_party/d3:min",
            ":wtf_ui_styles",
        ],
        "//:fastbuild": [
            ":wtf_ui_js_compiled",
            "maindisplay-debug.html",
            ":wtf_ui_styles",
            ":icons",
            "//third_party/d3:min",
        ],
        "//:opt": [
            ":wtf_ui_js_compiled",
            ":icons",
            "maindisplay.html",
            "scripts/release-maindisplay.js",
            "//third_party/d3:min",
            ":wtf_ui_styles",
        ],
    }),
)

pkg_zip(
    name = "wtf-app",
    srcs = [":app",],
)
