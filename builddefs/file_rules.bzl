# Description:
#  Rules for file manipulation.


def _concat_files_impl(ctx):
  ctx.actions.run(
      inputs = ctx.files.parts,
      outputs = [ctx.outputs.out],
      arguments = [
          ctx.outputs.out.path,
      ] + [f.path for f in ctx.files.parts],
      progress_message = "Concating into %s" % (ctx.outputs.out.short_path),
      executable = ctx.executable._concat_tool,
  )

concat_files = rule(
    implementation = _concat_files_impl,
    attrs = {
        "parts": attr.label_list(allow_files = True),
        "out": attr.output(mandatory = True),
        "_concat_tool": attr.label(
            executable = True,
            cfg = "host",
            allow_files = True,
            default = Label("//builddefs:concat_files"),
        ),
    },
)


def _embed_files_impl(ctx):
  # Write template string to a file as that's what expand_template wants.
  template_file = ctx.actions.declare_file(ctx.label.name + "_template")
  ctx.actions.write(
      output = template_file,
      content = ctx.attr.wrapper,
  )

  # Convert and template each file.
  templated_src_files = []
  for src_file in ctx.files.srcs:
    # Prepare temporary output file.
    templated_src_file = ctx.actions.declare_file(src_file.short_path + ".templated")
    templated_src_files.append(templated_src_file)

    # Issue conversion command.
    ctx.actions.run(
        inputs = [template_file, src_file],
        outputs = [templated_src_file],
        arguments = [
            ctx.attr.encoding,
            template_file.path,
            templated_src_file.path,
            src_file.path,
        ],
        progress_message = "Embedding %s" % (src_file.short_path),
        executable = ctx.executable._embed_tool,
    )

  # Concat all files together.
  ctx.actions.run(
      inputs = templated_src_files,
      outputs = [ctx.outputs.out],
      arguments = [
          ctx.outputs.out.path,
      ] + [f.path for f in templated_src_files],
      progress_message = "Concating into %s" % (ctx.outputs.out.short_path),
      executable = ctx.executable._concat_tool,
  )

embed_files = rule(
    implementation = _embed_files_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = True),
        "wrapper": attr.string(default = "%output%"),
        "encoding": attr.string(default = "utf8"),
        "out": attr.output(mandatory = True),
        "_embed_tool": attr.label(
            executable = True,
            cfg = "host",
            allow_files = True,
            default = Label("//builddefs:embed_files"),
        ),
        "_concat_tool": attr.label(
            executable = True,
            cfg = "host",
            allow_files = True,
            default = Label("//builddefs:concat_files"),
        ),
    },
)


def _strip_comments_impl(ctx):
  ctx.actions.run(
      inputs = ctx.files.srcs,
      outputs = [ctx.outputs.out],
      arguments = [
          ctx.files.srcs[0].path,
          ctx.outputs.out.path,
      ],
      progress_message = "Stripping comments from %s" % (ctx.outputs.out.short_path),
      executable = ctx.executable._strip_comments_tool,
  )

strip_comments = rule(
    implementation = _strip_comments_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = True),
        "out": attr.output(mandatory = True),
        "_strip_comments_tool": attr.label(
            executable = True,
            cfg = "host",
            allow_files = True,
            default = Label("//builddefs:strip_comments"),
        ),
    },
)
