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
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.ZoneType');
goog.require('wtf.io.cff.BinaryStreamTarget');
goog.require('wtf.io.transports.MemoryWriteTransport');
goog.require('wtf.timing');
goog.require('wtf.trace.BuiltinEvents');
goog.require('wtf.trace.EventRegistry');
goog.require('wtf.trace.EventSessionContext');
goog.require('wtf.trace.Zone');
goog.require('wtf.trace.sessions.SnapshottingSession');
goog.require('wtf.util.Options');



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
 * Fired when a snapshot has been requested.
 * @param {!wtf.trace.Session} session Trace session.
 * @param {function(this:T, wtf.io.Blob)} callback Function called one for
 *     each snapshot buffer. When the buffer is null it means the last buffer
 *     has been reached.
 * @param {T=} opt_scope Callback scope.
 * @return {number|undefined} The number of expected callbacks.
 * @template T
 */
wtf.trace.ISessionListener.prototype.requestSnapshots = goog.nullFunction;


/**
 * Fired when the snapshot should be reset.
 */
wtf.trace.ISessionListener.prototype.reset = goog.nullFunction;



/**
 * Trace manager.
 * Manages trace sessions.
 *
 * @param {Object=} opt_options Options overrides.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.trace.TraceManager = function(opt_options) {
  goog.base(this);

  var options = new wtf.util.Options();
  options.mixin(opt_options);

  // If we don't have an extension try to load settings from local storage.
  if (goog.global.localStorage) {
    if (!options.getOptionalBoolean('wtf.injector', false)) {
      // Load from local storage.
      var value = goog.global.localStorage.getItem('__wtf_options__');
      if (value) {
        options.load(value);
      }
    } else {
      // Otherwise, remove settings from local storage so they don't conflict
      // with the extension.
      goog.global.localStorage.removeItem('__wtf_options__');
    }
  }

  // Always prefer certain options from the user to stored ones.
  // If we don't do this, things like the injector setting will be saved.
  var OVERRIDE_KEYS = [
    'wtf.injector',
    'wtf.hud.app.mode',
    'wtf.hud.app.endpoint',
    'wtf.addons',
    'wtf.trace.provider.chromeDebug.present',
    'wtf.trace.provider.chromeDebug.tracing',
    'wtf.trace.provider.firefoxDebug.present'
  ];
  for (var n = 0; n < OVERRIDE_KEYS.length; n++) {
    var key = OVERRIDE_KEYS[n];
    options.setValue(key, opt_options ? opt_options[key] : undefined);
  }

  // Mixin any global overrides, if present.
  options.mixin(goog.global['wtf_trace_options']);
  options.mixin(goog.global['wtf_hud_options']);

  /**
   * Global options.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

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

  // Listen for newly registered events.
  var registry = wtf.trace.EventRegistry.getShared();
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
 * Gets the global options, optionally combined with options overrides.
 * @param {Object=} opt_options Options overrides.
 * @return {!wtf.util.Options} Options.
 */
wtf.trace.TraceManager.prototype.getOptions = function(opt_options) {
  // TODO(benvanik): chaining of options objects? would be nice to have events.
  var options = this.options_.clone();
  options.mixin(opt_options);
  return options;
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
 * Appends all zones to the given buffer.
 * @param {!wtf.io.BufferView.Type} bufferView Buffer to write to.
 */
wtf.trace.TraceManager.prototype.appendAllZones = function(bufferView) {
  // Note that since zone IDs are unique per stream it's ok if there are
  // multiple create events. Clients must dedupe these (and use the last created
  // time) or not show ones never referenced.
  for (var key in this.allZones_) {
    var zone = this.allZones_[key];
    // Note that we use 0 instead of zone.timestamp to prevent skewing traces
    wtf.trace.BuiltinEvents.createZone(
        zone.id, zone.name, zone.type, zone.location, 0, bufferView);
  }

  var currentZone = this.getCurrentZone();
  if (currentZone) {
    wtf.trace.BuiltinEvents.setZone(currentZone.id, 0, bufferView);
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

  var registry = wtf.trace.EventRegistry.getShared();
  var context = registry.getEventSessionContext();
  wtf.trace.EventSessionContext.init(context, session);

  // Reset all event counts.
  var eventTypes = registry.getEventTypes();
  for (var n = 0; n < eventTypes.length; n++) {
    var eventType = eventTypes[n];
    eventType.count = 0;
  }

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

  var registry = wtf.trace.EventRegistry.getShared();
  var context = registry.getEventSessionContext();
  wtf.trace.EventSessionContext.init(context, null);
};


// TODO(benvanik): move this out of here, or someplace else.
/**
 * Asynchronously snapshots all contexts.
 * This will take a snapshot of the current context as well as any dependent
 * ones such as servers or worker threads. The results are sent to the callback
 * when they have all been returned.
 * If the call is going to be ignored (no active session) or fails the callback
 * will fire on the next javascript tick with a null value.
 *
 * @param {function(this:T, Array.<!wtf.io.Blob>)} callback Function called
 *     when all buffers are available. The value will be null if an error
 *     occurred.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.trace.TraceManager.prototype.requestSnapshots = function(
    callback, opt_scope) {
  var session = this.currentSession_;
  if (!session ||
      !(session instanceof wtf.trace.sessions.SnapshottingSession)) {
    wtf.timing.setImmediate(function() {
      callback.call(opt_scope, null);
    });
    return;
  }

  // Create target stream.
  var allBuffers = [];
  var transport = new wtf.io.transports.MemoryWriteTransport();
  transport.setTargetArray(allBuffers);
  var streamTarget = new wtf.io.cff.BinaryStreamTarget(transport);

  function complete() {
    goog.dispose(streamTarget);
    goog.dispose(transport);
    callback.call(opt_scope, allBuffers.length ? allBuffers : null);
  };

  // Snapshot self.
  session.snapshot(streamTarget);

  // Snapshot others.
  var pendingSnapshots = 0;
  function listenerCallback(buffer) {
    if (!pendingSnapshots) {
      return;
    }
    if (buffer) {
      allBuffers.push(buffer);
    }

    // End chain when done.
    pendingSnapshots--;
    if (!pendingSnapshots) {
      complete();
    }
  };
  for (var n = 0; n < this.listeners_.length; n++) {
    var requested = this.listeners_[n].requestSnapshots(
        session, listenerCallback);
    if (requested !== undefined) {
      pendingSnapshots += requested;
    }
  }
  if (!pendingSnapshots) {
    // No pending async snapshots - end next tick.
    wtf.timing.setImmediate(function() {
      complete();
    });
  }
};


/**
 * Resets the snapshot for all sessions.
 */
wtf.trace.TraceManager.prototype.reset = function() {
  var session = this.getCurrentSession();
  if (session instanceof wtf.trace.sessions.SnapshottingSession) {
    session.reset();
  }
  for (var n = 0; n < this.listeners_.length; n++) {
    this.listeners_[n].reset();
  }
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
 * @param {!wtf.io.BufferView.Type} bufferView Target buffer.
 * @param {boolean=} opt_all True to write all events, regardless of use.
 * @return {boolean} True if the header was written successfully.
 */
wtf.trace.TraceManager.prototype.writeEventHeader = function(
    bufferView, opt_all) {
  // Write event metadata.
  var registry = wtf.trace.EventRegistry.getShared();
  var eventTypes = registry.getEventTypes();
  for (var n = 0; n < eventTypes.length; n++) {
    var eventType = eventTypes[n];

    // Skip events that haven't been written, unless it's a builtin.
    if (!opt_all &&
        !(eventType.flags & wtf.data.EventFlag.BUILTIN) &&
        !eventType.count) {
      continue;
    }

    // Append to the header.
    wtf.trace.BuiltinEvents.defineEvent(
        eventType.wireId,
        eventType.eventClass,
        eventType.flags,
        eventType.name,
        eventType.getArgString(),
        undefined,
        bufferView);
  }

  return true;
};


/**
 * Global shared trace manager instance.
 * @type {wtf.trace.TraceManager}
 * @private
 */
wtf.trace.TraceManager.sharedInstance_ = null;


/**
 * Gets the current shared instance value, if any.
 * @return {wtf.trace.TraceManager} Shared instance.
 */
wtf.trace.TraceManager.getSharedInstance = function() {
  return wtf.trace.TraceManager.sharedInstance_;
};


/**
 * Sets a new shared instance value.
 * The previous value is discarded but not disposed and must be disposed by the
 * caller.
 * @param {wtf.trace.TraceManager} value New value, if any.
 */
wtf.trace.TraceManager.setSharedInstance = function(value) {
  wtf.trace.TraceManager.sharedInstance_ = value;
};
