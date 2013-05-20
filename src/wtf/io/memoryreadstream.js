/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview In-memory read-only stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.MemoryReadStream');

goog.require('wtf.io.Buffer');
goog.require('wtf.io.ReadStream');



/**
 * @constructor
 * @extends {wtf.io.ReadStream}
 */
wtf.io.MemoryReadStream = function() {
  goog.base(this);

  /**
   * Queued read buffers, waiting for the initial listen.
   * @type {!Array.<!wtf.io.Buffer>}
   * @private
   */
  this.queue_ = [];
};
goog.inherits(wtf.io.MemoryReadStream, wtf.io.ReadStream);


/**
 * @override
 */
wtf.io.MemoryReadStream.prototype.disposeInternal = function() {
  this.queue_.length = 0;
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.MemoryReadStream.prototype.listeningBegan = function() {
  for (var n = 0; n < this.queue_.length; n++) {
    var buffer = this.queue_[n];
    this.fireReadEvent(buffer, buffer.capacity);
  }
  this.queue_.length = 0;
};


/**
 * Adds new buffer data to the stream.
 * The read event will be fired immediately.
 * @param {!wtf.io.ByteArray} data Binary data.
 */
wtf.io.MemoryReadStream.prototype.addData = function(data) {
  var buffer = new wtf.io.Buffer(data.length, null, data);
  if (this.isListening()) {
    this.fireReadEvent(buffer, buffer.capacity);
  } else {
    this.queue_.push(buffer);
  }
};
