/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Replay JavaScript event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.ReplayProvider');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.webidl');
goog.require('wtf.math.MersenneTwister');
goog.require('wtf.trace.ISessionListener');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');
goog.require('wtf.trace.util');
goog.require('wtf.util');
goog.require('wtf.util.FunctionBuilder');



/**
 * Provides in-depth recording and shims to make runtime code deterministic.
 * Performance numbers aren't as meaningful with this running as more event
 * hooks are added.
 *
 * @param {!wtf.trace.TraceManager} traceManager Trace manager.
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @implements {wtf.trace.ISessionListener}
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.ReplayProvider = function(traceManager, options) {
  goog.base(this, options);

  goog.asserts.assert(options.getBoolean('wtf.trace.replayable', false));

  // Error out the feature if not supported.
  goog.asserts.assert(wtf.util.FunctionBuilder.isSupported());
  if (!wtf.util.FunctionBuilder.isSupported()) {
    throw new Error(
        'Replay not supported; no "new Function()" support available.');
  }

  /**
   * The shared function builder object.
   * @type {!wtf.util.FunctionBuilder}
   * @private
   */
  this.functionBuilder_ = new wtf.util.FunctionBuilder();

  /**
   * Event used to track the random seed value.
   * Must be called at the start of every session.
   * @type {Function}
   * @private
   */
  this.randomSeedEvent_ = wtf.trace.events.createInstance(
      'wtf.replay#randomSeed(uint32 value)',
      wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_);

  this.injectDate_();
  this.injectEvents_();

  // Listen for sessions so that we can write header events/etc.
  traceManager.addListener(this);
};
goog.inherits(wtf.trace.providers.ReplayProvider, wtf.trace.Provider);


/**
 * Whether to hide events from the UI.
 * Useful to disable when debugging.
 * @type {boolean}
 * @const
 * @private
 */
wtf.trace.providers.ReplayProvider.HIDE_EVENTS_ = false;


/**
 * Default flag bitmask for events.
 * @type {number}
 * @const
 * @private
 */
wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_ =
    wtf.trace.providers.ReplayProvider.HIDE_EVENTS_ ?
        wtf.data.EventFlag.INTERNAL : 0;


/**
 * @override
 */
wtf.trace.providers.ReplayProvider.prototype.sessionStarted =
    function(session) {
  // Re-initialize the RNG with a new seed value and save it off.
  this.initializeRandom_();

  // TODO(benvanik): attach the global event listeners.
};


/**
 * @override
 */
wtf.trace.providers.ReplayProvider.prototype.sessionStopped =
    function(session) {
  // TODO(benvanik): detach the global event listeners.
};


/**
 * @override
 */
wtf.trace.providers.ReplayProvider.prototype.requestSnapshots =
    goog.nullFunction;


/**
 * @override
 */
wtf.trace.providers.ReplayProvider.prototype.reset =
    goog.nullFunction;


/**
 * Re-initializes the Math.random replacement.
 * This should be called at the start of each new session.
 * @private
 */
wtf.trace.providers.ReplayProvider.prototype.initializeRandom_ = function() {
  // Pick a seed value to use for the RNG.
  // We record this value so that the playback side can seed themselves.
  // TODO(benvanik): use the raw now()? Would save a single event.
  var seed = Date.now();

  // Record the used seed.
  this.randomSeedEvent_(seed);

  // Initialize a deterministic random number generator.
  var rng = new wtf.math.MersenneTwister(seed);

  // Swap out random with our version.
  goog.global['Math']['random'] = function deterministicRandom() {
    return rng.random();
  };
};


/**
 * Injects Date functions.
 * @private
 */
wtf.trace.providers.ReplayProvider.prototype.injectDate_ = function() {
  // We only emit a time advance event when the value queried is not the last
  // value emitted. This limits us to 1 event/ms, which is acceptable.
  // TODO(benvanik): solve the issues here around time advancing.
  //     For now we just disable this optimization and write all queries.
  //var lastDateQuery = 0;

  var advanceTimeEvent = wtf.trace.events.createInstance(
      'wtf.replay#advanceTime(uint32 value)',
      wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_);

  var originalDate = goog.global['Date'];
  var newDate = function() {
    if (!arguments.length) {
      return new originalDate(newDate['now']());
    } else if (arguments.length == 1) {
      return new originalDate(arguments[0]);
    } else {
      return new originalDate(
          arguments[0], arguments[1], arguments[2], arguments[3],
          arguments[4], arguments[5], arguments[6]);
    }
  };
  newDate.prototype = originalDate;
  this.injectFunction(goog.global, 'Date', newDate);

  newDate['parse'] = originalDate['parse'];
  newDate['UTC'] = originalDate['UTC'];
  newDate['now'] = function() {
    var time = originalDate.now();
    // TODO(benvanik): re-enable duplication optimization.
    advanceTimeEvent(time);
    // if (time != lastDateQuery) {
    //   lastDateQuery = time;
    //   advanceTimeEvent(time);
    // }
    return time;
  };

  newDate['now']['raw'] = function() {
    return originalDate['now']();
  };
};


/**
 * Injects window/document events to record them.
 * @private
 */
wtf.trace.providers.ReplayProvider.prototype.injectEvents_ = function() {
  // This will add capture handlers on to the Window and Document objects
  // that attempt to get all events so that we can dispatchEvent them in
  // the replay context.
  // This is different than the {@see wtf.trace.providers.DomProvider} as we
  // always want full argument data and want to be able to differentiate these
  // replay events from the normal ones.

  // This is the list of all objects that will have their events tracked.
  // It's used to build a complete map of event names and types that will be
  // listened for on the window.
  var allObjectNames = [
    'Document',
    'Window'
  ];
  goog.array.extend(allObjectNames, wtf.data.webidl.DOM_OBJECTS);
  var allEventTypes = wtf.data.webidl.getAllEventTypes(allObjectNames);

  // Inject the event handlers onto window for all event types.
  this.injectCaptureEvents_(goog.global, allEventTypes);
};


/**
 * Injects capturing event listeners for the given events.
 * @param {!Object} target Event listener that will have events added to it.
 * @param {!Object.<!Object>} eventTypes All events mapped by name to their type
 *     object.
 * @private
 */
wtf.trace.providers.ReplayProvider.prototype.injectCaptureEvents_ =
    function(target, eventTypes) {
  for (var eventName in eventTypes) {
    var eventType = eventTypes[eventName];

    // Generate event listener function.
    var listener = this.buildListener_(eventName, eventType);

    // Add capture event.
    // The hope is that we are the first thing to run, so we are the first to
    // be added.
    target.addEventListener(
        eventName, wtf.trace.util.ignoreListener(listener), true);
  }
};


// TODO(benvanik): move this into webidl with options for suffix and wtf event
//     type so that it can be shared with other providers.
/**
 * Builds a WTF event and listener function for a given event.
 * @param {string} eventName Event name, like 'click'.
 * @param {!Object} eventType Event type from {@see wtf.data.webidl}.
 * @return {!Function} Listener function.
 * @private
 */
wtf.trace.providers.ReplayProvider.prototype.buildListener_ =
    function(eventName, eventType) {
  // Generate the event signature.
  var signature = wtf.data.webidl.getEventSignature(
      'wtf.replay.dispatch', eventName, eventType);

  // Create instance event. We don't care about duration.
  var recordEvent = wtf.trace.events.createInstance(
      signature,
      wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_);

  // Create the function that actually captures the event data and event.
  // This will be passed as a listener to addEventListener.
  var builder = this.functionBuilder_;
  builder.begin();
  builder.addScopeVariable('getElementPath', wtf.util.getElementXPath);
  builder.addScopeVariable('recordEvent', recordEvent);
  builder.addArgument('e');

  // TODO(benvanik): de-dupe target/currentTarget/etc now.

  builder.append('  recordEvent(');

  var attributes = wtf.data.webidl.getEventAttributes(eventType);
  for (var n = 0; n < attributes.length; n++) {
    var attributeName = attributes[n].name;
    var attributeType = attributes[n].type;

    var line = '    ';
    switch (attributeType) {
      case 'dompath':
        line += 'getElementPath(e.' + attributeName + ')';
        break;
      default:
        line += 'e.' + attributeName;
        break;
    }

    if (n < attributes.length - 1) {
      line += ', ';
    }

    builder.append(line);
  }

  builder.append('    );');

  return builder.end('wtf.replay.dispatch#' + eventName + ':capture');
};
