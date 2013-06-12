/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview XMLHttpRequest write transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.XhrWriteTransport');

goog.require('goog.asserts');
goog.require('wtf.io.WriteTransport');



/**
 * Write-only XHR transport base type.
 * Writes data via an XHR POST.
 *
 * @param {string} url Target URL.
 * @param {string=} opt_mimeType MIME type override.
 * @constructor
 * @extends {wtf.io.WriteTransport}
 */
wtf.io.transports.XhrWriteTransport = function(url, opt_mimeType) {
  goog.base(this);

  // TODO(benvanik): use the Blob create/append loop to allow very large sizes?

  /**
   * URL to POST the data to.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * MIME type or null to pick automatically.
   * @type {?string}
   * @private
   */
  this.mimeType_ = opt_mimeType || null;

  /**
   * XHR object, if active.
   * @type {XMLHttpRequest}
   * @private
   */
  this.xhr_ = null;

  /**
   * All data elements that have been written.
   * This is used to create a single blob on demand.
   * @type {!Array.<!wtf.io.BlobData>}
   * @private
   */
  this.data_ = [];
};
goog.inherits(wtf.io.transports.XhrWriteTransport, wtf.io.WriteTransport);


/**
 * Timeout, in ms.
 * @type {number}
 * @const
 * @private
 */
wtf.io.transports.XhrWriteTransport.TIMEOUT_MS_ = 120 * 1000;


/**
 * @override
 */
wtf.io.transports.XhrWriteTransport.prototype.disposeInternal = function() {
  if (this.xhr_) {
    this.xhr_.onprogress = null;
    this.xhr_.onload = null;
    this.xhr_.onerror = null;
    this.xhr_ = null;
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.transports.XhrWriteTransport.prototype.write = function(data) {
  this.data_.push(data);
};


/**
 * @override
 */
wtf.io.transports.XhrWriteTransport.prototype.flush = function() {
  goog.asserts.assert(!this.xhr_);

  // Pick mime type based on content type.
  // TODO(benvanik): more intelligent picking. If all strings, for example, use
  // text/plain.
  var mimeType = this.mimeType_ || 'application/octet-stream';

  // Setup XHR.
  this.xhr_ = new XMLHttpRequest();
  this.xhr_.timeout = wtf.io.transports.XhrWriteTransport.TIMEOUT_MS_;
  this.xhr_.setRequestHeader('Content-Type', mimeType);

  var self = this;
  this.xhr_.onload = function(e) {
    // Done sending, have response.
    // TODO(benvanik): emit event.
  };
  this.xhr_.onerror = function(e) {
    // Error sending.
    // TODO(benvanik): emit event.
  };

  // Create blob and send.
  var blob = new Blob(this.data_, {
    'type': mimeType
  });
  this.xhr_.open('POST', this.url_, true);
  this.xhr_.send(blob);
};
