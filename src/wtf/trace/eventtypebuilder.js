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
goog.require('wtf');
goog.require('wtf.data.EventClass');
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
};
goog.inherits(wtf.trace.EventTypeBuilder, wtf.util.FunctionBuilder);


/**
 * Generates an event tracing function.
 * @param {!wtf.trace.EventSessionContextType} context Event session context.
 * @param {!wtf.trace.EventType} eventType Event type.
 * @return {Function} Generated function based on class.
 */
wtf.trace.EventTypeBuilder.prototype.generate = function(context, eventType) {
  var writers = wtf.trace.EventTypeBuilder.WRITERS_;

  // Context structure, from eventsessioncontext.js:
  // [0] = wtf.trace.Session?
  // [1] = wtf.io.BufferView.Type?

  // Begin building the function with default args.
  this.begin();
  this.addScopeVariable('context', context);
  this.addScopeVariable('eventType', eventType);
  this.addScopeVariable('now', wtf.now);
  this.addScopeVariable('stringify', function(value) {
    // TODO(benvanik): make this even faster.
    var json = null;
    if (typeof value == 'number') {
      json = '' + value;
    } else if (typeof value == 'boolean') {
      json = '' + value;
    } else if (!value) {
      json = null;
    } else {
      // JSON is faster and generates less garbage.
      // goog.json adds 1K to file size, and is only needed for IE7-.
      json = goog.global.JSON.stringify(value);
    }
    return json;
  });

  // Fetch the time as early as possible.
  // TODO(benvanik): inline now code (instead of using wtf.now)
  this.append('var time = (opt_time === undefined) ? now() : opt_time;');

  // Count.
  this.append('eventType.' + this.eventTypeNames_.count + '++;');

  // Setup arguments.
  // Scan arguments to figure out which buffers we need and try to compute
  // the size.
  // We try very hard to use constant offsets, but if the user has any
  // variable-length arguments we need to switch to variable offsets.
  var requiredBuffers = {
    'int32Array': true
  };
  var minSize = 4 + 4;
  var sizeExpressions = [];
  var args = eventType.args;
  for (var n = 0; n < args.length; n++) {
    var arg = args[n];

    // Add argument.
    this.addArgument(arg.name + '_');

    // Ensure we support the type.
    var writer = writers[arg.typeName];
    goog.asserts.assert(writer);

    // Track required buffers.
    for (var m = 0; m < writer.uses.length; m++) {
      requiredBuffers[writer.uses[m]] = true;
    }

    // Track minimum size.
    if (writer.size) {
      minSize += writer.size < 4 ?
          (writer.size + (4 - (writer.size % 4))) : 4;
    }

    // If variable size, get the expression.
    if (writer.computeSize) {
      sizeExpressions.push('(' + writer.computeSize(arg.name + '_') + ')');
    }

    // Setup code, if any.
    if (writer.setup) {
      this.append.apply(this, writer.setup(arg.name + '_'));
    }
  }
  if (sizeExpressions.length) {
    this.append(
        'var size = ' + minSize + ' + ' + sizeExpressions.join(' + ') + ';');
  } else {
    this.append(
        'var size = ' + minSize + ';');
  }

  // Additional optional arguments.
  this.addArgument('opt_time');
  this.addArgument('opt_buffer');

  // TODO(benvanik): optimize this.
  this.append(
      'var buffer = opt_buffer || context[1];',
      'var session = context[0];',
      'if (!buffer || buffer.capacity - buffer.offset < size) {',
      '  buffer = session ? session.acquireBuffer(time, size) : null;',
      '  context[1] = buffer;',
      '}',
      'if (!buffer || !session) return undefined;');

  // Add all buffer getters.
  for (var name in requiredBuffers) {
    this.append('var ' + name + ' = buffer.' + name + ';');
  }

  // Write event header.
  this.append(
      'var o = buffer.offset >> 2;',
      'int32Array[o + 0] = ' + eventType.wireId + ';',
      'int32Array[o + 1] = time * 1000;');

  // Append arguments.
  // We track a constant offset from 'o' used when writing things. when we
  // hit something with variable length (array/etc), we use 'o' to track the
  // offset and reset our constant back to 0.
  var offset = 1 + 1;
  if (args.length) {
    for (var n = 0; n < args.length; n++) {
      var arg = args[n];
      var writer = writers[arg.typeName];

      // Update the offset if we are about to write a variable-lengthed thing.
      if (!writer.size && offset) {
        this.append('o += ' + offset + ';');
        offset = 0;
      }

      // Append the variable write.
      this.append.apply(this, writer.write(arg.name + '_', 'o + ' + offset));

      // Fixup constant offset.
      if (writer.size) {
        // Pad out to 4b.
        offset += (writer.size + 3) >> 2;
      }
    }
  }

  // Stash back the buffer offset.
  if (offset) {
    this.append('buffer.offset = (o + ' + offset + ') << 2;');
  } else {
    this.append('buffer.offset = o << 2;');
  }

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
 *   uses: !Array.<string>,
 *   size: number,
 *   setup: (function(string):(!Array.<string>))?,
 *   computeSize: (function(string):string)?,
 *   write: function(string, (number|string)):(!Array.<string>)
 * }}
 * @private
 */
wtf.trace.EventTypeBuilder.Writer_;


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_BOOL_ = ({
  uses: ['int8Array'],
  size: 1,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int8Array[(' + offset + ') << 2] = ' + a + ' ? 1 : 0;'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT8_ = ({
  uses: ['int8Array'],
  size: 1,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int8Array[(' + offset + ') << 2] = ' + a + ';'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_ = ({
  uses: ['int32Array', 'int8Array'],
  size: 0,
  setup: function(a) {
    return ['var ' + a + 'Length = ' + a + ' ? ' + a + '.length : 0;'];
  },
  computeSize: function(a) {
    return '4 + ((' + a + 'Length + 3) & ~0x3)';
  },
  write: function(a, offset) {
    return [
      'if (!' + a + ') {',
      '  int32Array[o++] = -1;',
      '} else {',
      '  int32Array[o++] = ' + a + 'Length;',
      '  for (var n = 0, oi = o << 2; n < ' + a + 'Length; n++) {',
      '    int8Array[oi + n] = ' + a + '[n];',
      '  }',
      '  o += (' + a + 'Length + 3) >> 2;',
      '}'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT16_ = ({
  uses: ['int16Array'],
  size: 2,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int16Array[(' + offset + ') << 1] = ' + a + ';'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_ = ({
  uses: ['int32Array', 'int16Array'],
  size: 0,
  setup: function(a) {
    return ['var ' + a + 'Length = ' + a + ' ? ' + a + '.length : 0;'];
  },
  computeSize: function(a) {
    return '4 + (((' + a + 'Length + 1) << 1) & 0x3)';
  },
  write: function(a, offset) {
    return [
      'if (!' + a + ') {',
      '  int32Array[o++] = -1;',
      '} else {',
      '  int32Array[o++] = ' + a + 'Length;',
      '  for (var n = 0, oi = o << 1; n < ' + a + 'Length; n++) {',
      '    int16Array[oi + n] = ' + a + '[n];',
      '  }',
      '  o += (' + a + 'Length + 1) >> 1;',
      '}'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT32_ = ({
  uses: ['int32Array'],
  size: 4,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int32Array[' + offset + '] = ' + a + ';'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_ = ({
  uses: ['int32Array'],
  size: 0,
  setup: function(a) {
    return ['var ' + a + 'Length = ' + a + ' ? ' + a + '.length : 0;'];
  },
  computeSize: function(a) {
    return '4 + ' + a + 'Length << 2';
  },
  write: function(a, offset) {
    return [
      'if (!' + a + ') {',
      '  int32Array[o++] = -1;',
      '} else {',
      '  int32Array[o++] = ' + a + 'Length;',
      '  for (var n = 0; n < ' + a + 'Length; n++) {',
      '    int32Array[o + n] = ' + a + '[n];',
      '  }',
      '  o += ' + a + 'Length;',
      '}'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_FLOAT32_ = ({
  uses: ['float32Array'],
  size: 4,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'float32Array[' + offset + '] = ' + a + ';'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_FLOAT32ARRAY_ = ({
  uses: ['int32Array', 'float32Array'],
  size: 0,
  setup: function(a) {
    return ['var ' + a + 'Length = ' + a + ' ? ' + a + '.length : 0;'];
  },
  computeSize: function(a) {
    return '4 + ' + a + 'Length << 2';
  },
  write: function(a, offset) {
    return [
      'if (!' + a + ') {',
      '  int32Array[o++] = -1;',
      '} else {',
      '  int32Array[o++] = ' + a + 'Length;',
      '  for (var n = 0; n < ' + a + 'Length; n++) {',
      '    float32Array[o + n] = ' + a + '[n];',
      '  }',
      '  o += ' + a + 'Length;',
      '}'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_STRING_ = ({
  uses: ['int32Array', 'stringTable'],
  size: 4,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'if (typeof ' + a + ' == "string") {',
      '  int32Array[' + offset + '] = ' + a + '.length ? ' +
          'stringTable.addString(' + a + ') : -2;',
      '} else {',
      '  int32Array[' + offset + '] = -1;',
      '}'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_CHAR_ = ({
  uses: ['int8Array'],
  size: 1,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int8Array[(' + offset + ') << 2] = ' + a + '.charCodeAt(0);'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_CHARARRAY_ = ({
  uses: ['int32Array', 'int8Array'],
  size: 0,
  setup: function(a) {
    return ['var ' + a + 'Length = ' + a + ' ? ' + a + '.length : 0;'];
  },
  computeSize: function(a) {
    return '4 + ((' + a + 'Length + 3) & ~0x3)';
  },
  write: function(a, offset) {
    return [
      'if (' + a + ' === null || ' + a + ' === undefined) {',
      '  int32Array[o++] = -1;',
      '} else {',
      '  int32Array[o++] = ' + a + 'Length;',
      '  for (var n = 0, oi = o << 2; n < ' + a + 'Length; n++) {',
      '    int8Array[oi + n] = ' + a + '.charCodeAt(n);',
      '  }',
      '  o += (' + a + 'Length + 3) >> 2;',
      '}'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_WCHAR_ = ({
  uses: ['int16Array'],
  size: 2,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int16Array[(' + offset + ') << 1] = ' + a + '.charCodeAt(0);'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_WCHARARRAY_ = ({
  uses: ['int32Array', 'int16Array'],
  size: 0,
  setup: function(a) {
    return ['var ' + a + 'Length = ' + a + ' ? ' + a + '.length : 0;'];
  },
  computeSize: function(a) {
    return '4 + (((' + a + 'Length + 1) << 1) & 0x3)';
  },
  write: function(a, offset) {
    return [
      'if (' + a + ' === null || ' + a + ' === undefined) {',
      '  int32Array[o++] = -1;',
      '} else {',
      '  int32Array[o++] = ' + a + 'Length;',
      '  for (var n = 0, oi = o << 1; n < ' + a + 'Length; n++) {',
      '    int16Array[oi + n] = ' + a + '.charCodeAt(n);',
      '  }',
      '  o += (' + a + 'Length + 1) >> 1;',
      '}'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_ANY_ = ({
  uses: ['int32Array', 'stringTable'],
  size: 4,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int32Array[' + offset + '] = ' +
          a + ' !== undefined && ' + a + ' !== null ? ' +
          'stringTable.addString(stringify(' + a + ')) : -1;'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_FLOWID_ = ({
  uses: ['int32Array'],
  size: 4,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int32Array[' + offset + '] = ' + a + ' ? ' + a + '.getId() : 0;'
    ];
  }
});


/**
 * @type {wtf.trace.EventTypeBuilder.Writer_}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITE_TIME32_ = ({
  uses: ['int32Array'],
  size: 4,
  setup: null,
  computeSize: null,
  write: function(a, offset) {
    return [
      'int32Array[' + offset + '] = ' + a + ' * 1000;'
    ];
  }
});


/**
 * Writer information for supported types.
 * @type {!Object.<!wtf.trace.EventTypeBuilder.Writer_>}
 * @private
 */
wtf.trace.EventTypeBuilder.WRITERS_ = {
  'bool': wtf.trace.EventTypeBuilder.WRITE_BOOL_,
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
  'ascii': wtf.trace.EventTypeBuilder.WRITE_STRING_,
  'utf8': wtf.trace.EventTypeBuilder.WRITE_STRING_,
  'char': wtf.trace.EventTypeBuilder.WRITE_CHAR_,
  'char[]': wtf.trace.EventTypeBuilder.WRITE_CHARARRAY_,
  'wchar': wtf.trace.EventTypeBuilder.WRITE_WCHAR_,
  'wchar[]': wtf.trace.EventTypeBuilder.WRITE_WCHARARRAY_,
  'any': wtf.trace.EventTypeBuilder.WRITE_ANY_,
  'flowId': wtf.trace.EventTypeBuilder.WRITE_FLOWID_,
  'time32': wtf.trace.EventTypeBuilder.WRITE_TIME32_
};
