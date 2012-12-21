# Tracing API

TODO(benvanik): more information.

Get a time compatible with the tracing framework:

    // Consistent time; high-resolution if available
    var time = wtf.now();

Emitting an instance event:

    // Create the event and cache the event object:
    var myEvent = wtf.trace.events.createInstance('myEvent(uint32 foo)');
    // At some point in the future, append it:
    myEvent(12345);

Emitting a scope event:

    // Create the event and cache the event object:
    var myScopeEvent = wtf.trace.events.createScope('myScopeEvent(utf8 bar)');
    // Enter/leave the scope:
    var scope = myScopeEvent('hello world');
    // ...
    return wtf.trace.leaveScope(scope, someResult);

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

If you find yourself neededing to add arguments to a scope that was
automatically created or is added conditionally, consider using an append event.

    // Create the appending event:
    var appendMyData = wtf.trace.events.createInstance(
        'my.custom.append(uint32 a, uint32 b)',
        wtf.data.EventFlag.APPEND_SCOPE_DATA);
    // Call the method inside of scopes:
    var scope = ...enter scope...();
    appendMyData(123, 456);
    wtf.trace.leaveScope(scope);

If (and only if!) you're doing some debugging and need a bunch of data in your
scopes you can use the super slow `wtf.trace.appendScopeData` method:

    var scope = ...enter scope...();
    // The value can be any JSONifiable value (numbers/arrays/objects).
    wtf.trace.appendScopeData('myBlob', {
      'complex': ['objects'],
      'prop': 123.456
    });
    wtf.trace.leaveScope(scope);

If you need to do any expensive work that you don't want to show up as user
time, use the built-in helper scope:

    var traceScope = wtf.trace.enterTracingScope();
    // Expensive work...
    wtf.trace.leaveScope(traceScope);

To prevent DOM event listeners from appearing in the trace, wrap them with
`wtf.trace.ignoreListener` before attaching them:

    var el = document.createElement('a');
    el.onclick = wtf.trace.ignoreListener(function(e) {
      // Clicked and untraced
    });
    el.addEventListener('click', wtf.trace.ignoreListener(function(e) {
      // Clicked and untraced
    }), false);

Supported types in event signatures:

* int8/uint8
* int16/uint16
* int32/uint32
* float32
* ascii
* utf8
* any of the int/float types as type[] for an array

TODO: add more types (float64/number, typed arrays, etc)
