/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Abstract platform TCP listen socket.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.net.ListenSocket');

goog.require('wtf.events.EventEmitter');
goog.require('wtf.net.EventType');



/**
 * Abstract TCP listen socket.
 * Emits {@see wtf.net.EventType#CONNECTION} events with the newly connected
 * sockets.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.net.ListenSocket = function() {
  goog.base(this);
};
goog.inherits(wtf.net.ListenSocket, wtf.events.EventEmitter);


/**
 * Emits a connection event.
 * @param {!wtf.net.Socket} socket TCP socket.
 * @protected
 */
wtf.net.ListenSocket.prototype.emitConnection = function(socket) {
  this.emitEvent(wtf.net.EventType.CONNECTION, this, socket);
};
