/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timing JavaScript event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.TimingProvider');

goog.require('goog.array');
goog.require('wtf');
goog.require('wtf.data.EventFlag');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Provides the timing events common between browsers and node.js, such as
 * timers, rAF, etc.
 *
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.TimingProvider = function(options) {
  goog.base(this, options);

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
  // Flows, by timeout ID.
  var timeoutFlows = {};
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
          var scope = setTimeoutCallbackEvent(timeoutIdRef[0]);
          wtf.trace.extendFlow(flow, 'callback');
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
            delete timeoutFlows[timeoutIdRef[0]];
            wtf.trace.terminateFlow(flow);
            wtf.trace.leaveScope(scope);
          }
        }, delay);
        timeoutIdRef[0] = timeoutId;

        // Append event (making it easy to identify setTimeouts).
        setTimeoutEvent(delay, timeoutId);

        // Branch flow after the setTimeout so that the event order looks right.
        flow = wtf.trace.branchFlow('window#setTimeout');
        timeoutFlows[timeoutId] = flow;

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

        // Clear flow.
        var flow = timeoutFlows[timeoutId];
        if (flow) {
          wtf.trace.terminateFlow(flow);
          delete timeoutFlows[timeoutId];
        }

        // Append event.
        clearTimeoutEvent(timeoutId);
      });

  // window.setInterval
  var setIntervalEvent = wtf.trace.events.createInstance(
      'window#setInterval(uint32 delay, uint32 intervalId)');
  var setIntervalCallbackEvent = wtf.trace.events.createScope(
      'window#setInterval:callback(uint32 intervalId)');
  var originalSetInterval = goog.global['setInterval'];
  // Flows, by interval ID.
  var intervalFlows = {};
  this.injectFunction(goog.global, 'setInterval',
      function setInterval(funcOrCode, delay) {
        // Some people pass args to setInterval - this unfortunately complicates
        // things.
        var args = Array.prototype.slice.call(arguments, 2);

        // Hack to get the interval ID in the closure.
        var intervalIdRef = [-1];

        // Flow-spanning logic.
        var flow; // NOTE: flow is branched below so event order is correct
        var intervalId = originalSetInterval.call(goog.global, function() {
          var scope = setIntervalCallbackEvent(intervalIdRef[0]);
          wtf.trace.extendFlow(flow, 'callback');
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
            wtf.trace.leaveScope(scope);
          }
        }, delay);
        intervalIdRef[0] = intervalId;

        // Append event (making it easy to identify setTimeouts).
        setIntervalEvent(delay, intervalId);

        // Branch flow after the setInterval so that the event order looks
        // right.
        flow = wtf.trace.branchFlow('window#setInterval');
        intervalFlows[intervalId] = flow;

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

        // Clear flow.
        var flow = intervalFlows[intervalId];
        if (flow) {
          wtf.trace.terminateFlow(flow);
          delete intervalFlows[intervalId];
        }

        // Append event.
        clearIntervalEvent(intervalId);
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
  // Flows, by immediate ID.
  var immediateFlows = {};
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
          var scope = setImmediateCallbackEvent(immediateIdRef[0]);
          wtf.trace.extendFlow(flow, 'callback');
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
            delete immediateFlows[immediateIdRef[0]];
            wtf.trace.terminateFlow(flow);
            wtf.trace.leaveScope(scope);
          }
        });
        immediateIdRef[0] = immediateId;

        // Append event (making it easy to identify setImmediates).
        setImmediateEvent(immediateId);

        // Branch flow after the setImmediate so that the event order looks
        // right.
        flow = wtf.trace.branchFlow('window#setImmediate');
        immediateFlows[immediateId] = flow;

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

        // Clear flow.
        var flow = immediateFlows[immediateId];
        if (flow) {
          wtf.trace.terminateFlow(flow);
          delete immediateFlows[immediateId];
        }

        // Append event.
        clearImmediateEvent(immediateId);
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
  'msRequestAnimationFrame', 'msCancelAnimationFrame',
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
        'wtf.timing#frameStart(uint32 number)',
        wtf.data.EventFlag.INTERNAL),
    frameEnd: wtf.trace.events.createInstance(
        'wtf.timing#frameEnd(uint32 number)',
        wtf.data.EventFlag.INTERNAL),
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
  for (var n = 0; n < rafNames.length; n += 2) {
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
  var pendingRafs = [];
  var frameRafs = [];

  // Flows, by rAF ID.
  var rafFlows = {};

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
        events.frameStart(frameNumber, now);
      }

      var scope = events.requestAnimationFrameCallback(handleRef[0], now);
      wtf.trace.extendFlow(flow, 'callback');
      try {
        cb.apply(this, arguments);
      } finally {
        delete rafFlows[handleRef[0]];
        wtf.trace.terminateFlow(flow);
        wtf.trace.leaveScope(scope);

        // If this is the last rAF of the frame, handle frame-end and list
        // resetting.
        if (frameRafs[frameRafs.length - 1] == handleRef[0]) {
          now = wtf.now();
          events.frameEnd(frameNumber, now);
          frameRafs.length = 0;
        }
      }
    });
    handleRef[0] = handle;

    // Queue in pending rAF list.
    pendingRafs.push(handle);

    // Append event (making it easy to identify requestAnimationFrames).
    events.requestAnimationFrame(handle);

    // Branch flow after the requestAnimationFrame so that the event order looks
    // right.
    flow = wtf.trace.branchFlow('window#requestAnimationFrame');
    rafFlows[handle] = flow;

    return handle;
  };
  this.injectFunction(goog.global, requestName, requestAnimationFrame);

  var originalCancelAnimationFrame = goog.global[cancelName];
  var cancelAnimationFrame = function cancelAnimationFrame(handle) {
    // Remove from the rAF list.
    goog.array.remove(pendingRafs, handle);

    // Clear the callback.
    originalCancelAnimationFrame.call(goog.global, handle);

    // Clear flow.
    var flow = rafFlows[handle];
    if (flow) {
      wtf.trace.terminateFlow(flow);
      delete rafFlows[handle];
    }

    // Append event.
    events.cancelAnimationFrame(handle);
  };
  // NOTE: some browsers don't implement cancel.
  if (originalCancelAnimationFrame) {
    this.injectFunction(goog.global, cancelName, cancelAnimationFrame);
  }
};
