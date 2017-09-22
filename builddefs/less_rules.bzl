# Description:
#  Rules for building LESS CSS libraries.

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_css_library")


def _unfurl(deps, provider=""):
  """Returns deps as well as deps exported by parent rules."""
  res = []
  for dep in deps:
    if not provider or hasattr(dep, provider):
      res.append(dep)
    if hasattr(dep, "exports"):
      for edep in dep.exports:
        if not provider or hasattr(edep, provider):
          res.append(edep)
  return res


def _collect_less_deps(deps):
  """Aggregates transitive LESS source files from unfurled deps."""
  srcs = []
  for dep in deps:
    srcs += getattr(dep.less_css_library, "srcs", [])
    srcs += getattr(dep.less_css_library, "main_srcs", [])
    srcs += getattr(dep.less_css_library, "transitive_srcs", [])
  return srcs


def _less_css_library(ctx):
  deps = _unfurl(ctx.attr.deps, provider="less_css_library")
  less_deps = _collect_less_deps(deps)
  less_deps.extend(ctx.files.srcs)

  common_less_args = []
  include_paths = ["."]
  if ctx.attr.includes:
    include_paths.extend(ctx.attr.includes)
  common_less_args.append("--include-path=" + ":".join(include_paths))
  if ctx.attr.defs:
    common_less_args.extend(ctx.attr.defs)

  # Translate each .less into a .css individually.
  css_files = []
  for src in ctx.files.main_srcs:
    css_file = ctx.actions.declare_file(src.short_path[:-5] + ".css")
    css_files.append(css_file)
    ctx.actions.run(
        outputs = [css_file],
        inputs = [src] + less_deps,
        executable = ctx.executable._compiler,
        arguments = common_less_args + [
            src.path,
            css_file.path,
        ],
        mnemonic = "LessCompile",
        progress_message = "Translating LESS to CSS: %s" % (src.short_path),
    )

  return struct(
      files = depset(css_files),
      less_css_library = struct(
          srcs = ctx.files.srcs,
          main_srcs = ctx.files.main_srcs,
          transitive_srcs = less_deps,
      ),
      closure_css_library = struct(
          srcs = css_files,
          deps = deps,
          data = ctx.attr.srcs,
          orientation = ctx.attr.orientation,
      ),
  )

less_css_library = rule(
    implementation = _less_css_library,
    attrs = {
        "main_srcs": attr.label_list(allow_files=FileType([".css", ".less"])),
        "srcs": attr.label_list(allow_files=FileType([".css", ".less"])),
        "deps": attr.label_list(providers=["less_css_library"]),
        "includes": attr.string_list(),
        "defs": attr.string_list(),
        "orientation": attr.string(default="LTR"),
        "_compiler": attr.label(
            default = Label("//builddefs:lessc"),
            allow_files = True,
            cfg = "host",
            executable = True,
        ),
    },
    #outputs = {"out": "%{name}.css"},
)

