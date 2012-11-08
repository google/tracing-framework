/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Abstract platform TCP socket.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.net.Socket');

goog.require('wtf.events.EventEmitter');
goog.require('wtf.net.EventType');



/**
 * Abstract TCP socket.
 * Emits {@see wtf.net.EventType#DATA} events with buffers and
 * {@see wtf.net.EventType#CLOSE} events when the socket is closed.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.net.Socket = function() {
  goog.base(this);
};
goog.inherits(wtf.net.Socket, wtf.events.EventEmitter);


/**
 * Emits a data event.
 * @param {!Uint8Array} data Socket data.
 * @protected
 */
wtf.net.Socket.prototype.emitData = function(data) {
  this.emitEvent(wtf.net.EventType.DATA, this, data);
};


/**
 * Emits a close event.
 * @protected
 */
wtf.net.Socket.prototype.emitClose = function() {
  this.emitEvent(wtf.net.EventType.CLOSE, this);
};


/**
 * Sets the desired read buffer size.
 * This can be 0 to use the default.
 * @param {number} value New buffer size value.
 */
wtf.net.Socket.prototype.setBufferSize = goog.nullFunction;


/**
 * Writes data to the socket.
 * @param {!Uint8Array} data Data to write.
 */
wtf.net.Socket.prototype.write = goog.abstractMethod;
