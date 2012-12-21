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
goog.provide('wtf.io.FloatConverter');
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
  if (!value) {
    return false;
  }
  return (wtf.io.HAS_TYPED_ARRAYS && value instanceof Uint8Array) ||
      goog.isArray(value);
};


/**
 * Creates a new byte array from a regular array.
 * @param {!Array.<number>} source Source array.
 * @return {!wtf.io.ByteArray} The new byte array.
 */
wtf.io.createByteArrayFromArray = function(source) {
  var target = wtf.io.createByteArray(source.length);
  for (var n = 0; n < source.length; n++) {
    target[n] = source[n] & 0xFF;
  }
  return target;
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
 * Converts the given string to a byte array.
 * @param {string} value String representation of a byte array.
 * @return {wtf.io.ByteArray} Byte array, if the string was valid.
 */
wtf.io.stringToNewByteArray = function(value) {
  // TODO(benvanik): optimize to create no garbage
  var result = goog.crypt.base64.decodeStringToByteArray(value);
  if (!result) {
    return null;
  }
  return wtf.io.createByteArrayFromArray(result);
};


/**
 * Interface describing classes that can convert floating point numbers to
 * bytes.
 * @typedef {{
 *   float32ToUint8Array: function(number, !wtf.io.ByteArray, number),
 *   uint8ArrayToFloat32: function(!wtf.io.ByteArray, number):number,
 *   float64ToUint8Array: function(number, !wtf.io.ByteArray, number),
 *   uint8ArrayToFloat64: function(!wtf.io.ByteArray, number):number
 * }}
 */
wtf.io.FloatConverter;


/**
 * Floating point number conversion when typed arrays are not supported.
 * Uses some Javascript arithmetic-fu to do the conversion.
 * @type {!wtf.io.FloatConverter}
 * @private
 */
wtf.io.JavaScriptFloatConverter_ = (function() {
  return {
    float32ToUint8Array: function(value, target, offset) {
      // TODO(benvanik): JS float converter
      goog.asserts.fail('JS float converter not yet implemented');
    },
    uint8ArrayToFloat32: function(source, offset) {
      // TODO(benvanik): JS float converter
      goog.asserts.fail('JS float converter not yet implemented');
      return NaN;
    },
    float64ToUint8Array: function(value, target, offset) {
      // TODO(benvanik): JS float converter
      goog.asserts.fail('JS float converter not yet implemented');
    },
    uint8ArrayToFloat64: function(source, offset) {
      // TODO(benvanik): JS float converter
      goog.asserts.fail('JS float converter not yet implemented');
      return NaN;
    }
  };
})();


/**
 * Floating point number conversion when typed arrays are supported.
 * @type {!wtf.io.FloatConverter}
 * @private
 */
wtf.io.TypedArrayFloatConverter_ = (function() {
  var float32 = new Float32Array(16);
  var float32byte = new Uint8Array(float32.buffer);
  var float64 = new Float64Array(16);
  var float64byte = new Uint8Array(float64.buffer);
  return {
    float32ToUint8Array: function(value, target, offset) {
      float32[0] = value;
      target[offset++] = float32byte[0];
      target[offset++] = float32byte[1];
      target[offset++] = float32byte[2];
      target[offset++] = float32byte[3];
    },
    uint8ArrayToFloat32: function(source, offset) {
      float32byte[0] = source[offset++];
      float32byte[1] = source[offset++];
      float32byte[2] = source[offset++];
      float32byte[3] = source[offset++];
      return float32[0];
    },
    float64ToUint8Array: function(value, target, offset) {
      float64[0] = value;
      target[offset++] = float64byte[0];
      target[offset++] = float64byte[1];
      target[offset++] = float64byte[2];
      target[offset++] = float64byte[3];
      target[offset++] = float64byte[4];
      target[offset++] = float64byte[5];
      target[offset++] = float64byte[6];
      target[offset++] = float64byte[7];
    },
    uint8ArrayToFloat64: function(source, offset) {
      float64byte[0] = source[offset++];
      float64byte[1] = source[offset++];
      float64byte[2] = source[offset++];
      float64byte[3] = source[offset++];
      float64byte[4] = source[offset++];
      float64byte[5] = source[offset++];
      float64byte[6] = source[offset++];
      float64byte[7] = source[offset++];
      return float64[0];
    }
  };
})();


/**
 * Floating point number converter.
 * @type {!wtf.io.FloatConverter}
 */
wtf.io.floatConverter =
    goog.global['Float32Array'] && goog.global['Float64Array'] ?
    wtf.io.TypedArrayFloatConverter_ :
    wtf.io.JavaScriptFloatConverter_;
