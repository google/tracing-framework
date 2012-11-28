/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Data variable types used for custom event payloads.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.data.Variable');
goog.provide('wtf.data.VariableFlag');

goog.require('goog.asserts');


/**
 * Bitmask values for variable flags.
 * @enum {number}
 */
wtf.data.VariableFlag = {
};



/**
 * Abstract base variable type.
 * Along with its subclasses describes information about a variable that is used
 * to generate source for event data reads/writes.
 *
 * @param {string} signatureName Variable type name used in signatures.
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 */
wtf.data.Variable = function(signatureName, name, opt_flags) {
  /**
   * Variable type name used in signatures.
   * Ex: 'uint8'.
   * @type {string}
   */
  this.signatureName = signatureName;

  /**
   * Machine-friendly name used to uniquely identify the variable. It should be
   * a valid Javascript literal (no spaces/etc).
   * @type {string}
   */
  this.name = name;

  /**
   * Bitmask of {@see wtf.data.VariableFlag} values describing the behavior of
   * the variable.
   * @type {number}
   */
  this.flags = opt_flags || 0;

  /**
   * Whether the variable is fixed size.
   * Fixed size variables are significantly faster than variable-sized ones.
   * @type {boolean}
   */
  this.isFixedSize = true;
};


/**
 * Gets the size of the variable.
 * This is only valid for fixed-size variables. Variable-sized ones can only be
 * computed at runtime.
 * @return {number} Size, in bytes, of the variable.
 */
wtf.data.Variable.prototype.getSize = goog.abstractMethod;


/**
 * Gets a source code statement for calculating the variables size.
 * This is only valid for variable-size variables.
 * @param {string} name Local variable name.
 * @return {string} Source statement.
 */
wtf.data.Variable.prototype.getSizeCalculationSource = goog.abstractMethod;


/**
 * Reads the variable from a buffer.
 * @param {!wtf.io.Buffer} buffer Data buffer.
 * @return {*} Data value.
 */
wtf.data.Variable.prototype.read = goog.abstractMethod;


/**
 * Gets a source code statement for reading the variable.
 * @param {!Object.<string>} bufferNameMap {@see wtf.io.Buffer} name map.
 * @param {string} name Local variable name.
 * @return {string} Source statement.
 */
wtf.data.Variable.prototype.getReadSource = goog.abstractMethod;


/**
 * Gets a source code statement for writing the variable.
 * @param {!Object.<string>} bufferNameMap {@see wtf.io.Buffer} name map.
 * @param {string} name Local variable name.
 * @return {string} Source statement.
 */
wtf.data.Variable.prototype.getWriteSource = goog.abstractMethod;



/**
 * Int8 variable.
 * Represented as 1 binary byte.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Int8 = function(name, opt_flags) {
  goog.base(this, 'int8', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.Int8, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Int8.prototype.getSize = function() {
  return 1;
};


/**
 * @override
 */
wtf.data.Variable.Int8.prototype.read = function(buffer) {
  return buffer.readInt8();
};


/**
 * @override
 */
wtf.data.Variable.Int8.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return name + ' = buffer.' + bufferNameMap.readInt8 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Int8.prototype.getWriteSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeInt8 + '(' + name + ')';
};



/**
 * Int16 variable.
 * Represented as 2 binary bytes.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Int16 = function(name, opt_flags) {
  goog.base(this, 'int16', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.Int16, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Int16.prototype.getSize = function() {
  return 2;
};


/**
 * @override
 */
wtf.data.Variable.Int16.prototype.read = function(buffer) {
  return buffer.readInt16();
};


/**
 * @override
 */
wtf.data.Variable.Int16.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return name + ' = buffer.' + bufferNameMap.readInt16 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Int16.prototype.getWriteSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeInt16 + '(' + name + ')';
};



/**
 * Int32 variable.
 * Represented as 4 binary bytes.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Int32 = function(name, opt_flags) {
  goog.base(this, 'int32', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.Int32, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Int32.prototype.getSize = function() {
  return 4;
};


/**
 * @override
 */
wtf.data.Variable.Int32.prototype.read = function(buffer) {
  return buffer.readInt32();
};


/**
 * @override
 */
wtf.data.Variable.Int32.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return name + ' = buffer.' + bufferNameMap.readInt32 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Int32.prototype.getWriteSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeInt32 + '(' + name + ' >>> 0)';
};



/**
 * Uint8 variable.
 * Represented as 1 binary byte.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Uint8 = function(name, opt_flags) {
  goog.base(this, 'uint8', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.Uint8, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Uint8.prototype.getSize = function() {
  return 1;
};


/**
 * @override
 */
wtf.data.Variable.Uint8.prototype.read = function(buffer) {
  return buffer.readUint8();
};


/**
 * @override
 */
wtf.data.Variable.Uint8.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return name + ' = buffer.' + bufferNameMap.readUint8 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Uint8.prototype.getWriteSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeUint8 + '(' + name + ')';
};



/**
 * Uint16 variable.
 * Represented as 2 binary bytes.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Uint16 = function(name, opt_flags) {
  goog.base(this, 'uint16', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.Uint16, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Uint16.prototype.getSize = function() {
  return 2;
};


/**
 * @override
 */
wtf.data.Variable.Uint16.prototype.read = function(buffer) {
  return buffer.readUint16();
};


/**
 * @override
 */
wtf.data.Variable.Uint16.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return name + ' = buffer.' + bufferNameMap.readUint16 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Uint16.prototype.getWriteSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeUint16 + '(' + name + ')';
};



/**
 * Uint32 variable.
 * Represented as 4 binary bytes.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Uint32 = function(name, opt_flags) {
  goog.base(this, 'uint32', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.Uint32, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Uint32.prototype.getSize = function() {
  return 4;
};


/**
 * @override
 */
wtf.data.Variable.Uint32.prototype.read = function(buffer) {
  return buffer.readUint32();
};


/**
 * @override
 */
wtf.data.Variable.Uint32.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return name + ' = buffer.' + bufferNameMap.readUint32 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Uint32.prototype.getWriteSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeUint32 + '(' + name + ' >>> 0)';
};



/**
 * Float32 variable.
 * Represented as 4 binary bytes.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Float32 = function(name, opt_flags) {
  goog.base(this, 'float', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.Float32, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Float32.prototype.getSize = function() {
  return 4;
};


/**
 * @override
 */
wtf.data.Variable.Float32.prototype.read = function(buffer) {
  return buffer.readUint32();
};


/**
 * @override
 */
wtf.data.Variable.Float32.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return name + ' = buffer.' + bufferNameMap.readFloat32 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Float32.prototype.getWriteSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeFloat32 + '(' + name + ')';
};



/**
 * ASCII string variable.
 * Represented as a length-prefixed ASCII string.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.AsciiString = function(name, opt_flags) {
  goog.base(this, 'ascii', name, opt_flags);
  this.isFixedSize = false;
};
goog.inherits(wtf.data.Variable.AsciiString, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.AsciiString.prototype.getSizeCalculationSource =
    function(name) {
  // Note: this requires knowledge of the wire format of strings, however the
  // performance gain by avoiding the call is worth it.
  return name + ' ? (2 + ' + name + '.length) : 2';
};


/**
 * @override
 */
wtf.data.Variable.AsciiString.prototype.read = function(buffer) {
  return buffer.readAsciiString();
};


/**
 * @override
 */
wtf.data.Variable.AsciiString.prototype.getReadSource = function(
    bufferNameMap, name) {
  return name + ' = buffer.' + bufferNameMap.readAsciiString + '()';
};


/**
 * @override
 */
wtf.data.Variable.AsciiString.prototype.getWriteSource = function(
    bufferNameMap, name) {
  var writeUint16Fn = bufferNameMap.writeUint16;
  var writeStringFn = bufferNameMap.writeAsciiString;
  return name + ' ? buffer.' + writeStringFn + '(' + name + ') : ' +
      'buffer.' + writeUint16Fn + '(0)';
};



/**
 * UTF8 string variable.
 * Represented as a length-prefixed UTF8 string.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Utf8String = function(name, opt_flags) {
  goog.base(this, 'utf8', name, opt_flags);
  this.isFixedSize = false;
};
goog.inherits(wtf.data.Variable.Utf8String, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Utf8String.prototype.getSizeCalculationSource =
    function(name) {
  // Note: this requires knowledge of the wire format of strings, however the
  // performance gain by avoiding the call is worth it.
  return name + ' ? (2 + 2 + ' + name + '.length * 3) : 2';
};


/**
 * @override
 */
wtf.data.Variable.Utf8String.prototype.read = function(buffer) {
  return buffer.readUtf8String();
};


/**
 * @override
 */
wtf.data.Variable.Utf8String.prototype.getReadSource = function(
    bufferNameMap, name) {
  return name + ' = buffer.' + bufferNameMap.readUtf8String + '()';
};


/**
 * @override
 */
wtf.data.Variable.Utf8String.prototype.getWriteSource = function(
    bufferNameMap, name) {
  var writeUint16Fn = bufferNameMap.writeUint16;
  var writeStringFn = bufferNameMap.writeUtf8String;
  return name + ' ? buffer.' + writeStringFn + '(' + name + ') : ' +
      'buffer.' + writeUint16Fn + '(0)';
};



/**
 * Flow ID variable.
 * Implementation-specific value for now.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.FlowID = function(name, opt_flags) {
  goog.base(this, 'flowId', name, opt_flags);
  this.isFixedSize = true;
};
goog.inherits(wtf.data.Variable.FlowID, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.FlowID.prototype.getSize = function() {
  return 4;
};


/**
 * @override
 */
wtf.data.Variable.FlowID.prototype.read = function(buffer) {
  return buffer.readUint32();
};


/**
 * @override
 */
wtf.data.Variable.FlowID.prototype.getReadSource = function(
    bufferNameMap, name) {
  return name + ' = buffer.' + bufferNameMap.readUint32 + '()';
};


/**
 * @override
 */
wtf.data.Variable.FlowID.prototype.getWriteSource = function(
    bufferNameMap, name) {
  return 'buffer.' + bufferNameMap.writeUint32 + '(' + name + ')';
};



// TODO(benvanik): support fixed-length arrays (remove length overhead).
// TODO(benvanik): support varint lengths (may be more expensive than fixed).
/**
 * Variable sequence wrapper.
 * Serializes the size and the values of the given type.
 *
 * @param {!wtf.data.Variable} elementType Element type.
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 * @extends {wtf.data.Variable}
 */
wtf.data.Variable.Sequence = function(elementType, name, opt_flags) {
  goog.base(this, elementType.signatureName + '[]', name, opt_flags);
  this.isFixedSize = false;

  /**
   * Array element type.
   * @type {!wtf.data.Variable}
   */
  this.elementType = elementType;
};
goog.inherits(wtf.data.Variable.Sequence, wtf.data.Variable);


/**
 * @override
 */
wtf.data.Variable.Sequence.prototype.getSizeCalculationSource = function(name) {
  // TODO(benvanik): doing child size calculation is expensive, fix?
  goog.asserts.assert(this.elementType.isFixedSize);
  var size = this.elementType.getSize();
  return name + ' ? (4 + ' + name + '.length * (' + size + ')) : 4';
};


/**
 * @override
 */
wtf.data.Variable.Sequence.prototype.read = function(buffer) {
  var length = buffer.readUint32();
  if (length) {
    var result = new Array(length);
    var elementType = this.elementType;
    for (var n = 0; n < length; n++) {
      result[n] = elementType.read(buffer);
    }
    return result;
  } else {
    return [];
  }
};


/**
 * @override
 */
wtf.data.Variable.Sequence.prototype.getReadSource = function(
    bufferNameMap, name) {
  // TODO(benvanik): fast-path for common types (uint8/float32/etc).
  return [
    'var __length = buffer.' + bufferNameMap.readUint32 + '()',
    'var __value = new Array(__length);',
    'for (var n = 0; n < __length; n++) {',
    this.elementType.getReadSource(bufferNameMap, '__value[n]'),
    '}',
    name + ' = __value;'
  ].join('\n');
};


/**
 * @override
 */
wtf.data.Variable.Sequence.prototype.getWriteSource = function(
    bufferNameMap, name) {
  return [
    'var __value = ' + name + ';',
    'if (__value && __value.length) {',
    '  buffer.' + bufferNameMap.writeUint32 + '(__value.length);',
    '  for (var n = 0; n < __value.length; n++) {',
    this.elementType.getWriteSource(bufferNameMap, '__value[n]'),
    '  }',
    '} else {',
    '  buffer.' + bufferNameMap.writeUint32 + '(0);',
    '}'
  ].join('\n');
};


/**
 * Creates a variable by type name.
 * @param {string} type Type name.
 * @param {string} name Variable name.
 * @return {wtf.data.Variable} Variable type, if found.
 */
wtf.data.Variable.create = function(type, name) {
  // Handle array types.
  var elementTypeName = null;
  if (type.indexOf('[]') != -1) {
    // type[] syntax.
    elementTypeName = type.substr(0, type.length - 2);
  } else if (type.indexOf('sequence<') == 0) {
    // sequence<type> syntax.
    elementTypeName = type.substr(9, type.length - 10);
  }
  if (elementTypeName) {
    var elementType = wtf.data.Variable.create(elementTypeName, name);
    if (!elementType) {
      return null;
    }
    return new wtf.data.Variable.Sequence(elementType, name);
  }

  switch (type) {
    case 'int8':
    case 'byte':
      return new wtf.data.Variable.Int8(name);
    case 'int16':
    case 'short':
      return new wtf.data.Variable.Int16(name);
    case 'int32':
    case 'long':
      return new wtf.data.Variable.Int32(name);
    case 'uint8':
    case 'octet':
      return new wtf.data.Variable.Uint8(name);
    case 'uint16':
    case 'unsigned short':
      return new wtf.data.Variable.Uint16(name);
    case 'uint32':
    case 'unsigned long':
      return new wtf.data.Variable.Uint32(name);
    case 'float32':
    case 'float':
      return new wtf.data.Variable.Float32(name);
    case 'ascii':
      return new wtf.data.Variable.AsciiString(name);
    case 'utf8':
    case 'DOMString':
      return new wtf.data.Variable.Utf8String(name);
    case 'flowId':
      return new wtf.data.Variable.FlowID(name);
  }

  return null;
};


/**
 * A regex for parsing signature arguments.
 * {@code 'unsigned long[] foo' -> [*, 'unsigned long[]', 'foo']}
 * @type {RegExp}
 * @const
 * @private
 */
wtf.data.Variable.SIGNATURE_REGEX_ =
    /[ ]*([a-zA-Z0-9 \[\]\<\>]+) ([a-zA-Z0-9_]+)/;


/**
 * Parses an argument map from the given signature string arguments block.
 * @param {string} argsString Signature args in the form of
 * {@code 'uint8 a, uint8 b@3, uint8[] c'}.
 * @return {!Array.<{ordinal: number, variable: !wtf.data.Variable}>}
 *     Arguments to write as data.
 */
wtf.data.Variable.parseSignatureArguments = function(argsString) {
  var signatureArgs = argsString.split(',');

  var argMap = [];
  var ordinal = 0;
  var regex = wtf.data.Variable.SIGNATURE_REGEX_;
  for (var n = 0; n < signatureArgs.length; n++) {
    var signatureArg = regex.exec(signatureArgs[n]);

    // 'uint8 foo' or 'uint8 foo@4'
    var argType = signatureArg[1];
    var argName = signatureArg[2];
    var argAt = argName.indexOf('@');
    if (argAt != -1) {
      // Contains a location specifier.
      ordinal = Number(argName.substr(argAt + 1));
      argName = argName.substr(0, argAt);
    }

    var variable = wtf.data.Variable.create(argType, argName);
    goog.asserts.assert(variable);
    if (variable) {
      // Add to map.
      argMap.push({
        ordinal: ordinal,
        variable: variable
      });
    }

    ordinal++;
  }

  return argMap;
};
