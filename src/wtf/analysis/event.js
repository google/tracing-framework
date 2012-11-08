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
 * @param {wtf.analysis.Scope} scope Scope the event ocurred in.
 * @param {number} time Wall-time of the event.
 * @param {Object} args Custom event arguments.
 * @constructor
 */
wtf.analysis.Event = function(eventType, zone, scope, time, args) {
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
  this.scope = scope;

  /**
   * Wall-time the event occurred at.
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
 * Drops the event from memory.
 */
wtf.analysis.Event.prototype.drop = function() {
  goog.dispose(this.tag);
  this.tag = null;
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



/**
 * Scope event.
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {wtf.analysis.Scope} scope Scope the event ocurred in.
 * @param {number} time Wall-time of the event.
 * @param {Object} args Custom event arguments.
 * @constructor
 * @extends {wtf.analysis.Event}
 */
wtf.analysis.ScopeEvent = function(eventType, zone, scope, time, args) {
  goog.base(this, eventType, zone, scope, time, args);
};
goog.inherits(wtf.analysis.ScopeEvent, wtf.analysis.Event);



/**
 * Flow event.
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {wtf.analysis.Scope} scope Scope the event ocurred in.
 * @param {number} time Wall-time of the event.
 * @param {Object} args Custom event arguments.
 * @param {!wtf.analysis.Flow} flow Flow.
 * @constructor
 * @extends {wtf.analysis.Event}
 */
wtf.analysis.FlowEvent = function(eventType, zone, scope, time, args, flow) {
  goog.base(this, eventType, zone, scope, time, args);

  /**
   * Flow.
   * @type {!wtf.analysis.Flow}
   */
  this.flow = flow;
};
goog.inherits(wtf.analysis.FlowEvent, wtf.analysis.Event);



/**
 * Zone event.
 * @param {!wtf.analysis.EventType} eventType Event information.
 * @param {wtf.analysis.Zone} zone Zone the event occurred in.
 * @param {wtf.analysis.Scope} scope Scope the event ocurred in.
 * @param {number} time Wall-time of the event.
 * @param {Object} args Custom event arguments.
 * @param {!wtf.analysis.Zone} zoneValue Zone.
 * @constructor
 * @extends {wtf.analysis.Event}
 */
wtf.analysis.ZoneEvent = function(eventType, zone, scope, time, args,
    zoneValue) {
  goog.base(this, eventType, zone, scope, time, args);

  /**
   * Zone.
   * @type {!wtf.analysis.Zone}
   */
  this.value = zoneValue;
};
goog.inherits(wtf.analysis.ZoneEvent, wtf.analysis.Event);
