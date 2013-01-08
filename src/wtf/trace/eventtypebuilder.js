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

goog.require('goog.asserts');
goog.require('goog.json');
goog.require('wtf');
goog.require('wtf.data.EventClass');
goog.require('wtf.io.Buffer');
goog.require('wtf.io.floatConverter');
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
  var writers = wtf.trace.EventTypeBuilder.WRITERS_;

  // Begin building the function with default args.
  this.begin();
  this.addScopeVariable('sessionPtr', sessionPtr);
  this.addScopeVariable('eventType', eventType);
  this.addScopeVariable('now', wtf.now);
  this.addScopeVariable('writeFloat32',
      wtf.io.floatConverter.float32ToUint8Array);
  this.addScopeVariable('stringify', function(value) {
    // TODO(benvanik): make this even faster.
    var json = null;
    if (typeof value == 'number') {
      json = '' + value;
    } else if (typeof value == 'boolean') {
      json = '' + value;
    } else if (!value) {
      json = null;
    } else if (typeof value == 'string') {
      // TODO(benvanik): escape the string (at least quotes).
      json = '"' + value + '"';
    } else {
      // JSON is faster and generates less garbage.
      if (goog.global.JSON) {
        json = goog.global.JSON.stringify(value);
      } else {
        json = goog.json.serialize(value);
      }
    }
    return json;
  });

  // Count.
  this.append('eventType.' + this.eventTypeNames_.count + '++;');

  // Setup arguments.
  // This adds arguments to the function and for any arguments that require
  // preparation (variable length/encoded) this is done here to get their
  // size.
  var minSize = 2 + 4;
  // TODO(benvanik): add support for extension data here
  var args = eventType.args;
  for (var n = 0; n < args.length; n++) {
    var arg = args[n];
    this.addArgument(arg.name + '_');
    var writer = writers[arg.typeName];
    goog.asserts.assert(writer);
    minSize += writer.size; // 0 if variable sized
  }
  this.append('var size = ' + minSize + ';');
  for (var n = 0; n < args.length; n++) {
    var arg = args[n];
    var writer = writers[arg.typeName];
    if (writer.prepare) {
      this.append.apply(this, writer.prepare(arg.name + '_'));
    }
  }

  // Additional optional arguments.
  this.addArgument('opt_time');
  this.addArgument('opt_buffer');

  this.append('var time = opt_time || now();');
  this.append('var session = sessionPtr[0];');
  this.append('var buffer = opt_buffer;');
  this.append(
      'if (!buffer && (!session || ' +
      '!(buffer = session.acquireBuffer(time, size)))) {',
      '  return undefined;',
      '}');

  // Write event header.
  // This is manually inlined because it's so common and we don't get any
  // jscompiler inlining optimizations at runtime.
  this.append(
      'var d = buffer.' + this.bufferNames_.data + ';',
      'var o = buffer.' + this.bufferNames_.offset + ';',
      'd[o++] = ' + ((eventType.wireId >> 8) & 0xFF) + ';',
      'd[o++] = ' + (eventType.wireId & 0xFF) + ';',
      'var itime = (time * 1000) >>> 0;',
      'd[o++] = (itime >>> 24) & 0xFF;',
      'd[o++] = (itime >>> 16) & 0xFF;',
      'd[o++] = (itime >>> 8) & 0xFF;',
      'd[o++] = itime & 0xFF;');

  // Append arguments.
  if (args.length) {
    this.append('var t = 0;');
    for (var n = 0; n < args.length; n++) {
      var arg = args[n];
      var writer = writers[arg.typeName];
      this.append.apply(this, writer.write(arg.name + '_', this.bufferNames_));
    }
  }

  // Stash back the buffer offset.
  this.append('buffer.' + this.bufferNames_.offset + ' = o;');

  // Enter scope/flow/etc.
  if (eventType.eventClass == wtf.data.EventClass.SCOPE) {
    this.append('return session.enterTypedScope(time);');
  }

  // Save off the final function.
  var fn = this.end(eventType.toString());

  // Expose us on the event function for others to use, if they want reflection.
  fn['eventType'] = eventType;

  return fn;
};


/**
 * @typedef {{
 *   size: number,
 *   prepare: (function(string):(!Array.<string>))?,
 *   write: function(string, !Object):(!Array.<string>)
 * }}
 * @private
 */
wtf.trace.EventTypeBuilder.Writer_;


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT8_ = {
  size: 1,
  prepare: null,
  write: function(a, bufferNames) {
    return [
      'd[o++] = ' + a + ' & 0xFF;'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_ = {
  size: 0,
  prepare: function(a) {
    return [
      'size += ' + a + '.length;'
    ];
  },
  write: function(a, bufferNames) {
    return [
      'if (' + a + ' && (t = ' + a + '.length)) {',
      '  d[o++] = (t >>> 24) & 0xFF;',
      '  d[o++] = (t >>> 16) & 0xFF;',
      '  d[o++] = (t >>> 8) & 0xFF;',
      '  d[o++] = t & 0xFF;',
      '  for (var n = 0; n < t; n++, o++) {',
      '    d[o] = ' + a + '[n];',
      '  }',
      '} else {',
      '  d[o++] = d[o++] = d[o++] = d[o++] = 0;',
      '}'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT16_ = {
  size: 2,
  prepare: null,
  write: function(a, bufferNames) {
    return [
      'd[o++] = (' + a + ' >> 8) & 0xFF;',
      'd[o++] = ' + a + ' & 0xFF;'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_ = {
  size: 0,
  prepare: function(a) {
    return [
      'size += ' + a + '.length * 2;'
    ];
  },
  write: function(a, bufferNames) {
    return [
      'if (' + a + ' && (t = ' + a + '.length)) {',
      '  d[o++] = (t >>> 24) & 0xFF;',
      '  d[o++] = (t >>> 16) & 0xFF;',
      '  d[o++] = (t >>> 8) & 0xFF;',
      '  d[o++] = t & 0xFF;',
      '  for (var n = 0; n < t; n++, o += 2) {',
      '    var v = ' + a + '[n];',
      '    d[o] = (v >> 8) & 0xFF;',
      '    d[o + 1] = v & 0xFF;',
      '  }',
      '} else {',
      '  d[o++] = d[o++] = d[o++] = d[o++] = 0;',
      '}'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT32_ = {
  size: 4,
  prepare: null,
  write: function(a, bufferNames) {
    return [
      'var ' + a + '_ = ' + a + ' >>> 0;',
      'd[o++] = (' + a + '_ >>> 24) & 0xFF;',
      'd[o++] = (' + a + '_ >>> 16) & 0xFF;',
      'd[o++] = (' + a + '_ >>> 8) & 0xFF;',
      'd[o++] = ' + a + '_ & 0xFF;'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_ = {
  size: 0,
  prepare: function(a) {
    return [
      'size += ' + a + '.length * 4;'
    ];
  },
  write: function(a, bufferNames) {
    return [
      'if (' + a + ' && (t = ' + a + '.length)) {',
      '  d[o++] = (t >>> 24) & 0xFF;',
      '  d[o++] = (t >>> 16) & 0xFF;',
      '  d[o++] = (t >>> 8) & 0xFF;',
      '  d[o++] = t & 0xFF;',
      '  for (var n = 0; n < t; n++, o += 4) {',
      '    var v = ' + a + '[n] >>> 0;',
      '    d[o] = (v >>> 24) & 0xFF;',
      '    d[o + 1] = (v >>> 16) & 0xFF;',
      '    d[o + 2] = (v >>> 8) & 0xFF;',
      '    d[o + 3] = v & 0xFF;',
      '  }',
      '} else {',
      '  d[o++] = d[o++] = d[o++] = d[o++] = 0;',
      '}'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_FLOAT32_ = {
  size: 4,
  prepare: null,
  write: function(a, bufferNames) {
    return [
      'writeFloat32(' + a + ', d, o); o += 4;'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_FLOAT32ARRAY_ = {
  size: 0,
  prepare: function(a) {
    return [
      'size += ' + a + '.length * 4;'
    ];
  },
  write: function(a, bufferNames) {
    return [
      'if (' + a + ' && (t = ' + a + '.length)) {',
      '  d[o++] = (t >>> 24) & 0xFF;',
      '  d[o++] = (t >>> 16) & 0xFF;',
      '  d[o++] = (t >>> 8) & 0xFF;',
      '  d[o++] = t & 0xFF;',
      '  for (var n = 0; n < t; n++, o += 4) {',
      '    writeFloat32(' + a + '[n], d, o);',
      '  }',
      '} else {',
      '  d[o++] = d[o++] = d[o++] = d[o++] = 0;',
      '}'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_ASCII_ = {
  size: 0,
  prepare: function(a) {
    return [
      'size += ' + a + ' ? (2 + ' + a + '.length) : 2;'
    ];
  },
  write: function(a, bufferNames) {
    return [
      'if (' + a + ' && ' + a + '.length) {',
      // TODO(benvanik): fix APIs to prevent flush.
      '  buffer.' + bufferNames.offset + ' = o;',
      '  buffer.' + bufferNames.writeAsciiString + '(' + a + ');',
      '  o = buffer.' + bufferNames.offset + ';',
      '} else {',
      '  d[o++] = d[o++] = 0;',
      '}'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_UTF8_ = {
  size: 0,
  prepare: function(a) {
    return [
      'size += ' + a + ' ? (2 + 2 + ' + a + '.length * 3) : 2;'
    ];
  },
  write: function(a, bufferNames) {
    return [
      'if (' + a + ' && ' + a + '.length) {',
      // TODO(benvanik): fix APIs to prevent flush.
      '  buffer.' + bufferNames.offset + ' = o;',
      '  buffer.' + bufferNames.writeUtf8String + '(' + a + ');',
      '  o = buffer.' + bufferNames.offset + ';',
      '} else {',
      '  d[o++] = d[o++] = 0;',
      '}'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_ANY_ = {
  size: 0,
  prepare: function(a) {
    return [
      'var ' + a + '_ = stringify(' + a + ');',
      'size += ' + a + '_ ? (2 + 2 + ' + a + '_.length * 3) : 2;'
    ];
  },
  write: function(a, bufferNames) {
    return [
      'if (' + a + '_ && ' + a + '_.length) {',
      // TODO(benvanik): fix APIs to prevent flush.
      '  buffer.' + bufferNames.offset + ' = o;',
      '  buffer.' + bufferNames.writeUtf8String + '(' + a + '_);',
      '  o = buffer.' + bufferNames.offset + ';',
      '} else {',
      '  d[o++] = d[o++] = 0;',
      '}'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_FLOWID_ = {
  size: 4,
  prepare: null,
  write: function(a, bufferNames) {
    return [
      'var ' + a + '_ = ' + a + ' ? (' + a + '.getId() >>> 0) : 0;',
      'd[o++] = (' + a + '_ >>> 24) & 0xFF;',
      'd[o++] = (' + a + '_ >>> 16) & 0xFF;',
      'd[o++] = (' + a + '_ >>> 8) & 0xFF;',
      'd[o++] = ' + a + '_ & 0xFF;'
    ];
  }
};


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_TIME32_ = {
  size: 4,
  prepare: null,
  write: function(a, bufferNames) {
    return [
      'var ' + a + '_ = (' + a + ' * 1000) >>> 0;',
      'd[o++] = (' + a + '_ >>> 24) & 0xFF;',
      'd[o++] = (' + a + '_ >>> 16) & 0xFF;',
      'd[o++] = (' + a + '_ >>> 8) & 0xFF;',
      'd[o++] = ' + a + '_ & 0xFF;'
    ];
  }
};


/**
 * Writer information for supported types.
 * @type {!Object.<!wtf.trace.EventTypeBuilder.Writer_>}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITERS_ = {
  'int8': wtf.trace.EventTypeBuilder.WRITE_INT8_,
  'int8[]': wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_,
  'uint8': wtf.trace.EventTypeBuilder.WRITE_INT8_,
  'uint8[]': wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_,
  'int16': wtf.trace.EventTypeBuilder.WRITE_INT16_,
  'int16[]': wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_,
  'uint16': wtf.trace.EventTypeBuilder.WRITE_INT16_,
  'uint16[]': wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_,
  'int32': wtf.trace.EventTypeBuilder.WRITE_INT32_,
  'int32[]': wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_,
  'uint32': wtf.trace.EventTypeBuilder.WRITE_INT32_,
  'uint32[]': wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_,
  'float32': wtf.trace.EventTypeBuilder.WRITE_FLOAT32_,
  'float32[]': wtf.trace.EventTypeBuilder.WRITE_FLOAT32ARRAY_,
  'ascii': wtf.trace.EventTypeBuilder.WRITE_ASCII_,
  'utf8': wtf.trace.EventTypeBuilder.WRITE_UTF8_,
  'any': wtf.trace.EventTypeBuilder.WRITE_ANY_,
  'flowId': wtf.trace.EventTypeBuilder.WRITE_FLOWID_,
  'time32': wtf.trace.EventTypeBuilder.WRITE_TIME32_
};
