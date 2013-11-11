/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event statistics table.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.EventDataEntry');
goog.provide('wtf.db.EventStatistics');
goog.provide('wtf.db.InstanceEventDataEntry');
goog.provide('wtf.db.ScopeEventDataEntry');
goog.provide('wtf.db.SortMode');

goog.require('goog.Disposable');
goog.require('goog.object');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.EventFlag');
goog.require('wtf.events.EventType');


/**
 * Sorting mode to use when retrieving entries.
 * @enum {number}
 */
wtf.db.SortMode = {
  ANY: 0,
  COUNT: 1,
  TOTAL_TIME: 2,
  MEAN_TIME: 3,
  OWN_TIME: 4
};


goog.exportSymbol(
    'wtf.db.SortMode',
    wtf.db.SortMode);
goog.exportProperty(
    wtf.db.SortMode, 'ANY',
    wtf.db.SortMode.ANY);
goog.exportProperty(
    wtf.db.SortMode, 'COUNT',
    wtf.db.SortMode.COUNT);
goog.exportProperty(
    wtf.db.SortMode, 'TOTAL_TIME',
    wtf.db.SortMode.TOTAL_TIME);
goog.exportProperty(
    wtf.db.SortMode, 'MEAN_TIME',
    wtf.db.SortMode.MEAN_TIME);
goog.exportProperty(
    wtf.db.SortMode, 'OWN_TIME',
    wtf.db.SortMode.OWN_TIME);



/**
 * Event data table.
 * Caches detailed aggregate information about events.
 *
 * @param {!wtf.db.Database} db Event database.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.db.EventStatistics = function(db) {
  goog.base(this);

  /**
   * Event database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * The cached full table for the entire database.
   * Since it's a common operation to select everything this is kept around.
   * @type {wtf.db.EventStatistics.Table}
   * @private
   */
  this.fullTable_ = null;

  /**
   * A cache dtable for a time range.
   * Currently we only stash one of these, but we could do many if there is
   * regular thrashing.
   * This is populated on-demand by {@see #getTable}.
   * @type {wtf.db.EventStatistics.Table}
   * @private
   */
  this.selectedTable_ = null;

  db.addListener(wtf.events.EventType.INVALIDATED, function() {
    this.fullTable_ = null;
    this.selectedTable_ = null;
  }, this);
};
goog.inherits(wtf.db.EventStatistics, goog.Disposable);


/**
 * Gets a table covering the requested time range or, if the times are omitted,
 * the entire database.
 * @param {number=} opt_startTime Starting time.
 * @param {number=} opt_endTime Ending time.
 * @return {!wtf.db.EventStatistics.Table} A table covering the requested time
 *     range.
 */
wtf.db.EventStatistics.prototype.getTable = function(
    opt_startTime, opt_endTime) {
  var startTime = goog.isDef(opt_startTime) ? opt_startTime : -Number.MAX_VALUE;
  var endTime = goog.isDef(opt_endTime) ? opt_endTime : Number.MAX_VALUE;
  if (startTime == -Number.MAX_VALUE && endTime == Number.MAX_VALUE) {
    if (!this.fullTable_) {
      this.fullTable_ = new wtf.db.EventStatistics.Table(
          this.db_, -Number.MAX_VALUE, Number.MAX_VALUE);
      this.fullTable_.rebuild();
    }
    return this.fullTable_;
  } else {
    if (this.selectedTable_) {
      if (this.selectedTable_.getStartTime() == startTime &&
          this.selectedTable_.getEndTime() == endTime) {
        return this.selectedTable_;
      }
    }
    this.selectedTable_ = new wtf.db.EventStatistics.Table(
        this.db_, startTime, endTime);
    this.selectedTable_.rebuild();
    return this.selectedTable_;
  }
};


/**
 * Gets all of the event type names found in all of the given tables.
 * @param {!Array.<!wtf.db.EventStatistics.Table>} tables Tables.
 * @param {wtf.data.EventClass=} opt_eventClass Class to limit to.
 * @return {!Array.<string>} All event type names.
 */
wtf.db.EventStatistics.getAllEventTypeNames = function(tables, opt_eventClass) {
  var names = {};
  for (var n = 0; n < tables.length; n++) {
    var table = tables[n];
    for (var m = 0; m < table.list_.length; m++) {
      var eventType = table.list_[m].eventType;
      if (opt_eventClass === undefined ||
          eventType.eventClass == opt_eventClass) {
        names[eventType.name] = true;
      }
    }
  }
  return goog.object.getKeys(names);
};


goog.exportSymbol(
    'wtf.db.EventStatistics',
    wtf.db.EventStatistics);
goog.exportProperty(
    wtf.db.EventStatistics.prototype, 'getTable',
    wtf.db.EventStatistics.prototype.getTable);
goog.exportSymbol(
    'wtf.db.EventStatistics.getAllEventTypeNames',
    wtf.db.EventStatistics.getAllEventTypeNames);



/**
 * A result table generated from an event statistics build.
 * The results of the table can be retreived in any order or with a filter
 * very quickly, but a new table must be generated to change the time range.
 * @param {!wtf.db.Database} db Event database.
 * @param {number} startTime Starting time.
 * @param {number} endTime Ending time.
 * @constructor
 */
wtf.db.EventStatistics.Table = function(db, startTime, endTime) {
  /**
   * Event database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Starting time.
   * @type {number}
   * @private
   */
  this.startTime_ = startTime;

  /**
   * Ending time.
   * @type {number}
   * @private
   */
  this.endTime_ = endTime;

  /**
   * Total number of events.
   * @type {number}
   * @private
   */
  this.eventCount_ = 0;

  /**
   * Event data keyed on event name.
   * @type {!Object.<!wtf.db.EventDataEntry>}
   * @private
   */
  this.table_ = {};

  /**
   * A list of all event entries.
   * @type {!Array.<!wtf.db.EventDataEntry>}
   * @private
   */
  this.list_ = [];

  /**
   * The current sort mode of the list.
   * This is used to prevent successive sorts of the list.
   * @type {wtf.db.SortMode}
   * @private
   */
  this.listSortMode_ = wtf.db.SortMode.ANY;
};


/**
 * Rebuilds from the database.
 * @param {wtf.db.Filter=} opt_filter Filter.
 * @protected
 */
wtf.db.EventStatistics.Table.prototype.rebuild = function(opt_filter) {
  this.eventCount_ = 0;
  var tableById = {};
  var list = [];

  var eventTypeFilter = opt_filter ? opt_filter.getEventTypeFilter() : null;
  var argumentFilter = opt_filter ? opt_filter.getArgumentFilter() : null;

  // Setup entries for everything.
  // We do this here so that the expensive work happens per-type and
  // not per-event.
  var eventTypeTable = this.db_.getEventTypeTable();
  var eventTypeList = eventTypeTable.getAll();
  for (var n = 0; n < eventTypeList.length; n++) {
    var type = eventTypeList[n];

    // Skip system events/etc.
    if (type.flags & wtf.data.EventFlag.INTERNAL ||
        type.flags & wtf.data.EventFlag.BUILTIN) {
      continue;
    }

    if (eventTypeFilter && !eventTypeFilter(type)) {
      continue;
    }

    var entry;
    if (type.eventClass == wtf.data.EventClass.SCOPE) {
      entry = new wtf.db.ScopeEventDataEntry(type);
    } else {
      entry = new wtf.db.InstanceEventDataEntry(type);
    }
    tableById[type.id] = entry;
    list.push(entry);
  }

  // Find all events that match.
  var zones = this.db_.getZones();
  for (var n = 0; n < zones.length; n++) {
    var eventList = zones[n].getEventList();
    var it = eventList.beginTimeRange(this.startTime_, this.endTime_);
    for (; !it.done(); it.next()) {
      var typeId = it.getTypeId();
      var entry = tableById[typeId];
      if (entry) {
        if (!argumentFilter || argumentFilter(it)) {
          entry.appendEvent(it);
          this.eventCount_++;
        }
      }
    }
  }

  // Build a table by type name.
  // Also remove any types that had no matching events.
  var tableByName = {};
  var validList = [];
  for (var n = 0; n < list.length; n++) {
    var entry = list[n];
    if (entry.count) {
      tableByName[entry.eventType.name] = entry;
      validList.push(entry);
    }
  }

  this.table_ = tableByName;
  this.list_ = validList;
  this.listSortMode_ = wtf.db.SortMode.ANY;
};


/**
 * Gets the time the table starts at.
 * @return {number} Starting time. May be MIN_VALUE to indicate a min.
 */
wtf.db.EventStatistics.Table.prototype.getStartTime = function() {
  return this.startTime_;
};


/**
 * Gets the time the table ends at.
 * @return {number} Ending time. May be MAX_VALUE to indicate a max.
 */
wtf.db.EventStatistics.Table.prototype.getEndTime = function() {
  return this.endTime_;
};


/**
 * Gets the total number of events included in the table.
 * @return {number} Event count.
 */
wtf.db.EventStatistics.Table.prototype.getEventCount = function() {
  return this.eventCount_;
};


/**
 * Gets all entries.
 * The result should not be modified.
 * @return {!Array.<!wtf.db.EventDataEntry>}
 */
wtf.db.EventStatistics.Table.prototype.getEntries = function() {
  return this.list_;
};


/**
 * Gets the entry for an event type, if it exists.
 * @param {string} eventName Event name.
 * @return {wtf.db.EventDataEntry} Event entry, if it exists.
 */
wtf.db.EventStatistics.Table.prototype.getEventTypeEntry = function(eventName) {
  return this.table_[eventName] || null;
};


/**
 * Gets all entries from the table of the given type.
 * @param {wtf.data.EventClass} eventClass Event class.
 * @return {!Object.<!wtf.db.EventDataEntry>} All entries of the given
 *     class, keyed by event type name.
 */
wtf.db.EventStatistics.Table.prototype.getEntriesByClass = function(
    eventClass) {
  var result = {};
  for (var n = 0; n < this.list_.length; n++) {
    var entry = this.list_[n];
    if (entry.eventType.eventClass == eventClass) {
      result[entry.eventType.name] = entry;
    }
  }
  return result;
};


/**
 * Enumerates all event type entries in the data table.
 * @param {function(this: T, !wtf.db.EventDataEntry)} callback
 *     A function called for each entry.
 * @param {T=} opt_scope Callback scope.
 * @param {wtf.db.SortMode=} opt_sortMode Sort mode.
 * @template T
 */
wtf.db.EventStatistics.Table.prototype.forEach = function(
    callback, opt_scope, opt_sortMode) {
  // Sort before enumerating if the sort order does not match the cached
  // value.
  if (opt_sortMode && this.listSortMode_ != opt_sortMode) {
    this.listSortMode_ = opt_sortMode;
    switch (this.listSortMode_) {
      case wtf.db.SortMode.COUNT:
        this.list_.sort(function(a, b) {
          return b.count - a.count;
        });
        break;
      case wtf.db.SortMode.TOTAL_TIME:
        this.list_.sort(function(a, b) {
          if (a instanceof wtf.db.ScopeEventDataEntry &&
              b instanceof wtf.db.ScopeEventDataEntry) {
            return b.totalTime_ - a.totalTime_;
          } else if (a instanceof wtf.db.ScopeEventDataEntry) {
            return -1;
          } else if (b instanceof wtf.db.ScopeEventDataEntry) {
            return 1;
          } else {
            return b.count - a.count;
          }
        });
        break;
      case wtf.db.SortMode.MEAN_TIME:
        this.list_.sort(function(a, b) {
          if (a instanceof wtf.db.ScopeEventDataEntry &&
              b instanceof wtf.db.ScopeEventDataEntry) {
            return b.getMeanTime() - a.getMeanTime();
          } else if (a instanceof wtf.db.ScopeEventDataEntry) {
            return -1;
          } else if (b instanceof wtf.db.ScopeEventDataEntry) {
            return 1;
          } else {
            return b.count - a.count;
          }
        });
        break;
      case wtf.db.SortMode.OWN_TIME:
        this.list_.sort(function(a, b) {
          if (a instanceof wtf.db.ScopeEventDataEntry &&
              b instanceof wtf.db.ScopeEventDataEntry) {
            return b.ownTime_ - a.ownTime_;
          } else if (a instanceof wtf.db.ScopeEventDataEntry) {
            return -1;
          } else if (b instanceof wtf.db.ScopeEventDataEntry) {
            return 1;
          } else {
            return b.count - a.count;
          }
        });
        break;
    }
  }

  for (var n = 0; n < this.list_.length; n++) {
    callback.call(opt_scope, this.list_[n]);
  }
};


/**
 * Filters the event entries in the table based on the given filter.
 * @param {!wtf.db.Filter} filter Filter.
 * @return {!wtf.db.EventStatistics.Table} New table.
 */
wtf.db.EventStatistics.Table.prototype.filter = function(filter) {
  if (!filter.isActive()) {
    return this;
  }

  var newTable = new wtf.db.EventStatistics.Table(
      this.db_, this.startTime_, this.endTime_);

  if (filter.getArgumentFilter()) {
    // Slow path of building a new table by scanning all events.
    newTable.rebuild(filter);
  } else {
    // Build the new table and place the matching entries in it.
    // This is a fast path for when we can just reuse the previously calculated
    // data.
    var filterFn = filter.getEventTypeFilter();
    for (var n = 0; n < this.list_.length; n++) {
      var entry = this.list_[n];
      if (filterFn(entry.eventType)) {
        newTable.eventCount_ += entry.count;
        newTable.table_[entry.eventType.name] = entry;
        newTable.list_.push(entry);
      }
    }
  }

  return newTable;
};


goog.exportProperty(
    wtf.db.EventStatistics.Table.prototype, 'getEventCount',
    wtf.db.EventStatistics.Table.prototype.getEventCount);
goog.exportProperty(
    wtf.db.EventStatistics.Table.prototype, 'getEntries',
    wtf.db.EventStatistics.Table.prototype.getEntries);
goog.exportProperty(
    wtf.db.EventStatistics.Table.prototype, 'getEventTypeEntry',
    wtf.db.EventStatistics.Table.prototype.getEventTypeEntry);
goog.exportProperty(
    wtf.db.EventStatistics.Table.prototype, 'getEntriesByClass',
    wtf.db.EventStatistics.Table.prototype.getEntriesByClass);
goog.exportProperty(
    wtf.db.EventStatistics.Table.prototype, 'forEach',
    wtf.db.EventStatistics.Table.prototype.forEach);
goog.exportProperty(
    wtf.db.EventStatistics.Table.prototype, 'filter',
    wtf.db.EventStatistics.Table.prototype.filter);



/**
 * Abstract base type for entries in the {@see wtf.db.EventStatistics}.
 * @param {!wtf.db.EventType} eventType Event type.
 * @constructor
 */
wtf.db.EventDataEntry = function(eventType) {
  /**
   * Event type.
   * @type {!wtf.db.EventType}
   * @protected
   */
  this.eventType = eventType;

  /**
   * Total number of the events encountered.
   * @type {number}
   * @protected
   */
  this.count = 0;
};


/**
 * Appends an event to the entry.
 * @param {!wtf.db.EventIterator} it Event.
 */
wtf.db.EventDataEntry.prototype.appendEvent = goog.abstractMethod;


/**
 * Gets the event type this entry describes.
 * @return {!wtf.db.EventType} Event type.
 */
wtf.db.EventDataEntry.prototype.getEventType = function() {
  return this.eventType;
};


/**
 * Gets the total number of events encountered.
 * @return {number} Event count.
 */
wtf.db.EventDataEntry.prototype.getCount = function() {
  return this.count;
};


/**
 * Gets the frequency of the events as a measure of instances/sec.
 * @return {number} Instances/second.
 */
wtf.db.EventDataEntry.prototype.getFrequency = function() {
  // TODO(benvanik): compute frequency of events.
  return 0;
};


goog.exportSymbol(
    'wtf.db.EventDataEntry',
    wtf.db.EventDataEntry);
goog.exportProperty(
    wtf.db.EventDataEntry.prototype, 'getEventType',
    wtf.db.EventDataEntry.prototype.getEventType);
goog.exportProperty(
    wtf.db.EventDataEntry.prototype, 'getCount',
    wtf.db.EventDataEntry.prototype.getCount);
goog.exportProperty(
    wtf.db.EventDataEntry.prototype, 'getFrequency',
    wtf.db.EventDataEntry.prototype.getFrequency);



/**
 * An entry in the {@see wtf.db.EventStatistics} describing scope
 * event types.
 * @param {!wtf.db.EventType} eventType Event type.
 * @constructor
 * @extends {wtf.db.EventDataEntry}
 */
wtf.db.ScopeEventDataEntry = function(eventType) {
  goog.base(this, eventType);

  /**
   * Total time taken by all scopes.
   * @type {number}
   * @private
   */
  this.totalTime_ = 0;

  /**
   * Total own time taken by all scopes.
   * @type {number}
   * @private
   */
  this.ownTime_ = 0;

  /**
   * Total time taken by all scopes, minus system time.
   * @type {number}
   * @private
   */
  this.userTime_ = 0;

  /**
   * Buckets of time, each 1ms.
   * @type {!Uint32Array}
   * @private
   */
  this.buckets_ = new Uint32Array(1000);
};
goog.inherits(wtf.db.ScopeEventDataEntry, wtf.db.EventDataEntry);


/**
 * @override
 */
wtf.db.ScopeEventDataEntry.prototype.appendEvent = function(it) {
  if (!it.getEndTime()) {
    return;
  }

  this.count++;

  var userDuration = it.getUserDuration();
  this.totalTime_ += it.getTotalDuration();
  this.ownTime_ += it.getOwnDuration();
  this.userTime_ += userDuration;

  var bucketIndex = Math.round(userDuration) | 0;
  if (bucketIndex >= 1000) {
    bucketIndex = 999;
  }
  this.buckets_[bucketIndex]++;
};


/**
 * Gets the total time spent within all scopes of this type, including
 * system time.
 * @return {number} Total time.
 */
wtf.db.ScopeEventDataEntry.prototype.getTotalTime = function() {
  return this.totalTime_;
};


/**
 * Gets the total time spent within all scopes of this type, excluding children.
 * @return {number} Total time.
 */
wtf.db.ScopeEventDataEntry.prototype.getOwnTime = function() {
  return this.ownTime_;
};


/**
 * Gets the total time spent within all scopes of this type, excluding
 * system time.
 * @return {number} Total time.
 */
wtf.db.ScopeEventDataEntry.prototype.getUserTime = function() {
  return this.userTime_;
};


/**
 * Gets the mean time of scopes of this type.
 * @return {number} Average mean time.
 */
wtf.db.ScopeEventDataEntry.prototype.getMeanTime = function() {
  if (this.count) {
    if (this.eventType.flags & wtf.data.EventFlag.SYSTEM_TIME) {
      return this.totalTime_ / this.count;
    } else {
      return this.userTime_ / this.count;
    }
  } else {
    return 0;
  }
};


/**
 * Gets the distribution of the events over 0-1s.
 * Any event that ran longer than 1s will be in the last bucket.
 * @return {!Uint32Array} Distribution.
 */
wtf.db.ScopeEventDataEntry.prototype.getDistribution = function() {
  return this.buckets_;
};


goog.exportSymbol(
    'wtf.db.ScopeEventDataEntry',
    wtf.db.ScopeEventDataEntry);
goog.exportProperty(
    wtf.db.ScopeEventDataEntry.prototype, 'getTotalTime',
    wtf.db.ScopeEventDataEntry.prototype.getTotalTime);
goog.exportProperty(
    wtf.db.ScopeEventDataEntry.prototype, 'getOwnTime',
    wtf.db.ScopeEventDataEntry.prototype.getOwnTime);
goog.exportProperty(
    wtf.db.ScopeEventDataEntry.prototype, 'getUserTime',
    wtf.db.ScopeEventDataEntry.prototype.getUserTime);
goog.exportProperty(
    wtf.db.ScopeEventDataEntry.prototype, 'getMeanTime',
    wtf.db.ScopeEventDataEntry.prototype.getMeanTime);
goog.exportProperty(
    wtf.db.ScopeEventDataEntry.prototype, 'getDistribution',
    wtf.db.ScopeEventDataEntry.prototype.getDistribution);



/**
 * An entry in the {@see wtf.db.EventStatistics} describing instance
 * event types.
 * @param {!wtf.db.EventType} eventType Event type.
 * @constructor
 * @extends {wtf.db.EventDataEntry}
 */
wtf.db.InstanceEventDataEntry = function(eventType) {
  goog.base(this, eventType);
};
goog.inherits(wtf.db.InstanceEventDataEntry, wtf.db.EventDataEntry);


/**
 * @override
 */
wtf.db.InstanceEventDataEntry.prototype.appendEvent = function(it) {
  this.count++;
};


goog.exportSymbol(
    'wtf.db.InstanceEventDataEntry',
    wtf.db.InstanceEventDataEntry);
