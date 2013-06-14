/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Blob write transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.BlobWriteTransport');

goog.require('wtf.io.Blob');
goog.require('wtf.io.WriteTransport');
goog.require('wtf.pal');



/**
 * Write-only file transport base type.
 *
 * @param {string} filename Filename.
 * @constructor
 * @extends {wtf.io.WriteTransport}
 */
wtf.io.transports.BlobWriteTransport = function(filename) {
  goog.base(this);

  /**
   * Filename used when saving.
   * @type {string}
   * @private
   */
  this.filename_ = filename;

  /**
   * Current blob containing all data that has been written.
   * @type {!wtf.io.Blob}
   * @private
   */
  this.blob_ = wtf.io.Blob.create([]);
};
goog.inherits(wtf.io.transports.BlobWriteTransport, wtf.io.WriteTransport);


/**
 * @override
 */
wtf.io.transports.BlobWriteTransport.prototype.disposeInternal = function() {
  var platform = wtf.pal.getPlatform();
  platform.writeBinaryFile(
      this.filename_,
      /** @type {!Blob} */ (wtf.io.Blob.toNative(this.blob_)));
  this.blob_.close();

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.transports.BlobWriteTransport.prototype.write = function(data) {
  var oldBlob = this.blob_;
  this.blob_ = wtf.io.Blob.create([oldBlob, data]);
  oldBlob.close();
};


/**
 * @override
 */
wtf.io.transports.BlobWriteTransport.prototype.flush = function() {
  // No-op.
};


/**
 * Gets a blob containing all data that has been written to the transport.
 * @return {!wtf.io.Blob} Data blob.
 */
wtf.io.transports.BlobWriteTransport.prototype.getBlob = function() {
  return this.blob_.slice(0, this.blob_.getSize());
};
