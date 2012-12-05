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

goog.provide('wtf.ipc.MessageChannel');

goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('wtf.ipc.Channel');



/**
 * MessagePort-based IPC channel.
 * Enables efficient communication with another window.
 *
 * @param {!Window} recvPort Port that onmessage is fired on.
 * @param {!Window} sendPort Port that messages should be posted on.
 * @constructor
 * @extends {wtf.ipc.Channel}
 */
wtf.ipc.MessageChannel = function(recvPort, sendPort) {
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

  /**
   * Whether the send port supports transferrable objects.
   * This check is done on the first post as there's no way to detect it
   * otherwise.
   * @type {boolean|undefined}
   * @private
   */
  this.hasTransferablePostMessage_ = undefined;

  this.eh_.listen(
      this.recvPort_,
      goog.events.EventType.MESSAGE,
      this.handleMessage_,
      true);
};
goog.inherits(wtf.ipc.MessageChannel, wtf.ipc.Channel);


/**
 * @override
 */
wtf.ipc.MessageChannel.prototype.disposeInternal = function() {
  this.recvPort_ = null;
  this.sendPort_ = null;
  goog.base(this, 'disposeInternal');
};


/**
 * @typedef {{
 *   data: !Object
 * }}
 */
wtf.ipc.MessageChannel.Packet;


/**
 * Unique token found in all packets.
 * @const
 * @type {string}
 */
wtf.ipc.MessageChannel.PACKET_TOKEN = 'wtf_ipc_connect_token';


/**
 * @override
 */
wtf.ipc.MessageChannel.prototype.isConnected = function() {
  return !!this.sendPort_ && !this.sendPort_.closed;
};


/**
 * Focuses the target.
 */
wtf.ipc.MessageChannel.prototype.focus = function() {
  if (this.sendPort_) {
    this.sendPort_.focus();
  }
};


/**
 * Handles incoming messages.
 * @param {!goog.events.BrowserEvent} browserEvent Event.
 * @private
 */
wtf.ipc.MessageChannel.prototype.handleMessage_ = function(browserEvent) {
  var e = browserEvent.getBrowserEvent();

  var packet = /** @type {wtf.ipc.MessageChannel.Packet} */ (e.data);
  if (!packet || !packet[wtf.ipc.MessageChannel.PACKET_TOKEN]) {
    return;
  }
  e.stopPropagation();

  this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, packet['data']);
};


/**
 * @override
 */
wtf.ipc.MessageChannel.prototype.postMessage = function(
    data, opt_transferrables) {
  // If the port is closed fail.
  if (!this.sendPort_) {
    return;
  }

  // Create packet with callback ID so that we can track things.
  var packet = /** @type {!wtf.ipc.MessageChannel.Packet} */ ({
    'data': data
  });
  packet[wtf.ipc.MessageChannel.PACKET_TOKEN] = true;

  // Actual post.
  if (this.hasTransferablePostMessage_ === undefined) {
    try {
      this.sendPort_.postMessage(packet, '*', opt_transferrables);
      // Data has been sent!
      this.hasTransferablePostMessage_ = true;
    } catch (e) {
      // Send failed - try without transferrables.
      this.hasTransferablePostMessage_ = false;
      this.sendPort_.postMessage(packet, '*');
    }
  } else if (this.hasTransferablePostMessage_) {
    this.sendPort_.postMessage(packet, '*', opt_transferrables);
  } else {
    this.sendPort_.postMessage(packet, '*');
  }
};
