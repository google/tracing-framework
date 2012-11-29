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
goog.require('goog.events.EventHandler');
goog.require('wtf.ipc.Channel');



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
   * A somewhat unique ID used to identify this end of the channel.
   * This prevents this channels own events from being detected.
   * @type {string}
   * @private
   */
  this.localId_ = String(goog.now());

  /**
   * Event handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  this.eh_.listen(
      this.el_, this.eventType_, this.handleMessage_, false);
};
goog.inherits(wtf.ipc.DomChannel, wtf.ipc.Channel);


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
 * @override
 */
wtf.ipc.DomChannel.prototype.isConnected = function() {
  return true;
};


/**
 * Handles incoming messages.
 * @param {!goog.events.BrowserEvent} e Incoming event.
 * @private
 */
wtf.ipc.DomChannel.prototype.handleMessage_ = function(e) {
  var detail = e.getBrowserEvent()['detail'];
  if (!detail) {
    return;
  }
  var packet = /** @type {wtf.ipc.DomChannel.Packet} */ (detail);
  if (!packet ||
      !packet[wtf.ipc.DomChannel.PACKET_TOKEN] ||
      packet[wtf.ipc.DomChannel.SENDER_TOKEN] == this.localId_) {
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
  packet[wtf.ipc.DomChannel.SENDER_TOKEN] = this.localId_;

  // Actual post.
  var doc = goog.dom.getOwnerDocument(this.el_);
  var e = doc.createEvent('CustomEvent');
  e.initCustomEvent(this.eventType_, false, false, packet);
  this.el_.dispatchEvent(e);
};
