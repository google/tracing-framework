# Description:
#  Bazel macros, rules, and defines.

package(default_visibility = ["//:internal"])

load("@build_bazel_rules_nodejs//:defs.bzl", "nodejs_binary")

# Used by the file_rules.bzl:concat_files rule.
sh_binary(
    name = "concat_files",
    srcs = ["concat_files.sh"],
)

# Used by the file_rules.bzl:embed_files rule.
py_binary(
    name = "embed_files",
    srcs = ["embed_files.py"],
)

# Used by the file_rules.bzl:strip_comments rule.
py_binary(
    name = "strip_comments",
    srcs = ["strip_comments.py"],
)

# Used by the less_rules.bzl:less_css_library rule.
nodejs_binary(
    name = "lessc",
    entry_point = "less/bin/lessc",
)
