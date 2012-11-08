/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Memory-buffered local-file write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.LocalFileWriteStream');

goog.require('goog.string');
goog.require('wtf.io');
goog.require('wtf.io.WriteStream');
goog.require('wtf.util');



/**
 * Memory-buffered local-file write stream.
 * Clones all buffers and keeps them around until closed.
 *
 * @param {string} filenamePrefix Prefix for the filename.
 * @constructor
 * @extends {wtf.io.WriteStream}
 */
wtf.io.LocalFileWriteStream = function(filenamePrefix) {
  goog.base(this);

  // prefix-YYYY-MM-DDTHH-MM-SS-mmmZZZ
  var dt = new Date();
  var filenameSuffix = '-' +
      dt.getFullYear() +
      goog.string.padNumber(dt.getMonth() + 1, 2) +
      goog.string.padNumber(dt.getDate(), 2) + 'T' +
      goog.string.padNumber(dt.getHours(), 2) +
      goog.string.padNumber(dt.getMinutes(), 2) +
      goog.string.padNumber(dt.getSeconds(), 2);

  /**
   * Filename used when saving.
   * @type {string}
   * @private
   */
  this.filename_ = filenamePrefix + filenameSuffix + wtf.io.FILE_EXTENSION;

  /**
   * Cloned memory buffers.
   * @type {!Array.<!wtf.io.ByteArray>}
   * @private
   */
  this.bufferDatas_ = [];
};
goog.inherits(wtf.io.LocalFileWriteStream, wtf.io.WriteStream);


/**
 * @override
 */
wtf.io.LocalFileWriteStream.prototype.disposeInternal = function() {
  wtf.util.downloadData(this.bufferDatas_, this.filename_);
  this.bufferDatas_.length = 0;

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.LocalFileWriteStream.prototype.write = function(
    buffer, returnBufferCallback, opt_selfObj) {
  var newBuffer = buffer.clone();
  this.bufferDatas_.push(newBuffer.data);
  return true;
};


/**
 * @override
 */
wtf.io.LocalFileWriteStream.prototype.flush = function() {
};
