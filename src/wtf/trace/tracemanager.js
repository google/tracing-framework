/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.ISessionListener');
goog.provide('wtf.trace.TraceManager');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('wtf');
goog.require('wtf.data.ContextInfo');
goog.require('wtf.data.ZoneType');
goog.require('wtf.trace.BuiltinEvents');
goog.require('wtf.trace.EventRegistry');
goog.require('wtf.trace.Zone');



/**
 * Session event listener.
 * @interface
 */
wtf.trace.ISessionListener = function() {};


/**
 * Fired when a session is started.
 * @param {!wtf.trace.Session} session Trace session.
 */
wtf.trace.ISessionListener.prototype.sessionStarted = goog.nullFunction;


/**
 * Fired when a session is stopped.
 * @param {!wtf.trace.Session} session Trace session.
 */
wtf.trace.ISessionListener.prototype.sessionStopped = goog.nullFunction;



/**
 * Trace manager.
 * Manages trace sessions.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.trace.TraceManager = function() {
  goog.base(this);

  /**
   * Session event listeners.
   * @type {!Array.<!wtf.trace.ISessionListener>}
   * @private
   */
  this.listeners_ = [];

  /**
   * All trace providers.
   * @type {!Array.<!wtf.trace.Provider>}
   * @private
   */
  this.providers_ = [];

  /**
   * The next ID to allocate for zone IDs.
   * @type {number}
   * @private
   */
  this.nextZoneId_ = 1;

  /**
   * Active zone stack.
   * The last element is the currently active zone.
   * @type {!Array.<!wtf.trace.Zone>}
   * @private
   */
  this.zoneStack_ = [];

  /**
   * All living zones.
   * These are all zones that have ever lived. This is used to send the zone
   * blob at the snapshot start. This could likely be made a lot smarter (ref
   * counting zones based on living IDs? zones used per buffer?) but it
   * shouldn't matter much.
   * @type {!Object.<!wtf.trace.Zone>}
   * @private
   */
  this.allZones_ = {};

  /**
   * Current trace session, if any.
   * There may only be one session at a time.
   * @type {wtf.trace.Session}
   * @private
   */
  this.currentSession_ = null;

  var registry = wtf.trace.EventRegistry.getShared();
  /**
   * A 'pointer' to the current session.
   * This is kept in sync with {@see #currentSession_} and is used to allow
   * for resetting the session in generated closures.
   * @type {!Array.<wtf.trace.Session>}
   * @private
   */
  this.currentSessionPtr_ = registry.getSessionPtr();

  // Listen for newly registered events.
  registry.addListener(
      wtf.trace.EventRegistry.EventType.EVENT_TYPE_REGISTERED,
      this.eventTypeRegistered_, this);

  // Create the default zone.
  var defaultZone = this.createZone(
      'Script',
      wtf.data.ZoneType.SCRIPT,
      wtf.NODE ? goog.global['process']['argv'][1] : goog.global.location.href);
  this.pushZone(defaultZone);
};
goog.inherits(wtf.trace.TraceManager, goog.Disposable);


/**
 * @override
 */
wtf.trace.TraceManager.prototype.disposeInternal = function() {
  this.stopSession();

  goog.disposeAll(this.providers_);
  this.providers_.length = 0;

  goog.base(this, 'disposeInternal');
};


/**
 * Detects context info.
 * It's best to do this at the time of snapshot so that information such
 * as window size/title/etc match the expected values.
 * @return {!wtf.data.ContextInfo} Detected context info.
 */
wtf.trace.TraceManager.prototype.detectContextInfo = function() {
  return wtf.data.ContextInfo.detect();
};


/**
 * Adds a session event listener.
 * @param {!wtf.trace.ISessionListener} listener Event listener.
 */
wtf.trace.TraceManager.prototype.addListener = function(listener) {
  this.listeners_.push(listener);

  // If there is a session, notify the listener.
  if (this.currentSession_) {
    listener.sessionStarted(this.currentSession_);
  }
};


/**
 * Adds a provider to the trace manager.
 * @param {!wtf.trace.Provider} provider Provider instance.
 */
wtf.trace.TraceManager.prototype.addProvider = function(provider) {
  this.providers_.push(provider);
};


/**
 * Gets a full list of trace providers.
 * @return {!Array.<!wtf.trace.Provider>} All trace providers. Don't modify.
 */
wtf.trace.TraceManager.prototype.getProviders = function() {
  return this.providers_;
};


/**
 * Creates a new execution zone.
 * Execution zones are used to group regions of code in the trace stream.
 * For example, one zone may be 'Page' to indicate all page JS and another
 * 'Worker' to show events from a web worker.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @return {!wtf.trace.Zone} Zone object used for future calls.
 */
wtf.trace.TraceManager.prototype.createZone = function(name, type, location) {
  // Create definition for tracking.
  var zone = new wtf.trace.Zone(
      this.nextZoneId_++, wtf.now(), name, type, location);
  this.allZones_[zone.id] = zone;

  // Append event.
  wtf.trace.BuiltinEvents.createZone(
      zone.id, zone.name, zone.type, zone.location, zone.timestamp);

  return zone;
};


/**
 * Deletes an execution zone.
 * @param {!wtf.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtf.trace.TraceManager.prototype.deleteZone = function(zone) {
  // Should never be deleting zones that are active.
  goog.asserts.assert(!goog.array.contains(this.zoneStack_, zone));

  // Append event.
  wtf.trace.BuiltinEvents.deleteZone(zone.id);

  // NOTE: zones are never deleted.
};


/**
 * Appends all zones to the given.
 * @param {!wtf.io.Buffer} buffer Buffer to write to.
 */
wtf.trace.TraceManager.prototype.appendAllZones = function(buffer) {
  // Note that since zone IDs are unique per stream it's ok if there are
  // multiple create events. Clients must dedupe these (and use the last created
  // time) or not show ones never referenced.
  for (var key in this.allZones_) {
    var zone = this.allZones_[key];
    // Note that we use 0 instead of zone.timestamp to prevent skewing traces
    wtf.trace.BuiltinEvents.createZone(
        zone.id, zone.name, zone.type, zone.location, 0, buffer);
  }

  var currentZone = this.getCurrentZone();
  if (currentZone) {
    wtf.trace.BuiltinEvents.setZone(currentZone.id, 0, buffer);
  }
};


/**
 * Pushes a new zone as active.
 * @param {!wtf.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtf.trace.TraceManager.prototype.pushZone = function(zone) {
  this.zoneStack_.push(zone);

  // Append event.
  // Note that we avoid doing clever things here around de-duping events
  // as the frequency of this should be low and snappshotting could cause
  // events to end up missing.
  wtf.trace.BuiltinEvents.setZone(zone.id);
};


/**
 * Pops the current zone.
 */
wtf.trace.TraceManager.prototype.popZone = function() {
  goog.asserts.assert(this.zoneStack_.length);
  this.zoneStack_.pop();

  // Append event.
  var zone = this.getCurrentZone();
  wtf.trace.BuiltinEvents.setZone(zone.id);
};


/**
 * Gets the current zone, if any.
 * @return {wtf.trace.Zone} Zone information, if a zone is active.
 */
wtf.trace.TraceManager.prototype.getCurrentZone = function() {
  return this.zoneStack_.length ?
      this.zoneStack_[this.zoneStack_.length - 1] : null;
};


/**
 * Gets the current tracing session.
 * Only valid if a recording session has been setup.
 * @return {wtf.trace.Session} The current trace session, if any.
 */
wtf.trace.TraceManager.prototype.getCurrentSession = function() {
  return this.currentSession_;
};


/**
 * Starts a new snapshotting session.
 * The session will snapshot the trace log when {@see wtf.trace#snapshot} is
 * called.
 *
 * @param {!wtf.trace.Session} session New session.
 */
wtf.trace.TraceManager.prototype.startSession = function(session) {
  goog.asserts.assert(!this.currentSession_);

  this.currentSession_ = session;
  this.currentSessionPtr_[0] = session;

  // Notify listeners.
  if (this.currentSession_) {
    for (var n = 0; n < this.listeners_.length; n++) {
      this.listeners_[n].sessionStarted(this.currentSession_);
    }
  }
};


/**
 * Stops the current session.
 */
wtf.trace.TraceManager.prototype.stopSession = function() {
  // Notify listeners.
  if (this.currentSession_) {
    for (var n = 0; n < this.listeners_.length; n++) {
      this.listeners_[n].sessionStopped(this.currentSession_);
    }
  }

  // Cleanup session.
  goog.dispose(this.currentSession_);
  this.currentSession_ = null;
  this.currentSessionPtr_[0] = null;
};


/**
 * Handles event type registration events.
 * @param {!wtf.trace.EventType} eventType Newly registered event type.
 * @private
 */
wtf.trace.TraceManager.prototype.eventTypeRegistered_ = function(eventType) {
  // If there is an active session, append the event type to the stream.
  if (this.currentSession_) {
    // Append to the stream.
    wtf.trace.BuiltinEvents.defineEvent(
        eventType.wireId,
        eventType.eventClass,
        eventType.flags,
        eventType.name,
        eventType.getArgString());
  }
};


/**
 * Writes the event header to the given buffer.
 * This header contains all event metadata that can be used for parsing events
 * on the other side.
 * @param {!wtf.io.Buffer} buffer Target buffer.
 * @return {boolean} True if the header was written successfully.
 */
wtf.trace.TraceManager.prototype.writeEventHeader = function(buffer) {
  // Write event metadata.
  var registry = wtf.trace.EventRegistry.getShared();
  var eventTypes = registry.getEventTypes();
  for (var n = 0; n < eventTypes.length; n++) {
    var eventType = eventTypes[n];

    // Append to the header.
    wtf.trace.BuiltinEvents.defineEvent(
        eventType.wireId,
        eventType.eventClass,
        eventType.flags,
        eventType.name,
        eventType.getArgString(),
        undefined,
        buffer);
  }

  return true;
};
