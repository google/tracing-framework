/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timing Javascript event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.TimingProvider');

goog.require('wtf');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.Timing');



/**
 * Provides the timing events common between browsers and node.js, such as
 * timers, rAF, etc.
 *
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.TimingProvider = function() {
  goog.base(this);

  this.injectFrameMarker_();
  this.injectTimeouts_();
  this.injectSetImmediate_();
  this.injectRequestAnimationFrame_();
};
goog.inherits(wtf.trace.TimingProvider, wtf.trace.Provider);


/**
 * Injects a frame marker that tries to guess render frames.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectFrameMarker_ = function() {
  // Try rAF first - this is the most accurate way.
  // It may cause side effects, but I'll ignore that for now.
  var hasRaf = false;
  for (var n = 0; n < wtf.trace.TimingProvider.RAF_NAMES_.length; n++) {
    var name = wtf.trace.TimingProvider.RAF_NAMES_[n];
    if (!goog.global[name]) {
      continue;
    }
    hasRaf = true;
    this.setupRafFrameMarker_(name);
    break;
  }

  if (!hasRaf) {
    // No rAF - fallback to setInterval guessing.
    var frameNumber = 0;
    goog.global.setInterval(function() {
      frameNumber++;
      wtf.trace.Timing.frameMarker.append(wtf.now(), frameNumber);
    }, 16);
  }
};


/**
 * Sets up a requestAnimationFrame-based frame marker.
 * @param {string} name Name of the requestAnimationFrame function.
 * @private
 */
wtf.trace.TimingProvider.prototype.setupRafFrameMarker_ = function(name) {
  var raf = goog.global[name];

  var frameNumber = 0;
  function appendFrameMarker(timestamp) {
    raf.call(goog.global, appendFrameMarker);
    frameNumber++;
    wtf.trace.Timing.frameMarker.append(timestamp, frameNumber);
  };
  raf.call(goog.global, appendFrameMarker);
};


/**
 * Injects setTimeout/setInterval/related functions.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectTimeouts_ = function() {
  // TODO(benvanik): would be nice to track timeoutIds so we could cancel
  // the flow that was started when the timeout was scheduled (or link it
  // to here so the user knows why).

  // window.setTimeout
  var originalSetTimeout = goog.global['setTimeout'];
  this.injectFunction(goog.global, 'setTimeout',
      function setTimeout(funcOrCode, delay) {
        // Some people pass args to setTimeout - this unfortunately complicates
        // things.
        var args = Array.prototype.slice.call(arguments, 2);

        // Hack to get the timeout ID in the closure.
        var timeoutIdRef = [-1];

        // Flow-spanning logic.
        var flow; // NOTE: flow is branched below so event order is correct
        var timeoutId = originalSetTimeout.call(goog.global, function() {
          var scope = wtf.trace.Timing.setTimeoutCallback.enterScope(
              wtf.now(), flow, timeoutIdRef[0]);
          try {
            // Support both functions and strings as callbacks.
            if (funcOrCode) {
              if (goog.isString(funcOrCode)) {
                eval(funcOrCode);
              } else {
                funcOrCode.apply(goog.global, args);
              }
            }
          } finally {
            scope.leave();
          }
        }, delay);
        timeoutIdRef[0] = timeoutId;

        // Append event (making it easy to identify setTimeouts).
        wtf.trace.Timing.setTimeout.append(wtf.now(), delay, timeoutId);

        // Branch flow after the setTimeout so that the event order looks right.
        flow = wtf.trace.branchFlow();

        return timeoutId;
      });

  // window.clearTimeout
  var originalClearTimeout = goog.global['clearTimeout'];
  this.injectFunction(goog.global, 'clearTimeout',
      function clearTimeout(timeoutId) {
        // Clear the timeout.
        originalClearTimeout.call(goog.global, timeoutId);

        // Append event.
        wtf.trace.Timing.clearTimeout.append(wtf.now(), timeoutId);
      });

  // window.setInterval
  var originalSetInterval = goog.global['setInterval'];
  this.injectFunction(goog.global, 'setInterval',
      function setInterval(funcOrCode, delay) {
        // Some people pass args to setInterval - this unfortunately complicates
        // things.
        var args = Array.prototype.slice.call(arguments, 2);

        // Hack to get the interval ID in the closure.
        var intervalIdRef = [-1];

        // Flow-spanning logic.
        // Note that the logic here is more complex than the logic for
        // setTimeout as the flow is continually reset.
        // NOTE: flow is branched below so event order is correct
        var flowRef = [];
        var intervalId = originalSetInterval.call(goog.global, function() {
          var scope = wtf.trace.Timing.setIntervalCallback.enterScope(
              wtf.now(), flowRef[0], intervalIdRef[0]);
          try {
            // Support both functions and strings as callbacks.
            if (funcOrCode) {
              if (goog.isString(funcOrCode)) {
                eval(funcOrCode);
              } else {
                funcOrCode.apply(goog.global, args);
              }
            }
          } finally {
            // Reset flow so that it shows as bouncing from this function.
            // This builds a nice chain with parenting.
            flowRef[0] = wtf.trace.branchFlow();
            scope.leave();
          }
        }, delay);
        intervalIdRef[0] = intervalId;

        // Append event (making it easy to identify setTimeouts).
        wtf.trace.Timing.setInterval.append(wtf.now(), delay, intervalId);

        // Branch flow after the setInterval so that the event order looks
        // right.
        flowRef[0] = wtf.trace.branchFlow();

        return intervalId;
      });

  // window.clearInterval
  var originalClearInterval = goog.global['clearInterval'];
  this.injectFunction(goog.global, 'clearInterval',
      function clearInterval(intervalId) {
        // Clear the interval.
        originalClearInterval.call(goog.global, intervalId);

        // Append event.
        wtf.trace.Timing.clearInterval.append(wtf.now(), intervalId);
      });
};


/**
 * Injects setImmediate functions.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectSetImmediate_ = function() {
  // Only IE now, prefixed 'msSetImmediate'

  // window.setImmediate
  var originalSetImmediate = goog.global['msSetImmediate'];
  if (!originalSetImmediate) {
    return;
  }
  this.injectFunction(goog.global, 'msSetImmediate',
      function msSetImmediate(funcOrCode) {
        // Some people pass args to setImmediate - this unfortunately
        // complicates things.
        var args = Array.prototype.slice.call(arguments, 2);

        // Hack to get the immediate ID in the closure.
        var immediateIdRef = [-1];

        // Flow-spanning logic.
        var flow; // NOTE: flow is branched below so event order is correct
        var immediateId = originalSetImmediate.call(goog.global, function() {
          var scope = wtf.trace.Timing.setImmediateCallback.enterScope(
              wtf.now(), flow, immediateIdRef[0]);
          try {
            // Support both functions and strings as callbacks.
            if (funcOrCode) {
              if (goog.isString(funcOrCode)) {
                eval(funcOrCode);
              } else {
                funcOrCode.apply(goog.global, args);
              }
            }
          } finally {
            scope.leave();
          }
        });
        immediateIdRef[0] = immediateId;

        // Append event (making it easy to identify setImmediates).
        wtf.trace.Timing.setImmediate.append(wtf.now(), immediateId);

        // Branch flow after the setImmediate so that the event order looks
        // right.
        flow = wtf.trace.branchFlow();

        return immediateId;
      });

  // window.clearImmediate
  var originalClearImmediate = goog.global['msClearInterval'];
  this.injectFunction(goog.global, 'msClearImmediate',
      function msClearImmediate(immediateId) {
        // Clear the interval.
        originalClearImmediate.call(goog.global, immediateId);

        // Append event.
        wtf.trace.Timing.clearImmediate.append(wtf.now(), immediateId);
      });
};


/**
 * A list of names used for requestAnimationFrame.
 * @const
 * @type {!Array.<string>}
 * @private
 */
wtf.trace.TimingProvider.RAF_NAMES_ = [
  'requestAnimationFrame',
  'mozRequestAnimationFrame',
  'msRequestAnimationFrame',
  'oRequestAnimationFrame',
  'webkitRequestAnimationFrame'
];


/**
 * A list of names used for cancelAnimationFrame.
 * @const
 * @type {!Array.<string>}
 * @private
 */
wtf.trace.TimingProvider.CANCEL_RAF_NAMES_ = [
  'cancelAnimationFrame',
  'mozCancelAnimationFrame',
  'msCAncelAnimationFrame',
  'oCancelAnimationFrame',
  'webkitCancelAnimationFrame'
];


/**
 * Injects rAF functions.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectRequestAnimationFrame_ = function() {
  // Due to fun JS closure capture rules these loops defer to other functions.

  // window.requestAnimationFrame
  for (var n = 0; n < wtf.trace.TimingProvider.RAF_NAMES_.length; n++) {
    var name = wtf.trace.TimingProvider.RAF_NAMES_[n];
    if (goog.global[name]) {
      this.injectRequestAnimationFrameFn_(name);
    }
  }

  // window.cancelAnimationFrame
  for (var n = 0; n < wtf.trace.TimingProvider.CANCEL_RAF_NAMES_.length; n++) {
    var name = wtf.trace.TimingProvider.CANCEL_RAF_NAMES_[n];
    if (goog.global[name]) {
      this.injectCancelAnimationFrameFn_(name);
    }
  }
};


/**
 * Injects requestAnimationFrame.
 * @param {string} name Name of the requestAnimationFrame method.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectRequestAnimationFrameFn_ =
    function(name) {
  var originalRequestAnimationFrame = goog.global[name];
  this.injectFunction(goog.global, name, function requestAnimationFrame(cb) {
    // Hack to get the handle in the closure.
    var handleRef = [-1];

    // Flow-spanning logic.
    var flow; // NOTE: flow is branched below so event order is correct
    var handle = originalRequestAnimationFrame.call(goog.global, function() {
      var scope = wtf.trace.Timing.requestAnimationFrameCallback.enterScope(
          wtf.now(), flow, handleRef[0]);
      try {
        cb.apply(this, arguments);
      } finally {
        scope.leave();
      }
    });
    handleRef[0] = handle;

    // Append event (making it easy to identify requestAnimationFrames).
    wtf.trace.Timing.requestAnimationFrame.append(wtf.now(), handle);

    // Branch flow after the requestAnimationFrame so that the event order looks
    // right.
    flow = wtf.trace.branchFlow();

    return handle;
  });
};


/**
 * Injects cancelAnimationFrame.
 * @param {string} name Name of the cancelAnimationFrame method.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectCancelAnimationFrameFn_ =
    function(name) {
  var originalClearAnimationFrame = goog.global[name];
  this.injectFunction(goog.global, name, function cancelAnimationFrame(handle) {
    // Clear the callback.
    originalClearAnimationFrame.call(goog.global, handle);

    // Append event.
    wtf.trace.Timing.clearAnimationFrame.append(wtf.now(), handle);
  });
};
