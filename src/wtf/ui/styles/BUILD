# Description:
#  Shared UI styles for reset, compatibility, and kennedy.

package(default_visibility = ["//:internal"])

load("//builddefs:less_rules.bzl", "less_css_library")

less_css_library(
    name = "styles",
    srcs = [
        "common.less",
        "css3.less",
        "kennedy.less",
        "reset.less",
    ],
    includes = [
        ".",
        "src",
    ],
    deps = [
        "//third_party:normalize_css",
    ],
)
