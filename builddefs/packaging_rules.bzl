# Description:
#  Rules for packaging build outputs.


def _pkg_zip_impl(ctx):
  # Copy all files into the staging directory.
  staging_dir = ctx.attr.name + "_pkg"
  staged_files = []
  for src_file in ctx.files.srcs:
    # Remap path, if desired.
    original_path = src_file.short_path
    staged_path = original_path
    for (prefix, replacement) in ctx.attr.path_mapping.items():
      if staged_path.startswith(prefix):
        staged_path = staged_path.replace(prefix, replacement)
    staged_path = "/".join([staging_dir, staged_path])

    # Copy to staging path.
    staged_file = ctx.actions.declare_file(staged_path)
    staged_files.append(staged_file)
    ctx.actions.run_shell(
        inputs = [src_file],
        outputs = [staged_file],
        command = "cp $1 $2",
        arguments = [
            src_file.path,
            staged_file.path,
        ],
        progress_message = "Staging %s" % (src_file.short_path),
    )

  # Zip all of the files in the staging dir.
  staged_file_paths = []
  staged_base_path = "/".join([ctx.label.package, staging_dir]) + "/"
  for staged_file in staged_files:
    relative_path = staged_file.short_path.replace(staged_base_path, "")
    staged_file_paths.append("/".join([relative_path]))
  ctx.actions.run_shell(
      inputs = staged_files,
      outputs = [ctx.outputs.out],
      command = "\n".join([
          "ROOT_PATH=`pwd`",
          "cd %s" % ("/".join([ctx.outputs.out.dirname, staging_dir])),
          "zip -rqD $ROOT_PATH/%s %s" % (
              ctx.outputs.out.path,
              " ".join(staged_file_paths),
          ),
          "cd -",
      ]),
      progress_message = "Zipping package %s" % (ctx.outputs.out.short_path),
  )

  return struct(
      files = depset([ctx.outputs.out]),
  )

pkg_zip = rule(
    implementation = _pkg_zip_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = True),
        "path_mapping": attr.string_dict(),
    },
    outputs = {
        "out": "%{name}.zip",
    },
)
