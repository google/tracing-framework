/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Read stream that copies data to a write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.CopyReadStream');

goog.require('wtf.io.EventType');
goog.require('wtf.io.ReadStream');



/**
 * Copying read stream.
 * This wraps an existing read stream and clones all output to a write stream.
 *
 * @param {!wtf.io.ReadStream} sourceStream Source stream.
 * @param {!wtf.io.WriteStream} targetStream Target stream.
 * @constructor
 * @extends {wtf.io.ReadStream}
 */
wtf.io.CopyReadStream = function(sourceStream, targetStream) {
  goog.base(this);

  /**
   * Source read stream.
   * @type {!wtf.io.ReadStream}
   * @private
   */
  this.sourceStream_ = sourceStream;
  this.registerDisposable(this.sourceStream_);

  /**
   * Target write stream that will receive all data.
   * @type {!wtf.io.WriteStream}
   * @private
   */
  this.targetStream_ = targetStream;
  this.registerDisposable(this.targetStream_);

  this.sourceStream_.addListener(wtf.io.EventType.READ, this.bufferRead_, this);
};
goog.inherits(wtf.io.CopyReadStream, wtf.io.ReadStream);


/**
 * Handles incoming buffer read events.
 * @param {!wtf.io.Buffer} buffer Incoming buffer.
 * @param {number} length Valid buffer data length.
 * @private
 */
wtf.io.CopyReadStream.prototype.bufferRead_ = function(buffer, length) {
  // Begin writing.
  // This clones the buffer for writing because we can't be sure if it's async
  // or not. This could be made more optimal.
  var clonedBuffer = buffer.clone(length);
  clonedBuffer.offset = length;
  this.targetStream_.write(clonedBuffer, function(buffer) {}, this);

  // TODO(benvanik): is the flush required?
  this.targetStream_.flush();

  // Dispatch the incoming buffer.
  this.fireReadEvent(buffer, length);
};


/**
 * @override
 */
wtf.io.CopyReadStream.prototype.listeningBegan = function() {
  this.sourceStream_.listen();
};


/**
 * @override
 */
wtf.io.CopyReadStream.prototype.getBuffer = function(length) {
  return this.sourceStream_.getBuffer(length);
};


/**
 * @override
 */
wtf.io.CopyReadStream.prototype.releaseBuffer = function(buffer) {
  this.sourceStream_.releaseBuffer(buffer);
};
