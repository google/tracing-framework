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
   * A list of all blobs written so far.
   * @type {!Array.<!wtf.io.Blob>}
   * @private
   */
  this.blobParts_ = [];
};
goog.inherits(wtf.io.transports.BlobWriteTransport, wtf.io.WriteTransport);


/**
 * @override
 */
wtf.io.transports.BlobWriteTransport.prototype.disposeInternal = function() {
  var blob = wtf.io.Blob.create(this.blobParts_);
  var platform = wtf.pal.getPlatform();
  platform.writeBinaryFile(
      this.filename_,
      /** @type {!Blob} */ (wtf.io.Blob.toNative(blob)));

  // TODO(benvanik): close?

  // Drop all parts.
  this.blobParts_ = [];

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.transports.BlobWriteTransport.prototype.write = function(data) {
  if (wtf.io.Blob.isBlob(data)) {
    // Blobs are immutable, so store off our input.
    this.blobParts_.push(data);
  } else {
    // Wrap in a blob. This allows the browser to page the data out if needed.
    this.blobParts_.push(wtf.io.Blob.create([data]));
  }
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
  return wtf.io.Blob.create(this.blobParts_);
};
