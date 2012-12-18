# Using the tracing-framework with node.js

## Tracing node applications

### Quickstart

    $ npm install tracing-framework
    $ node
    > var wtf = require('tracing-framework');
    > wtf.trace.node.start();
    > var scope = wtf.trace.enterScope('hello!');
    > scope.leave();
    > process.exit()
    $ wtf-dump node-[time].wtf-trace

### Instrumenting

See [api](api.md) for the `wtf.trace` API.

### Running

Automatic injection from the shell:

    # Start a snapshot-on-exit trace:
    wtf-trace myscript.js [args]

Simple snapshot-on-exit:

    var wtf = require('tracing-framework');
    // Begin recording a trace - a snapshot will be taken upon process.exit.
    wtf.trace.node.start({
      // Any options overrides; see options.md
    });

Manual control:

    var wtf = require('tracing-framework');

    // Begin recording a trace...
    wtf.trace.start({
      // Options
    });

    // Perform a snapshot immediately.
    wtf.trace.snapshot();

    // Stop recording.
    wtf.trace.stop();

## Loading and processing traces

### Quickstart

    $ npm install tracing-framework
    $ node
    > var wtf = require('tracing-framework');
    > wtf.analysis.run(wtf.analysis.createTraceListener({
        'wtf.scope#enter': function(e) {
          console.log(e.time);
        }
      }), 'test.wtf-trace');

### Using the Tool Runner

TODO
