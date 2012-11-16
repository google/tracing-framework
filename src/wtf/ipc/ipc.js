/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Browser simple IPC.
 * There should only be one channel open at a time.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ipc');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('wtf.ipc.MessageChannel');


/**
 * Connects to the window that opened this window, if any.
 * @return {wtf.ipc.Channel} IPC channel.
 */
wtf.ipc.connectToParentWindow = function() {
  if (!window.opener) {
    return null;
  }
  var channel = new wtf.ipc.MessageChannel(window, window.opener);
  channel.postMessage({
    'hello': true
  });
  return channel;
};


/**
 * Waits for a child window to connect.
 * This hooks the global message handler and sniffs for packets.
 * @param {!function(!wtf.ipc.Channel)} callback Connect callback.
 * @param {Object=} opt_scope Scope for the callback.
 */
wtf.ipc.listenForChildWindows = function(callback, opt_scope) {
  goog.events.listen(
      window,
      goog.events.EventType.MESSAGE,
      /**
       * @param {!goog.events.BrowserEvent} browserEvent Event.
       */
      function(browserEvent) {
        var e = browserEvent.getBrowserEvent();
        if (e.data && e.data[wtf.ipc.MessageChannel.PACKET_TOKEN] &&
            e.data.data && e.data.data['hello'] == true) {
          e.stopPropagation();

          goog.asserts.assert(e.source);
          var channel = new wtf.ipc.MessageChannel(window, e.source);
          callback.call(opt_scope, channel);
        }
      },
      true);
};
