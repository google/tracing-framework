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

goog.require('goog.events.EventType');
goog.require('wtf.ipc.Channel');
goog.require('wtf.trace.util');



/**
 * MessagePort-based IPC channel.
 * Enables efficient communication with another window.
 *
 * If any other messages may be coming across the port this should be registered
 * first to ensure that the messages are received and none of the other
 * listeners are called.
 *
 * Note that avoid using the goog.messaging types built into Closure so that we
 * can ensure we function correctly when instrumented and can work well with
 * others who are sending messages across the port.
 *
 * @param {!Window} recvPort Port that onmessage is fired on.
 * @param {!Window} sendPort Port that messages should be posted on.
 * @constructor
 * @extends {wtf.ipc.Channel}
 */
wtf.ipc.MessageChannel = function(recvPort, sendPort) {
  goog.base(this);

  var self = this;

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

  // TODO(benvanik): set to undefined to enable checking - right now Chrome
  //     does not support transferrable types to popup windows and this
  //     is just an extraneous exception.
  /**
   * Whether the send port supports transferrable objects.
   * This check is done on the first post as there's no way to detect it
   * otherwise.
   * @type {boolean|undefined}
   * @private
   */
  this.hasTransferablePostMessage_ = undefined;

  /**
   * Bound/ignored version of {@see handleMessage_}.
   * @type {function ((Event|null)): (boolean|undefined)}
   * @private
   */
  this.boundHandleMessage_ = wtf.trace.util.ignoreListener(function(e) {
    self.handleMessage_(e);
  });

  this.recvPort_.addEventListener(
      goog.events.EventType.MESSAGE, this.boundHandleMessage_, true);
};
goog.inherits(wtf.ipc.MessageChannel, wtf.ipc.Channel);


/**
 * @override
 */
wtf.ipc.MessageChannel.prototype.disposeInternal = function() {
  this.recvPort_.removeEventListener(
      goog.events.EventType.MESSAGE, this.boundHandleMessage_, true);
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
 * Token value indicating who sent a message.
 * @const
 * @type {string}
 * @private
 */
wtf.ipc.MessageChannel.SENDER_TOKEN_ = 'wtf_ipc_sender_token';


/**
 * A unique-enough ID used to differentiate this channel from others.
 * @const
 * @type {string}
 * @private
 */
wtf.ipc.MessageChannel.LOCAL_ID_ =
    String(Number(wtf.trace.util.dateNow() + 10000));


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
 * @param {!Event} e Event.
 * @private
 */
wtf.ipc.MessageChannel.prototype.handleMessage_ = function(e) {
  var packet = /** @type {wtf.ipc.MessageChannel.Packet} */ (e.data);
  if (!packet || !packet[wtf.ipc.MessageChannel.PACKET_TOKEN]) {
    return;
  }

  // Don't allow the event to be dispatched again.
  // Note that MessageEvent is not cancelable, so we try to ignore it too.
  e.stopPropagation();
  wtf.trace.util.ignoreEvent(e);

  // Ignore any messages from ourselves.
  if (packet[wtf.ipc.MessageChannel.SENDER_TOKEN_] ==
      wtf.ipc.MessageChannel.LOCAL_ID_) {
    return;
  }

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
  packet[wtf.ipc.MessageChannel.SENDER_TOKEN_] =
      wtf.ipc.MessageChannel.LOCAL_ID_;

  // Always call the uninstrumented version.
  var postMessage =
      this.sendPort_.postMessage['raw'] || this.sendPort_.postMessage;

  // Actual post.
  if (this.hasTransferablePostMessage_ === undefined && opt_transferrables) {
    // Attempt to send with transferrables, otherwise fallback and disable it
    // for future attempts.
    try {
      postMessage.call(this.sendPort_, packet, '*', opt_transferrables);
      // Data has been sent!
      this.hasTransferablePostMessage_ = true;
    } catch (e) {
      // Send failed - try without transferrables.
      this.hasTransferablePostMessage_ = false;
      postMessage.call(this.sendPort_, packet, '*');
    }
  } else if (this.hasTransferablePostMessage_) {
    postMessage.call(this.sendPort_, packet, '*', opt_transferrables);
  } else {
    postMessage.call(this.sendPort_, packet, '*');
  }
};
