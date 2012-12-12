/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event database.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.EventDatabase');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.events');
goog.require('wtf.analysis.TraceListener');
goog.require('wtf.analysis.db.EventIndex');
goog.require('wtf.analysis.db.SummaryIndex');
goog.require('wtf.analysis.db.ZoneIndex');
goog.require('wtf.data.EventFlag');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Virtualized event database.
 * The event database is an in-memory (and potentially file-backed) selectable
 * database of events. It's designed to injest data from out-of-order event
 * streams and generate a structure that is fast to seek and can contain
 * aggregate data.
 *
 * Databases themselves cannot be queried directly, but have views and indices
 * that manage the data. These views respond to events (such as data updating)
 * and can quickly query their current region of interest.
 *
 * Future versions can be file-backed (or contain extra information) to enable
 * virtualization by generating the higher-level data structures and discarding
 * data not immediately required.
 *
 * Databases contain a time index that references event data chunks.
 * Applications can add their own event-based indices to allow for more control
 * over iteration.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.analysis.db.EventDatabase = function() {
  goog.base(this);

  /**
   * All sources that have been added to provide event data.
   * @type {!Array.<!wtf.data.ContextInfo>}
   * @private
   */
  this.sources_ = [];

  /**
   * Total number of events added.
   * This excludes uninteresting events (like scope leaves) and should only be
   * used for display.
   * @type {number}
   * @private
   */
  this.totalEventCount_ = 0;

  /**
   * Summary index.
   * @type {!wtf.analysis.db.SummaryIndex}
   * @private
   */
  this.summaryIndex_ = new wtf.analysis.db.SummaryIndex();
  this.registerDisposable(this.summaryIndex_);

  /**
   * Indicies for all zones seen in the stream.
   * @type {!Array.<!wtf.analysis.db.ZoneIndex>}
   * @private
   */
  this.zoneIndices_ = [];

  /**
   * All registered event indices.
   * @type {!Array.<!wtf.analysis.db.EventIndex>}
   * @private
   */
  this.eventIndices_ = [];

  /**
   * Trace listener subclass that redirects events into the database.
   * @type {!wtf.analysis.db.EventDatabase.Listener_}
   * @private
   */
  this.listener_ = new wtf.analysis.db.EventDatabase.Listener_(this);
};
goog.inherits(wtf.analysis.db.EventDatabase, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.analysis.db.EventDatabase.prototype.disposeInternal = function() {
  goog.disposeAll(this.eventIndices_);
  goog.disposeAll(this.zoneIndices_);
  goog.base(this, 'disposeInternal');
};


/**
 * Event types for the database.
 * @enum {string}
 */
wtf.analysis.db.EventDatabase.EventType = {
  /**
   * The sources listing changed (source added/etc).
   */
  SOURCES_CHANGED: goog.events.getUniqueId('sources_changed'),

  /**
   * One or more zones was added. Args include a list of the added zones.
   */
  ZONES_ADDED: goog.events.getUniqueId('zones_added')
};


/**
 * Gets a list of all sources that have been added to provide event data.
 * @return {!Array.<!wtf.data.ContextInfo>} A list of all sources. Do not
 *     modify.
 */
wtf.analysis.db.EventDatabase.prototype.getSources = function() {
  return this.sources_;
};


/**
 * Gets the total number of interesting events.
 * This excludes things such as scope leaves.
 * @return {number} Event count.
 */
wtf.analysis.db.EventDatabase.prototype.getTotalEventCount = function() {
  return this.totalEventCount_;
};


/**
 * Gets the timebase that all event times are relative to.
 * This, when added to an events time, can be used to compute the wall-time
 * the event occurred at.
 * @return {number} Timebase.
 */
wtf.analysis.db.EventDatabase.prototype.getTimebase = function() {
  return this.listener_.getCommonTimebase();
};


/**
 * Gets the time of the first event in the index.
 * @return {number} Time of the first event or 0 if no events.
 */
wtf.analysis.db.EventDatabase.prototype.getFirstEventTime = function() {
  return this.summaryIndex_.getFirstEventTime();
};


/**
 * Gets the time of the last event in the index.
 * @return {number} Time of the last event or 0 if no events.
 */
wtf.analysis.db.EventDatabase.prototype.getLastEventTime = function() {
  return this.summaryIndex_.getLastEventTime();
};


/**
 * Gets the summary index.
 * @return {!wtf.analysis.db.SummaryIndex} Summary index.
 */
wtf.analysis.db.EventDatabase.prototype.getSummaryIndex = function() {
  return this.summaryIndex_;
};


/**
 * Gets all of the zone indices.
 * @return {!Array.<!wtf.analysis.db.ZoneIndex>} Zone indices. Do not modify.
 */
wtf.analysis.db.EventDatabase.prototype.getZoneIndices = function() {
  return this.zoneIndices_;
};


/**
 * Creates a new event index in the database.
 * This may take some time to complete if the database already contains data.
 *
 * If the index already exists it will be returned. Because of this it's best
 * to always attempt creating an index unless you know for sure it exists.
 *
 * @param {string} eventName Event name.
 * @return {!goog.async.Deferred} A deferred fulfilled when the index is ready.
 *     Successful callbacks receive the new event index as the only argument.
 */
wtf.analysis.db.EventDatabase.prototype.createEventIndex = function(eventName) {
  // Quick check to see if it already exists.
  var eventIndex = this.getEventIndex(eventName);
  if (eventIndex) {
    return goog.async.Deferred.succeed(eventIndex);
  }

  // Create the index (empty).
  eventIndex = new wtf.analysis.db.EventIndex(eventName);
  this.eventIndices_.push(eventIndex);

  // TODO(benvanik): async loading support (add to waiter list/etc)
  // This is a hack to synchronously populate the index.
  //eventIndex.beginInserting();
  // hmm already lost the events... what to do?
  //eventIndex.endInserting();

  return goog.async.Deferred.succeed(eventIndex);
};


/**
 * Gets the event index for the given event info, if it exists.
 * Note that the result of this method should be cached for efficiency.
 * @param {string} eventName Event name.
 * @return {wtf.analysis.db.EventIndex} Event index, if found.
 */
wtf.analysis.db.EventDatabase.prototype.getEventIndex = function(eventName) {
  for (var n = 0; n < this.eventIndices_.length; n++) {
    var eventIndex = this.eventIndices_[n];
    if (eventIndex.getEventName() == eventName) {
      return eventIndex;
    }
  }
  return null;
};


/**
 * Gets the internal trace listener.
 * @return {!wtf.analysis.TraceListener} Trace listener.
 */
wtf.analysis.db.EventDatabase.prototype.getTraceListener = function() {
  return this.listener_;
};


/**
 * Handles database structure invalidation (new sources/etc).
 * @private
 */
wtf.analysis.db.EventDatabase.prototype.invalidate_ = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};



/**
 * Trace listener implementation that adds events to the database.
 *
 * @param {!wtf.analysis.db.EventDatabase} db Target database.
 * @constructor
 * @extends {wtf.analysis.TraceListener}
 * @private
 */
wtf.analysis.db.EventDatabase.Listener_ = function(db) {
  goog.base(this);

  /**
   * Target event database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  // TODO(benvanik): setup event indices/etc as listeners for the event type
  //     names - this would make things much more efficient as the number of
  //     indices grows.
  /**
   * A list of event targets for insertion notification.
   * This list is rebuilt each insertion block and is in a specific order.
   * @type {!Array.<!wtf.analysis.db.IEventTarget>}
   * @private
   */
  this.eventTargets_ = [];

  /**
   * Whether the listener is inside an insertion block.
   * @type {boolean}
   * @private
   */
  this.insertingEvents_ = false;

  /**
   * Number of events added in the current insert block so far.
   * @type {number}
   * @private
   */
  this.insertedEventCount_ = 0;

  /**
   * The number of zones when insertion began.
   * Used to track new zones.
   * @type {number}
   * @private
   */
  this.beginningZoneCount_ = 0;

  /**
   * Start-time of the dirty range.
   * @type {number}
   * @private
   */
  this.dirtyTimeStart_ = 0;

  /**
   * End-time of the dirty range.
   * @type {number}
   * @private
   */
  this.dirtyTimeEnd_ = 0;

  /**
   * Cached event types, for performance.
   * @type {!Object.<!wtf.analysis.EventType>}
   * @private
   */
  this.eventTypes_ = {
    zoneCreate: this.getEventType('wtf.zone.create'),
    scopeLeave: this.getEventType('wtf.scope.leave')
  };
};
goog.inherits(wtf.analysis.db.EventDatabase.Listener_,
    wtf.analysis.TraceListener);


/**
 * @override
 */
wtf.analysis.db.EventDatabase.Listener_.prototype.sourceAdded =
    function(timebase, contextInfo) {
  this.db_.sources_.push(contextInfo);
  this.db_.emitEvent(wtf.analysis.db.EventDatabase.EventType.SOURCES_CHANGED);
  this.db_.invalidate_();
};


/**
 * @override
 */
wtf.analysis.db.EventDatabase.Listener_.prototype.beginEventBatch =
    function(contextInfo) {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = true;

  this.beginningZoneCount_ = this.db_.zoneIndices_.length;
  this.dirtyTimeStart_ = Number.MAX_VALUE;
  this.dirtyTimeEnd_ = Number.MIN_VALUE;

  // Rebuild the target list.
  var db = this.db_;
  this.eventTargets_.length = 0;
  this.eventTargets_.push(db.summaryIndex_);
  this.eventTargets_.push.apply(this.eventTargets_, db.zoneIndices_);
  this.eventTargets_.push.apply(this.eventTargets_, db.eventIndices_);

  // Begin inserting.
  for (var n = 0; n < this.eventTargets_.length; n++) {
    this.eventTargets_[n].beginInserting();
  }
};


/**
 * @override
 */
wtf.analysis.db.EventDatabase.Listener_.prototype.endEventBatch = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = false;

  // End inserting.
  for (var n = this.eventTargets_.length - 1; n >= 0; n--) {
    this.eventTargets_[n].endInserting();
  }

  // Track added zones and emit the event.
  if (this.beginningZoneCount_ != this.db_.zoneIndices_.length) {
    var addedZones = this.db_.zoneIndices_.slice(this.beginningZoneCount_);
    this.db_.emitEvent(
        wtf.analysis.db.EventDatabase.EventType.ZONES_ADDED, addedZones);
  }

  // Notify watchers.
  if (this.insertedEventCount_) {
    this.insertedEventCount_ = 0;
    this.db_.invalidate_();
  }

  this.eventTargets_.length = 0;
};


/**
 * @override
 */
wtf.analysis.db.EventDatabase.Listener_.prototype.traceEvent = function(e) {
  if (e.time < this.dirtyTimeStart_) {
    this.dirtyTimeStart_ = e.time;
  }
  if (e.time > this.dirtyTimeEnd_) {
    this.dirtyTimeEnd_ = e.time;
  }
  this.insertedEventCount_++;

  if (!(e.eventType.flags & wtf.data.EventFlag.INTERNAL ||
      e.eventType == this.eventTypes_.scopeLeave)) {
    // Scope leave - subtract from total count.
    this.db_.totalEventCount_++;
  }

  // Handle zone creation.
  // This happens first so that if we create a new zone it's added to the
  // event targets list.
  if (e.eventType == this.eventTypes_.zoneCreate) {
    // Create a new zone index.
    var newZone = e.value;
    var zoneIndex = new wtf.analysis.db.ZoneIndex(this, newZone);
    this.db_.zoneIndices_.push(zoneIndex);
    this.eventTargets_.push(zoneIndex);
    zoneIndex.beginInserting();
  }

  // Dispatch to targets.
  for (var n = 0; n < this.eventTargets_.length; n++) {
    this.eventTargets_[n].insertEvent(e);
  }
};


goog.exportSymbol(
    'wtf.analysis.db.EventDatabase',
    wtf.analysis.db.EventDatabase);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getSources',
    wtf.analysis.db.EventDatabase.prototype.getSources);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getTotalEventCount',
    wtf.analysis.db.EventDatabase.prototype.getTotalEventCount);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getTimebase',
    wtf.analysis.db.EventDatabase.prototype.getTimebase);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getFirstEventTime',
    wtf.analysis.db.EventDatabase.prototype.getFirstEventTime);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getLastEventTime',
    wtf.analysis.db.EventDatabase.prototype.getLastEventTime);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getSummaryIndex',
    wtf.analysis.db.EventDatabase.prototype.getSummaryIndex);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getZoneIndices',
    wtf.analysis.db.EventDatabase.prototype.getZoneIndices);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'createEventIndex',
    wtf.analysis.db.EventDatabase.prototype.createEventIndex);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getEventIndex',
    wtf.analysis.db.EventDatabase.prototype.getEventIndex);
goog.exportProperty(
    wtf.analysis.db.EventDatabase.prototype, 'getTraceListener',
    wtf.analysis.db.EventDatabase.prototype.getTraceListener);
