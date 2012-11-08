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
 * @return {string} Source statement.
 */
wtf.data.Variable.prototype.getReadSource = goog.abstractMethod;


/**
 * Gets a source code statement for writing the variable.
 * @param {!Object.<string>} bufferNameMap {@see wtf.io.Buffer} name map.
 * @return {string} Source statement.
 */
wtf.data.Variable.prototype.getWriteSource = goog.abstractMethod;



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
wtf.data.Variable.Uint16.prototype.getReadSource = function(bufferNameMap) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.readUint16 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Uint16.prototype.getWriteSource = function(bufferNameMap) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeUint16 + '(' + this.name + '_)';
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
wtf.data.Variable.Uint32.prototype.getReadSource = function(bufferNameMap) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.readUint32 + '()';
};


/**
 * @override
 */
wtf.data.Variable.Uint32.prototype.getWriteSource = function(bufferNameMap) {
  // TODO(benvanik): inline
  return 'buffer.' + bufferNameMap.writeUint32 + '(' + this.name + '_ >>> 0)';
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
    function() {
  // Note: this requires knowledge of the wire format of strings, however the
  // performance gain by avoiding the call is worth it.
  return this.name + '_ ? (2 + ' + this.name + '_.length) : 2';
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
    bufferNameMap) {
  return 'buffer.' + bufferNameMap.readAsciiString + '()';
};


/**
 * @override
 */
wtf.data.Variable.AsciiString.prototype.getWriteSource = function(
    bufferNameMap) {
  var writeUint16Fn = bufferNameMap.writeUint16;
  var writeStringFn = bufferNameMap.writeAsciiString;
  return this.name + '_ ? buffer.' + writeStringFn + '(' + this.name + '_) : ' +
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
    function() {
  // Note: this requires knowledge of the wire format of strings, however the
  // performance gain by avoiding the call is worth it.
  return this.name + '_ ? (2 + 2 + ' + this.name + '_.length * 3) : 2';
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
wtf.data.Variable.Utf8String.prototype.getReadSource = function(bufferNameMap) {
  return 'buffer.' + bufferNameMap.readUtf8String + '()';
};


/**
 * @override
 */
wtf.data.Variable.Utf8String.prototype.getWriteSource = function(
    bufferNameMap) {
  var writeUint16Fn = bufferNameMap.writeUint16;
  var writeStringFn = bufferNameMap.writeUtf8String;
  return this.name + '_ ? buffer.' + writeStringFn + '(' + this.name + '_) : ' +
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
wtf.data.Variable.FlowID.prototype.getReadSource = function(bufferNameMap) {
  return 'buffer.' + bufferNameMap.readUint32 + '()';
};


/**
 * @override
 */
wtf.data.Variable.FlowID.prototype.getWriteSource = function(bufferNameMap) {
  return 'buffer.' + bufferNameMap.writeUint32 + '(' + this.name + '_)';
};


/**
 * Creates a variable by type name.
 * @param {string} type Type name.
 * @param {string} name Variable name.
 * @return {wtf.data.Variable} Variable type, if found.
 */
wtf.data.Variable.create = function(type, name) {
  switch (type) {
    case 'uint16':
      return new wtf.data.Variable.Uint16(name);
    case 'uint32':
      return new wtf.data.Variable.Uint32(name);
    case 'ascii':
      return new wtf.data.Variable.AsciiString(name);
    case 'utf8':
      return new wtf.data.Variable.Utf8String(name);
    case 'flowId':
      return new wtf.data.Variable.FlowID(name);
  }
  return null;
};


/**
 * Parses an argument map from the given signature string arguments block.
 * @param {string} argsString Signature args in the form of
 * {@code 'uint8 a, uint8 b@3'}.
 * @return {!Array.<{ordinal: number, variable: !wtf.data.Variable}>}
 *     Arguments to write as data.
 */
wtf.data.Variable.parseSignatureArguments = function(argsString) {
  var signatureArgs = argsString.split(',');

  var argMap = [];
  var ordinal = 0;
  for (var n = 0; n < signatureArgs.length; n++) {
    var signatureArg = signatureArgs[n].trim().split(' ');

    // 'uint8 foo' or 'uint8 foo@4'
    var argType = signatureArg[0];
    var argName = signatureArg[1];
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
