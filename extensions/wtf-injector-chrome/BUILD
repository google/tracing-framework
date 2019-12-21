# Description:
#  WTF Chrome Extension.

package(default_visibility = ["//:internal"])

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_css_binary")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_binary")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_deps")
load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_library")
load("//builddefs:config.bzl", "SHARED_CSS_FLAGS")
load("//builddefs:config.bzl", "SHARED_JS_FLAGS")
load("//builddefs:file_rules.bzl", "concat_files", "embed_files", "strip_comments")
load("//builddefs:less_rules.bzl", "less_css_library")
load("//builddefs:packaging_rules.bzl", "pkg_zip")

# CWS hates comments in extension manifests - strip them all.
strip_comments(
    name = "stripped_manifest",
    srcs = ["manifest.template.json"],
    out = "manifest.json",
)

less_css_library(
    name = "popup_styles",
    includes = ["src"],
    main_srcs = ["popup.less"],
    deps = [
        "//src/wtf/ui/styles",
    ],
)

filegroup(
    name = "extension_files",
    srcs = [
        "//app",
        "//bindings/js",
        ":stripped_manifest",
        ":popup_styles",
        "background.js",
        "debugger.js",
        "extension.js",
        "injectedtab.js",
        "options.js",
        "popup.html",
        "popup.js",
        "tracer.js",
        "uri.js",
        "wtf-call-tracing.js",
        "wtf-injector.js",
        "wtf-process.js",
    ] + glob([
        "assets/icons/*.png",
        "third_party/*.js",
    ]),
)

pkg_zip(
    name = "wtf-injector-chrome",
    srcs = [":extension_files"],
    path_mapping = {
        "bindings/js/": "",
        "extensions/wtf-injector-chrome/": "",
    },
)
