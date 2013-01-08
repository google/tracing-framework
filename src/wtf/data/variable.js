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
goog.require('goog.string');


/**
 * Bitmask values for variable flags.
 * @enum {number}
 */
wtf.data.VariableFlag = {
};



/**
 * Variable.
 *
 * @param {string} name Variable type name used in signatures.
 * @param {string} typeName A machine-friendly name used to uniquely identify
 *     the variable. It should be a valid Javascript literal (no spaces/etc).
 * @param {number=} opt_flags Bitmask of {@see wtf.data.VariableFlag} values.
 * @constructor
 */
wtf.data.Variable = function(name, typeName, opt_flags) {
  /**
   * Variable type name used in signatures.
   * Ex: 'uint8'.
   * @type {string}
   */
  this.name = name;

  /**
   * Machine-friendly name used to uniquely identify the variable. It should be
   * a valid Javascript literal (no spaces/etc).
   * @type {string}
   */
  this.typeName = typeName;

  /**
   * Bitmask of {@see wtf.data.VariableFlag} values describing the behavior of
   * the variable.
   * @type {number}
   */
  this.flags = opt_flags || 0;
};


/**
 * A simple mapping of various type names to the standardized types.
 * @const
 * @type {!Object.<string>}
 * @private
 */
wtf.data.Variable.TYPE_MAP_ = {
  'bool': 'bool',
  'int8': 'int8',
  'byte': 'int8',
  'uint8': 'uint8',
  'octet': 'uint8',
  'int16': 'int16',
  'short': 'int16',
  'uint16': 'uint16',
  'unsigned short': 'uint16',
  'int32': 'int32',
  'long': 'int32',
  'uint32': 'uint32',
  'unsigned long': 'uint32',
  'float32': 'float32',
  'float': 'float32',
  'ascii': 'ascii',
  'utf8': 'utf8',
  'DOMString': 'utf8',
  'any': 'any',
  'flowId': 'flowId',
  'time32': 'time32'
};


/**
 * Creates a variable by type name.
 * @param {string} name Variable name.
 * @param {string} type Type name.
 * @return {wtf.data.Variable} Variable type, if found.
 */
wtf.data.Variable.create = function(name, type) {
  var isArray = false;
  if (goog.string.endsWith(type, '[]')) {
    // type[] syntax.
    isArray = true;
    type = type.replace('[]', '');
  }
  if (goog.string.startsWith(type, 'sequence<')) {
    // sequence<type> syntax.
    isArray = true;
    type = type.substr(9, type.length - 10);
  }

  type = wtf.data.Variable.TYPE_MAP_[type];
  if (!type) {
    return null;
  }
  if (isArray) {
    type += '[]';
  }

  return new wtf.data.Variable(name, type, 0);
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

    var variable = wtf.data.Variable.create(argName, argType);
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


/**
 * Parses a signature string and returns the parts.
 * The signature can be of any one of the given forms:
 * {@code namespace.someMethod}, {@code someMethod(uint8 a)},
 * {@code someMethod(uint8 a@4)}, etc.
 * @param {string} signature Signature string.
 * @return {{
 *   name: string,
 *   args: !Array.<!wtf.data.Variable>,
 *   argMap: !Array.<{ordinal: number, variable: !wtf.data.Variable}>
 * }}
 */
wtf.data.Variable.parseSignature = function(signature) {
  // Split signature.
  // 'a.b.c(<params>)'
  // ["a.b.c(t1 x, t1 y, t3 z@3)", "a.b.c", "(<params>)", "<params>"]
  var signatureParts = /^([a-zA-Z0-9_\.#:]+)(\((.*)\)$)?/.exec(signature);
  var signatureName = signatureParts[1]; // entire name before ()
  var signatureArgs = signatureParts[3]; // contents of () (excluding ())

  // Build argument mapping.
  var argMap = [];
  var argList = [];
  if (signatureArgs) {
    argMap = wtf.data.Variable.parseSignatureArguments(signatureArgs);
    for (var n = 0; n < argMap.length; n++) {
      argList.push(argMap[n].variable);
    }
  }

  return {
    name: signatureName,
    args: argList,
    argMap: argMap
  };
};
