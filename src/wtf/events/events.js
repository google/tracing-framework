/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Events utility namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events');

goog.require('goog.asserts');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('wtf.events.CommandManager');
goog.require('wtf.events.Keyboard');
goog.require('wtf.util');


/**
 * Alias for {@see wtf.events.Keyboard#getWindowKeyboard}.
 */
wtf.events.getWindowKeyboard = wtf.events.Keyboard.getWindowKeyboard;


/**
 * Alias for {@see wtf.events.CommandManager#getShared}.
 */
wtf.events.getCommandManager = wtf.events.CommandManager.getShared;


/**
 * Gets a shared {@see goog.dom.ViewportSizeMonitor} for the given window.
 * This should be used in place of {@code getInstanceForWindow}.
 *
 * A viewport size monitor acquired by this method must be released with
 * {@see #releaseViewportSizeMonitor}.
 *
 * @param {Window=} opt_window The window to monitor; defaults to the window in
 *    which this code is executing.
 * @return {!goog.dom.ViewportSizeMonitor} A viewport size monitor.
 */
wtf.events.acquireViewportSizeMonitor = function(opt_window) {
  var stash = wtf.util.getGlobalCacheObject('vsm', opt_window);
  var instance = stash.instance;
  if (!instance) {
    stash.count = 1;
    instance = stash.instance = new goog.dom.ViewportSizeMonitor(opt_window);
  } else {
    stash.count++;
  }
  return instance;
};


/**
 * Releases a previously acquired viewport size monitor.
 * @param {!goog.dom.ViewportSizeMonitor} instance Viewport size monitor.
 * @param {Window=} opt_window The window to monitor; defaults to the window in
 *    which this code is executing.
 */
wtf.events.releaseViewportSizeMonitor = function(instance, opt_window) {
  var stash = wtf.util.getGlobalCacheObject('vsm', opt_window);
  goog.asserts.assert(instance == stash.instance);
  if (stash.count) {
    stash.count--;
    if (!stash.count) {
      goog.dispose(stash.instance);
      stash.instance = null;
    }
  }
};
