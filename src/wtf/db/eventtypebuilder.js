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

goog.provide('wtf.db.EventTypeBuilder');

goog.require('goog.asserts');
goog.require('wtf.util.FunctionBuilder');



/**
 * Analysis event function builder.
 * Builds the various event tracing functions used exclusively by the
 * analysis library.
 *
 * @constructor
 * @extends {wtf.util.FunctionBuilder}
 */
wtf.db.EventTypeBuilder = function() {
  goog.base(this);
};
goog.inherits(wtf.db.EventTypeBuilder, wtf.util.FunctionBuilder);


/**
 * Generates an event argument parsing function.
 * @param {!wtf.db.EventType} eventType Event type.
 * @return {wtf.db.EventType.ParseFunction} Generated function based on
 *     class.
 */
wtf.db.EventTypeBuilder.prototype.generate = function(eventType) {
  var readers = wtf.db.EventTypeBuilder.READERS_;
  if (!wtf.util.FunctionBuilder.isSupported()) {
    // TODO(benvanik): implement the fallback reader path.
    throw new Error(
        'Fallback path for event type builder is not yet implemented');
  }

  this.begin();
  this.addArgument('buffer');

  // Scan arguments to figure out which buffers we need.
  var uses = {};
  var args = eventType.args;
  for (var n = 0; n < args.length; n++) {
    var arg = args[n];

    // Ensure we support the type.
    var reader = readers[arg.typeName];
    goog.asserts.assert(reader);

    // Track required buffers.
    for (var m = 0; m < reader.uses.length; m++) {
      uses[reader.uses[m]] = true;
    }
  }

  // Add all buffer/var getters.
  for (var name in uses) {
    switch (name) {
      case 'temp':
      case 'len':
        this.append('var ' + name + ';');
        break;
      default:
        this.append('var ' + name + ' = buffer.' + name + ';');
        break;
    }
  }

  // Grab offset.
  this.append('var o = buffer.offset >> 2;');

  // Parse data arguments.
  // We track a constant offset from 'o' used when writing things. when we
  // hit something with variable length (array/etc), we use 'o' to track the
  // offset and reset our constant back to 0.
  var offset = 0;
  for (var n = 0; n < args.length; n++) {
    var arg = args[n];
    var reader = readers[arg.typeName];

    // If the first variable sized argument, switch to non-constant mode.
    if (!reader.size && offset) {
      this.append('o += ' + offset + ';');
      offset = 0;
    }

    // Append the variable read.
    this.append.apply(this, reader.read(arg.name, 'o + ' + offset));

    // Fixup offset.
    if (reader.size) {
      // Pad out to 4b.
      offset += (reader.size + 3) >> 2;
    }
  }

  // Stash back the buffer offset.
  if (offset) {
    this.append('buffer.offset = (o + ' + offset + ') << 2;');
  } else {
    this.append('buffer.offset = o << 2;');
  }

  // Build result object. We build an object literal from all the locals we've
  // gathered to try to help v8 optimize things.
  this.append('return {');
  for (var n = 0; n < args.length; n++) {
    var arg = args[n];
    this.append(
        '  "' + arg.name + '": ' + arg.name + '_' +
            ((n < args.length - 1) ? ',' : ''));
  }
  this.append('};');

  return this.end(eventType.toString());
};


/**
 * Reader information for supported types.
 * @type {!Object.<!{
 *   uses: !Array.<string>,
 *   size: number,
 *   read: function(string, (number|string)):(!Array.<string>)
 * }>}
 * @private
 */
wtf.db.EventTypeBuilder.READERS_ = ({
  'bool': {
    uses: ['uint8Array'],
    size: 1,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = !!uint8Array[(' + offset + ') << 2];'
      ];
    }
  },
  'int8': {
    uses: ['int8Array'],
    size: 1,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = int8Array[(' + offset + ') << 2];'
      ];
    }
  },
  'int8[]': {
    uses: ['uint32Array', 'int8Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len != 0xFFFFFFFF) {',
        '  ' + a + '_ = temp = new Int8Array(len);',
        '  for (var n = 0, oi = o << 2; n < len; n++) {',
        '    temp[n] = int8Array[oi + n];',
        '  }',
        '  o += (len + 3) >> 2;',
        '}'
      ];
    }
  },
  'uint8': {
    uses: ['uint8Array'],
    size: 1,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = uint8Array[(' + offset + ') << 2];'
      ];
    }
  },
  'uint8[]': {
    uses: ['uint32Array', 'uint8Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len != 0xFFFFFFFF) {',
        '  ' + a + '_ = temp = new Uint8Array(len);',
        '  for (var n = 0, oi = o << 2; n < len; n++) {',
        '    temp[n] = uint8Array[oi + n];',
        '  }',
        '  o += (len + 3) >> 2;',
        '}'
      ];
    }
  },
  'int16': {
    uses: ['int16Array'],
    size: 2,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = int16Array[(' + offset + ') << 1];'
      ];
    }
  },
  'int16[]': {
    uses: ['uint32Array', 'int16Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len != 0xFFFFFFFF) {',
        '  ' + a + '_ = temp = new Int16Array(len);',
        '  for (var n = 0, oi = o << 1; n < len; n++) {',
        '    temp[n] = int16Array[oi + n];',
        '  }',
        '  o += (len + 1) >> 1;',
        '}'
      ];
    }
  },
  'uint16': {
    uses: ['uint16Array'],
    size: 2,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = uint16Array[(' + offset + ') << 1];'
      ];
    }
  },
  'uint16[]': {
    uses: ['uint32Array', 'uint16Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len != 0xFFFFFFFF) {',
        '  ' + a + '_ = temp = new Uint16Array(len);',
        '  for (var n = 0, oi = o << 1; n < len; n++) {',
        '    temp[n] = uint16Array[oi + n];',
        '  }',
        '  o += (len + 1) >> 1;',
        '}'
      ];
    }
  },
  'int32': {
    uses: ['int32Array'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = int32Array[' + offset + '];'
      ];
    }
  },
  'int32[]': {
    uses: ['uint32Array', 'int32Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len != 0xFFFFFFFF) {',
        '  ' + a + '_ = temp = new Int32Array(len);',
        '  for (var n = 0; n < len; n++) {',
        '    temp[n] = int32Array[o + n];',
        '  }',
        '  o += len;',
        '}'
      ];
    }
  },
  'uint32': {
    uses: ['uint32Array'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = uint32Array[' + offset + '];'
      ];
    }
  },
  'uint32[]': {
    uses: ['uint32Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len != 0xFFFFFFFF) {',
        '  ' + a + '_ = temp = new Uint32Array(len);',
        '  for (var n = 0; n < len; n++) {',
        '    temp[n] = uint32Array[o + n];',
        '  }',
        '  o += len;',
        '}'
      ];
    }
  },
  'float32': {
    uses: ['float32Array'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = float32Array[' + offset + '];'
      ];
    }
  },
  'float32[]': {
    uses: ['uint32Array', 'float32Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len != 0xFFFFFFFF) {',
        '  ' + a + '_ = temp = new Float32Array(len);',
        '  for (var n = 0; n < len; n++) {',
        '    temp[n] = float32Array[o + n];',
        '  }',
        '  o += len;',
        '}'
      ];
    }
  },
  'ascii': {
    uses: ['uint32Array', 'stringTable'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = ' +
            'stringTable.getString(uint32Array[' + offset + ']);'
      ];
    }
  },
  'utf8': {
    uses: ['uint32Array', 'stringTable'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = ' +
            'stringTable.getString(uint32Array[' + offset + ']);'
      ];
    }
  },
  'char': {
    uses: ['uint8Array'],
    size: 1,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = String.fromCharCode(' +
            'uint8Array[(' + offset + ') << 2]);'
      ];
    }
  },
  'char[]': {
    uses: ['uint32Array', 'uint8Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len == 0) {',
        '  ' + a + '_ = \'\'',
        '} else if (len != 0xFFFFFFFF) {',
        '  temp = new Array(len);',
        '  for (var n = 0, oi = o << 2; n < len; n++) {',
        '    temp[n] = uint8Array[oi + n];',
        '  }',
        '  ' + a + '_ = String.fromCharCode.apply(null, temp);',
        '  o += (len + 3) >> 2;',
        '}'
      ];
    }
  },
  'wchar': {
    uses: ['uint16Array'],
    size: 2,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = String.fromCharCode(' +
            'uint16Array[(' + offset + ') << 1]);'
      ];
    }
  },
  'wchar[]': {
    uses: ['uint32Array', 'uint16Array', 'temp', 'len'],
    size: 0,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = null;',
        'len = uint32Array[o++];',
        'if (len == 0) {',
        '  ' + a + '_ = \'\'',
        '} else if (len != 0xFFFFFFFF) {',
        '  temp = new Array(len);',
        '  for (var n = 0, oi = o << 1; n < len; n++) {',
        '    temp[n] = uint16Array[oi + n];',
        '  }',
        '  ' + a + '_ = String.fromCharCode.apply(null, temp);',
        '  o += (len + 1) >> 1;',
        '}'
      ];
    }
  },
  'any': {
    uses: ['uint32Array', 'stringTable'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = ' +
            'JSON.parse(stringTable.getString(uint32Array[' + offset + ']));'
      ];
    }
  },
  'flowId': {
    uses: ['uint32Array'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = uint32Array[' + offset + '];'
      ];
    }
  },
  'time32': {
    uses: ['uint32Array'],
    size: 4,
    read: function(a, offset) {
      return [
        'var ' + a + '_ = uint32Array[' + offset + '] / 1000;'
      ];
    }
  }
});


/**
 * Generates an event argument parsing function.
 * This supports the legacy binary format that uses {@see wtf.io.Buffer}.
 * @param {!wtf.db.EventType} eventType Event type.
 * @return {wtf.db.EventType.LegacyParseFunction} Generated function based on
 *     class.
 */
wtf.db.EventTypeBuilder.prototype.generateLegacy = function(eventType) {
  var readers = wtf.db.EventTypeBuilder.LEGACY_READERS_;

  // To reduce code size we just support the non-codegen version of things.
  var args = eventType.args;
  return function(buffer) {
    var value = {};
    for (var n = 0; n < args.length; n++) {
      var arg = args[n];
      value[arg.name] = readers[arg.typeName](buffer);
    }
    return value;
  };
};


/**
 * Reader information for supported types.
 * @type {!Object.<!(function(!wtf.io.Buffer):(*))>}
 * @private
 */
wtf.db.EventTypeBuilder.LEGACY_READERS_ = ({
  'bool': function(buffer) {
    return !!buffer.readInt8();
  },
  'int8': function(buffer) {
    return buffer.readInt8();
  },
  'int8[]': function(buffer) {
    var length = buffer.readUint32();
    var result = new Int8Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readInt8();
    }
    return result;
  },
  'uint8': function(buffer) {
    return buffer.readUint8();
  },
  'uint8[]': function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint8Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint8();
    }
    return result;
  },
  'int16': function(buffer) {
    return buffer.readInt16();
  },
  'int16[]': function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint16Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint16();
    }
    return result;
  },
  'uint16': function(buffer) {
    return buffer.readUint16();
  },
  'uint16[]': function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint16Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint16();
    }
    return result;
  },
  'int32': function(buffer) {
    return buffer.readInt32();
  },
  'int32[]': function(buffer) {
    var length = buffer.readUint32();
    var result = new Int32Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readInt32();
    }
    return result;
  },
  'uint32': function(buffer) {
    return buffer.readUint32();
  },
  'uint32[]': function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint32Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint32();
    }
    return result;
  },
  'float32': function(buffer) {
    return buffer.readFloat32();
  },
  'float32[]': function(buffer) {
    var length = buffer.readUint32();
    var result = new Float32Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readFloat32();
    }
    return result;
  },
  'ascii': function(buffer) {
    return buffer.readAsciiString();
  },
  'utf8': function(buffer) {
    return buffer.readUtf8String();
  },
  'any': function(buffer) {
    var string = buffer.readUtf8String();
    return goog.global.JSON.parse(string);
  },
  'flowId': function(buffer) {
    return buffer.readUint32();
  },
  'time32': function(buffer) {
    return buffer.readUint32() / 1000;
  }
});
