# Description:
#   D3.js.

package(default_visibility = ["//:internal"])

licenses(["notice"])  # New BSD

load("//builddefs:file_rules.bzl", "concat_files")

filegroup(
    name = "colorbrewer",
    srcs = ["colorbrewer.js"],
)

filegroup(
    name = "plugins",
    srcs = [
        "sankey.js",
    ],
)

# Debug files.
concat_files(
    name = "debug",
    parts = [
        "d3.v3.js",
        ":plugins",
    ],
    out = "d3-debug-concat.js",
)

# Minified files.
concat_files(
    name = "min",
    parts = [
        "d3.v3.min.js",
        ":plugins",
    ],
    out = "d3-min-concat.js",
)
