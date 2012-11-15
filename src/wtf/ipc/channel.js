/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview MessagePort-based IPC channel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ipc.Channel');

goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('wtf.events.EventEmitter');



/**
 * IPC channel.
 * Enables efficient communication with another window.
 *
 * @param {!Window} recvPort Port that onmessage is fired on.
 * @param {!Window} sendPort Port that messages should be posted on.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.ipc.Channel = function(recvPort, sendPort) {
  goog.base(this);

  /**
   * Port that onmessage is fired on.
   * @type {Window}
   * @private
   */
  this.recvPort_ = recvPort;

  /**
   * Port that messages should be posted on.
   * @type {Window}
   * @private
   */
  this.sendPort_ = sendPort;

  /**
   * Event handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  this.eh_.listen(
      this.recvPort_,
      goog.events.EventType.MESSAGE,
      this.handleMessage_,
      true);
};
goog.inherits(wtf.ipc.Channel, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.ipc.Channel.prototype.disposeInternal = function() {
  this.recvPort_ = null;
  this.sendPort_ = null;
  goog.base(this, 'disposeInternal');
};


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
 * @typedef {{
 *   data: !Object
 * }}
 */
wtf.ipc.Channel.Packet;


/**
 * Unique token found in all packets.
 * @const
 * @type {string}
 */
wtf.ipc.Channel.PACKET_TOKEN = 'wtf_ipc_connect_token';


/**
 * Gets a value indicating whether the channel is currently connected.
 * @return {boolean} True if the channel is connected.
 */
wtf.ipc.Channel.prototype.isConnected = function() {
  return !!this.sendPort_ && !this.sendPort_.closed;
};


/**
 * Focuses the target.
 */
wtf.ipc.Channel.prototype.focus = function() {
  if (this.sendPort_) {
    this.sendPort_.focus();
  }
};


/**
 * Handles incoming messages.
 * @param {!goog.events.BrowserEvent} browserEvent Event.
 * @private
 */
wtf.ipc.Channel.prototype.handleMessage_ = function(browserEvent) {
  var e = browserEvent.getBrowserEvent();

  var packet = /** @type {wtf.ipc.Channel.Packet} */ (e.data);
  if (!packet || !packet[wtf.ipc.Channel.PACKET_TOKEN]) {
    return;
  }
  e.stopPropagation();

  this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, packet.data);
};


/**
 * Sends a message.
 * @param {!Object} data Message to send.
 * @param {Array.<!Object>=} opt_transferrables Transferrable objects contained
 *     within {@code data}.
 */
wtf.ipc.Channel.prototype.postMessage = function(data, opt_transferrables) {
  // If the port is closed fail.
  if (!this.sendPort_) {
    return;
  }

  // Create packet with callback ID so that we can track things.
  var packet = /** @type {!wtf.ipc.Channel.Packet} */ ({
    data: data
  });
  packet[wtf.ipc.Channel.PACKET_TOKEN] = true;

  // Actual post.
  if (this.sendPort_.webkitPostMessage) {
    this.sendPort_.webkitPostMessage(packet, '*', opt_transferrables);
  } else {
    this.sendPort_.postMessage(packet, '*');
  }
};
