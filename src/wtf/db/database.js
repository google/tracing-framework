/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event database.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.Database');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('wtf.db.EventTypeTable');
goog.require('wtf.db.Unit');
goog.require('wtf.db.Zone');
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
wtf.db.Database = function() {
  goog.base(this);

  /**
   * All trace sources that have been added to provide data.
   * @type {!Array.<!wtf.db.DataSource>}
   * @private
   */
  this.sources_ = [];

  /**
   * Unit of measure.
   * @type {wtf.db.Unit}
   * @private
   */
  this.units_ = wtf.db.Unit.TIME_MILLISECONDS;

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
   * Time the first event occurred.
   * @type {number}
   * @private
   */
  this.firstEventTime_ = 0;

  /**
   * Time the last event occurred.
   * @type {number}
   * @private
   */
  this.lastEventTime_ = 0;

  /**
   * All zones.
   * @type {!Array.<!wtf.db.Zone>}
   * @private
   */
  this.zoneList_ = [];

  /**
   * All zones, indexed by zone key.
   * @type {!Object.<!wtf.db.Zone>}
   * @private
   */
  this.zoneMap_ = {};

  /**
   * The default zone.
   * This is the first zone created either explicitly via
   * {@see #createOrGetZone} or implicitly via {@see #getDefaultZone}.
   * @type {wtf.db.Zone}
   * @private
   */
  this.defaultZone_ = null;

  /**
   * Lookup table for all defined {@see wtf.db.EventType}s.
   * @type {!wtf.db.EventTypeTable}
   * @private
   */
  this.eventTypeTable_ = new wtf.db.EventTypeTable();

  /**
   * Whether the database is inside an insertion block.
   * @type {boolean}
   * @private
   */
  this.insertingEvents_ = false;

  /**
   * The number of zones when insertion began.
   * Used to track new zones.
   * @type {number}
   * @private
   */
  this.beginningZoneCount_ = 0;
};
goog.inherits(wtf.db.Database, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.db.Database.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};


/**
 * Event types for the database.
 * @enum {string}
 */
wtf.db.Database.EventType = {
  /**
   * The sources listing changed (source added/etc).
   */
  SOURCES_CHANGED: goog.events.getUniqueId('sources_changed'),

  /**
   * A source had an error parsing an input.
   * Args: [source, message, opt_detail]
   */
  SOURCE_ERROR: goog.events.getUniqueId('source_error'),

  /**
   * A source has ended and will produce no more data.
   * Args: [source]
   */
  SOURCE_ENDED: goog.events.getUniqueId('source_ended'),

  /**
   * One or more zones was added. Args include a list of the added zones.
   */
  ZONES_ADDED: goog.events.getUniqueId('zones_added')
};


/**
 * Handles database structure invalidation (new sources/etc).
 * @private
 */
wtf.db.Database.prototype.invalidate_ = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


/**
 * Adds a data source to the database.
 * @param {!wtf.db.DataSource} dataSource Data source to add to the database.\.
 */
wtf.db.Database.prototype.addSource = function(dataSource) {
  // Add to the database.
  // TODO(benvanik): dispose when completed?
  this.sources_.push(dataSource);
  this.registerDisposable(dataSource);

  this.emitEvent(wtf.db.Database.EventType.SOURCES_CHANGED);
  this.invalidate_();
};


/**
 * Gets a list of all sources that have been added to provide event data.
 * @return {!Array.<!wtf.db.DataSource>} A list of all sources. Do not modify.
 */
wtf.db.Database.prototype.getSources = function() {
  return this.sources_;
};


/**
 * Gets the unit of measure used in the database.
 * @return {wtf.db.Unit} Unit of measure.
 */
wtf.db.Database.prototype.getUnits = function() {
  return this.units_;
};


/**
 * Gets the timebase that all event times are relative to.
 * This, when added to an events time, can be used to compute the wall-time
 * the event occurred at.
 * @return {number} Timebase.
 */
wtf.db.Database.prototype.getTimebase = function() {
  return this.commonTimebase_;
};


/**
 * Computes a time delay for the given source from the shared timebase.
 * If no timebase has been previously registered the given timebase will be set
 * as the shared one.
 * @param {number} timebase Source timebase.
 * @return {number} The time delay between the given timebase and the shared
 *     one.
 */
wtf.db.Database.prototype.computeTimeDelay = function(timebase) {
  if (this.commonTimebase_ == -1) {
    this.commonTimebase_ = timebase;
    return 0;
  } else {
    return this.commonTimebase_ - timebase;
  }
};


/**
 * Creates a new zone or gets an existing one if a matching zone already exists.
 * If a default zone was created previously this will be merged with that.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @return {!wtf.db.Zone} Zone.
 */
wtf.db.Database.prototype.createOrGetZone = function(name, type, location) {
  var key = name + ':' + type + ':' + location;

  // If there is a nameless default zone then merge with that.
  if (this.defaultZone_ && this.defaultZone_.getName() == '') {
    this.defaultZone_.resetInfo(name, type, location);
    this.zoneMap_[key] = this.defaultZone_;
    return this.defaultZone_;
  }

  // Lookup or create.
  var value = this.zoneMap_[key];
  if (!value) {
    value = new wtf.db.Zone(this, name, type, location);
    this.zoneMap_[key] = value;
    this.zoneList_.push(value);

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
 * @return {!wtf.db.Zone} The default zone.
 */
wtf.db.Database.prototype.getDefaultZone = function() {
  if (!this.defaultZone_) {
    this.defaultZone_ = new wtf.db.Zone(this, '', '', '');
    this.zoneList_.push(this.defaultZone_);
  }
  return this.defaultZone_;
};


/**
 * Gets a list of all zones. Do not modify.
 * @return {!Array.<!wtf.db.Zone>} Zones.
 */
wtf.db.Database.prototype.getZones = function() {
  return this.zoneList_;
};


/**
 * Gets the event type table.
 * @return {!wtf.db.EventTypeTable} Event type table.
 */
wtf.db.Database.prototype.getEventTypeTable = function() {
  return this.eventTypeTable_;
};


/**
 * Gets the event type for the given event name.
 * @param {string} name Event name.
 * @return {wtf.db.EventType?} Event type, if found.
 */
wtf.db.Database.prototype.getEventType = function(name) {
  return this.eventTypeTable_.getByName(name);
};


/**
 * Gets the first frame list containing valid frames from any zone, if any.
 * @return {wtf.db.FrameList} Frame list, if any.
 */
wtf.db.Database.prototype.getFirstFrameList = function() {
  for (var n = 0; n < this.zoneList_.length; n++) {
    var zone = this.zoneList_[n];
    var frameList = zone.getFrameList();
    if (frameList.getCount()) {
      return frameList;
    }
  }
  return null;
};


/**
 * Gets the time of the first event in the index.
 * @return {number} Time of the first event or 0 if no events.
 */
wtf.db.Database.prototype.getFirstEventTime = function() {
  return this.firstEventTime_;
};


/**
 * Gets the time of the last event in the index.
 * @return {number} Time of the last event or 0 if no events.
 */
wtf.db.Database.prototype.getLastEventTime = function() {
  return this.lastEventTime_;
};


/**
 * Signals that a data source was initialized with header information.
 * The data may not be fully loaded yet.
 * @param {!wtf.db.DataSource} source Source that was initialized.
 * @return {boolean} Whether the initialization was successful.
 */
wtf.db.Database.prototype.sourceInitialized = function(source) {
  // Handle source units.
  // If this is the first source we just switch to that, otherwise we verify
  // that the user isn't trying to mix units.
  var units = source.getUnits();
  if (this.sources_.length == 1) {
    this.units_ = units;
  } else {
    if (this.units_ != units) {
      this.sourceError(source,
          'Mixing measurement units is not supported.',
          'All sources loaded must be of the same type (time/size).');
      return false;
    }
  }

  return true;
};


/**
 * Signals that an error occurred while parsing a trace source.
 * @param {!wtf.db.DataSource} source Source that had the error.
 * @param {string} message Error message.
 * @param {string=} opt_detail Detailed information.
 */
wtf.db.Database.prototype.sourceError =
    function(source, message, opt_detail) {
  this.emitEvent(wtf.db.Database.EventType.SOURCE_ERROR,
      source, message, opt_detail);
};


/**
 * Signals that a data source ended successfully.
 * @param {!wtf.db.DataSource} source Source that ended.
 */
wtf.db.Database.prototype.sourceEnded = function(source) {
  this.emitEvent(wtf.db.Database.EventType.SOURCE_ENDED, source);
};


/**
 * Begins a batch of events.
 * This will be called immediately before a new batch of events are dispatched.
 * All events dispatched will be from the given source.
 * @param {!wtf.db.DataSource} source Source adding the events.
 */
wtf.db.Database.prototype.beginInsertingEvents = function(source) {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = true;

  // For tracking newly created zones.
  this.beginningZoneCount_ = this.zoneList_.length;
  if (this.zoneList_.length == 1 &&
      this.zoneList_[0].getName() == '') {
    // Special handling for the default zone.
    this.beginningZoneCount_ = 0;
  }
};


/**
 * Ends a batch of events.
 */
wtf.db.Database.prototype.endInsertingEvents = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = false;

  // Reconcile zone changes.
  this.firstEventTime_ = Number.MAX_VALUE;
  this.lastEventTime_ = -Number.MAX_VALUE;
  for (var n = 0; n < this.zoneList_.length; n++) {
    var eventList = this.zoneList_[n].getEventList();
    eventList.rebuild();

    this.firstEventTime_ =
        Math.min(eventList.getFirstEventTime(), this.firstEventTime_);
    this.lastEventTime_ =
        Math.max(eventList.getLastEventTime(), this.lastEventTime_);
  }
  if (this.firstEventTime_ == Number.MAX_VALUE) {
    this.firstEventTime_ = 0;
    this.lastEventTime_ = 0;
  }

  // Track added zones and emit the event.
  if (this.beginningZoneCount_ != this.zoneList_.length) {
    var addedZones = this.zoneList_.slice(this.beginningZoneCount_);
    this.emitEvent(wtf.db.Database.EventType.ZONES_ADDED, addedZones);
  }

  // Notify watchers.
  this.invalidate_();
};



goog.exportSymbol(
    'wtf.db.Database',
    wtf.db.Database);
goog.exportProperty(
    wtf.db.Database.prototype, 'addSource',
    wtf.db.Database.prototype.addSource);
goog.exportProperty(
    wtf.db.Database.prototype, 'getSources',
    wtf.db.Database.prototype.getSources);
goog.exportProperty(
    wtf.db.Database.prototype, 'getTimebase',
    wtf.db.Database.prototype.getTimebase);
goog.exportProperty(
    wtf.db.Database.prototype, 'getZones',
    wtf.db.Database.prototype.getZones);
goog.exportProperty(
    wtf.db.Database.prototype, 'getEventTypeTable',
    wtf.db.Database.prototype.getEventTypeTable);
goog.exportProperty(
    wtf.db.Database.prototype, 'getEventType',
    wtf.db.Database.prototype.getEventType);
goog.exportProperty(
    wtf.db.Database.prototype, 'getFirstFrameList',
    wtf.db.Database.prototype.getFirstFrameList);
goog.exportProperty(
    wtf.db.Database.prototype, 'getFirstEventTime',
    wtf.db.Database.prototype.getFirstEventTime);
goog.exportProperty(
    wtf.db.Database.prototype, 'getLastEventTime',
    wtf.db.Database.prototype.getLastEventTime);
