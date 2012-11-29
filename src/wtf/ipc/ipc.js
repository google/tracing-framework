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
goog.require('wtf.ipc.ExtensionChannel');
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
 * Waits for a single child window to connect.
 * @param {!function(this: T, !wtf.ipc.Channel)} callback Connect callback.
 * @param {T=} opt_scope Scope for the callback.
 * @template T
 */
wtf.ipc.waitForChildWindow = function(callback, opt_scope) {
  var key = goog.events.listen(
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
          goog.events.unlistenByKey(key);

          goog.asserts.assert(e.source);
          var channel = new wtf.ipc.MessageChannel(window, e.source);
          callback.call(opt_scope, channel);
        }
      },
      true);
};


/**
 * Waits for a child window to connect.
 * This hooks the global message handler and sniffs for packets.
 * @param {!function(this: T, !wtf.ipc.Channel)} callback Connect callback.
 * @param {T=} opt_scope Scope for the callback.
 * @template T
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


/**
 * Connects to the extension with the given ID.
 * @param {string} extensionId Target extension ID.
 * @return {wtf.ipc.ExtensionChannel} Extension channel, if the other extension
 *     is installed.
 */
wtf.ipc.connectToExtension = function(extensionId) {
  var port = chrome.extension.connect(extensionId);
  if (!port) {
    return null;
  }
  var channel = new wtf.ipc.ExtensionChannel(port);
  return channel;
};
