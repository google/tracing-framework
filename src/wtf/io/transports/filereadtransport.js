/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview File read transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.FileReadTransport');

goog.require('goog.asserts');
goog.require('wtf.io.DataFormat');
goog.require('wtf.io.ReadTransport');



/**
 * Read-only file transport base type.
 *
 * @param {string} filename Filename.
 * @constructor
 * @extends {wtf.io.ReadTransport}
 */
wtf.io.transports.FileReadTransport = function(filename) {
  goog.base(this);

  /**
   * Node 'fs' modulle.
   * @type {!NodeFsModule}
   * @private
   */
  this.fs_ = /** @type {!NodeFsModule} */ (require('fs'));

  /**
   * Source filename.
   * @type {string}
   * @private
   */
  this.filename_ = filename;

  /**
   * Read stream.
   * Initialized on first resume.
   * @type {NodeReadStream}
   * @private
   */
  this.stream_ = null;

  // TODO(benvanik): remove and stream back to target.
  /**
   * All incoming data buffers.
   * @type {!Array.<!Buffer>}
   * @private
   */
  this.pendingBuffers_ = [];
};
goog.inherits(wtf.io.transports.FileReadTransport, wtf.io.ReadTransport);


/**
 * @override
 */
wtf.io.transports.FileReadTransport.prototype.disposeInternal = function() {
  if (this.stream_) {
    this.stream_.destroy();
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.transports.FileReadTransport.prototype.resume = function() {
  goog.base(this, 'resume');

  if (!this.stream_) {
    // We don't support blobs on node.
    goog.asserts.assert(this.getPreferredFormat() != wtf.io.DataFormat.BLOB);

    // Create stream.
    var encoding = null;
    if (this.getPreferredFormat() == wtf.io.DataFormat.STRING) {
      encoding = 'utf8';
    }
    this.stream_ = this.fs_.createReadStream(this.filename_, {
      flags: 'r',
      encoding: encoding
    });

    // Gather all data then convert and emit.
    var self = this;
    var offset = 0;
    var total = 0;
    this.stream_.on('data', function(nodeData) {
      self.emitProgressEvent(offset, total);
      this.pendingBuffers_.push(nodeData);
    });
    this.stream_.on('end', function() {
      self.emitProgressEvent(total, total);

      // Combine all pending buffers.
      // TODO(benvanik): stream back as received.
      if (this.getPreferredFormat() == wtf.io.DataFormat.STRING) {
        var combinedData = this.pendingBuffers_.join('');
      } else {
        var combinedData = new Uint8Array(total);
        var offset = 0;
        for (var n = 0; n < self.pendingBuffers_.length; n++) {
          var sourceBuffer = self.pendingBuffers_[n];
          for (var m = 0; m < sourceBuffer.length; m++) {
            combinedData[offset + m] = sourceBuffer[m];
          }
          offset += sourceBuffer.length;
        }
      }
      this.pendingBuffers_ = [];

      self.emitReceiveData(combinedData);
      self.end();
    });
  }
};
