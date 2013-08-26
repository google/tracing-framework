/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Memory write transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.MemoryWriteTransport');

goog.require('wtf.io.Blob');
goog.require('wtf.io.WriteTransport');



/**
 * Write-only memory transport base type.
 *
 * @constructor
 * @extends {wtf.io.WriteTransport}
 */
wtf.io.transports.MemoryWriteTransport = function() {
  goog.base(this);

  // TODO(benvanik): use the Blob create/append loop to allow very large sizes?

  /**
   * All data elements that have been written.
   * This is used to create a single blob on demand.
   * @type {!Array.<!wtf.io.BlobData>}
   * @private
   */
  this.data_ = [];

  /**
   * If specified the given array will be populated with the result blob on
   * dispose.
   * @type {Array}
   * @private
   */
  this.targetArray_ = null;
};
goog.inherits(wtf.io.transports.MemoryWriteTransport, wtf.io.WriteTransport);


/**
 * @override
 */
wtf.io.transports.MemoryWriteTransport.prototype.disposeInternal = function() {
  if (this.targetArray_) {
    this.targetArray_.push(this.getBlob());
  }
  goog.base(this, 'disposeInternal');
};


/**
 * Sets an array target that will be automatically populated with the blob data
 * when the transport is disposed.
 * The blob will be pushed on.
 * @param {!Array} value Target array.
 */
wtf.io.transports.MemoryWriteTransport.prototype.setTargetArray =
    function(value) {
  this.targetArray_ = value;
};


/**
 * @override
 */
wtf.io.transports.MemoryWriteTransport.prototype.write = function(data) {
  this.data_.push(data);
};


/**
 * @override
 */
wtf.io.transports.MemoryWriteTransport.prototype.flush = function() {
  // No-op.
};


/**
 * Gets a blob containing all data that has been written to the transport.
 * @return {!wtf.io.Blob} Data blob.
 */
wtf.io.transports.MemoryWriteTransport.prototype.getBlob = function() {
  return wtf.io.Blob.create(this.data_);
};
