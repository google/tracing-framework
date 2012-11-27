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

goog.require('wtf.analysis.FilterOperation');
goog.require('wtf.analysis.Zone');
goog.require('wtf.events.EventEmitter');



/**
 * Trace listener base type.
 * Consumers of the analysis framework should subclass this to receive events
 * from the trace session. It provides filtering and efficient dispatch of
 * events and hooks for custom provider extensions.
 *
 * @param {wtf.analysis.FilterOperation=} opt_defaultOperation Default filtering
 *     operation.
 * @param {Array.<!wtf.analysis.Filter>=} opt_filters A list of filters.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.analysis.TraceListener = function(opt_defaultOperation, opt_filters) {
  goog.base(this);

  /**
   * Default filtering operation.
   * @type {wtf.analysis.FilterOperation}
   * @private
   */
  this.defaultOperation_ = goog.isDef(opt_defaultOperation) ?
      opt_defaultOperation : wtf.analysis.FilterOperation.INCLUDE;

  /**
   * Filters applied to the entries.
   * @type {!Array.<!wtf.analysis.Filter>}
   * @private
   */
  this.filters_ = opt_filters || [];

  // TODO(benvanik): add registered provider listeners

  /**
   * All zones, indexed by zone key.
   * @type {!Object.<!wtf.analysis.Zone>}
   * @private
   */
  this.allZones_ = {};
};
goog.inherits(wtf.analysis.TraceListener, wtf.events.EventEmitter);


/**
 * Gets the default filtering operation.
 * @return {wtf.analysis.FilterOperation} Default filtering operation.
 */
wtf.analysis.TraceListener.prototype.getDefaultFilterOperation = function() {
  return this.defaultOperation_;
};


/**
 * Gets a list of filters to apply to events.
 * @return {!Array.<!wtf.analysis.Filter>} Filters.
 */
wtf.analysis.TraceListener.prototype.getFilters = function() {
  return this.filters_;
};


/**
 * Creates a new zone or gets an existing one if a matching zone already exists.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.TraceListener.prototype.createOrGetZone = function(
    name, type, location) {
  var key = name + ':' + type + ':' + location;
  var value = this.allZones_[key];
  if (!value) {
    value = new wtf.analysis.Zone(name, type, location);
    this.allZones_[key] = value;
  }
  return value;
};


// TODO(benvanik): real source type
/**
 * Signals that a new event source was added.
 * @param {number} timebase Timebase.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 */
wtf.analysis.TraceListener.prototype.sourceAdded = function(
    timebase, contextInfo) {
  this.emitEvent(wtf.analysis.TraceListener.EventType.SOURCE_ADDED,
      timebase, contextInfo);
};


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


/**
 * Event type values for the events dispatched on trace listeners.
 * @enum {string}
 */
wtf.analysis.TraceListener.EventType = {
  /**
   * Args: [timebase, wtf.data.ContextInfo]
   */
  SOURCE_ADDED: 'sourceAdded',

  /**
   * Args: [wtf.analysis.Event]
   */
  DISCONTINUITY: 'wtf.discontinuity',

  /**
   * Args: [wtf.analysis.ZoneEvent]
   */
  CREATE_ZONE: 'wtf.zone.create',

  /**
   * Args: [wtf.analysis.ZoneEvent]
   */
  DELETE_ZONE: 'wtf.zone.delete',

  /**
   * Args: [wtf.analysis.ScopeEvent]
   */
  ENTER_SCOPE: 'wtf.scope.enter',

  /**
   * Args: [wtf.analysis.ScopeEvent]
   */
  LEAVE_SCOPE: 'wtf.scope.leave',

  /**
   * Args: [wtf.analysis.FlowEvent]
   */
  BRANCH_FLOW: 'wtf.flow.branch',

  /**
   * Args: [wtf.analysis.FlowEvent]
   */
  EXTEND_FLOW: 'wtf.flow.extend',

  /**
   * Args: [wtf.analysis.FlowEvent]
   */
  TERMINATE_FLOW: 'wtf.flow.terminate',

  /**
   * Args: [wtf.analysis.Event]
   */
  MARK: 'wtf.mark',

  /**
   * Args: [wtf.analysis.Event]
   */
  CUSTOM: 'custom'
};
