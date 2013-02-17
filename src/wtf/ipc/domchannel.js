/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Custom DOM event-based IPC channel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ipc.DomChannel');

goog.require('goog.dom');
goog.require('wtf.ipc.Channel');
goog.require('wtf.trace.util');



/**
 * Custom DOM event-based IPC channel.
 * Enables somewhat-efficient communication with a content script via
 * custom DOM events.
 *
 * @param {!(Document|Element)} el Element to communicate on.
 * @param {string} eventType Event type name.
 * @constructor
 * @extends {wtf.ipc.Channel}
 */
wtf.ipc.DomChannel = function(el, eventType) {
  goog.base(this);

  /**
   * Port that onmessage is fired on.
   * @type {!(Document|Element)}
   * @private
   */
  this.el_ = el;

  /**
   * The event type name used when sending events.
   * @type {string}
   * @private
   */
  this.eventType_ = eventType;

  /**
   * Bound {@see #handleMessage_} call that will be ignored in the trace.
   * @type {!function(Event):(boolean|undefined)}
   * @private
   */
  this.boundHandleMessage_ = wtf.trace.util.ignoreListener(
      /** @type {function(Event):(boolean|undefined)} */ (
          goog.bind(this.handleMessage_, this)));
  this.el_.addEventListener(
      this.eventType_, this.boundHandleMessage_, false);
};
goog.inherits(wtf.ipc.DomChannel, wtf.ipc.Channel);


/**
 * @override
 */
wtf.ipc.DomChannel.prototype.disposeInternal = function() {
  this.el_.removeEventListener(
      this.eventType_, this.boundHandleMessage_, false);
  goog.base(this, 'disposeInternal');
};


/**
 * @typedef {{
 *   data: !Object
 * }}
 */
wtf.ipc.DomChannel.Packet;


/**
 * Unique token found in all packets.
 * @const
 * @type {string}
 */
wtf.ipc.DomChannel.PACKET_TOKEN = 'wtf_ipc_connect_token';


/**
 * Sender token.
 * @const
 * @type {string}
 */
wtf.ipc.DomChannel.SENDER_TOKEN = 'wtf_ipc_sender_token';


/**
 * A somewhat unique ID used to identify this end of the channel.
 * This prevents this channels own events from being detected.
 * @type {string}
 * @private
 */
wtf.ipc.DomChannel.LOCAL_ID_ = String(goog.now());


/**
 * @override
 */
wtf.ipc.DomChannel.prototype.isConnected = function() {
  return true;
};


/**
 * Handles incoming messages.
 * @param {!Event} e Incoming event.
 * @private
 */
wtf.ipc.DomChannel.prototype.handleMessage_ = function(e) {
  var detail = e['detail'];
  if (!detail) {
    return;
  }
  var packet = /** @type {wtf.ipc.DomChannel.Packet} */ (detail);
  if (!packet ||
      !packet[wtf.ipc.DomChannel.PACKET_TOKEN] ||
      packet[wtf.ipc.DomChannel.SENDER_TOKEN] == wtf.ipc.DomChannel.LOCAL_ID_) {
    return;
  }

  this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, packet['data']);
};


/**
 * @override
 */
wtf.ipc.DomChannel.prototype.postMessage = function(
    data, opt_transferrables) {
  // Create packet with callback ID so that we can track things.
  var packet = /** @type {!wtf.ipc.DomChannel.Packet} */ ({
    'data': data
  });
  packet[wtf.ipc.DomChannel.PACKET_TOKEN] = true;
  packet[wtf.ipc.DomChannel.SENDER_TOKEN] = wtf.ipc.DomChannel.LOCAL_ID_;

  // Actual post.
  var doc = goog.dom.getOwnerDocument(this.el_);
  var e = doc.createEvent('CustomEvent');
  e.initCustomEvent(this.eventType_, false, false, packet);
  this.el_.dispatchEvent(e);
};
