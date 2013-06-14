/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview File write transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.FileWriteTransport');

goog.require('wtf.io.Blob');
goog.require('wtf.io.WriteTransport');



/**
 * Write-only file transport base type.
 * We use synchronous writes for now, as async writes break under node when
 * the user calls process.exit().
 *
 * @param {string} filename Filename.
 * @constructor
 * @extends {wtf.io.WriteTransport}
 */
wtf.io.transports.FileWriteTransport = function(filename) {
  goog.base(this);

  /**
   * Node 'fs' modulle.
   * @type {!NodeFsModule}
   * @private
   */
  this.fs_ = /** @type {!NodeFsModule} */ (require('fs'));

  /**
   * Filename used when saving.
   * @type {string}
   * @private
   */
  this.filename_ = filename;

  /**
   * File handle.
   * @type {number}
   * @private
   */
  this.fd_ = this.fs_.openSync(this.filename_, 'w');
};
goog.inherits(wtf.io.transports.FileWriteTransport, wtf.io.WriteTransport);


/**
 * @override
 */
wtf.io.transports.FileWriteTransport.prototype.disposeInternal = function() {
  // Flush and finish.
  this.fs_.fsyncSync(this.fd_);
  this.fs_.closeSync(this.fd_);

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.transports.FileWriteTransport.prototype.write = function(data) {
  var nodeData;
  if (data instanceof ArrayBuffer ||
      data.buffer && data.buffer instanceof ArrayBuffer) {
    var sourceData;
    if (data instanceof ArrayBuffer) {
      sourceData = new Uint8Array(data);
    } else {
      sourceData = new Uint8Array(data.buffer);
    }
    // TODO(benvanik): a better way to convert.
    nodeData = new Buffer(sourceData.length);
    for (var n = 0; n < nodeData.length; n++) {
      nodeData[n] = sourceData[n];
    }
  } else if (wtf.io.Blob.isBlob(data)) {
    nodeData = /** @type {!Buffer} */ (wtf.io.Blob.toNative(
        /** @type {!wtf.io.Blob} */ (data)));
  } else {
    throw new Error('Unsupported write data type.');
  }

  this.fs_.writeSync(this.fd_, nodeData, 0, nodeData.length, null);
};


/**
 * @override
 */
wtf.io.transports.FileWriteTransport.prototype.flush = function() {
  this.fs_.fsyncSync(this.fd_);
};
