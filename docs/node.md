# Using the tracing-framework with node.js

## Tracing node applications

### Quickstart

```bash
$ npm install tracing-framework
$ node
> var wtf = require('tracing-framework');
> wtf.trace.node.start();
> var scope = wtf.trace.enterScope('hello!');
> wtf.trace.leaveScope(scope);
> process.exit()
$ wtf-dump node-[time].wtf-trace
```

### Instrumenting

See [api](api.md) for the `wtf.trace` API.

### Running

Automatic injection from the shell:

```bash
# Start a snapshot-on-exit trace:
wtf-trace myscript.js [args]
```

Simple snapshot-on-exit:

    var wtf = require('tracing-framework');
    // Begin recording a trace - a snapshot will be taken upon process.exit.
    wtf.trace.node.start({
      // Any options overrides; see options.md
    });

Manual control:

    var wtf = require('tracing-framework');

    // Begin recording a trace...
    wtf.trace.prepare({
      // Options
    });
    wtf.trace.start();

    // Perform a snapshot.
    wtf.trace.snapshot();

    // Stop recording.
    wtf.trace.stop();

## Loading and processing traces

### Quickstart

```bash
$ npm install tracing-framework
$ node
> var wtf = require('tracing-framework');
> var db = wtf.db.load('test.wtf-trace', function(db) {
    db.query('something');
  });
```

### Using the Tool Runner

TODO
