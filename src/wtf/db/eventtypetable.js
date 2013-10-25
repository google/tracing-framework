/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event type definition table.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.EventTypeTable');



/**
 * Event type definition table.
 * Provides management and lookup of event type definitions.
 *
 * @constructor
 */
wtf.db.EventTypeTable = function() {
  /**
   * The next ID to assign to a new event type.
   * 0 is reserved.
   * @type {number}
   * @private
   */
  this.nextTypeId_ = 1;

  /**
   * A list of all event types.
   * @type {!Array.<!wtf.db.EventType>}
   * @private
   */
  this.list_ = [];

  /**
   * All event types, keyed by event ID.
   * @type {!Array.<!wtf.db.EventType>}
   * @private
   */
  this.eventsById_ = [];

  /**
   * All event types, mapped by name.
   * @type {!Object.<!wtf.db.EventType>}
   * @private
   */
  this.eventsByName_ = Object.create(null);
};


/**
 * Adds an event type to the event table.
 * If the event type is already defined the existing one is returned. If any of
 * the values differ an error is thrown.
 * @param {!wtf.db.EventType} eventType Event type.
 * @return {!wtf.db.EventType} The given event type or an existing one.
 */
wtf.db.EventTypeTable.prototype.defineType = function(eventType) {
  var existingEventType = this.eventsByName_[eventType.name];
  if (!existingEventType) {
    eventType.id = this.nextTypeId_++;
    this.eventsById_[eventType.id] = eventType;
    this.eventsByName_[eventType.name] = eventType;
    this.list_.push(eventType);
    return eventType;
  }

  // TODO(benvanik): diff definitions

  return existingEventType;
};


/**
 * Gets a list of all event types.
 * @return {!Array.<!wtf.db.EventType>} List of event types. Do not modify.
 */
wtf.db.EventTypeTable.prototype.getAll = function() {
  return this.list_;
};


/**
 * Gets a list of events whose name matches the given regex.
 * @param {!RegExp} regex Regex.
 * @param {wtf.data.EventClass=} opt_class Event class type to return. Omit
 *     for all classes.
 * @return {!Array.<!wtf.db.EventType>} A list of matching events.
 */
wtf.db.EventTypeTable.prototype.getAllMatching = function(regex, opt_class) {
  var matches = [];
  for (var n = 0; n < this.list_.length; n++) {
    var eventType = this.list_[n];
    if (opt_class !== undefined &&
        eventType.eventClass !== opt_class) {
      continue;
    }
    if (regex.test(eventType.name)) {
      matches.push(eventType);
    }
  }
  return matches;
};


/**
 * Gets a set of event type IDs whose names match the given regex.
 * @param {!RegExp} regex Regex.
 * @return {!Object.<boolean>} A set of event type IDs whose names
 *     match the regex.
 */
wtf.db.EventTypeTable.prototype.getSetMatching = function(regex) {
  var matches = {};
  for (var n = 0; n < this.list_.length; n++) {
    var eventType = this.list_[n];
    if (regex.test(eventType.name)) {
      matches[eventType.id] = true;
    }
  }
  return matches;
};


/**
 * Gets the event type for the given event ID.
 * @param {number} id Event ID.
 * @return {wtf.db.EventType?} Event type, if found.
 */
wtf.db.EventTypeTable.prototype.getById = function(id) {
  return this.eventsById_[id] || null;
};


/**
 * Gets the event type for the given event name.
 * @param {string} name Event name.
 * @return {wtf.db.EventType?} Event type, if found.
 */
wtf.db.EventTypeTable.prototype.getByName = function(name) {
  return this.eventsByName_[name] || null;
};


goog.exportSymbol(
    'wtf.db.EventTypeTable',
    wtf.db.EventTypeTable);
goog.exportProperty(
    wtf.db.EventTypeTable.prototype, 'getAll',
    wtf.db.EventTypeTable.prototype.getAll);
goog.exportProperty(
    wtf.db.EventTypeTable.prototype, 'getAllMatching',
    wtf.db.EventTypeTable.prototype.getAllMatching);
goog.exportProperty(
    wtf.db.EventTypeTable.prototype, 'getByName',
    wtf.db.EventTypeTable.prototype.getByName);
