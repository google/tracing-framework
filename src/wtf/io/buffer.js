/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Basic buffer abstraction providing read/write utilities
 * against binary buffers.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.Buffer');
goog.provide('wtf.io.ReturnBufferCallback');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.reflect');
goog.require('wtf.io');
goog.require('wtf.io.floatConverter');


/**
 * A function callback that receives a buffer that is no longer required.
 * @typedef {function(!wtf.io.Buffer)}
 */
wtf.io.ReturnBufferCallback;



/**
 * A fixed-size binary buffer.
 * Buffers are very thin wrappers around byte arrays to make it easier to pass
 * them around along with the current read/write offset.
 *
 * @param {number} capacity Total capacity, in bytes.
 * @param {wtf.io.ByteArray=} opt_data Override data. This will be used instead
 *     of a new array. It will not be cloned!
 * @constructor
 */
wtf.io.Buffer = function(capacity, opt_data) {
  /**
   * Capacity, in bytes.
   * @type {number}
   */
  this.capacity = capacity;

  /**
   * Current offset, in bytes.
   * @type {number}
   */
  this.offset = 0;

  /**
   * Binary data buffer.
   * Note that this may not be a typed array (if the browser does not support
   * them), so always ensure the values written are bytes.
   * @type {!wtf.io.ByteArray}
   */
  this.data = opt_data || wtf.io.createByteArray(capacity);
};


/**
 * Whether to enable buffer assertions.
 * @const
 * @type {boolean}
 */
wtf.io.Buffer.ENABLE_ASSERTS = false;


/**
 * Clones the buffer.
 * Only the valid bytes in the buffer are cloned.
 * @param {number=} opt_length Total length to clone. If omitted the current
 *     offset is used.
 * @return {!wtf.io.Buffer} Cloned buffer.
 */
wtf.io.Buffer.prototype.clone = function(opt_length) {
  var length = goog.isDef(opt_length) ? opt_length : this.offset;
  length = Math.min(length, this.offset);
  var newBuffer = new wtf.io.Buffer(length);
  var srcData = this.data;
  var dstData = newBuffer.data;
  for (var n = 0; n < length; n++) {
    dstData[n] = srcData[n];
  }
  return newBuffer;
};


/**
 * Truncates the buffer to the current offset.
 * This should only ever be used if the buffer is being made immutable and kept
 * for a long time. Prefer passing buffers with valid subregions instead to
 * avoid copies.
 */
wtf.io.Buffer.prototype.truncate = function() {
  this.data = wtf.io.sliceByteArray(this.data, 0, this.offset);
  this.capacity = this.offset;
};


/**
 * Ensures that at least the given number of bytes are available for reading
 * from the buffer.
 * @param {number} size Number of bytes to ensure available.
 * @this {wtf.io.Buffer}
 * @private
 */
wtf.io.Buffer.prototype.ensureAvailable_ = wtf.io.Buffer.ENABLE_ASSERTS ?
    function(size) {
      goog.asserts.assert(this.offset + size <= this.data.length);
    } : goog.nullFunction;


/**
 * Ensures that at least the given number of bytes are available in the buffer
 * for writing.
 * @param {number} size Number of bytes to ensure available.
 * @this {wtf.io.Buffer}
 * @private
 */
wtf.io.Buffer.prototype.ensureCapacity_ = wtf.io.Buffer.ENABLE_ASSERTS ?
    function(size) {
      goog.asserts.assert(this.offset + size <= this.capacity);
    } : goog.nullFunction;


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readInt8 = function() {
  this.ensureAvailable_(1);
  var b0 = this.data[this.offset++];
  return b0 > 128 - 1 ? b0 - 256 : b0;
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeInt8 = function(value) {
  this.ensureCapacity_(1);
  this.data[this.offset++] = value & 0xFF;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readInt16 = function() {
  this.ensureAvailable_(2);
  var data = this.data;
  var offset = this.offset;
  var b0 = data[offset++];
  var b1 = data[offset++];
  this.offset = offset;
  var u = (b0 << 8) | b1;
  return u > 32768 - 1 ? u - 65536 : u;
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeInt16 = function(value) {
  this.ensureCapacity_(2);
  var data = this.data;
  var offset = this.offset;
  data[offset++] = (value >> 8) & 0xFF;
  data[offset++] = value & 0xFF;
  this.offset = offset;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readInt32 = function() {
  this.ensureAvailable_(4);
  var data = this.data;
  var offset = this.offset;
  var b0 = data[offset++];
  var b1 = data[offset++];
  var b2 = data[offset++];
  var b3 = data[offset++];
  this.offset = offset;
  var u = ((b0 << 24) >>> 0) | (b1 << 16) | (b2 << 8) | b3;
  return u > 2147483648 - 1 ? u - 4294967296 : u;
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeInt32 = function(value) {
  this.ensureCapacity_(4);
  var data = this.data;
  var offset = this.offset;
  data[offset++] = (value >> 24) & 0xFF;
  data[offset++] = (value >> 16) & 0xFF;
  data[offset++] = (value >> 8) & 0xFF;
  data[offset++] = value & 0xFF;
  this.offset = offset;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readUint8 = function() {
  this.ensureAvailable_(1);
  return this.data[this.offset++];
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeUint8 = function(value) {
  this.ensureCapacity_(1);
  this.data[this.offset++] = value & 0xFF;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readUint16 = function() {
  this.ensureAvailable_(2);
  var data = this.data;
  var offset = this.offset;
  window.console.assert(offset + 2 <= data.byteLength);
  var b0 = data[offset++];
  var b1 = data[offset++];
  this.offset = offset;
  return (b0 << 8) | b1;
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeUint16 = function(value) {
  this.ensureCapacity_(2);
  var data = this.data;
  var offset = this.offset;
  data[offset++] = (value >> 8) & 0xFF;
  data[offset++] = value & 0xFF;
  this.offset = offset;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readUint32 = function() {
  this.ensureAvailable_(4);
  var data = this.data;
  var offset = this.offset;
  var b0 = data[offset++];
  var b1 = data[offset++];
  var b2 = data[offset++];
  var b3 = data[offset++];
  this.offset = offset;
  return (((b0 << 24) >>> 0) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeUint32 = function(value) {
  this.ensureCapacity_(4);
  var data = this.data;
  var offset = this.offset;
  data[offset++] = (value >> 24) & 0xFF;
  data[offset++] = (value >> 16) & 0xFF;
  data[offset++] = (value >> 8) & 0xFF;
  data[offset++] = value & 0xFF;
  this.offset = offset;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readVarUint = function() {
  this.ensureAvailable_(1);
  var result = 0;
  var shift = 0;
  var nextByte;
  var data = this.data;
  var offset = this.offset;
  while ((nextByte = data[offset++] & 0xFF) & 0x80) {
    result |= (nextByte & 0x7F) << shift;
    shift += 7;
  }
  this.offset = offset;
  return result | (nextByte << shift);
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeVarUint = function(value) {
  this.ensureCapacity_(5);
  value &= 0xFFFFFFFF;
  var data = this.data;
  var offset = this.offset;
  while (value & 0xFFFFFF80) {
    data[offset++] = (value & 0x7F) | 0x80;
    value >>>= 7;
  }
  data[offset++] = value & 0x7F;
  this.offset = offset;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readVarInt = function() {
  // Signed integer zigzag coding:
  // https://developers.google.com/protocol-buffers/docs/encoding#types
  var value = this.readVarUint();
  return ((((value << 31) >> 31) ^ value) >> 1) ^ (value & (1 << 31));
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeVarInt = function(value) {
  // Signed integer zigzag coding:
  // https://developers.google.com/protocol-buffers/docs/encoding#types
  this.writeVarUint((value << 1) ^ (value >> 31));
};


/**
 * Reads a value from the buffer.
 * @param {wtf.io.ByteArray=} opt_target Target value, used if the
 *      size matches.
 * @return {!wtf.io.ByteArray} Value read.
 */
wtf.io.Buffer.prototype.readUint8Array = function(opt_target) {
  this.ensureAvailable_(4);
  var length = this.readVarUint();
  this.ensureAvailable_(length);
  var result;
  if (opt_target && opt_target.length == length) {
    result = opt_target;
  } else {
    result = wtf.io.createByteArray(length);
  }
  for (var n = 0; n < length; n++) {
    result[n] = this.data[this.offset++];
  }
  return result;
};


/**
 * Writes a value to the buffer.
 * @param {!wtf.io.ByteArray} value Value to write.
 */
wtf.io.Buffer.prototype.writeUint8Array = function(value) {
  this.writeVarUint(value.length);
  this.ensureCapacity_(value.length);
  for (var n = 0; n < value.length; n++) {
    this.data[this.offset++] = value[n];
  }
};


/**
 * Reads a value from the buffer.
 * @param {!wtf.io.ByteArray} target Target value. Must be properly
 *     sized.
 * @return {!wtf.io.ByteArray} The input array.
 */
wtf.io.Buffer.prototype.readFixedUint8Array = function(target) {
  this.ensureAvailable_(target.length);
  for (var n = 0; n < target.length; n++) {
    target[n] = this.data[this.offset++];
  }
  return target;
};


/**
 * Writes a value to the buffer.
 * @param {!wtf.io.ByteArray} value Value to write.
 */
wtf.io.Buffer.prototype.writeFixedUint8Array = function(value) {
  this.ensureCapacity_(value.length);
  for (var n = 0; n < value.length; n++) {
    this.data[this.offset++] = value[n];
  }
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readFloat32 = function() {
  this.ensureAvailable_(4);
  var value = wtf.io.floatConverter.uint8ArrayToFloat32(this.data, this.offset);
  this.offset += 4;
  return value;
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeFloat32 = function(value) {
  this.ensureCapacity_(4);
  wtf.io.floatConverter.float32ToUint8Array(value, this.data, this.offset);
  this.offset += 4;
};


/**
 * Reads a value from the buffer.
 * @return {number} Value read.
 */
wtf.io.Buffer.prototype.readFloat64 = function() {
  this.ensureAvailable_(8);
  var value = wtf.io.floatConverter.uint8ArrayToFloat64(this.data, this.offset);
  this.offset += 8;
  return value;
};


/**
 * Writes a value to the buffer.
 * @param {number} value Value to write.
 */
wtf.io.Buffer.prototype.writeFloat64 = function(value) {
  this.ensureCapacity_(8);
  wtf.io.floatConverter.float64ToUint8Array(value, this.data, this.offset);
  this.offset += 8;
};


/**
 * Reads a value from the buffer.
 * @return {?string} Value read.
 */
wtf.io.Buffer.prototype.readAsciiString = function() {
  // Wire format:
  // uint16 : character/byte count
  // (byte count bytes)
  this.ensureAvailable_(2);
  var b0 = this.data[this.offset++];
  var b1 = this.data[this.offset++];
  var charCount = (b0 << 8) | b1;
  if (!charCount) {
    // Fast-path for optional strings.
    return null;
  }

  // TODO(benvanik): evaluate not using a temp array
  var data = this.data;
  var offset = this.offset;
  var out = new Array(charCount);
  for (var n = 0; n < charCount; n++) {
    out[n] = String.fromCharCode(data[offset++]);
  }
  this.offset = offset;

  return out.join('');
};


/**
 * Writes a value to the buffer.
 * @param {string|null|undefined} value Value to write.
 */
wtf.io.Buffer.prototype.writeAsciiString = function(value) {
  // Fast-path for optional strings.
  // Note: wtf.data.Variable makes assumptions about this format.
  if (!value || !value.length) {
    this.ensureCapacity_(2);
    this.data[this.offset++] = 0;
    this.data[this.offset++] = 0;
    return;
  }

  // Wire format:
  // uint16 : character/byte count
  // (byte count bytes)
  this.ensureCapacity_(2 + value.length);

  // Character count.
  var data = this.data;
  var offset = this.offset;
  data[offset++] = (value.length >> 8) & 0xFF;
  data[offset++] = value.length & 0xFF;

  // Write all bytes.
  for (var n = 0; n < value.length; n++) {
    data[offset++] = value.charCodeAt(n) & 0xFF;
  }
  this.offset = offset;
};


/**
 * Maximum length of utf8 strings, in bytes.
 * @const
 * @type {number}
 * @private
 */
wtf.io.Buffer.MAX_UTF8_STRING_BYTE_LENGTH_ = 0xFFFF;


/**
 * Maximum length of utf8 strings, in characters.
 * @const
 * @type {number}
 * @private
 */
wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_ =
    wtf.io.Buffer.MAX_UTF8_STRING_BYTE_LENGTH_ / 3;


/**
 * Reads a value from the buffer.
 * @return {?string} Value read.
 */
wtf.io.Buffer.prototype.readUtf8String = function() {
  // Essentially goog.crypt.utf8ByteArrayToString but without as much garbage.

  // Wire format:
  // uint16 : character count
  // uint16 : byte count
  // (byte count bytes)
  this.ensureAvailable_(2);
  var b0 = this.data[this.offset++];
  var b1 = this.data[this.offset++];
  var charCount = (b0 << 8) | b1;
  if (!charCount) {
    // Fast-path for optional strings.
    return null;
  }

  // Byte count.
  var data = this.data;
  var offset = this.offset;
  this.ensureAvailable_(2);
  b0 = data[offset++];
  b1 = data[offset++];
  var byteCount = (b0 << 8) | b1;
  this.ensureAvailable_(byteCount);

  // TODO(benvanik): evaluate not using a temp array
  var out = new Array(charCount);
  var c = 0;
  while (c < charCount) {
    var c1 = data[offset++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      var c2 = data[offset++];
      out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
    } else {
      var c2 = data[offset++];
      var c3 = data[offset++];
      out[c++] = String.fromCharCode(
          (c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
    }
  }
  this.offset = offset;

  return out.join('');
};


/**
 * Writes a value to the buffer.
 * @param {string|null|undefined} value Value to write.
 */
wtf.io.Buffer.prototype.writeUtf8String = function(value) {
  // This implementation comes from goog.crypt.stringToUtf8ByteArray, but is
  // designed to not create garbage.

  // Fast-path for optional strings.
  // Note: wtf.data.Variable makes assumptions about this format.
  if (!value || !value.length) {
    this.ensureCapacity_(2);
    this.data[this.offset++] = 0;
    this.data[this.offset++] = 0;
    return;
  }

  // Limit length - this keeps our format fixed.
  goog.asserts.assert(value.length <= wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_);
  if (value.length > wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_) {
    value = value.substr(0, wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_);
  }

  // Wire format:
  // uint16 : character count
  // uint16 : byte count
  // (at most 3x character count bytes)
  this.ensureCapacity_(2 + 2 + value.length * 3);

  // Character count.
  var data = this.data;
  var offset = this.offset;
  data[offset++] = (value.length >> 8) & 0xFF;
  data[offset++] = value.length & 0xFF;

  // Hold a space for the byte count.
  var byteCountOffset = offset;
  offset += 2;

  // Write all bytes.
  var byteCount = 0;
  for (var n = 0; n < value.length; n++) {
    var c = value.charCodeAt(n);
    if (c < 128) {
      data[offset++] = c;
      byteCount++;
    } else if (c < 2048) {
      data[offset++] = (c >> 6) | 192;
      data[offset++] = (c & 63) | 128;
      byteCount += 2;
    } else {
      data[offset++] = (c >> 12) | 224;
      data[offset++] = ((c >> 6) & 63) | 128;
      data[offset++] = (c & 63) | 128;
      byteCount += 3;
    }
  }

  // Seek back to the header and write the byte count.
  data[byteCountOffset] = (byteCount >> 8) & 0xFF;
  data[byteCountOffset + 1] = byteCount & 0xFF;

  this.offset = offset;
};


/**
 * Gets an object mapping buffer member names to compiled names.
 * For example:
 * <code>
 * var nameMap = wtf.io.Buffer.getNameMap();
 * buffer[nameMap.writeUint16](5);
 * </code>
 * @return {!Object.<string>} Map from usable literals to compiled names.
 */
wtf.io.Buffer.getNameMap = function() {
  var reflectedNames = goog.reflect.object(wtf.io.Buffer, {
    offset: 0,
    data: 1,
    readInt8: 2,
    writeInt8: 3,
    readInt16: 4,
    writeInt16: 5,
    readInt32: 6,
    writeInt32: 7,
    readUint8: 8,
    writeUint8: 9,
    readUint16: 10,
    writeUint16: 11,
    readUint32: 12,
    writeUint32: 13,
    readVarUint: 14,
    writeVarUint: 15,
    readVarInt: 16,
    writeVarInt: 17,
    readUint8Array: 18,
    writeUint8Array: 19,
    readFixedUint8Array: 20,
    writeFixedUint8Array: 21,
    readFloat32: 22,
    writeFloat32: 23,
    readFloat64: 24,
    writeFloat64: 25,
    readAsciiString: 26,
    writeAsciiString: 27,
    readUtf8String: 28,
    writeUtf8String: 29
  });
  reflectedNames = goog.object.transpose(reflectedNames);
  return {
    offset: reflectedNames[0],
    data: reflectedNames[1],
    readInt8: reflectedNames[2],
    writeInt8: reflectedNames[3],
    readInt16: reflectedNames[4],
    writeInt16: reflectedNames[5],
    readInt32: reflectedNames[6],
    writeInt32: reflectedNames[7],
    readUint8: reflectedNames[8],
    writeUint8: reflectedNames[9],
    readUint16: reflectedNames[10],
    writeUint16: reflectedNames[11],
    readUint32: reflectedNames[12],
    writeUint32: reflectedNames[13],
    readVarUint: reflectedNames[14],
    writeVarUint: reflectedNames[15],
    readVarInt: reflectedNames[16],
    writeVarInt: reflectedNames[17],
    readUint8Array: reflectedNames[18],
    writeUint8Array: reflectedNames[19],
    readFixedUint8Array: reflectedNames[20],
    writeFixedUint8Array: reflectedNames[21],
    readFloat32: reflectedNames[22],
    writeFloat32: reflectedNames[23],
    readFloat64: reflectedNames[24],
    writeFloat64: reflectedNames[25],
    readAsciiString: reflectedNames[26],
    writeAsciiString: reflectedNames[27],
    readUtf8String: reflectedNames[28],
    writeUtf8String: reflectedNames[29]
  };
};
