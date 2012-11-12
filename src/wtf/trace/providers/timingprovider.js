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

goog.require('goog.array');
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

  this.injectTimeouts_();
  this.injectSetImmediate_();
  this.injectRequestAnimationFrame_();
};
goog.inherits(wtf.trace.TimingProvider, wtf.trace.Provider);


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
 * A list of names used for requestAnimationFrame and cancelAnimationFrame.
 * @const
 * @type {!Array.<string>}
 * @private
 */
wtf.trace.TimingProvider.RAF_NAMES_ = [
  'requestAnimationFrame', 'cancelAnimationFrame',
  'mozRequestAnimationFrame', 'mozCancelAnimationFrame',
  'msRequestAnimationFrame', 'msCAncelAnimationFrame',
  'oRequestAnimationFrame', 'oCancelAnimationFrame',
  'webkitRequestAnimationFrame', 'webkitCancelAnimationFrame'
];


/**
 * Injects rAF functions.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectRequestAnimationFrame_ = function() {
  // Due to fun JS closure capture rules these loops defer to other functions.

  // window.requestAnimationFrame
  // window.cancelAnimationFrame
  for (var n = 0; n < wtf.trace.TimingProvider.RAF_NAMES_.length / 2; n += 2) {
    var requestName = wtf.trace.TimingProvider.RAF_NAMES_[n];
    var cancelName = wtf.trace.TimingProvider.RAF_NAMES_[n + 1];
    if (goog.global[requestName]) {
      this.injectRequestAnimationFrameFn_(requestName, cancelName);
    }
  }
};


/**
 * Injects requestAnimationFrame.
 * @param {string} requestName Name of the requestAnimationFrame method.
 * @param {string} cancelName Name of the cancelAnimationFrame method.
 * @private
 */
wtf.trace.TimingProvider.prototype.injectRequestAnimationFrameFn_ =
    function(requestName, cancelName) {
  var frameNumber = 0;
  var frameStart = 0;
  var pendingRafs = [];
  var frameRafs = [];

  var originalRequestAnimationFrame = goog.global[requestName];
  var requestAnimationFrame = function requestAnimationFrame(cb) {
    // Hack to get the handle in the closure.
    var handleRef = [-1];

    // Flow-spanning logic.
    var flow; // NOTE: flow is branched below so event order is correct
    var handle = originalRequestAnimationFrame.call(goog.global, function() {
      var now = wtf.now();

      // If this is the first rAF of the frame, handle frame-start and list
      // swapping.
      if (!frameRafs.length) {
        frameNumber++;
        frameRafs.push.apply(frameRafs, pendingRafs);
        pendingRafs.length = 0;
        frameStart = now;
        wtf.trace.Timing.frameStart.append(now, frameNumber);
      }

      var scope = wtf.trace.Timing.requestAnimationFrameCallback.enterScope(
          now, flow, handleRef[0]);
      try {
        cb.apply(this, arguments);
      } finally {
        // If this is the last rAF of the frame, handle frame-end and list
        // resetting.
        if (frameRafs[frameRafs.length - 1] == handleRef[0]) {
          now = wtf.now();
          var duration = ((now - frameStart) * 1000) >>> 0;
          wtf.trace.Timing.frameEnd.append(now, frameNumber, duration);
          frameRafs.length = 0;
        }

        scope.leave();
      }
    });
    handleRef[0] = handle;

    // Queue in pending rAF list.
    pendingRafs.push(handle);

    // Append event (making it easy to identify requestAnimationFrames).
    wtf.trace.Timing.requestAnimationFrame.append(wtf.now(), handle);

    // Branch flow after the requestAnimationFrame so that the event order looks
    // right.
    flow = wtf.trace.branchFlow();

    return handle;
  };
  this.injectFunction(goog.global, requestName, requestAnimationFrame);

  var originalCancelAnimationFrame = goog.global[cancelName];
  var cancelAnimationFrame = function cancelAnimationFrame(handle) {
    // Remove from the rAF list.
    goog.array.remove(pendingRafs, handle);

    // Clear the callback.
    originalCancelAnimationFrame.call(goog.global, handle);

    // Append event.
    wtf.trace.Timing.cancelAnimationFrame.append(wtf.now(), handle);
  };
  // NOTE: some browsers don't implement cancel.
  if (originalCancelAnimationFrame) {
    this.injectFunction(goog.global, cancelName, cancelAnimationFrame);
  }
};
