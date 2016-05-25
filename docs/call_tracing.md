# Call Tracing

Warning: this feature is experimental and requires a bit of work to get going.

Want to see every single function call your app is making? How about how many
bytes each function allocates as it runs? That'd be cool, right?!

The normal WTF instrumentation requires adding `wtf.trace` calls inside your
code to find the times and structure of your code as it executes. Since you're
trying to get timing you want to restrain your usage as to not cause time skew
and other bad effects. It's also impossible to try to instrument every call in
your program, even with the nifty helper functions.

So the call tracing feature is implemented entirely differently. It is **not for
timing** - you will not be able to get function times from this! What you will
be seeing in the user interface is counts, based on the mode you're running in.

The `wtf-instrument` command line tool runs over your JavaScript to produce
an instrumented file that can be run in the browser. Unlike the normal
instrumentation that normal WTF does, this process performs code transformation
and results in a different kind of file: `.wtf-calls`.

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

Future versions will try to handle other cases better. Or help out and [hack in
your own](https://github.com/google/tracing-framework/blob/master/bin/instrument.js#L131)!

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

## Install the tracing-framework Tools

```bash
npm install -g tracing-framework
```

## Manual Instrumentation

If you have a JavaScript file you'd like to instrument the easiest way to get
started is by using the `wtf-instrument` tool included in the npm package
(aka `./bin/instrument.js` in the repo).

This tool will take an input file and produce an instrumented version that can
be used on a page.

```bash
# Generate the instrumented js file.
wtf-instrument myapp.js myapp.instrumented.js
```

Once you have this file, include it on your page instead of the uninstrmented
version. That's it! See below for how to actually use the instrumented page.

Caveats:

* Only one JavaScript file on a page can be instrumented this way right now. If
you need more use the proxy below.

## Automatic Instrumentation

By running a tiny proxy server and using a Chrome extension it's possible to
automatically instrument all JavaScript sources on a page automatically.

Flow:

* Launch the proxy server (`wtf-instrument --server`).
* Install and enable the Chrome extension (wtf-instrument-proxy).
* Reload the page you want to instrument.
* Capture the calls!

### Launching the Proxy Server

```bash
# Launch the proxy on the default ports.
# Leave this running and watch the output to make sure it's working.
wtf-instrument --server
```

If you're running from source, use `./bin/instrument.js --server`.

### Install the Extension

Navigate to `chrome://extensions`, click Load Unpacked Extensions, and select
the `extensions/wtf-instrument-proxy/` directory. You can leave the extension
installed but should disable it when not in use so that you aren't instrumenting
every page you visit!

### Reload Your Page

Make sure to force a full reload of your page to refetch all contents. Once the
page is fully loaded you can disable the extension.

## Capturing Call Traces

Once you've instrumented your JavaScript with one of the above methods, you can
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

## Tracking Memory Usage

The call tracing tool can be used to see how much memory each function
allocates by enabling a special Chrome flag and adding a flag to your
`wtf-instrument` call.

First, launch a Chrome with natives enabled.

```bash
# WARNING: THIS IS TOTALLY UNSAFE! DO NOT BROWSE THE WEB LIKE THIS!
chrome --remote-debugging-port=9222 --disable-web-security --js-flags=--allow-natives-syntax
```

When running `wtf-instrument` add the `--track-heap` argument:

```bash
wtf-instrument --track-heap some.js
# or
wtf-instrument --server --track-heap
```

When viewing the trace each function call will be represented with the total
bytes of memory allocated inside of that call as its time (so something that
took 0.032ms allocated 32bytes, etc).

## Bookmarklets

Drag these to your bookmarks bar to make working with instrumented pages easier.

Err, github doesn't allow javascript: links, so you'll have to create these
manually:

* Reset Trace: `javascript:__resetTrace()`
  * Resets recorded data to start recording fresh.
* Save Trace: `javascript:__saveTrace()`
  * Saves a `.wtf-calls` file with the currently recorded data.

## Limitations

The recording buffer is currently hardcoded to some large size and after it is
full all calls are ignored without warning.

Functions without a proper name will end up named as 'anon#'. Future versions
may try a little harder to extract a valid name from functions that have one
(for example, property setters).
