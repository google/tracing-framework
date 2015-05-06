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

/** @suppress {extraRequire} */
goog.require('wtf.version');


/**
 * @define {boolean} True if running under node. Guard all node code with this
 * define to ensure it does not leak into web code.
 */
wtf.NODE = false;


/**
 * @define {boolean} True to enable a 'min' build, which cuts out most expesive
 * or helpful features (error dialogs, human-friendly strings, etc).
 */
wtf.MIN_BUILD = false;


/**
 * @define {boolean} True to enable a 'prod' build, which essentially uses min
 * build, except that JSON format is used.
 */
wtf.PROD_BUILD = false;


/**
 * Whether the current code is running inside of a Chrome extension.
 * @type {boolean}
 */
wtf.CHROME_EXTENSION =
    goog.global['chrome'] &&
    chrome.runtime &&
    chrome.runtime.id;


/**
 * Stashed inline functions from {@see wtf.preventInlining}.
 * @type {!Array.<Function>}
 * @private
 */
wtf.dummyStore_ = [];


/**
 * Prevents jscompiler from inlining a function.
 * Call this from the global scope to prevent the given function from being
 * inlined into callers (and potentially breaking optimizations).
 * @param {Function} fn Function to prevent inlining on.
 */
wtf.preventInlining = function(fn) {
  wtf.dummyStore_.push(fn);
};


/**
 * Whether the runtime can provide high-resolution times.
 * If this is false times are likely in milliseconds and largely useless.
 * @type {boolean}
 */
wtf.hasHighResolutionTimes =
    wtf.NODE ||
    !!(goog.global['performance'] && (
        goog.global['performance']['now'] ||
        goog.global['performance']['webkitNow']));


/**
 * Creates a high performance time function from window.performance, if present.
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
wtf.computeHighPrecisionTimebase_ = function() {
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
    try {
      var microtime = require('microtime');
      timebase = microtime['nowDouble']() * 1000;
    } catch (e) {
      var timeValue = goog.global['process']['hrtime']();
      timebase = timeValue[0] * 1000 + timeValue[1] / 1000000;
    }
  } else {
    if (wtf.performanceNow_) {
      timebase = wtf.computeHighPrecisionTimebase_();
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
    var timebase = wtf.timebase();
    try {
      var microtime = require('microtime');
      return function wtfNowMicrotime() {
        return microtime['nowDouble']() * 1000 - timebase;
      };
    } catch (e) {
      var hrtime = goog.global['process']['hrtime'];
      return function wtfNowHrtime() {
        var timeValue = hrtime();
        return (timeValue[0] * 1000 - timebase) + timeValue[1] / 1000000;
      };
    }
  }

  // This dance is a little silly, but calling off of the closure object is
  // 2x+ faster than dereferencing the global and using a direct call instead of
  // a .call() is 2x+ on top of that.
  if (wtf.performanceNow_) {
    return wtf.performanceNow_;
  } else {
    var timebase = wtf.timebase();
    var now = Date.now;
    return function wtfNowDate() {
      return now() - timebase;
    };
  }
})();


/**
 * Runs a microbenchmark to try to compute the overhead of a call to
 * {@see wtf#now}.
 * @return {number} Estimated overhead, in nanoseconds (1/1000 us).
 */
wtf.computeNowOverhead = function() {
  // This is in a function so that v8 can JIT it easier.
  // We then run it a few times to try to factor out the JIT time.
  function computeInner(iterations) {
    var dummy = 0;
    for (var n = 0; n < iterations; n++) {
      // We don't have to worry about this being entirely removed (yet), as
      // JITs don't seem to consider now() as not having side-effects.
      dummy += wtf.now();
    }
    return dummy;
  };

  var iterations = 100000;
  var dummy = 0;
  var duration = 0;
  for (var n = 0; n < 10; n++) {
    var startTime = wtf.now();
    dummy += computeInner(iterations);
    duration = wtf.now() - startTime;
  }
  return (duration * 1000 * 1000 / iterations) | 0; // ms -> us -> ns
};


/**
 * Logs a deprecation message.
 * @param {string} message Message.
 */
wtf.deprecated = goog.global.console ?
    goog.global.console.log.bind(goog.global.console) :
    goog.nullFunction;


goog.exportSymbol(
    'wtf.hasHighResolutionTimes',
    wtf.hasHighResolutionTimes);
goog.exportSymbol(
    'wtf.timebase',
    wtf.timebase);
goog.exportSymbol(
    'wtf.now',
    wtf.now);
goog.exportSymbol(
    'wtf.computeNowOverhead',
    wtf.computeNowOverhead);
