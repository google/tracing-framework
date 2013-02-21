# Call Tracing

Warning: this feature is experimental and requires a bit of work to get going.

This tool makes it possible to get a full function call trace of your
application without the need to instrument anything manually. Since there's an
overwhelming amount of data being recorded only the fact that calls were made
is encoded, and no times are available.

The basic usage is to instrument your code (via a command line tool or a proxy),
capture the call trace data, and view it in WTF.

## Preparing Your Code

### Remove Tracing/Assertions/Logs

First off, **make sure all WTF tracing code is disabled**. This tool does not
interact with `wtf.trace` calls well and if they are present you'll end up
seeing them in your output. Strip all calls using a compiler or an if guard.

Next, drop all code you aren't interested in. Future versions may allow you to
selectively ignore functions (by adding a .ignore property to functions or
something), but for now you should strip what you don't want like asserts/etc.

### Ensure Functions are Named

This tool only supports named function declarations right now:

```
// This will be named properly:
function someName() {}
var named1 = function() {};
My.named2 = function() {};
My.prototype.named3 = function() {};
```

Future versions will try to handle other cases better.

If you're using Closure Compiler to generate your optimized code you can enable
anonymous function naming via the `setAnonymousFunctionNaming` compiler option.
It should be set to either `UNMAPPED` or `MAPPED`. This is
`setDebugOptionsForCompilationLevel` in the CompilationLevel and exposed to the
command line as `--debug`.

### Use Final Output (with names on)

If you're using Closure Compiler ensure you have inlining/etc enabled so that
the structure of the code you're executing is what you will be shipping. The
**only** difference between the code you run this tool on and what you ship
should be visual only (pretty printing, naming, etc).

## Manual Instrumentation

If you have a Javascript file you'd like to instrument the easiest way to get
started is by using the `wtf-instrument` tool included in the npm package
(aka `./bin/instrument.js` in the repo).

This tool will take an input file and produce an instrumented version that can
be used on a page.

```
# Generate the instrumented js file.
wtf-instrument myapp.js myapp.instrumented.js
```

Once you have this file, include it on your page instead of the uninstrmented
version. That's it! See below for how to actually use the instrumented page.

Caveats:

* Only one Javascript file on a page can be instrumented this way right now. If
you need more use the proxy below.

## Automatic Instrumentation

By running a tiny proxy server and using a Chrome extension it's possible to
automatically instrument all Javascript sources on a page automatically.

Flow:

* Launch the proxy server (`wtf-instrument --server`).
* Install and enable the Chrome extension (wtf-instrument-proxy).
* Reload the page you want to instrument.
* Capture the calls!

### Launching the Proxy Server

```
# Launch the proxy on the default ports.
# Leave this running and watch the output to make sure it's working.
wtf-instrument --server
```

If you're running from source, use `./bin/instrument.js --server`.

### Install the Extension

Navigate to `chrome://extensions`, click Load Unpacked Extensions, and select
the `experiments/wtf-instrument-proxy/` directory. You can leave the extension
installed but should disable it when not in use so that you aren't instrumenting
every page you visit!

### Reload Your Page

Make sure to force a full reload of your page to refetch all contents. Once the
page is fully loaded you can disable the extension.

## Capturing Call Traces

Once you've instrumented your Javascript with one of the above methods, you can
capture your data.

TODO: future versions will have a fancy UI, maybe.

Right now, you need to use the console to manually trigger clearing and saving
of data. It's best to open the dev tools console before reloading your page so
that the resize doesn't affect your trace. Once it's open, reload and wait until
you want to capture the data.

```
// Saves the current trace data to a .wtf-calls file.
__saveTrace()
// Clears the trace data.
__resetTrace()
```

You can reset and save as many times as you want in a session.

## Limitations

When manually instrumenting with the command line app you will only be able to
have a single instrumented file on a page. This may be fixed in future versions.

There's no UI right now so you must use the console. Future versions will likely
have a few modes (capture after N seconds, etc) or a UI.

The recording buffer is currently hardcoded to 128MB and after that calls are
ignored without warning.

Functions without a proper name will end up named as 'anon#'. Future versions
may try a little harder to extract a valid name from functions that have one
(for example, property setters).
