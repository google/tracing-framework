/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Memory write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.MemoryWriteStream');

goog.require('wtf.io');
goog.require('wtf.io.WriteStream');



/**
 * Memory write stream.
 * Clones all buffers and keeps them around forever.
 *
 * @param {!Array.<!wtf.io.ByteArray>} resultArray Array to fill with results.
 * @constructor
 * @extends {wtf.io.WriteStream}
 */
wtf.io.MemoryWriteStream = function(resultArray) {
  goog.base(this);

  /**
   * Result array.
   * @type {!Array.<!wtf.io.ByteArray>}
   * @private
   */
  this.resultArray_ = resultArray;

  /**
   * Cloned memory buffers.
   * @type {!Array.<!wtf.io.ByteArray>}
   * @private
   */
  this.buffers_ = [];

  /**
   * Total length, in bytes.
   * @type {number}
   * @private
   */
  this.totalLength_ = 0;
};
goog.inherits(wtf.io.MemoryWriteStream, wtf.io.WriteStream);


/**
 * @override
 */
wtf.io.MemoryWriteStream.prototype.disposeInternal = function() {
  this.resultArray_.push(this.getData());
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the total length of all memory written.
 * @return {number} Total length, in bytes.
 */
wtf.io.MemoryWriteStream.prototype.getLength = function() {
  return this.totalLength_;
};


/**
 * Gets all data as a single buffer.
 * @return {!wtf.io.ByteArray} A byte array containing all written data.
 */
wtf.io.MemoryWriteStream.prototype.getData = function() {
  return wtf.io.combineByteArrays(this.buffers_);
};


/**
 * @override
 */
wtf.io.MemoryWriteStream.prototype.write = function(
    buffer, returnBufferCallback, opt_selfObj) {
  var newBuffer = /** @type {!wtf.io.Buffer} */ (buffer.clone());
  this.buffers_.push(newBuffer.data);
  this.totalLength_ += newBuffer.capacity;
  return true;
};


/**
 * @override
 */
wtf.io.MemoryWriteStream.prototype.flush = function() {
};
