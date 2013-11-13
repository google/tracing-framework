/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview XMLHttpRequest read transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.XhrReadTransport');

goog.require('goog.asserts');
goog.require('wtf.io.DataFormat');
goog.require('wtf.io.ReadTransport');



/**
 * Read-only XHR transport base type.
 * Reads data from an XHR GET.
 *
 * @param {string} url Target URL.
 * @param {XMLHttpRequest=} opt_xhr An XHR object to use. It should be opened
 *     but not sent.
 * @constructor
 * @extends {wtf.io.ReadTransport}
 */
wtf.io.transports.XhrReadTransport = function(url, opt_xhr) {
  goog.base(this);

  /**
   * URL to GET the data from.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * XHR object, if active.
   * @type {XMLHttpRequest}
   * @private
   */
  this.xhr_ = opt_xhr || null;
};
goog.inherits(wtf.io.transports.XhrReadTransport, wtf.io.ReadTransport);


/**
 * Timeout, in ms.
 * @type {number}
 * @const
 * @private
 */
wtf.io.transports.XhrReadTransport.TIMEOUT_MS_ = 120 * 1000;


/**
 * @override
 */
wtf.io.transports.XhrReadTransport.prototype.disposeInternal = function() {
  if (this.xhr_) {
    this.xhr_.onprogress = null;
    this.xhr_.onload = null;
    this.xhr_.onerror = null;
    this.xhr_.abort();
    this.xhr_ = null;
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.transports.XhrReadTransport.prototype.resume = function() {
  goog.base(this, 'resume');

  // Setup the XHR.
  // Note that we may have been passed an XHR to use, so track that.
  var reusingXhr = !!this.xhr_;
  if (!reusingXhr) {
    this.xhr_ = new XMLHttpRequest();
  }

  // Setup events.
  var self = this;
  this.xhr_.onprogress = function(e) {
    if (e.lengthComputable) {
      self.emitProgressEvent(e.loaded, e.total);
    }
  };
  this.xhr_.onload = function(e) {
    if (e.target.status == 200) {
      var data = e.target.response;
      self.emitReceiveData(data);
    } else {
      var err = new Error('Error fetching data: ' + e.target.status + ' ' +
          e.target.statusText);
      self.emitErrorEvent(err);
    }
    goog.dispose(self);
  };
  this.xhr_.onerror = function(e) {
    var err = new Error('Unknown error fetching data.');
    self.emitErrorEvent(err);
    goog.dispose(self);
  };

  // Open.
  // If we wanted to support POST reads, this would be where to do it.
  if (!reusingXhr) {
    this.xhr_.open('GET', this.url_, true);
  }

  this.xhr_.timeout = wtf.io.transports.XhrReadTransport.TIMEOUT_MS_;

  // Pick response type based on desired format. This avoids any conversion.
  var responseType = 'text';
  switch (this.format) {
    case wtf.io.DataFormat.STRING:
      responseType = 'text';
      break;
    case wtf.io.DataFormat.ARRAY_BUFFER:
      responseType = 'arraybuffer';
      break;
    case wtf.io.DataFormat.BLOB:
      responseType = 'blob';
      break;
    default:
      goog.asserts.fail('Unknown data format.');
      break;
  }
  this.xhr_.responseType = responseType;

  // Issue send.
  this.xhr_.send();
};
