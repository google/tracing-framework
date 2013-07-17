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
goog.require('goog.events.EventType');
goog.require('wtf.ipc.MessageChannel');
goog.require('wtf.timing');
goog.require('wtf.trace.util');


/**
 * Connects to the window that opened this window, if any.
 * When running inside a Chrome extension this will connect to the background
 * page.
 * @param {!function(this: T, wtf.ipc.Channel)} callback Connect callback.
 * @param {T=} opt_scope Scope for the callback.
 * @template T
 */
wtf.ipc.connectToParentWindow = function(callback, opt_scope) {
  var chrome = goog.global['chrome'];
  if (chrome && chrome['runtime'] &&
      chrome['runtime']['getBackgroundPage']) {
    chrome['runtime']['getBackgroundPage'](function(backgroundPage) {
      var channel = new wtf.ipc.MessageChannel(window, backgroundPage);
      channel.postMessage({
        'hello': true
      });
      callback.call(opt_scope, channel);
    });
  } else {
    if (!window.opener) {
      wtf.timing.setImmediate(function() {
        callback.call(opt_scope, null);
      });
      return;
    }

    var channel = new wtf.ipc.MessageChannel(window, window.opener);
    channel.postMessage({
      'hello': true
    });
    wtf.timing.setImmediate(function() {
      callback.call(opt_scope, channel);
    });
  }
};


/**
 * Waits for a single child window to connect.
 * @param {!function(this: T, !wtf.ipc.Channel)} callback Connect callback.
 * @param {T=} opt_scope Scope for the callback.
 * @template T
 */
wtf.ipc.waitForChildWindow = function(callback, opt_scope) {
  var boundHandler = wtf.trace.util.ignoreListener(function(e) {
    if (e.data && e.data[wtf.ipc.MessageChannel.PACKET_TOKEN] &&
        e.data.data && e.data.data['hello'] == true) {
      e.stopPropagation();
      window.removeEventListener(
          goog.events.EventType.MESSAGE, boundHandler, true);

      goog.asserts.assert(e.source);
      var channel = new wtf.ipc.MessageChannel(window, e.source);
      callback.call(opt_scope, channel);
    }
  });
  window.addEventListener(
      goog.events.EventType.MESSAGE, boundHandler, true);
};


/**
 * Waits for a child window to connect.
 * This hooks the global message handler and sniffs for packets.
 * @param {!function(this: T, !wtf.ipc.Channel)} callback Connect callback.
 * @param {T=} opt_scope Scope for the callback.
 * @template T
 */
wtf.ipc.listenForChildWindows = function(callback, opt_scope) {
  var boundHandler = wtf.trace.util.ignoreListener(function(e) {
    if (e.data && e.data[wtf.ipc.MessageChannel.PACKET_TOKEN] &&
        e.data.data && e.data.data['hello'] == true) {
      e.stopPropagation();
      window.removeEventListener(
          goog.events.EventType.MESSAGE, boundHandler, true);

      goog.asserts.assert(e.source);
      var channel = new wtf.ipc.MessageChannel(window, e.source);
      callback.call(opt_scope, channel);
    }
  });
  window.addEventListener(
      goog.events.EventType.MESSAGE, boundHandler, true);
};
