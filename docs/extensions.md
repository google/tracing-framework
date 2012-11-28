# Framework Extensions

The tracing framework supports extensions that can be used to provide additional
event recording, custom behaviors, and custom visualizations. Extensions are
defined via manifest files that describe their behavior and are used for loading
and injecting code at runtime. Extension manifests can define actions and code
that should be run during tracing runs and/or triggers and code that is used
by the application when processing a trace.

## Manifest Files

Each extension gets a single manifest file. This file is JSON-based and should
be browser parsable (that means no comments/trailing commas/etc). An extension
should share a single manifest file if it's providing linked functionality
between tracing and apps.

    {
      "name": "My Extension",
      "required_version": "1.0.5", // required version of WTF
      "tracing": { // only include if needed
        "scripts": [
          // Scripts that are inserted into the page, in order
          "some/file.js"
        ]
      },
      "app": { // only include if needed
        "scripts": [
          // Scripts that are inserted into the iframe, in order
          "some/file.js"
        ],
        "stylesheets": [
          // Stylesheets inserted into the iframe, in order
          "some/file.css"
        ],
        "triggers": [
          {
            "type": "event",
            "name": "my.custom.event"
          }
        ]
      }
    }

## Tracing Extensions

Due to the issues around script injection, tracing extensions must define
all scripts required in their manifest. Browser injection extensions will then
read these files and insert the scripts immediately after WTF has been
initialized but before any user code executes.

### Usage

To use an extension with injected tracing (such as via a browser extension)
one must have the extension manifest listed in the `wtf.extensions` options
list at the time of page load. The browser extension will take care of injecting
the scripts and wiring up the runtime features.

When manually embedding the tracing framework (via a `<script>` tag) one must
also manually embed the extension scripts and register their manifests:

    <script src="wtf_trace_web_js_compiled.js"></script>
    <script>
      wtf.trace.prepare();
    </script>
    <script src="my/extension1/fileA.js"></script>
    <script src="my/extension1/fileB.js"></script>
    <script>
      wtf.ext.registerExtension('my/extension1/extension1.json');
    </script>
    <script>
      var options = {...};
      wtf.hud.prepare(options);
      wtf.trace.start(options);
    </script>

Note that `registerExtension` will only accept URLs that are either on the same
domain or have proper CORS headers. If you need to use cross-origin manifests
you can also pass the JSON object directly to `registerExtension`:

    <script src="wtf_trace_web_js_compiled.js"></script>
    <script>
      wtf.trace.prepare();
    </script>
    <script src="my/extension1/fileA.js"></script>
    <script src="my/extension1/fileB.js"></script>
    <script>
      wtf.ext.registerExtension('my/extension1/extension1.json', {
        "name": "My Extension",
        ...
      });
    </script>
    <script>
      var options = {...};
      wtf.hud.prepare(options);
      wtf.trace.start(options);
    </script>

### Scripts

The scripts provided are executed in the page context. They should assume
nothing about the global environment and try not to pollute it at the risk of
breaking the page. Scripts may use the global `wtf` object to add event
providers, control the operation of the tracing system, etc.

#### Tracing API

Get a time compatible with the tracing framework:

  // Consistent time; high-resolution if available
  var time = wtf.now();

Emitting an instance event:

  // Create the event and cache the event object:
  var myEvent = wtf.trace.events.createInstance('myEvent(uint32 foo)');
  // At some point in the future, append it:
  myEvent(wtf.now(), 12345);

Emitting a scope event:

  // Create the event and cache the event object:
  var myScopeEvent = wtf.trace.events.createScope('myScopeEvent(utf8 bar)');
  // Enter/leave the scope:
  var scope = myScopeEvent(wtf.now(), null, 'hello world');
  // ...
  return scope.leave(someResult);

Automatic instrumentation of a function:

  // Instrument an individual method:
  var someCall = wtf.trace.instrument(function(a, b) {
    return a + b;
  }, 'someCall(uint32 a, uint32 b)');
  // Instrument an individual method on a prototype:
  myType.prototype['someCall'] = wtf.trace.instrument(
      myType.prototype['someCall'],
      'someCall(uint32 a, uint32 b)',
      'MyType#');

Automatic instrumentation of an entire type:

  // Instrument a type:
  my.Type = wtf.trace.instrumentType(
      my.Type, 'my.Type(uint8 a, uint8 b)', {
        foo: 'foo(uint8 a)'
      });

Supported types in event signatures:

* int8/uint8
* int16/uint16
* int32/uint32
* float32
* ascii
* utf8
* any of the int/float types as type[] for an array

TODO: add more types (float64/number, typed arrays, etc)

### Actions

When running in the browser where the HUD is available an extension can define
a set of actions that will be shown as buttons next the standard ones. When the
action is invoked, either by a button press or an optional shortcut key, the
given global function will be called.

Buttons are added with the `wtf.hud.addButton` API:

    wtf.hud.addButton({
      title: 'Do something!',
      icon: 'data:...', // (21x21 icon - prefer a data URI of SVG content)
      shortcut: 'shift+f3', // optional,
      callback: this.buttonClicked_,
      scope: this
    });

TODO(benvanik): enable togglable actions via result-like objects returned from
the call.

If building an extension that should work both under node and the browser be
sure to check if `wtf.hud` is defined before attempting to call any methods
on it.

## App Extensions

TODO(benvanik): implement and describe app extensions
