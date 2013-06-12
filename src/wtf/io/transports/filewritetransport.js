/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview File transport types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.FileWriteTransport');

goog.require('wtf.io.WriteTransport');
goog.require('wtf.pal');



/**
 * Write-only file transport base type.
 *
 * @param {string} filename Filename.
 * @constructor
 * @extends {wtf.io.WriteTransport}
 */
wtf.io.transports.FileWriteTransport = function(filename) {
  goog.base(this);

  /**
   * Filename used when saving.
   * @type {string}
   * @private
   */
  this.filename_ = filename;

  /**
   * Current blob containing all data that has been written.
   * @type {!Blob}
   * @private
   */
  this.blob_ = new Blob([]);
};
goog.inherits(wtf.io.transports.FileWriteTransport, wtf.io.WriteTransport);


/**
 * @override
 */
wtf.io.transports.FileWriteTransport.prototype.disposeInternal = function() {
  var platform = wtf.pal.getPlatform();
  platform.writeBinaryFile(this.filename_, this.blob_);

  // TODO(benvanik): find a way to close on all browsers?
  if (this.blob_['close']) {
    this.blob_['close']();
  }

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.transports.FileWriteTransport.prototype.write = function(data) {
  var oldBlob = this.blob_;
  this.blob_ = new Blob([oldBlob, data]);

  // TODO(benvanik): find a way to close on all browsers?
  if (oldBlob['close']) {
    oldBlob['close']();
  }
};


/**
 * @override
 */
wtf.io.transports.FileWriteTransport.prototype.flush = function() {
  // No-op.
};


/**
 * Gets a blob containing all data that has been written to the transport.
 * @return {!Blob} Data blob.
 */
wtf.io.transports.FileWriteTransport.prototype.getBlob = function() {
  return this.blob_.slice(0, this.blob_.size);
};
