# Options

Options for the various components are specified in a key-value hash. Each
component uses a unique namespace that allows the same options store to be used
for all of them.

Users of each component can specify options when creating the component but are
not allowed to change them once the component is initialized. Some components
have the ability to change their options at runtime but this is an opt-in
behavior.

## Extensions

### wtf.addon

An array of addon manifest URLs. These addons will be either injected or
loaded at runtime and can provide tracing or visualization functionality.

## Tracing

Tracing options change the behavior of the core tracing library and
instrumentation providers. They can be specified as a value to the
`wtf.trace.start` method or by the global override object `wtf_trace_options`.

### wtf.trace.mode

The target mode for tracing.

* `snapshotting`: click to take a snapshot and open it in the UI or save to a
file.
* `streaming`: stream all events to the UI or a file.

### wtf.trace.format

The format of the resulting trace data.

* `binary`: an optimized binary format that's efficient to load and has small
file sizes.
* `json`: a JSON-based file format. Sort-of.

### wtf.trace.target

A string value indicating the target for the tracing session.

Supported targets:

* `null`: used for testing, a black hole.
* `http[s]://host:port/path`: an HTTP(S) endpoint to receive POSTS.
* `file://filename_prefix`: a local saved file with the given prefix.
* Custom objects: see below.

#### Custom Objects

To programmatically receive written data you can pass an object. This object
must contain a `write` method and may optionally contain `flush` and `close`
methods.

* `write(Uint8Array|Array, length, done)`: write the given bytes up to the
  provided length (do not trust the array length). You must call done() when
  writing has completed.
* `flush()`: write any pending data, if required.
* `close()`: the stream is closed and no more data will be written.

### wtf.trace.session.bufferSize

Individual trace buffer size, in bytes. The larger the size the less overhead
there will be while recording traces but the larger the latency when writing
the data over the network.

### wtf.trace.session.maximumMemoryUsage

Maximum tracing buffer memory usage, in bytes. This, combined with
`wtf.trace.session.bufferSize`, is used to determine how many buffers will be
created. The larger the value the more events can be recorded and the less
likely it is that data will be dropped, at the cost of extra memory.

### wtf.trace.snapshotting.resetOnSnapshot

True to reset all buffer data when a snapshot occurs, otherwise data will be retained across snapshots. This can be used ensure only tracing data that
occurred since the last snapshot is written.

### wtf.trace.streaming.flushIntervalMs

The frequency, in milliseconds, to flush data buffers or 0 to prevent automatic
flushing.

### wtf.trace.disableProviders

When set to true all providers and global hooks will be disabled. This is useful
when including the tracing script to do file manipulation/etc.

### wtf.trace.provider.*

Each event provider can be toggled here to allow for the choice of which kind
of events to include in the stream or the fidelity of the events added.

#### wtf.trace.provider.chromeDebug

Set `wtf.trace.provider.chromeDebug` to 1+ to enable the events. This will
use a variety of means to attempt to gather JavaScript runtime events, such as
garbage collections, JIT activity, etc. This functionality relies on the
injector extension or custom builds of Chromium. It introduces some overhead,
such as an additional 0.1ms per XHR open/send.

#### wtf.trace.provider.dom

Set `wtf.trace.provider.dom` to 1+ to enable DOM instrumentation. This will
add event handlers and other DOM hooks that may decrease performance slightly.

Use `wtf.trace.initializeDomEventProperties(el, opt_recursive)` to setup the
event hooks on new DOM elements added after the document has loaded. If this is
not called on new DOM sub trees their events may not be tracked in all browsers.

Use `wtf.trace.ignoreDomTree(el)` to ignore all of the events from a DOM tree.
This is useful for hiding tracing/debug UI from the traces.

#### wtf.trace.provider.image

Set `wtf.trace.provider.image` to 1+ to enable Image/HTMLImageElement events.

#### wtf.trace.provider.webworker

Set `wtf.trace.provider.webworker` to 1+ to enable automatically instrumenting
web workers as they are created and messages between workers.

#### wtf.trace.provider.xhr

Set `wtf.trace.provider.xhr` to 1+ to enable XHR events.
This may incur additional overhead in event processing.

## HUD

HUD options pertain only to the overlay used in browser-based injected runs.
They can be specified as a value passed to `wtf.hud.show` or by the global
override object `wtf_hud_options`.

### wtf.hud.dock

Docking position of the HUD overlay. May be one of:

* `tl`: Top Left.
* `tm`: Top Middle.
* `tr`: Top Right.
* `bl`: Bottom Left.
* `bm`: Bottom Middle.
* `br`: Bottom Right.

### wtf.hud.app.mode/wtf.hud.app.endpoint

The mode used for communicating with the visualizer application. May be one of:

* `page`: If set, `wtf.hud.app.endpoint` is a URL to the page that will be
opened in a new window.
* `remote`: If set, `wtf.hud.app.endpoint` is a `host:port` of a target HTTP server that will listen for POSTs.

## Remote Control

A page can be connected to a remote server for control via the
`wtf.remote.connect` method. This allows for snapshotting of instances running
inside of VMs or over the network that otherwise cannot run a WTF UI or save
files (such as iOS/Android).

### wtf.remote.target

The target URI to connect to. This must be set. The wtf-controller server will
list its URL on startup and that value should be used.
Example: `ws://localhost:8084`

## App

App options are only used by the app UI. They can be specified to the
`wtf.app.show` call or by the global override object `wtf_app_options`.
