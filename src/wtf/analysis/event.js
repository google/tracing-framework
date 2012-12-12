/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event node.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.Event');
goog.provide('wtf.analysis.FlowEvent');
goog.provide('wtf.analysis.ScopeEvent');
goog.provide('wtf.analysis.ZoneEvent');



/**
 * An individual event node in the database.
 * References an event type and all information about it (such as where and
 * when it occurred).
 *
 * Event nodes have a lifetime governed by views and may live much longer.
 * Applications can add additional information to events via the {@code tag}
 * property and so long as there is at least one view containing the event
 * it will stay alive.
 *
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {number} time Time of the event.
 * @param {Object} args Custom event arguments.
 * @constructor
 */
wtf.analysis.Event = function(eventType, zone, time, args) {
  // TODO(benvanik): make IDs listener-local?
  /**
   * DB-unique event ID.
   * @type {number}
   * @private
   */
  this.eventId_ = wtf.analysis.Event.nextEventId_++;

  /**
   * Event information.
   * @type {!wtf.analysis.EventType}
   */
  this.eventType = eventType;

  /**
   * Zone the event occurred in.
   * @type {wtf.analysis.Zone}
   */
  this.zone = zone;

  /**
   * Scope the event occurred in.
   * @type {wtf.analysis.Scope}
   */
  this.scope = null;

  /**
   * Time the event occurred at.
   * @type {number}
   */
  this.time = time;

  /**
   * Custom event arguments, if any.
   * @type {Object}
   */
  this.args = args;

  /**
   * Application-defined value that can be added to events.
   * If it implements {@see goog.disposable.IDisposable} then dispose will be
   * called on it when the event goes out of scope.
   * @type {*}
   */
  this.tag = null;
};


/**
 * Next event ID to assign.
 * Unique per session.
 * @type {number}
 * @private
 */
wtf.analysis.Event.nextEventId_ = 0;


/**
 * Gets a DB-unique event ID.
 * @return {number} A DB-unique event ID.
 */
wtf.analysis.Event.prototype.getId = function() {
  return this.eventId_;
};


/**
 * Gets the type of the event.
 * @return {!wtf.analysis.EventType} Event type.
 */
wtf.analysis.Event.prototype.getEventType = function() {
  return this.eventType;
};


/**
 * Gets the zone this event occurred in.
 * @return {wtf.analysis.Zone} Zone this event occurred in.
 */
wtf.analysis.Event.prototype.getZone = function() {
  return this.zone;
};


/**
 * Gets the scope this event occurred in.
 * @return {wtf.analysis.Scope} Scope this event occurred in.
 */
wtf.analysis.Event.prototype.getScope = function() {
  return this.scope;
};


/**
 * Sets the scope this event occurred in.
 * @param {wtf.analysis.Scope} value Scope this event occurred in.
 */
wtf.analysis.Event.prototype.setScope = function(value) {
  this.scope = value;
};


/**
 * Gets the time the event occurred at.
 * @return {number} Time.
 */
wtf.analysis.Event.prototype.getTime = function() {
  return this.time;
};


/**
 * Gets the custom event arguments, if any.
 * @return {Object} Event arguments.
 */
wtf.analysis.Event.prototype.getArguments = function() {
  return this.args;
};


/**
 * Gets the application-defined event tag, if any.
 * @return {*} Event tag.
 */
wtf.analysis.Event.prototype.getTag = function() {
  return this.tag;
};


/**
 * Sets the application-defined event tag, if any.
 * If it implements {@see goog.disposable.IDisposable} then dispose will be
 * called on it when the event goes out of scope.
 * @param {*} value New event tag value.
 */
wtf.analysis.Event.prototype.setTag = function(value) {
  if (this.tag == value) {
    return;
  }
  goog.dispose(this.tag);
  this.tag = value;
};


/**
 * Drops the event from memory.
 */
wtf.analysis.Event.prototype.drop = function() {
  this.setTag(null);
};


/**
 * Compares two events for sorting based on time and insertion order.
 * @param {!wtf.analysis.Event} a First event.
 * @param {!wtf.analysis.Event} b Second event.
 * @return {number} Sort value.
 */
wtf.analysis.Event.comparer = function(a, b) {
  if (a.time == b.time) {
    return a.eventId_ - b.eventId_;
  }
  return a.time - b.time;
};


goog.exportSymbol(
    'wtf.analysis.Event',
    wtf.analysis.Event);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'getId',
    wtf.analysis.Event.prototype.getId);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'getEventType',
    wtf.analysis.Event.prototype.getEventType);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'getZone',
    wtf.analysis.Event.prototype.getZone);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'getScope',
    wtf.analysis.Event.prototype.getScope);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'getTime',
    wtf.analysis.Event.prototype.getTime);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'getArguments',
    wtf.analysis.Event.prototype.getArguments);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'getTag',
    wtf.analysis.Event.prototype.getTime);
goog.exportProperty(
    wtf.analysis.Event.prototype, 'setTag',
    wtf.analysis.Event.prototype.getTime);



/**
 * Scope event.
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {number} time Wall-time of the event.
 * @param {Object} args Custom event arguments.
 * @param {!wtf.analysis.Scope} scopeValue Scope that was entered.
 * @constructor
 * @extends {wtf.analysis.Event}
 */
wtf.analysis.ScopeEvent = function(eventType, zone, time, args, scopeValue) {
  // We manually call base method instead of using goog.base because this method
  // is called often enough to have a major impact on load time in debug mode.
  wtf.analysis.Event.call(this, eventType, zone, time, args);
  this.scope = scopeValue;
};
goog.inherits(wtf.analysis.ScopeEvent, wtf.analysis.Event);


/**
 * Gets the scope this event pertains to.
 * @return {!wtf.analysis.Scope} Scope.
 */
wtf.analysis.ScopeEvent.prototype.getValue = function() {
  return /** @type {!wtf.analysis.Scope} */ (this.scope);
};


goog.exportSymbol(
    'wtf.analysis.ScopeEvent',
    wtf.analysis.ScopeEvent);
goog.exportProperty(
    wtf.analysis.ScopeEvent.prototype, 'getValue',
    wtf.analysis.ScopeEvent.prototype.getValue);



/**
 * Flow event.
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {number} time Wall-time of the event.
 * @param {Object} args Custom event arguments.
 * @param {!wtf.analysis.Flow} flow Flow.
 * @constructor
 * @extends {wtf.analysis.Event}
 */
wtf.analysis.FlowEvent = function(eventType, zone, time, args, flow) {
  goog.base(this, eventType, zone, time, args);

  /**
   * Flow.
   * @type {!wtf.analysis.Flow}
   */
  this.value = flow;
};
goog.inherits(wtf.analysis.FlowEvent, wtf.analysis.Event);


/**
 * Gets the flow this event pertains to.
 * @return {!wtf.analysis.Flow} Flow.
 */
wtf.analysis.FlowEvent.prototype.getValue = function() {
  return this.value;
};


goog.exportSymbol(
    'wtf.analysis.FlowEvent',
    wtf.analysis.FlowEvent);
goog.exportProperty(
    wtf.analysis.FlowEvent.prototype, 'getValue',
    wtf.analysis.FlowEvent.prototype.getValue);



/**
 * Zone event.
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {number} time Wall-time of the event.
 * @param {Object} args Custom event arguments.
 * @param {!wtf.analysis.Zone} zoneValue Zone.
 * @constructor
 * @extends {wtf.analysis.Event}
 */
wtf.analysis.ZoneEvent = function(eventType, zone, time, args, zoneValue) {
  goog.base(this, eventType, zone, time, args);

  /**
   * Zone.
   * @type {!wtf.analysis.Zone}
   */
  this.value = zoneValue;
};
goog.inherits(wtf.analysis.ZoneEvent, wtf.analysis.Event);


/**
 * Gets the zone this event pertains to.
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.ZoneEvent.prototype.getValue = function() {
  return this.value;
};


goog.exportSymbol(
    'wtf.analysis.ZoneEvent',
    wtf.analysis.ZoneEvent);
goog.exportProperty(
    wtf.analysis.ZoneEvent.prototype, 'getValue',
    wtf.analysis.ZoneEvent.prototype.getValue);
