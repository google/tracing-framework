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
 * Create a high performance time function from window.performance, if present.
 * @return {number} A time, in ms.
 * @private
 */
wtf.performanceNow_ = (function() {
  var performance = goog.global['performance'];
  if (performance && performance['now']) {
    return function() {
      return performance['now']();
    };
  } else if (performance && performance['webkitNow']) {
    return function() {
      return performance['webkitNow']();
    };
  }
  return undefined;
})();


/**
 * Calculates a base time when using window.performance instead of using
 * performance.timing.navigationStart. There are two reasons to do this:
 * 1) navigationStart is an integer number of ms so navigationStart +
 *    performance.now() will be off by some unknown value between 0 and 1 ms
 *    (compared to other high precision wall clock measurements like gc events)
 * 2) performance.now is based on a monotonic clock, so there's some risk
 *    that it falls out of sync with wall time.
 * We have a javascript way to access wall time - Date.now - but Date.now is
 * only ms precision, so what we do here is query Date.now in a tight loop to
 * find the edge of a ms, and then use THAT to calculate a base time which can
 * be used with performance.now to get absolute times that are in sync with
 * external time measurements.
 * @return {number} An appropriate high precision base time to use with
 *     performance.now.
 * @private
 */
wtf.computeHighPrecissionTimebase_ = function() {
  var initialDateNow = Date.now();
  var syncedDateNow;
  var syncedPerfNow;
  // We limit the loop iterations to make sure we don't accidentaly infinite
  // loop under some unnexpected behavior of Date.now. This should be plenty to
  // reach a new millisecond because this loop can do on the order of 10k
  // iterations per ms (250k gives some room for faster machines).
  for (var i = 0; i < 250000; i++) {
    syncedDateNow = Date.now();
    if (syncedDateNow != initialDateNow) {
      syncedPerfNow = wtf.performanceNow_();
      break;
    }
  }
  return syncedDateNow - syncedPerfNow;
};


/**
 * Returns the wall time that {@see wtf#now} is relative to.
 * This is often the page load time.
 *
 * @return {number} A time, in ms.
 */
wtf.timebase = (function() {
  var timebase;

  if (wtf.NODE) {
    var timeValue = goog.global['process']['hrtime']();
    timebase = timeValue[0] * 1000 + timeValue[1] / 1000000;
  } else {
    if (wtf.performanceNow_) {
      timebase = wtf.computeHighPrecissionTimebase_();
    } else {
      timebase = Date.now();
    }
  }

  return function() {
    return timebase;
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
  if (wtf.performanceNow_) {
    return wtf.performanceNow_;
  } else {
    var timebase = wtf.timebase();
    if (!Date.now) {
      return function() {
        return Date.now() - timebase;
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
