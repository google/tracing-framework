/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
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

goog.provide('wtf.io.BufferView');

goog.require('goog.asserts');
goog.require('wtf.io');
goog.require('wtf.io.StringTable');


/**
 * A fixed-size binary buffer with various views into it.
 * Buffers are very thin wrappers around typed arrays to make it easier to pass
 * them around along with the current read/write offset.
 *
 * Each instance has a single backing store with multiple typed array views into
 * it allowing for fast access in a variety of data sizes. A string table is
 * used to efficiently store strings without having to encode them into the
 * buffer.
 *
 * Unfortunately due to various jscompiler passes that may be run over this
 * (renaming, unused property removal, etc) this object is treated as a
 * dictionary with quoted names. This prevents the need for complex renaming
 * lookups when accessing from generated code or various compiler flag tweaking.
 *
 * @typedef {{
 *   capacity: number,
 *   offset: number,
 *   stringTable: !wtf.io.StringTable,
 *   arrayBuffer: !ArrayBuffer,
 *   int8Array: !Int8Array,
 *   uint8Array: !Uint8Array,
 *   int16Array: !Int16Array,
 *   uint16Array: !Uint16Array,
 *   int32Array: !Int32Array,
 *   uint32Array: !Uint32Array,
 *   float32Array: !Float32Array
 * }}
 */
wtf.io.BufferView.Type;


/**
 * Creates a new fixed size buffer view with the given capacity.
 * @param {number} capacity Total capacity, in bytes.
 * @return {!wtf.io.BufferView.Type} New empty buffer view.
 */
wtf.io.BufferView.createEmpty = function(capacity) {
  return wtf.io.BufferView.createWithBuffer(new ArrayBuffer(capacity));
};


/**
 * Creates a new fixed size buffer view with a copy of the contents of the given
 * byte buffer.
 * @param {!Uint8Array} sourceBytes Source byte buffer.
 * @return {!wtf.io.BufferView.Type} New buffer view with cloned data.
 */
wtf.io.BufferView.createCopy = function(sourceBytes) {
  var clone = new Uint8Array(sourceBytes.byteLength);
  clone.set(sourceBytes);
  return wtf.io.BufferView.createWithBuffer(clone.buffer);
};


/**
 * Creates a new fixed size buffer view with the given data/string table.
 * @param {!ArrayBuffer} arrayBuffer Array buffer data to use. The capacity of
 *     this buffer will determine the capacity of the buffer.
 * @param {wtf.io.StringTable=} opt_stringTable String table. One will be
 *     created if none is provided.
 * @return {!wtf.io.BufferView.Type} New buffer view wrapping the given byte
 *     buffer.
 */
wtf.io.BufferView.createWithBuffer = function(arrayBuffer, opt_stringTable) {
  return /** @type {!wtf.io.BufferView.Type} */ ({
    'capacity': arrayBuffer.byteLength,
    'offset': 0,
    'stringTable': opt_stringTable || new wtf.io.StringTable(),
    'arrayBuffer': arrayBuffer,
    'int8Array': new Int8Array(arrayBuffer),
    'uint8Array': new Uint8Array(arrayBuffer),
    'int16Array': new Int16Array(arrayBuffer),
    'uint16Array': new Uint16Array(arrayBuffer),
    'int32Array': new Int32Array(arrayBuffer),
    'uint32Array': new Uint32Array(arrayBuffer),
    'float32Array': new Float32Array(arrayBuffer)
  });
};


/**
 * Gets the bytes of the buffer that are currently in use.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer view.
 * @param {boolean=} opt_allowReference All the result to be a reference to
 *     the underlying data buffer. This prevents a copy if the bytes are going
 *     to be used immediately.
 * @return {!Uint8Array} Used bytes.
 */
wtf.io.BufferView.getUsedBytes = function(bufferView, opt_allowReference) {
  if (opt_allowReference) {
    if (bufferView['offset'] == bufferView['capacity']) {
      return bufferView['uint8Array'];
    } else {
      return new Uint8Array(bufferView['arrayBuffer'], 0, bufferView['offset']);
    }
  } else {
    return wtf.io.sliceByteArray(
        bufferView['uint8Array'], 0, bufferView['offset']);
  }
};


/**
 * Gets the capacity of the given buffer view, in bytes.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer view.
 * @return {number} Buffer view capacity.
 */
wtf.io.BufferView.getCapacity = function(bufferView) {
  return bufferView['capacity'];
};


/**
 * Gets the access offset of the given buffer view, in bytes.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer view.
 * @return {number} Buffer view offset.
 */
wtf.io.BufferView.getOffset = function(bufferView) {
  return bufferView['offset'];
};


/**
 * Sets the access offset of the given buffer view, in bytes.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer view.
 * @param {number} value New buffer view offset.
 */
wtf.io.BufferView.setOffset = function(bufferView, value) {
  goog.asserts.assert(value <= bufferView['capacity']);
  bufferView['offset'] = value;
};


/**
 * Gets the string table of the given buffer view.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer view.
 * @return {!wtf.io.StringTable} String table.
 */
wtf.io.BufferView.getStringTable = function(bufferView) {
  return bufferView['stringTable'];
};


/**
 * Sets the string table of the given buffer view.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer view.
 * @param {!wtf.io.StringTable} value New string table.
 */
wtf.io.BufferView.setStringTable = function(bufferView, value) {
  bufferView['stringTable'] = value;
};


/**
 * Resets the buffer offset to the start and clears its string table.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer view.
 */
wtf.io.BufferView.reset = function(bufferView) {
  bufferView['offset'] = 0;
  bufferView['stringTable'].reset();
};
