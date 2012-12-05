/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WTF defines and utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf');


/**
 * Version identifier.
 * TODO(benvanik): something sane
 * @const
 * @type {number}
 */
wtf.VERSION = 1;


/**
 * @define {boolean} True if running under node. Guard all node code with this
 * define to ensure it does not leak into web code.
 */
wtf.NODE = false;


/**
 * @define {boolean} True to enable the tracing API.
 */
wtf.ENABLE_TRACING = true;


/**
 * Whether the runtime can provide high-resolution times.
 * @type {boolean}
 */
wtf.hasHighResolutionTimes =
    !!(goog.global['process'] && goog.global['process']['hrtime']) ||
    !!(goog.global['performance'] && (
        goog.global['performance']['now'] ||
        goog.global['performance']['webkitNow']));


/**
 * Returns the wall time that {@see wtf#now} is relative to.
 * This is often the page load time.
 *
 * @return {number} A time, in ms.
 */
wtf.timebase = (function() {
  if (wtf.NODE) {
    var timeValue = goog.global['process']['hrtime']();
    var timebase = timeValue[0] * 1000 + timeValue[1] / 1000000;
    return function() {
      return timebase;
    };
  }

  var navigationStart = 0;
  var performance = goog.global['performance'];
  if (performance && performance['timing']) {
    navigationStart = performance['timing']['navigationStart'];
  } else {
    navigationStart = +new Date();
  }
  return function() {
    return navigationStart;
  };
})();


/**
 * Returns a non-wall time timestamp in milliseconds.
 * If available this will use a high precision timer. Otherwise it will fall
 * back to the default browser time.
 *
 * The time value is relative to page navigation, not wall time. Only use it for
 * relative measurements.
 *
 * @return {number} A monotonically increasing timer with sub-millisecond
 *      resolution (if supported).
 */
wtf.now = (function() {
  if (wtf.NODE) {
    // TODO(benvanik): use node-microtime if available instead?
    var timebase = wtf.timebase();
    var hrtime = goog.global['process']['hrtime'];
    var lastTime = hrtime();
    return function() {
      var timeValue = hrtime();
      return (timeValue[0] * 1000 - timebase) + timeValue[1] / 1000000;
    };
  }

  // This dance is a little silly, but calling off of the closure object is
  // 2x+ faster than dereferencing the global and using a direct call instead of
  // a .call() is 2x+ on top of that.
  var performance = goog.global['performance'];
  if (performance && performance['now']) {
    return function() {
      return performance['now']();
    };
  } else if (performance && performance['webkitNow']) {
    return function() {
      return performance['webkitNow']();
    };
  } else {
    var timebase = wtf.timebase();
    if (!Date.now) {
      return function() {
        return +new Date() - timebase;
      };
    } else {
      return Date.now;
    }
  }
})();


goog.exportSymbol(
    'wtf.hasHighResolutionTimes',
    wtf.hasHighResolutionTimes);
goog.exportSymbol(
    'wtf.timebase',
    wtf.timebase);
goog.exportSymbol(
    'wtf.now',
    wtf.now);
