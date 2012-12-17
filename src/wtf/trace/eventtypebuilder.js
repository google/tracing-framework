/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Function generator utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.EventTypeBuilder');

goog.require('wtf.data.EventClass');
goog.require('wtf.io.Buffer');
goog.require('wtf.trace.EventType');
goog.require('wtf.util.FunctionBuilder');



/**
 * Trace event function builder.
 * Builds the various event tracing functions used exclusively by the tracing
 * library.
 *
 * @constructor
 * @extends {wtf.util.FunctionBuilder}
 */
wtf.trace.EventTypeBuilder = function() {
  goog.base(this);

  /**
   * Names of compiled members on {@see wtf.trace.EventType}.
   * @type {!Object.<string>}
   * @private
   */
  this.eventTypeNames_ = wtf.trace.EventType.getNameMap();

  /**
   * Names of compiled members on {@see wtf.io.Buffer}.
   * @type {!Object.<string>}
   * @private
   */
  this.bufferNames_ = wtf.io.Buffer.getNameMap();

  /**
   * Dummy scope object.
   * Has the same exported methods as a real {@see wtf.trace.Scope}.
   * @type {!Object}
   * @private
   */
  this.dummyScope_ = {
    /**
     * Leave mock.
     * @param {T=} opt_result Optional result to chain.
     * @return {T|undefined} The value of the {@code opt_result} parameter.
     * @template T
     */
    'leave': function(opt_result) {
      return opt_result;
    }
  };
};
goog.inherits(wtf.trace.EventTypeBuilder, wtf.util.FunctionBuilder);


/**
 * Generates an event tracing function.
 * @param {!Array.<wtf.trace.Session>} sessionPtr An array containing a
 *     reference to the target trace session.
 * @param {!wtf.trace.EventType} eventType Event type.
 * @return {Function} Generated function based on class.
 */
wtf.trace.EventTypeBuilder.prototype.generate = function(
    sessionPtr, eventType) {
  // Begin building the function with default args.
  this.begin();
  this.addScopeVariable('sessionPtr', sessionPtr);
  this.addScopeVariable('dummyScope', this.dummyScope_);
  this.addScopeVariable('eventType', eventType);

  this.addArgument('time');
  switch (eventType.eventClass) {
    case wtf.data.EventClass.SCOPE:
      // Custom typed scope - take flow to pass down to enterTypedScope.
      this.addArgument('flow');
      break;
  }

  // Build a complete list of custom data arguments.
  // Each variable maps to an argument to the function.
  // Also calculate whether the size of the event is variable or not.
  var args = eventType.args;
  var minSize = 1 + 1 + 4;
  var isVariableSize = false;
  for (var n = 0; n < args.length; n++) {
    var dataArg = args[n];
    this.addArgument(dataArg.name + '_');
    if (dataArg.isFixedSize) {
      minSize += dataArg.getSize();
    } else {
      isVariableSize = true;
    }
  }

  // Always accept an optional buffer.
  this.addArgument('opt_buffer');

  this.append(
      'var session = sessionPtr[0];');
  if (eventType.eventClass == wtf.data.EventClass.SCOPE) {
    this.append(
        'if (!session) { return dummyScope; }');
  } else {
    this.append(
        'if (!session) { return; }');
  }

  // Write buffer acquisition code (and size calculate if variable size).
  if (!isVariableSize) {
    // Size known - grab the buffer quickly.
    this.append(
        'var buffer = opt_buffer || session.acquireBuffer(' +
        'time, ' + minSize + ');');
  } else {
    // Size unknown - compute size and grab the buffer.
    this.append(
        'var argSize = 0;');
    for (var n = 0; n < args.length; n++) {
      var dataArg = args[n];
      if (!dataArg.isFixedSize) {
        // Calculate variable size at runtime.
        var sizeSource = dataArg.getSizeCalculationSource(dataArg.name + '_');
        this.append(
            'argSize += ' + sizeSource + ';');
      }
    }
    this.append(
        'var buffer = opt_buffer || session.acquireBuffer(' +
        'time, ' + minSize + ' + argSize);');
  }

  // Early out if the buffer couldn't be acquired.
  if (eventType.eventClass == wtf.data.EventClass.SCOPE) {
    this.append(
        'if (!buffer) { return dummyScope; }');
  } else {
    this.append(
        'if (!buffer) { return; }');
  }

  // Write event header.
  // This is manually inlined because it's so common and we don't get any
  // jscompiler inlining optimizations at runtime.
  this.append(
      'var d = buffer.' + this.bufferNames_.data + ';',
      'var o = buffer.' + this.bufferNames_.offset + ';',
      'd[o++] = ' + ((eventType.wireId >> 8) & 0xFF) + ';',
      'd[o++] = ' + (eventType.wireId & 0xFF) + ';',
      'var itime = (time * 1000) >>> 0;',
      'd[o++] = (itime >> 24) & 0xFF;',
      'd[o++] = (itime >> 16) & 0xFF;',
      'd[o++] = (itime >> 8) & 0xFF;',
      'd[o++] = itime & 0xFF;',
      'buffer.' + this.bufferNames_.offset + ' = o;');

  // Append data arguments.
  for (var n = 0; n < args.length; n++) {
    var dataArg = args[n];
    this.append('/* arg ' + n + ': ' + dataArg.name + ' */');
    this.append(
        dataArg.getWriteSource(this.bufferNames_, dataArg.name + '_') + ';');
  }

  // Count.
  this.append(
      'eventType.' + this.eventTypeNames_.count + '++;');

  // Enter scope/flow/etc.
  if (eventType.eventClass == wtf.data.EventClass.SCOPE) {
    this.append(
        'return session.enterTypedScope(flow, time);');
  }

  // Save off the final function.
  var fn = this.end(eventType.toString());

  // Expose us on the event function for others to use, if they want reflection.
  fn['eventType'] = eventType;

  return fn;
};
