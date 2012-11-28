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

goog.provide('wtf.trace.providers.TimingProvider');

goog.require('goog.array');
goog.require('wtf');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Provides the timing events common between browsers and node.js, such as
 * timers, rAF, etc.
 *
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.TimingProvider = function() {
  goog.base(this);

  this.injectTimeouts_();
  this.injectSetImmediate_();
  this.injectRequestAnimationFrame_();
};
goog.inherits(wtf.trace.providers.TimingProvider, wtf.trace.Provider);


/**
 * Injects setTimeout/setInterval/related functions.
 * @private
 */
wtf.trace.providers.TimingProvider.prototype.injectTimeouts_ = function() {
  // TODO(benvanik): would be nice to track timeoutIds so we could cancel
  // the flow that was started when the timeout was scheduled (or link it
  // to here so the user knows why).

  // window.setTimeout
  var setTimeoutEvent = wtf.trace.events.createInstance(
      'window#setTimeout(uint32 delay, uint32 timeoutId)');
  var setTimeoutCallbackEvent = wtf.trace.events.createScope(
      'window#setTimeout:callback(uint32 timeoutId)');
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
          var scope = setTimeoutCallbackEvent.enterScope(
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
        setTimeoutEvent.append(wtf.now(), delay, timeoutId);

        // Branch flow after the setTimeout so that the event order looks right.
        flow = wtf.trace.branchFlow();

        return timeoutId;
      });

  // window.clearTimeout
  var clearTimeoutEvent = wtf.trace.events.createInstance(
      'window#clearTimeout(uint32 timeoutId)');
  var originalClearTimeout = goog.global['clearTimeout'];
  this.injectFunction(goog.global, 'clearTimeout',
      function clearTimeout(timeoutId) {
        // Clear the timeout.
        originalClearTimeout.call(goog.global, timeoutId);

        // Append event.
        clearTimeoutEvent.append(wtf.now(), timeoutId);
      });

  // window.setInterval
  var setIntervalEvent = wtf.trace.events.createInstance(
      'window#setInterval(uint32 delay, uint32 intervalId)');
  var setIntervalCallbackEvent = wtf.trace.events.createScope(
      'window#setInterval:callback(uint32 intervalId)');
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
          var scope = setIntervalCallbackEvent.enterScope(
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
        setIntervalEvent.append(wtf.now(), delay, intervalId);

        // Branch flow after the setInterval so that the event order looks
        // right.
        flowRef[0] = wtf.trace.branchFlow();

        return intervalId;
      });

  // window.clearInterval
  var clearIntervalEvent = wtf.trace.events.createInstance(
      'window#clearInterval(uint32 intervalId)');
  var originalClearInterval = goog.global['clearInterval'];
  this.injectFunction(goog.global, 'clearInterval',
      function clearInterval(intervalId) {
        // Clear the interval.
        originalClearInterval.call(goog.global, intervalId);

        // Append event.
        clearIntervalEvent.append(wtf.now(), intervalId);
      });
};


/**
 * Injects setImmediate functions.
 * @private
 */
wtf.trace.providers.TimingProvider.prototype.injectSetImmediate_ = function() {
  // Only IE now, prefixed 'msSetImmediate'

  // window.setImmediate
  var originalSetImmediate = goog.global['msSetImmediate'];
  if (!originalSetImmediate) {
    return;
  }
  var setImmediateEvent = wtf.trace.events.createInstance(
      'window#setImmediate(uint32 immediateId)');
  var setImmediateCallbackEvent = wtf.trace.events.createScope(
      'window#setImmediate:callback(uint32 immediateId)');
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
          var scope = setImmediateCallbackEvent.enterScope(
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
        setImmediateEvent.append(wtf.now(), immediateId);

        // Branch flow after the setImmediate so that the event order looks
        // right.
        flow = wtf.trace.branchFlow();

        return immediateId;
      });

  // window.clearImmediate
  var clearImmediateEvent = wtf.trace.events.createInstance(
      'window#clearImmediate(uint32 immediateId)');
  var originalClearImmediate = goog.global['msClearInterval'];
  this.injectFunction(goog.global, 'msClearImmediate',
      function msClearImmediate(immediateId) {
        // Clear the interval.
        originalClearImmediate.call(goog.global, immediateId);

        // Append event.
        clearImmediateEvent.append(wtf.now(), immediateId);
      });
};


/**
 * A list of names used for requestAnimationFrame and cancelAnimationFrame.
 * @const
 * @type {!Array.<string>}
 * @private
 */
wtf.trace.providers.TimingProvider.RAF_NAMES_ = [
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
wtf.trace.providers.TimingProvider.prototype.injectRequestAnimationFrame_ =
    function() {
  // Due to fun JS closure capture rules these loops defer to other functions.

  // Events used by rAF - created once to prevent duplicates.
  var events = {
    frameStart: wtf.trace.events.createInstance(
        'timing.frameStart(uint32 number)'),
    frameEnd: wtf.trace.events.createInstance(
        'timing.frameEnd(uint32 number, uint32 duration)'),
    requestAnimationFrame: wtf.trace.events.createInstance(
        'window#requestAnimationFrame(uint32 handle)'),
    requestAnimationFrameCallback: wtf.trace.events.createScope(
        'window#requestAnimationFrame:callback(uint32 handle)'),
    cancelAnimationFrame: wtf.trace.events.createInstance(
        'window#cancelAnimationFrame(uint32 handle)')
  };

  // window.requestAnimationFrame
  // window.cancelAnimationFrame
  var rafNames = wtf.trace.providers.TimingProvider.RAF_NAMES_;
  for (var n = 0; n < rafNames.length / 2; n += 2) {
    var requestName = rafNames[n];
    var cancelName = rafNames[n + 1];
    if (goog.global[requestName]) {
      this.injectRequestAnimationFrameFn_(requestName, cancelName, events);
    }
  }
};


/**
 * Injects requestAnimationFrame.
 * @param {string} requestName Name of the requestAnimationFrame method.
 * @param {string} cancelName Name of the cancelAnimationFrame method.
 * @param {!Object.<!wtf.trace.EventType>} events rAF events.
 * @private
 */
wtf.trace.providers.TimingProvider.prototype.injectRequestAnimationFrameFn_ =
    function(requestName, cancelName, events) {
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
        events.frameStart.append(now, frameNumber);
      }

      var scope = events.requestAnimationFrameCallback.enterScope(
          now, flow, handleRef[0]);
      try {
        cb.apply(this, arguments);
      } finally {
        // If this is the last rAF of the frame, handle frame-end and list
        // resetting.
        if (frameRafs[frameRafs.length - 1] == handleRef[0]) {
          now = wtf.now();
          var duration = ((now - frameStart) * 1000) >>> 0;
          events.frameEnd.append(now, frameNumber, duration);
          frameRafs.length = 0;
        }

        scope.leave();
      }
    });
    handleRef[0] = handle;

    // Queue in pending rAF list.
    pendingRafs.push(handle);

    // Append event (making it easy to identify requestAnimationFrames).
    events.requestAnimationFrame.append(wtf.now(), handle);

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
    events.cancelAnimationFrame.append(wtf.now(), handle);
  };
  // NOTE: some browsers don't implement cancel.
  if (originalCancelAnimationFrame) {
    this.injectFunction(goog.global, cancelName, cancelAnimationFrame);
  }
};
