/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timing namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


goog.provide('wtf.timing');
goog.provide('wtf.timing.RunMode');

goog.require('wtf.timing.BrowserInterval');
goog.require('wtf.timing.RenderInterval');
goog.require('wtf.timing.RenderTimer');


/**
 * Number of milliseconds required to maintain ~30fps.
 * @const {number}
 */
wtf.timing.MILLISECONDS_30HZ = 33;


/**
 * Number of milliseconds required to maintain ~60fps.
 * @const {number}
 */
wtf.timing.MILLISECONDS_60HZ = 16;


/**
 * Shared render timer used for the RENDER run mode.
 * Initialized on first use.
 * @type {wtf.timing.RenderTimer}
 * @private
 */
wtf.timing.renderTimer_ = null;


/**
 * Timing run modes.
 * @enum {number}
 */
wtf.timing.RunMode = {
  /**
   * General timing that models browser setInterval behavior.
   */
  DEFAULT: 0,

  /**
   * Timing used for rendering - runs at exact periods and only when visible.
   */
  RENDERING: 1
};


/**
 * Starts a new interval in the given run mode.
 * This method models the browser {@code setInterval} with the added ability to
 * coalesce overlapping intervals whenever possible. Certain run modes, such as
 * {@see wtf.timing.RunMode#RENDERING} support using newer browser features
 * like {@code requestAnimationFrame} when available.
 *
 * @param {wtf.timing.RunMode} runMode Timing mode to run the interval in.
 * @param {number} delay Number of milliseconds to wait between callbacks.
 * @param {function(this:T, number): void} callback Callback issued on every
 *     interval tick and supplied with the current time.
 * @param {T=} opt_scope Optional scope to call the callback in.
 * @return {!wtf.timing.Handle} New interval handle.
 * @template T
 */
wtf.timing.setInterval = function(runMode, delay, callback, opt_scope) {
  var func = opt_scope ? goog.bind(callback, opt_scope) : callback;
  switch (runMode) {
    default:
    case wtf.timing.RunMode.DEFAULT:
      return new wtf.timing.BrowserInterval(func, delay);
    case wtf.timing.RunMode.RENDERING:
      if (!wtf.timing.renderTimer_) {
        wtf.timing.renderTimer_ = new wtf.timing.RenderTimer();
      }
      return wtf.timing.renderTimer_.setInterval(func);
  }
};


/**
 * Clears an active interval.
 * @param {wtf.timing.Handle} handle Interval handle to clear.
 */
wtf.timing.clearInterval = function(handle) {
  if (!handle) {
    return;
  }
  if (handle instanceof wtf.timing.RenderInterval) {
    if (!wtf.timing.renderTimer_) {
      return;
    }
    wtf.timing.renderTimer_.clearInterval(handle);

    // TODO(benvanik): dispose render timer when no more intervals.
  } else {
    handle.clear();
  }
};


/**
 * Sets a cancellable timeout.
 * @param {number} delay Delay, in ms.
 * @param {function(this:T)} callback Callback function.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.timing.setTimeout = (function() {
  var setTimeout = goog.global.setTimeout['raw'] || goog.global.setTimeout;
  return function(delay, callback, opt_scope) {
    setTimeout.call(goog.global, function() {
      callback.call(opt_scope);
    }, delay);
  };
})();


// TODO(benvanik): better setImmediate implementation
/**
 * Calls the given function as soon as possible.
 * @param {function(this:T)} callback Function to call.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.timing.setImmediate = (function() {
  var setTimeout = goog.global.setTimeout['raw'] || goog.global.setTimeout;
  return function(callback, opt_scope) {
    setTimeout.call(goog.global, function() {
      callback.call(opt_scope || goog.global);
    }, 0);
  };
})();


/**
 * A list of callbacks waiting for the next frame.
 * @type {!Array.<!{callback: !Function, scope: Object}>}
 * @private
 */
wtf.timing.waitingFrameCallbacks_ = [];


/**
 * Defers a call until the next frame.
 * On browsers that support it this will use {@code requestAnimationFrame}.
 * @param {function(this:T)} callback Callback function.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.timing.deferToNextFrame = function(callback, opt_scope) {
  if (!wtf.timing.renderTimer_) {
    wtf.timing.renderTimer_ = new wtf.timing.RenderTimer();
  }

  var needsRequest = wtf.timing.waitingFrameCallbacks_.length == 0;
  wtf.timing.waitingFrameCallbacks_.push({
    callback: callback,
    scope: opt_scope || null
  });
  if (needsRequest) {
    var intervalId = wtf.timing.renderTimer_.setInterval(function() {
      wtf.timing.renderTimer_.clearInterval(intervalId);
      wtf.timing.runDeferredCallbacks_();
    });
  }
};


/**
 * Runs deferred callbacks from {@see wtf.timing.deferToNextFrame}.
 * @private
 */
wtf.timing.runDeferredCallbacks_ = function() {
  var waiters = wtf.timing.waitingFrameCallbacks_;
  for (var n = 0; n < waiters.length; n++) {
    var waiter = waiters[n];
    waiter.callback.call(waiter.scope);
  }
  wtf.timing.waitingFrameCallbacks_.length = 0;
};
