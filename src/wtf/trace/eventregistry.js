/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview A registry of event types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.EventRegistry');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.trace.EventTypeBuilder');



/**
 * Event registry.
 * Handles the registration of events and dispatching of notifications when
 * they are registered.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.trace.EventRegistry = function() {
  goog.base(this);

  /**
   * A 'pointer' to the current session.
   * This is kept in sync with {@see #currentSession_} and is used to allow
   * for resetting the session in generated closures.
   * @type {!Array.<wtf.trace.Session>}
   * @private
   */
  this.currentSessionPtr_ = [null];

  /**
   * A list of all registered events.
   * @type {!Array.<!wtf.trace.EventType>}
   * @private
   */
  this.eventTypes_ = [];

  /**
   * All events mapped by their name.
   * This is primarily used for duplication checks.
   * @type {!Object.<!wtf.trace.EventType>}
   * @private
   */
  this.eventTypesByName_ = {};
};
goog.inherits(wtf.trace.EventRegistry, wtf.events.EventEmitter);


/**
 * Gets the current session pointer.
 * @return {!Array.<wtf.trace.Session>} Current session pointer.
 */
wtf.trace.EventRegistry.prototype.getSessionPtr = function() {
  return this.currentSessionPtr_;
};


/**
 * Registers a new event type.
 * @param {!wtf.trace.EventType} eventType Event type to register.
 */
wtf.trace.EventRegistry.prototype.registerEventType = function(eventType) {
  goog.asserts.assert(!this.eventTypesByName_[eventType.name]);
  if (this.eventTypesByName_[eventType.name]) {
    return;
  }

  this.eventTypes_.push(eventType);
  this.eventTypesByName_[eventType.name] = eventType;

  this.eventTypeBuilder_ = new wtf.trace.EventTypeBuilder();
  eventType.generateCode(this.eventTypeBuilder_, this.currentSessionPtr_);

  this.emitEvent(wtf.trace.EventRegistry.EventType.EVENT_TYPE_REGISTERED,
      eventType);
};


/**
 * Event types.
 * @enum {string}
 */
wtf.trace.EventRegistry.EventType = {
  EVENT_TYPE_REGISTERED: goog.events.getUniqueId('etr')
};


/**
 * Gets a list of all currently registered event types.
 * @return {!Array.<!wtf.trace.EventType>} A list of currently registered
 *     events. Do not modified.
 */
wtf.trace.EventRegistry.prototype.getEventTypes = function() {
  return this.eventTypes_;
};


/**
 * Gets the event type with the given name.
 * @param {string} name Event name.
 * @return {wtf.trace.EventType} The event type with the given name, if it
 *     exists.
 */
wtf.trace.EventRegistry.prototype.getEventType = function(name) {
  return this.eventTypesByName_[name] || null;
};


/**
 * A shared event registry singleton.
 * Initialized on first call to {@see #getShared}.
 * @type {wtf.trace.EventRegistry}
 * @private
 */
wtf.trace.EventRegistry.sharedInstance_ = null;


/**
 * Gets the shared event registry.
 * @return {!wtf.trace.EventRegistry} Event registry.
 */
wtf.trace.EventRegistry.getShared = function() {
  if (!wtf.trace.EventRegistry.sharedInstance_) {
    wtf.trace.EventRegistry.sharedInstance_ = new wtf.trace.EventRegistry();
  }
  return wtf.trace.EventRegistry.sharedInstance_;
};
