/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Abstract IPC channel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ipc.Channel');

goog.require('goog.events');
goog.require('wtf.events.EventEmitter');



/**
 * Abstract IPC channel.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.ipc.Channel = function() {
  goog.base(this);
};
goog.inherits(wtf.ipc.Channel, wtf.events.EventEmitter);


/**
 * Event types for channels.
 * @enum {string}
 */
wtf.ipc.Channel.EventType = {
  /**
   * Incoming message. Handlers receive the data as their only argument.
   */
  MESSAGE: goog.events.getUniqueId('message')
};


/**
 * Gets a value indicating whether the channel is currently connected.
 * @return {boolean} True if the channel is connected.
 */
wtf.ipc.Channel.prototype.isConnected = goog.abstractMethod;


/**
 * Sends a message.
 * @param {!Object} data Message to send.
 * @param {Array.<!Object>=} opt_transferrables Transferrable objects contained
 *     within {@code data}.
 */
wtf.ipc.Channel.prototype.postMessage = goog.abstractMethod;
