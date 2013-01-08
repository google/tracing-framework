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

goog.provide('wtf.analysis.EventTypeBuilder');

goog.require('goog.json');
goog.require('wtf.io.Buffer');
goog.require('wtf.util.FunctionBuilder');



/**
 * Analysis event function builder.
 * Builds the various event tracing functions used exclusively by the
 * analysis library.
 *
 * @constructor
 * @extends {wtf.util.FunctionBuilder}
 */
wtf.analysis.EventTypeBuilder = function() {
  goog.base(this);

  /**
   * Names of compiled members on {@see wtf.io.Buffer}.
   * @type {!Object.<string>}
   * @private
   */
  this.bufferNames_ = wtf.io.Buffer.getNameMap();
};
goog.inherits(wtf.analysis.EventTypeBuilder, wtf.util.FunctionBuilder);


/**
 * Generates an event argument parsing function.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @return {wtf.analysis.EventType.ParseFunction} Generated function based on
 *     class.
 */
wtf.analysis.EventTypeBuilder.prototype.generate = function(eventType) {
  var readers = wtf.analysis.EventTypeBuilder.READERS_;
  if (!wtf.util.FunctionBuilder.isSupported()) {
    // Fallback to non-codegen version.
    var args = eventType.args;
    return function(buffer) {
      var value = {};
      for (var n = 0; n < args.length; n++) {
        var arg = args[n];
        value[arg.name] = readers[arg.typeName].read(buffer);
      }
      return value;
    };
  }

  this.begin();
  this.addScopeVariable('jsonParse', goog.json.parse);
  this.addArgument('buffer');

  // Storage for data.
  // Would be nice to avoid this or do it more compactly.
  this.append('var value = {};');

  // Parse data arguments.
  for (var n = 0; n < eventType.args.length; n++) {
    var arg = eventType.args[n];
    var reader = readers[arg.typeName];
    this.append.apply(this, reader.readSource(arg.name, this.bufferNames_));
  }

  this.append('return value;');

  return this.end(eventType.toString());
};


/**
 * @typedef {{
 *   read: function(!wtf.io.Buffer):(*),
 *   readSource: function(string, !Object):(!Array.<string>)
 * }}
 * @private
 */
wtf.analysis.EventTypeBuilder.Reader_;


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_BOOL_ = {
  read: function(buffer) {
    return !!buffer.readInt8();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = !!buffer.' + bufferNames.readInt8 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_INT8_ = {
  read: function(buffer) {
    return buffer.readInt8();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readInt8 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_INT8ARRAY_ = {
  read: function(buffer) {
    var length = buffer.readUint32();
    var result = new Int8Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readInt8();
    }
    return result;
  },
  readSource: function(a, bufferNames) {
    return [
      // TODO(benvanik): optimize big array reads.
      'var ' + a + '_len = buffer.' + bufferNames.readUint32 + '();',
      'var ' + a + '_ = value["' + a + '"] = new Int8Array(' + a + '_len);',
      'for (var n = 0; n < ' + a + '_len; n++) {',
      '  ' + a + '_[n] = buffer.' + bufferNames.readInt8 + '();',
      '}'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_UINT8_ = {
  read: function(buffer) {
    return buffer.readUint8();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readUint8 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_UINT8ARRAY_ = {
  read: function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint8Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint8();
    }
    return result;
  },
  readSource: function(a, bufferNames) {
    return [
      // TODO(benvanik): optimize big array reads.
      'var ' + a + '_len = buffer.' + bufferNames.readUint32 + '();',
      'var ' + a + '_ = value["' + a + '"] = new Uint8Array(' + a + '_len);',
      'for (var n = 0; n < ' + a + '_len; n++) {',
      '  ' + a + '_[n] = buffer.' + bufferNames.readUint8 + '();',
      '}'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_INT16_ = {
  read: function(buffer) {
    return buffer.readInt16();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readInt16 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_INT16ARRAY_ = {
  read: function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint16Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint16();
    }
    return result;
  },
  readSource: function(a, bufferNames) {
    return [
      // TODO(benvanik): optimize big array reads.
      'var ' + a + '_len = buffer.' + bufferNames.readUint32 + '();',
      'var ' + a + '_ = value["' + a + '"] = new Int16Array(' + a + '_len);',
      'for (var n = 0; n < ' + a + '_len; n++) {',
      '  ' + a + '_[n] = buffer.' + bufferNames.readUint16 + '();',
      '}'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_UINT16_ = {
  read: function(buffer) {
    return buffer.readUint16();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readUint16 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_UINT16ARRAY_ = {
  read: function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint16Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint16();
    }
    return result;
  },
  readSource: function(a, bufferNames) {
    return [
      // TODO(benvanik): optimize big array reads.
      'var ' + a + '_len = buffer.' + bufferNames.readUint32 + '();',
      'var ' + a + '_ = value["' + a + '"] = new Uint16Array(' + a + '_len);',
      'for (var n = 0; n < ' + a + '_len; n++) {',
      '  ' + a + '_[n] = buffer.' + bufferNames.readUint16 + '();',
      '}'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_INT32_ = {
  read: function(buffer) {
    return buffer.readInt32();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readInt32 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_INT32ARRAY_ = {
  read: function(buffer) {
    var length = buffer.readUint32();
    var result = new Int32Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readInt32();
    }
    return result;
  },
  readSource: function(a, bufferNames) {
    return [
      // TODO(benvanik): optimize big array reads.
      'var ' + a + '_len = buffer.' + bufferNames.readUint32 + '();',
      'var ' + a + '_ = value["' + a + '"] = new Int32Array(' + a + '_len);',
      'for (var n = 0; n < ' + a + '_len; n++) {',
      '  ' + a + '_[n] = buffer.' + bufferNames.readInt32 + '();',
      '}'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_UINT32_ = {
  read: function(buffer) {
    return buffer.readUint32();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readUint32 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_UINT32ARRAY_ = {
  read: function(buffer) {
    var length = buffer.readUint32();
    var result = new Uint32Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readUint32();
    }
    return result;
  },
  readSource: function(a, bufferNames) {
    return [
      // TODO(benvanik): optimize big array reads.
      'var ' + a + '_len = buffer.' + bufferNames.readUint32 + '();',
      'var ' + a + '_ = value["' + a + '"] = new Uint32Array(' + a + '_len);',
      'for (var n = 0; n < ' + a + '_len; n++) {',
      '  ' + a + '_[n] = buffer.' + bufferNames.readUint32 + '();',
      '}'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_FLOAT32_ = {
  read: function(buffer) {
    return buffer.readFloat32();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readFloat32 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_FLOAT32ARRAY_ = {
  read: function(buffer) {
    var length = buffer.readUint32();
    var result = new Float32Array(length);
    for (var n = 0; n < length; n++) {
      result[n] = buffer.readFloat32();
    }
    return result;
  },
  readSource: function(a, bufferNames) {
    return [
      // TODO(benvanik): optimize big array reads.
      'var ' + a + '_len = buffer.' + bufferNames.readUint32 + '();',
      'var ' + a + '_ = value["' + a + '"] = new Float32Array(' + a + '_len);',
      'for (var n = 0; n < ' + a + '_len; n++) {',
      '  ' + a + '_[n] = buffer.' + bufferNames.readFloat32 + '();',
      '}'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_ASCII_ = {
  read: function(buffer) {
    return buffer.readAsciiString();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readAsciiString + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_UTF8_ = {
  read: function(buffer) {
    return buffer.readUtf8String();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readUtf8String + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_ANY_ = {
  read: function(buffer) {
    var string = buffer.readUtf8String();
    return goog.global.JSON.parse(string);
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = jsonParse(' +
          'buffer.' + bufferNames.readUtf8String + '());'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_FLOWID_ = {
  read: function(buffer) {
    return buffer.readUint32();
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readUint32 + '();'
    ];
  }
};


/**
 * @type {wtf.analysis.EventTypeBuilder.Reader_}
 * @private
 */
wtf.analysis.EventTypeBuilder.READ_TIME32_ = {
  read: function(buffer) {
    return buffer.readUint32() / 1000;
  },
  readSource: function(a, bufferNames) {
    return [
      'value["' + a + '"] = buffer.' + bufferNames.readUint32 + '() / 1000;'
    ];
  }
};


/**
 * Reader information for supported types.
 * @type {!Object.<!wtf.analysis.EventTypeBuilder.Reader_>}
 * @private
 */
wtf.analysis.EventTypeBuilder.READERS_ = {
  'bool': wtf.analysis.EventTypeBuilder.READ_BOOL_,
  'int8': wtf.analysis.EventTypeBuilder.READ_INT8_,
  'int8[]': wtf.analysis.EventTypeBuilder.READ_INT8ARRAY_,
  'uint8': wtf.analysis.EventTypeBuilder.READ_UINT8_,
  'uint8[]': wtf.analysis.EventTypeBuilder.READ_UINT8ARRAY_,
  'int16': wtf.analysis.EventTypeBuilder.READ_INT16_,
  'int16[]': wtf.analysis.EventTypeBuilder.READ_INT16ARRAY_,
  'uint16': wtf.analysis.EventTypeBuilder.READ_UINT16_,
  'uint16[]': wtf.analysis.EventTypeBuilder.READ_UINT16ARRAY_,
  'int32': wtf.analysis.EventTypeBuilder.READ_INT32_,
  'int32[]': wtf.analysis.EventTypeBuilder.READ_INT32ARRAY_,
  'uint32': wtf.analysis.EventTypeBuilder.READ_UINT32_,
  'uint32[]': wtf.analysis.EventTypeBuilder.READ_UINT32ARRAY_,
  'float32': wtf.analysis.EventTypeBuilder.READ_FLOAT32_,
  'float32[]': wtf.analysis.EventTypeBuilder.READ_FLOAT32ARRAY_,
  'ascii': wtf.analysis.EventTypeBuilder.READ_ASCII_,
  'utf8': wtf.analysis.EventTypeBuilder.READ_UTF8_,
  'any': wtf.analysis.EventTypeBuilder.READ_ANY_,
  'flowId': wtf.analysis.EventTypeBuilder.READ_FLOWID_,
  'time32': wtf.analysis.EventTypeBuilder.READ_TIME32_
};
