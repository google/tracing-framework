# Embedded Tracing

It is possible to embed the tracing library into a page and avoid the need for a
browser extesion. This makes it easier to use the library with browsers that
don't have an extension or have it installed (iOS/IE/etc).

## Browser/HTML Pages

Obtain a copy of `wtf_trace_web_js_compiled.js`:

    # Build the release trace library js
    # Alternatively you can build :release
    anvil build :wtf_trace_web_js_compiled
    # Copy the build-out/wtf_trace_web_js_compiled.js to wherever you want

Add the appropriate `<script>` tags to the HTML page:

    <html>
      <head>
        <!-- This MUST be the first script on the page! -->
        <script src="wtf_trace_web_js_compiled.js"></script>
        <script>
          wtf.trace.prepare(/* optional options */);
          wtf.trace.start({
            'wtf.trace.mode': 'snapshotting',
            'wtf.trace.target': 'file://test'
          });
        </script>
      </head>
      ...
    </html>

In snapshotting mode you can then call `wtf.trace.snapshot()` at any time to
create a snapshot and push it to the target.

### HUD

To add the HUD to a page and get the fancy UI, you must call the HUD preparation
method. You may still call the `wtf.trace.snapshot()` method manually as well
as using the UI.

    <html>
      <head>
        <script src="wtf_trace_web_js_compiled.js"></script>
        <script>
          var options = {
            'wtf.trace.mode': 'snapshotting',
            'wtf.trace.target': 'file://test'
          };
          wtf.hud.prepare(options);
          wtf.trace.start(options);
        </script>
      </head>
      ...
    </html>

## node.js apps

NOTE: this is experimental and not yet ready for use!

Obtain a copy of `wtf_trace_node_release.js`:

```bash
# Build the release trace library js
anvil build :wtf_trace_node_release
# Copy the build-out/wtf_trace_node_release.js to wherever you want
```

Run your app with the runner script:

```bash
node ./bin/trace-runner.js myscript.js arg1 arg2 ...
# See node.wtf-trace for the result
```
