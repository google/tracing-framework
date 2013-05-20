/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Abstract HTTP write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.HttpWriteStream');

goog.require('goog.asserts');
goog.require('goog.labs.net.xhr');
goog.require('goog.userAgent.product');
goog.require('wtf.io.WriteStream');



/**
 * Abstract HTTP write stream.
 * Supports write stream implementations that target HTTP endpoints.
 *
 * @constructor
 * @extends {wtf.io.WriteStream}
 */
wtf.io.HttpWriteStream = function() {
  goog.base(this);
};
goog.inherits(wtf.io.HttpWriteStream, wtf.io.WriteStream);


/**
 * Posts data to the given path.
 * @param {string} url A full URL to post to.
 * @param {string} mimeType MIME type of the data.
 * @param {!wtf.io.ByteArray} data Binary data.
 * @return {!goog.result.Result} A result set when the POST completes.
 * @protected
 */
wtf.io.HttpWriteStream.prototype.postData = function(url, mimeType, data) {
  // Chrome prefers ArrayBufferView, others prefer ArrayBuffer.
  var postData = null;
  if (goog.userAgent.product.CHROME) {
    postData = data;
  } else {
    // Need ArrayBuffer - must truncate if data is less than full thing.
    if (data.length < data.buffer.byteLength) {
      var tempData = new Uint8Array(data.length);
      tempData.set(data);
      postData = tempData.buffer;
    } else {
      postData = data.buffer;
    }
  }
  goog.asserts.assert(postData);

  postData = /** @type {ArrayBuffer} */ (postData);
  var result = goog.labs.net.xhr.post(url, postData, {
    headers: {
      // Extra info about sender?
      'Content-Type': mimeType
    },
    mimeType: mimeType
  });
  return result;
};
