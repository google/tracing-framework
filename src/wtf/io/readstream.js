/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Read-only stream base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.ReadStream');

goog.require('goog.asserts');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.io.Buffer');
goog.require('wtf.io.EventType');



/**
 * Abstract read-only binary data stream.
 * When listening read streams fire {@see wtf.io.EventType#READ} events with
 * the {@see wtf.io.Buffer} and its length.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.io.ReadStream = function() {
  goog.base(this);

  /**
   * Whether the source is listening.
   * @type {boolean}
   * @private
   */
  this.listening_ = false;

  // TODO(benvanik): buffer pool
};
goog.inherits(wtf.io.ReadStream, wtf.events.EventEmitter);


/**
 * Whether the stream is listening for events.
 * @return {boolean} True if the stream is listening.
 */
wtf.io.ReadStream.prototype.isListening = function() {
  return this.listening_;
};


/**
 * Begins the read streaming.
 */
wtf.io.ReadStream.prototype.listen = function() {
  // Setup state.
  goog.asserts.assert(!this.listening_);
  this.listening_ = true;

  // Let subclasses know listening has begun.
  this.listeningBegan();
};


/**
 * Fires read events.
 * @param {!wtf.io.Buffer} buffer New buffer containing data.
 * @param {number} length Valid buffer data length.
 * @protected
 */
wtf.io.ReadStream.prototype.fireReadEvent = function(buffer, length) {
  goog.asserts.assert(this.listening_);
  this.emitEvent(wtf.io.EventType.READ, buffer, length);
};


/**
 * Called after listening has begun.
 * If there are any queued read events they should be dispatched here.
 * @protected
 */
wtf.io.ReadStream.prototype.listeningBegan = goog.abstractMethod;


/**
 * Gets a buffer from the pool with enough capacity for the given length.
 * @param {number} length Minimum buffer length.
 * @return {!wtf.io.Buffer} A buffer from the pool. Contents are undefined.
 *     Capacity is at least the requested length.
 * @protected
 */
wtf.io.ReadStream.prototype.getBuffer = function(length) {
  // TODO(benvanik): buffer pool
  return new wtf.io.Buffer(length);
};


/**
 * Releases a buffer back to the pool.
 * @param {!wtf.io.Buffer} buffer A buffer to release to the pool.
 * @protected
 */
wtf.io.ReadStream.prototype.releaseBuffer = function(buffer) {
  // TODO(benvanik): buffer pool
};
