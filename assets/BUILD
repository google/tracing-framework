# Description:
#  Assets such as icons and images.

package(default_visibility = ["//:internal"])

load("//builddefs:file_rules.bzl", "concat_files", "embed_files")

ICON_WRAPPER = "".join([
    "wtf.ui.icons.setIconData(",
    "'/%path%', ",
    "'data:image/png;base64,%output%'",
    ");\n",
])

embed_files(
    name = "hud_icons",
    srcs = glob(["icons/**/*.png"]),
    out = "hud_icons.js",
    encoding = "base64",
    wrapper = ICON_WRAPPER,
)
