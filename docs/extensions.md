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
        ],
        "options": [
          {
            "title": "Section A",
            "widgets": [
              {
                "type": "label",
                "title": "Something:",
                "value": "woo"
              },
              {
                "type": "checkbox",
                "key": "my.option.value",
                "title": "Some option",
                "default": false
              },
              {
                "type": "dropdown",
                "key": "my.option.value",
                "title": "Some choice:",
                "options": [
                  {"value": "a", "title": "A"}
                ],
                "default": "a"
              },
              {
                "type": "textbox",
                "key": "my.option.value",
                "title": "Some input:",
                "empty": "I'm empty!",
                "default": "Default value!"
              }
            ]
          }
        ]
      },
      "app": { // only include if needed
        "scripts": [
          // Scripts that are inserted into a hidden iframe, in order
          "some/file.js"
        ],
        "options": [], // same as above
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
      var options = {...};
      wtf.trace.prepare(options);
    </script>
    <script src="my/extension1/fileA.js"></script>
    <script src="my/extension1/fileB.js"></script>
    <script>
      wtf.ext.registerExtension('my/extension1/extension1.json');
    </script>
    <script>
      wtf.hud.prepare();
      wtf.trace.start();
    </script>

Note that `registerExtension` will only accept URLs that are either on the same
domain or have proper CORS headers. If you need to use cross-origin manifests
you can also pass the JSON object directly to `registerExtension`:

    <script src="wtf_trace_web_js_compiled.js"></script>
    <script>
      var options = {...};
      wtf.trace.prepare(options);
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
      wtf.hud.prepare();
      wtf.trace.start();
    </script>

### Scripts

The scripts provided are executed in the page context. They should assume
nothing about the global environment and try not to pollute it at the risk of
breaking the page. Scripts may use the global `wtf` object to add event
providers, control the operation of the tracing system, etc.

For information on how to add events to the trace see [api](api.md).

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

Application extensions run inside a hidden iframe sandbox inside of the
application. Each extension gets loaded when a document is opened and destroyed
when it is closed.

Extensions have access to the `wtf.db` namespace on the global object as
well as a few helper libraries, such as [d3](http://d3js.org/). Any other
scripts can be inserted via the manifest.

### documentView

A global object `documentView` is available that contains APIs related to the
currently loaded document.

    // The wtf.db.Database instance of the document view.
    documentView.db;

### Panels

Extensions can add any number of panels to the tab bar in the UI. Panels
have their own iframes and can contain any content, such as custom scripts
or stylesheets.

    documentView.createTabPanel('mypanel', 'My Panel', {
      // Stylesheets to add to the iframe, if any.
      stylesheets: ['some.css'],
      // Scripts to add to the document, if any.
      scripts: ['some.js']
    }, function(document) {
      // Called back when the tab is created. 'document' is the iframe document.

      // Setup a UI (or use a script).
      var el = document.createElement('div');
      document.body.appendChild(el);

      // Optionally return some handlers for some events.
      return {
        onLayout: function(width, height) {
          // Called if the tab is resized with the new width/height.
        },
        onVisbilityChange: function(visible) {
          // Called when the tab is shown/hidden.
        }
      };
    });
