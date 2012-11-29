/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension API-based IPC channel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ipc.ExtensionChannel');

goog.require('wtf.ipc.Channel');



/**
 * Chrome extension API-based IPC channel.
 * Enables efficient communication with another extension.
 *
 * @param {!ChromePort} port Opened Chrome message port.
 * @constructor
 * @extends {wtf.ipc.Channel}
 */
wtf.ipc.ExtensionChannel = function(port) {
  goog.base(this);

  /**
   * Port that onmessage is fired on.
   * @type {ChromePort}
   * @private
   */
  this.port_ = port;

  port.onMessage.addListener(goog.bind(this.handleMessage_, this));
  port.onDisconnect.addListener(goog.bind(this.handleDisconnect_, this));
};
goog.inherits(wtf.ipc.ExtensionChannel, wtf.ipc.Channel);


/**
 * @override
 */
wtf.ipc.ExtensionChannel.prototype.disposeInternal = function() {
  this.port_ = null;
  goog.base(this, 'disposeInternal');
};


/**
 * @typedef {{
 *   data: !Object
 * }}
 */
wtf.ipc.ExtensionChannel.Packet;


/**
 * Unique token found in all packets.
 * @const
 * @type {string}
 */
wtf.ipc.ExtensionChannel.PACKET_TOKEN = 'wtf_ipc_connect_token';


/**
 * Handles disconnection events.
 * @private
 */
wtf.ipc.ExtensionChannel.prototype.handleDisconnect_ = function() {
  this.port_ = null;
};


/**
 * @override
 */
wtf.ipc.ExtensionChannel.prototype.isConnected = function() {
  return !!this.port_;
};


/**
 * Handles incoming messages.
 * @param {!Object} msg Incoming message.
 * @private
 */
wtf.ipc.ExtensionChannel.prototype.handleMessage_ = function(msg) {
  var packet = /** @type {wtf.ipc.ExtensionChannel.Packet} */ (msg);
  if (!packet || !packet[wtf.ipc.ExtensionChannel.PACKET_TOKEN]) {
    return;
  }

  this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, packet['data']);
};


/**
 * @override
 */
wtf.ipc.ExtensionChannel.prototype.postMessage = function(
    data, opt_transferrables) {
  // If the port is closed fail.
  if (!this.port_) {
    return;
  }

  // Create packet with callback ID so that we can track things.
  var packet = /** @type {!wtf.ipc.ExtensionChannel.Packet} */ ({
    'data': data
  });
  packet[wtf.ipc.ExtensionChannel.PACKET_TOKEN] = true;

  // Actual post.
  this.port_.postMessage(packet);
};
