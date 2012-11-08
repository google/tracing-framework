/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview IO utility functions.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io');
goog.provide('wtf.io.ByteArray');
goog.provide('wtf.io.IFloatConverter');
goog.provide('wtf.io.floatConverter');

goog.require('goog.asserts');
goog.require('goog.crypt.base64');


/**
 * File extension (including dot) used for trace files.
 * @const
 * @type {string}
 */
wtf.io.FILE_EXTENSION = '.wtf-trace';


/**
 * @typedef {Array.<number>|Uint8Array}
 */
wtf.io.ByteArray;


/**
 * Whether typed arrays are present.
 * @const
 * @type {boolean}
 */
wtf.io.HAS_TYPED_ARRAYS = !!goog.global['Uint8Array'];


/**
 * Creates a byte array.
 * This will either be a Uint8Array (if supported) or a zeroed Javascript
 * Array.
 * @param {number} size Size, in bytes.
 * @return {!wtf.io.ByteArray} The new array.
 */
wtf.io.createByteArray = wtf.io.HAS_TYPED_ARRAYS ? function(size) {
  return new Uint8Array(size);
} : function(size) {
  var value = new Array(size);
  for (var n = 0; n < value.length; n++) {
    value[n] = 0;
  }
  return value;
};


/**
 * Checks to see if the given value is a valid byte array type.
 * @param {*} value Value to test.
 * @return {boolean} True if the input is a byte array.
 */
wtf.io.isByteArray = function(value) {
  return (wtf.io.HAS_TYPED_ARRAYS && value instanceof Uint8Array) ||
      goog.isArray(value);
};


/**
 * Checks to see if the two byte arrays are equal.
 * @param {!wtf.io.ByteArray} a First array.
 * @param {!wtf.io.ByteArray} b Second array.
 * @return {boolean} True if the arrays are equal.
 */
wtf.io.byteArraysEqual = function(a, b) {
  if (a.length != b.length) {
    return false;
  }
  for (var n = 0; n < a.length; n++) {
    if (a[n] != b[n]) {
      return false;
    }
  }
  return true;
};


/**
 * Copies a byte array from one to another.
 * @param {!wtf.io.ByteArray} source Source array.
 * @param {!wtf.io.ByteArray} target Target array.
 * @param {number=} opt_targetOffset Offset into the target to write the source.
 */
wtf.io.copyByteArray = function(source, target, opt_targetOffset) {
  var targetOffset = opt_targetOffset || 0;
  if (wtf.io.HAS_TYPED_ARRAYS) {
    target.set(source, targetOffset);
  } else {
    for (var n = 0; n < source.length; n++) {
      target[targetOffset + n] = source[n];
    }
  }
};


/**
 * Combines multiple byte arrays into one.
 * @param {!Array.<!wtf.io.ByteArray>} sources Source byte arrays.
 * @return {!wtf.io.ByteArray} A byte array containing all of the source data.
 */
wtf.io.combineByteArrays = function(sources) {
  var totalSize = 0;
  for (var n = 0; n < sources.length; n++) {
    totalSize += sources[n].length;
  }
  var target = wtf.io.createByteArray(totalSize);
  for (var n = 0, offset = 0; n < sources.length; n++) {
    wtf.io.copyByteArray(sources[n], target, offset);
    offset += sources[n].length;
  }
  return target;
};


/**
 * Slices a byte array to the given length, creating a clone.
 * No bounds checking is performed. Results are undefined if values are out of
 * range.
 * @param {!wtf.io.ByteArray} source Source array.
 * @param {number} offset Offset into the array.
 * @param {number} length Length from the offset to slice.
 * @return {!wtf.io.ByteArray} Sliced array.
 */
wtf.io.sliceByteArray = wtf.io.HAS_TYPED_ARRAYS ?
    function(source, offset, length) {
      var target = new Uint8Array(length);
      for (var n = 0; n < length; n++) {
        target[n] = source[offset + n];
      }
      return target;
    } : function(source, offset, length) {
      return source.slice(offset, length);
    };


/**
 * Converts the given byte array to a string.
 * @param {!wtf.io.ByteArray} value Byte array.
 * @return {string} A string containing the value.
 */
wtf.io.byteArrayToString = function(value) {
  return goog.crypt.base64.encodeByteArray(value);
};


/**
 * Converts the given string to a byte array.
 * @param {string} value String representation of a byte array.
 * @param {!wtf.io.ByteArray} target Target byte array.
 * @return {number} Number of bytes written or -1 if an error occurred.
 */
wtf.io.stringToByteArray = function(value, target) {
  // TODO(benvanik): optimize to create no garbage
  var result = goog.crypt.base64.decodeStringToByteArray(value);
  if (!result) {
    return 0;
  }
  if (result.length > target.length) {
    return -1;
  }
  for (var n = 0; n < result.length; n++) {
    target[n] = result[n];
  }
  return result.length;
};



/**
 * Interface describing classes that can convert floating point numbers to
 * bytes.
 * @interface
 */
wtf.io.IFloatConverter = function() {};


/**
 * Converts a 32-bit floating point value to 4 bytes.
 * @param {number} value Floating point value.
 * @param {!wtf.io.ByteArray} target Target byte array.
 * @param {number} offset Offset in the byte array to write to.
 */
wtf.io.IFloatConverter.prototype.float32ToUint8Array =
    goog.abstractMethod;


/**
 * Converts 4 bytes to a 32-bit floating point value.
 * @param {!wtf.io.ByteArray} source Source byte array.
 * @param {number} offset Offset in the byte array to read from.
 * @return {number} Floating point value.
 */
wtf.io.IFloatConverter.prototype.uint8ArrayToFloat32 =
    goog.abstractMethod;


/**
 * Converts a 64-bit floating point value to 8 bytes.
 * @param {number} value Floating point value.
 * @param {!wtf.io.ByteArray} target Target byte array.
 * @param {number} offset Offset in the byte array to write to.
 */
wtf.io.IFloatConverter.prototype.float64ToUint8Array =
    goog.abstractMethod;


/**
 * Converts 8 bytes to a 64-bit floating point value.
 * @param {!wtf.io.ByteArray} source Source byte array.
 * @param {number} offset Offset in the byte array to read from.
 * @return {number} Floating point value.
 */
wtf.io.IFloatConverter.prototype.uint8ArrayToFloat64 =
    goog.abstractMethod;



/**
 * Floating point number conversion when typed arrays are not supported.
 * Uses some Javascript arithmetic-fu to do the conversion.
 * @constructor
 * @implements {wtf.io.IFloatConverter}
 * @private
 */
wtf.io.JavaScriptFloatConverter_ = function() {
};


/**
 * @override
 */
wtf.io.JavaScriptFloatConverter_.prototype.float32ToUint8Array =
    function(value, target, offset) {
  // TODO(benvanik): JS float converter
  goog.asserts.fail('JS float converter not yet implemented');
};


/**
 * @override
 */
wtf.io.JavaScriptFloatConverter_.prototype.uint8ArrayToFloat32 =
    function(source, offset) {
  // TODO(benvanik): JS float converter
  goog.asserts.fail('JS float converter not yet implemented');
  return NaN;
};


/**
 * @override
 */
wtf.io.JavaScriptFloatConverter_.prototype.float64ToUint8Array =
    function(value, target, offset) {
  // TODO(benvanik): JS float converter
  goog.asserts.fail('JS float converter not yet implemented');
};


/**
 * @override
 */
wtf.io.JavaScriptFloatConverter_.prototype.uint8ArrayToFloat64 =
    function(source, offset) {
  // TODO(benvanik): JS float converter
  goog.asserts.fail('JS float converter not yet implemented');
  return NaN;
};



/**
 * Floating point number conversion when typed arrays are supported.
 * @constructor
 * @implements {wtf.io.IFloatConverter}
 * @private
 */
wtf.io.TypedArrayFloatConverter_ = function() {
  /**
   * @type {!Float32Array}
   * @private
   */
  this.float32_ = new Float32Array(16);

  /**
   * @type {!Uint8Array}
   * @private
   */
  this.float32byte_ = new Uint8Array(this.float32_.buffer);

  /**
   * @type {!Float64Array}
   * @private
   */
  this.float64_ = new Float64Array(16);

  /**
   * @type {!Uint8Array}
   * @private
   */
  this.float64byte_ = new Uint8Array(this.float64_.buffer);
};


/**
 * @override
 */
wtf.io.TypedArrayFloatConverter_.prototype.float32ToUint8Array =
    function(value, target, offset) {
  this.float32_[0] = value;
  var float32byte = this.float32byte_;
  target[offset++] = float32byte[0];
  target[offset++] = float32byte[1];
  target[offset++] = float32byte[2];
  target[offset++] = float32byte[3];
};


/**
 * @override
 */
wtf.io.TypedArrayFloatConverter_.prototype.uint8ArrayToFloat32 =
    function(source, offset) {
  var float32byte = this.float32byte_;
  float32byte[0] = source[offset++];
  float32byte[1] = source[offset++];
  float32byte[2] = source[offset++];
  float32byte[3] = source[offset++];
  return this.float32_[0];
};


/**
 * @override
 */
wtf.io.TypedArrayFloatConverter_.prototype.float64ToUint8Array =
    function(value, target, offset) {
  this.float64_[0] = value;
  var float64byte = this.float64byte_;
  target[offset++] = float64byte[0];
  target[offset++] = float64byte[1];
  target[offset++] = float64byte[2];
  target[offset++] = float64byte[3];
  target[offset++] = float64byte[4];
  target[offset++] = float64byte[5];
  target[offset++] = float64byte[6];
  target[offset++] = float64byte[7];
};


/**
 * @override
 */
wtf.io.TypedArrayFloatConverter_.prototype.uint8ArrayToFloat64 =
    function(source, offset) {
  var float64byte = this.float64byte_;
  float64byte[0] = source[offset++];
  float64byte[1] = source[offset++];
  float64byte[2] = source[offset++];
  float64byte[3] = source[offset++];
  float64byte[4] = source[offset++];
  float64byte[5] = source[offset++];
  float64byte[6] = source[offset++];
  float64byte[7] = source[offset++];
  return this.float64_[0];
};


/**
 * Floating point number converter.
 * @type {!wtf.io.IFloatConverter}
 */
wtf.io.floatConverter =
    goog.global['Float32Array'] && goog.global['Float64Array'] ?
    new wtf.io.TypedArrayFloatConverter_() :
    new wtf.io.JavaScriptFloatConverter_();
