/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace listener type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.TraceListener');

goog.require('wtf.analysis.EventType');
goog.require('wtf.analysis.Zone');
goog.require('wtf.data.EventFlag');
goog.require('wtf.events.EventEmitter');



/**
 * Trace listener base type.
 * Consumers of the analysis framework should subclass this to receive events
 * from the trace session.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.analysis.TraceListener = function() {
  goog.base(this);

  // TODO(benvanik): add registered provider listeners

  /**
   * A timebase used to calculate the time delay of each source.
   * This is set by the first source added and all subsequent sources use it.
   * This means that it's possible to end up with events with negative time.
   * A value of -1 indicates that the timebase has not yet been set.
   * @type {number}
   * @private
   */
  this.commonTimebase_ = -1;

  /**
   * All zones, indexed by zone key.
   * @type {!Object.<!wtf.analysis.Zone>}
   * @private
   */
  this.allZones_ = {};

  /**
   * The default zone.
   * This is the first zone created either explicitly via
   * {@see #createOrGetZone} or implicitly via {@see #getDefaultZone}.
   * @type {wtf.analysis.Zone}
   * @private
   */
  this.defaultZone_ = null;

  /**
   * Lookup table for all defined {@see wtf.analysis.EventType}s by event name.
   * @type {!Object.<wtf.analysis.EventType>}
   * @private
   */
  this.eventTable_ = {};

  // Add some built-in events.
  var builtinEvents = wtf.analysis.TraceListener.BuiltinEvents_;
  for (var n = 0; n < builtinEvents.length; n++) {
    this.eventTable_[builtinEvents[n].name] = builtinEvents[n];
  }
};
goog.inherits(wtf.analysis.TraceListener, wtf.events.EventEmitter);


/**
 * Builtin events.
 * This matches {@see wtf.trace.BuiltinEvents}.
 * This list does not need to be exhaustive - it's only here to enable trace
 * sources that want to omit defining built in events to function.
 * @type {!Array.<!wtf.analysis.EventType>}
 * @private
 */
wtf.analysis.TraceListener.BuiltinEvents_ = [
  wtf.analysis.EventType.createInstance(
      'wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
          'ascii name, ascii args)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  wtf.analysis.EventType.createInstance(
      'wtf.trace.#discontinuity()',
      wtf.data.EventFlag.BUILTIN),

  wtf.analysis.EventType.createInstance(
      'wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  wtf.analysis.EventType.createInstance(
      'wtf.zone#delete(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  wtf.analysis.EventType.createInstance(
      'wtf.zone#set(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  wtf.analysis.EventType.createScope(
      'wtf.scope#enter(ascii msg)',
      wtf.data.EventFlag.BUILTIN),
  wtf.analysis.EventType.createScope(
      'wtf.scope#enterTracing()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL |
      wtf.data.EventFlag.SYSTEM_TIME),
  wtf.analysis.EventType.createInstance(
      'wtf.scope#leave()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  wtf.analysis.EventType.createInstance(
      'wtf.flow#branch(flowId id, flowId parentId, ascii msg)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  wtf.analysis.EventType.createInstance(
      'wtf.flow#extend(flowId id, ascii msg)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  wtf.analysis.EventType.createInstance(
      'wtf.flow#terminate(flowId id, ascii msg)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  wtf.analysis.EventType.createInstance(
      'wtf.trace#mark(ascii name)',
      wtf.data.EventFlag.BUILTIN),
  wtf.analysis.EventType.createInstance(
      'wtf.trace#timeStamp(ascii name)')
];


/**
 * Gets the common timebase.
 * @return {number} The timebase or 0 if it has not been set.
 */
wtf.analysis.TraceListener.prototype.getCommonTimebase = function() {
  return this.commonTimebase_ == -1 ? 0 : this.commonTimebase_;
};


/**
 * Computes a time delay for the given source from the shared timebase.
 * If no timebase has been previously registered the given timebase will be set
 * as the shared one.
 * @param {number} timebase Source timebase.
 * @return {number} The time delay between the given timebase and the shared
 *     one.
 */
wtf.analysis.TraceListener.prototype.computeTimeDelay = function(timebase) {
  if (this.commonTimebase_ == -1) {
    this.commonTimebase_ = timebase;
    return 0;
  } else {
    return timebase - this.commonTimebase_;
  }
};


/**
 * Creates a new zone or gets an existing one if a matching zone already exists.
 * If a default zone was created previously this will be merged with that.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.TraceListener.prototype.createOrGetZone = function(
    name, type, location) {
  var key = name + ':' + type + ':' + location;

  // If there is a nameless default zone then merge with that.
  if (this.defaultZone_ && this.defaultZone_.name == '') {
    this.defaultZone_.name = name;
    this.defaultZone_.type = type;
    this.defaultZone_.location = location;
    this.allZones_[key] = this.defaultZone_;
    return this.defaultZone_;
  }

  // Lookup or create.
  var value = this.allZones_[key];
  if (!value) {
    value = new wtf.analysis.Zone(name, type, location);
    this.allZones_[key] = value;

    // Set the default zone to the first created.
    if (!this.defaultZone_) {
      this.defaultZone_ = value;
    }
  }
  return value;
};


/**
 * Gets the default zone.
 * If it doesn't exist it will be created.
 * @return {!wtf.analysis.Zone} The default zone.
 */
wtf.analysis.TraceListener.prototype.getDefaultZone = function() {
  if (!this.defaultZone_) {
    this.defaultZone_ = new wtf.analysis.Zone('', '', '');
  }
  return this.defaultZone_;
};


/**
 * Adds an event type to the event table.
 * If the event type is already defined the existing one is returned. If any of
 * the values differ an error is thrown.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @return {!wtf.analysis.EventType} The given event type or an existing one.
 */
wtf.analysis.TraceListener.prototype.defineEventType = function(eventType) {
  var existingEventType = this.eventTable_[eventType.name];
  if (!existingEventType) {
    this.eventTable_[eventType.name] = eventType;
    return eventType;
  }

  // TODO(benvanik): diff definitions

  return existingEventType;
};


/**
 * Gets the event type for the given event name.
 * @param {string} name Event name.
 * @return {wtf.analysis.EventType?} Event type, if found.
 */
wtf.analysis.TraceListener.prototype.getEventType = function(name) {
  return this.eventTable_[name] || null;
};


// TODO(benvanik): real source type
/**
 * Signals that a new event source was added.
 * @param {number} timebase Timebase.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 */
wtf.analysis.TraceListener.prototype.sourceAdded = goog.nullFunction;


/**
 * Begins a batch of events.
 * This will be called immediately before a new batch of events are dispatched.
 * All events dispatched will be from the given source.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 */
wtf.analysis.TraceListener.prototype.beginEventBatch = goog.nullFunction;


/**
 * Ends a batch of events.
 */
wtf.analysis.TraceListener.prototype.endEventBatch = goog.nullFunction;


/**
 * Signals an event in the stream.
 * This fires for all events that pass filtering, including built-in ones.
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {number} timebase Timebase.
 * @param {number} time Timebase-relative time of the event.
 * @param {!Object} args Custom event data.
 */
wtf.analysis.TraceListener.prototype.traceRawEvent = goog.nullFunction;


/**
 * Signals an event in the stream.
 * This fires for all events that pass filtering, including built-in ones.
 * @param {!wtf.analysis.Event} e Event.
 */
wtf.analysis.TraceListener.prototype.traceEvent = goog.nullFunction;
