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
goog.provide('wtf.io.BlobData');
goog.provide('wtf.io.ByteArray');
goog.provide('wtf.io.DataFormat');
goog.provide('wtf.io.FloatConverter');

goog.require('goog.asserts');
goog.require('goog.crypt.base64');
goog.require('goog.string');


/**
 * File extension (including dot) used for trace files.
 * @const
 * @type {string}
 */
wtf.io.FILE_EXTENSION = '.wtf-trace';


/**
 * Gets a unique filename.
 * For example, {@code foo-2013-01-04T0832121.wtf-trace}.
 * @param {string} prefix Filename prefix.
 * @param {string} name Base file name.
 * @param {string=} opt_contentType Content type used to pick an extension.
 * @return {string} Full filename.
 */
wtf.io.getTimedFilename = function(prefix, name, opt_contentType) {
  // prefix-YYYY-MM-DDTHH-MM-SS
  var dt = new Date();
  var suffix = '-' +
      dt.getFullYear() +
      goog.string.padNumber(dt.getMonth() + 1, 2) +
      goog.string.padNumber(dt.getDate(), 2) + 'T' +
      goog.string.padNumber(dt.getHours(), 2) +
      goog.string.padNumber(dt.getMinutes(), 2) +
      goog.string.padNumber(dt.getSeconds(), 2);

  var extension = wtf.io.FILE_EXTENSION;
  switch (opt_contentType) {
    default:
    case 'application/x-extension-wtf-trace':
      extension = '.wtf-trace';
      break;
    case 'application/x-extension-wtf-json':
      extension = '.wtf-json';
      break;
  }

  return prefix + name + suffix + extension;
};


/**
 * @typedef {wtf.io.Blob|Blob|ArrayBufferView|string}
 */
wtf.io.BlobData;


/**
 * Describes the ways data can be represented.
 * @enum {number}
 */
wtf.io.DataFormat = {
  /** Handle data as a string. */
  STRING: 0,
  /** Handle data as a Blob. */
  BLOB: 1,
  /** Handle data as an ArrayBuffer. */
  ARRAY_BUFFER: 2
};


/**
 * @typedef {Uint8Array}
 */
wtf.io.ByteArray;


/**
 * Whether typed arrays are present.
 * @const
 * @type {boolean}
 */
wtf.io.HAS_TYPED_ARRAYS = !!goog.global['Uint8Array'];
goog.asserts.assert(wtf.io.HAS_TYPED_ARRAYS);


/**
 * Creates a byte array.
 * This will either be a Uint8Array (if supported) or a zeroed Javascript
 * Array.
 * @param {number} size Size, in bytes.
 * @return {!wtf.io.ByteArray} The new array.
 */
wtf.io.createByteArray = function(size) {
  return new Uint8Array(size);
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
  return (value instanceof Uint8Array);
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
  target.set(source, opt_targetOffset || 0);
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
wtf.io.sliceByteArray = function(source, offset, length) {
  // NOTE: IE10 does not have the slice method, so we need to fallback.
  if (source.buffer.slice) {
    var buffer = source.buffer.slice(offset, offset + length);
    return new Uint8Array(buffer);
  } else {
    var subarray = source.subarray(offset, offset + length);
    var target = new Uint8Array(subarray.length);
    target.set(subarray);
    return target;
  }
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
 * Floating point number converter, initialized on first use by
 * {@see wtf.io#getFloatConverter}.
 * @type {?wtf.io.FloatConverter}
 * @private
 */
wtf.io.floatConverter_ = null;


/**
 * Gets a singleton floating point number converter.
 * @return {!wtf.io.FloatConverter} Shared converter.
 */
wtf.io.getFloatConverter = function() {
  if (wtf.io.floatConverter_) {
    return wtf.io.floatConverter_;
  }
  var float32 = new Float32Array(16);
  var float32byte = new Uint8Array(float32.buffer);
  var float64 = new Float64Array(16);
  var float64byte = new Uint8Array(float64.buffer);
  wtf.io.floatConverter_ = {
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
  return wtf.io.floatConverter_;
};
