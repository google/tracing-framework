/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Utilities for timing functionality.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.timing.util');

goog.require('goog.array');


/**
 * Default fallback framerate, in frames/second.
 * @const
 * @type {number}
 */
wtf.timing.util.FRAMERATE = 60;


/**
 * Gets a {@code window} function by exhaustively checking all browser prefixes.
 * @param {string} specName camelCase name of the window function.
 * @return {?Function} The window function, if found.
 * @private
 */
wtf.timing.util.getWindowFunction_ = function(specName) {
  // Generate a list of all likely names.
  var capName = /** @type {string} */ (specName.replace(/^[a-z]/,
      function(match) {
        return match.toUpperCase();
      }));
  /** @type {Array.<string>} */
  var names = goog.array.map([
    null, 'webkit', 'moz', 'o', 'ms', 'Webkit', 'Moz', 'O', 'Ms'
  ], function(prefix) {
    return prefix ? prefix + capName : specName;
  });

  // Return the function, properly bound to window.
  for (var n = 0; n < names.length; n++) {
    var name = names[n];
    var fn = goog.global[name];
    if (!fn) {
      continue;
    }
    if (fn['raw']) {
      fn = fn['raw'];
    }
    return (function(fn) {
      return function() {
        return fn.apply(goog.global, arguments);
      };
    })(fn);
  }

  // Not found.
  return null;
};


/**
 * Gets the browser-supported requestAnimationFrame method or an equivalent.
 * @param {boolean=} opt_enableFallback Whether to enable fallback support. If
 *     true then even if requestAnimationFrame is not supported a function will
 *     be returned that simulates the behavior (with a performance penalty).
 * @return {?function(Function): number} An implementation of
 *     requestAnimationFrame.
 */
wtf.timing.util.getRequestAnimationFrame = function(opt_enableFallback) {
  var windowFunction = /** @type {?function(Function): number} */ (
      wtf.timing.util.getWindowFunction_('requestAnimationFrame'));
  if (windowFunction) {
    return windowFunction;
  }

  if (opt_enableFallback) {
    var setTimeout = goog.global.setTimeout['raw'] || goog.global.setTimeout;
    /**
     * Fallback function for requestAnimationFrame.
     * @param {Function} callback Callback to issue on tick.
     * @return {number} Cancellation handle.
     */
    return function(callback) {
      return setTimeout.call(
          goog.global, callback, 1000 / wtf.timing.util.FRAMERATE);
    };
  }

  return null;
};


/**
 * Gets the browser-supported cancelAnimationFrame method or an
 * equivalent.
 * @param {boolean=} opt_enableFallback Whether to enable fallback support. If
 *     true then even if cancelAnimationFrame is not supported a function
 *     will be returned that simulates the behavior.
 * @return {?function(number): void} An implementation of
 *     cancelRequestAnimationFrame.
 */
wtf.timing.util.getCancelAnimationFrame =
    function(opt_enableFallback) {
  var windowFunction = /** @type {?function(number): void} */ (
      wtf.timing.util.getWindowFunction_('cancelAnimationFrame') ||
      wtf.timing.util.getWindowFunction_('cancelRequestAnimationFrame'));
  if (windowFunction) {
    return windowFunction;
  }

  // If we have requestAnimationFrame but not cancel, we just return a no-op.
  if (!wtf.timing.util.getWindowFunction_('requestAnimationFrame')) {
    return goog.nullFunction;
  }

  if (opt_enableFallback) {
    var clearTimeout = goog.global.clearTimeout['raw'] ||
        goog.global.clearTimeout;
    /**
     * Fallback function for cancelRequestAnimationFrame.
     * @param {number} id The result of a previous {@code requestAnimationFrame}
     *     call.
     */
    return function(id) {
      clearTimeout(id);
    };
  }

  return null;
};
