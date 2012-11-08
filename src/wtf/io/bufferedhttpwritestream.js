/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Buffered HTTP write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.BufferedHttpWriteStream');

goog.require('wtf.io');
goog.require('wtf.io.HttpWriteStream');



/**
 * Buffered HTTP write stream.
 * Gathers all data buffers and performs one large post when flushed.
 *
 * @param {string} url Target URL.
 * @constructor
 * @extends {wtf.io.HttpWriteStream}
 */
wtf.io.BufferedHttpWriteStream = function(url) {
  goog.base(this);

  /**
   * Target URL.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * Cloned memory buffers.
   * @type {!Array.<!wtf.io.Buffer>}
   * @private
   */
  this.buffers_ = [];
};
goog.inherits(wtf.io.BufferedHttpWriteStream, wtf.io.HttpWriteStream);


/**
 * @override
 */
wtf.io.BufferedHttpWriteStream.prototype.disposeInternal = function() {
  this.flush();
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.BufferedHttpWriteStream.prototype.write = function(
    buffer, returnBufferCallback, opt_selfObj) {
  var newBuffer = buffer.clone();
  this.buffers_.push(newBuffer);
  return true;
};


/**
 * @override
 */
wtf.io.BufferedHttpWriteStream.prototype.flush = function() {
  var datas = [];
  for (var n = 0; n < this.buffers_.length; n++) {
    // All buffers have been cloned so the data is just the valid portions.
    datas.push(this.buffers_[n].data);
  }
  var combinedBuffers = wtf.io.combineByteArrays(datas);

  var mimeType = 'application/x-extension-wtf-trace';
  this.postData(this.url_, mimeType, combinedBuffers);
  this.buffers_.length = 0;
};
