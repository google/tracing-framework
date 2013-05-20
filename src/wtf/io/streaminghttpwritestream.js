/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HTTP write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.StreamingHttpWriteStream');

goog.require('goog.asserts');
goog.require('goog.labs.net.xhr');
goog.require('goog.result');
goog.require('goog.result.Result');
goog.require('wtf.io.HttpWriteStream');



/**
 * Streaming HTTP write stream.
 * POSTs each buffer as received to the given endpoint.
 *
 * @param {string} endpoint HTTP endpoint in the form of
 *     {@code http[s]://host:port}.
 * @constructor
 * @extends {wtf.io.HttpWriteStream}
 */
wtf.io.StreamingHttpWriteStream = function(endpoint) {
  goog.base(this);

  /**
   * HTTP endpoint in the form of {@code http[s]://host:port}.
   * @type {string}
   * @private
   */
  this.endpoint_ = endpoint;

  /**
   * Unique session ID.
   * @type {string}
   * @private
   */
  this.sessionId_ = '' + (0 | Math.random() * (1 << 30));

  /**
   * A unique ID for the session.
   * This should be somewhat-universally-unique.
   * @type {string}
   * @private
   */
  this.streamId_ = '' + (0 | Math.random() * (1 << 30));

  /**
   * Base URL.
   * @type {string}
   * @private
   */
  this.baseUrl_ = [
    this.endpoint_,
    'session',
    this.sessionId_,
    'stream',
    this.streamId_
  ].join('/');

  /**
   * Result waiter for creation.
   * No appends should occur until this is called.
   * @type {!goog.result.Result}
   * @private
   */
  this.createWaiter_ = goog.labs.net.xhr.post(this.baseUrl_ + '/create', '', {
    headers: {
      'X-Trace-Format': 'application/x-extension-wtf-trace'
    }
  });
};
goog.inherits(wtf.io.StreamingHttpWriteStream, wtf.io.HttpWriteStream);


/**
 * @override
 */
wtf.io.StreamingHttpWriteStream.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.StreamingHttpWriteStream.prototype.write = function(
    buffer, returnBufferCallback, opt_selfObj) {
  // Typed arrays - can subview to prevent a clone here.
  var async = true;
  var data = new Uint8Array(buffer.data.buffer, 0, buffer.offset);

  var mimeType = 'application/octet-stream';

  // Fast-path for synchronous and already created.
  if (!async &&
      this.createWaiter_.getState() == goog.result.Result.State.SUCCESS) {
    var result = this.postData(this.baseUrl_ + '/append', mimeType, data);
    goog.result.wait(result, function() {
      returnBufferCallback.call(opt_selfObj, buffer);
    }, this);
  } else {
    // Async - only release buffer when done.
    goog.result.wait(this.createWaiter_, function() {
      goog.asserts.assert(data);
      var result = this.postData(this.baseUrl_ + '/append', mimeType, data);
      goog.result.wait(result, function() {
        returnBufferCallback.call(opt_selfObj, buffer);
      }, this);
    }, this);
  }
};


/**
 * @override
 */
wtf.io.StreamingHttpWriteStream.prototype.flush = function() {
};
