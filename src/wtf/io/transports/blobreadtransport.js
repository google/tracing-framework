/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Blob read transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.BlobReadTransport');

goog.require('wtf.io.Blob');
goog.require('wtf.io.DataFormat');
goog.require('wtf.io.ReadTransport');



/**
 * Read-only blob transport type.
 *
 * @param {!wtf.io.Blob} blob Source blob.
 * @constructor
 * @extends {wtf.io.ReadTransport}
 */
wtf.io.transports.BlobReadTransport = function(blob) {
  goog.base(this);

  /**
   * Source blob.
   * @type {!wtf.io.Blob}
   * @private
   */
  this.blob_ = blob;

  /**
   * File reader.
   * @type {!FileReader}
   * @private
   */
  this.reader_ = new FileReader();

  /**
   * Whether the read has started.
   * @type {boolean}
   * @private
   */
  this.hasStartedRead_ = false;

  var self = this;
  var reader = this.reader_;
  reader.onprogress = function(e) {
    if (e.lengthComputable) {
      self.emitProgressEvent(e.loaded, e.total);
    }
  };
  reader.onloadend = function(e) {
    self.emitProgressEvent(e.loaded, e.loaded);
    if (reader.result) {
      // Succeeded.
      self.emitReceiveData(/** @type {!wtf.io.BlobData} */ (reader.result));
    } else {
      // Failed.
      self.emitErrorEvent(
          /** @type {Error} */ (reader['error']) ||
          new Error('Unknown blob read error'));
    }
    self.end();
  };
};
goog.inherits(wtf.io.transports.BlobReadTransport, wtf.io.ReadTransport);


/**
 * @override
 */
wtf.io.transports.BlobReadTransport.prototype.resume = function() {
  goog.base(this, 'resume');

  if (!this.hasStartedRead_) {
    this.hasStartedRead_ = true;

    var blob = /** @type {!Blob} */ (wtf.io.Blob.toNative(this.blob_));

    switch (this.getPreferredFormat()) {
      case wtf.io.DataFormat.STRING:
        this.reader_.readAsText(blob);
        break;
      case wtf.io.DataFormat.BLOB:
        // Immediate completion.
        this.emitProgressEvent(blob.size, blob.size);
        this.emitReceiveData(blob);
        this.end();
        break;
      case wtf.io.DataFormat.ARRAY_BUFFER:
        this.reader_.readAsArrayBuffer(blob);
        break;
    }
  }
};
