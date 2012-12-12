/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event data table.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.EventDataEntry');
goog.provide('wtf.analysis.db.EventDataTable');
goog.provide('wtf.analysis.db.InstanceEventDataEntry');
goog.provide('wtf.analysis.db.ScopeEventDataEntry');

goog.require('goog.Disposable');
goog.require('wtf.analysis.db.SortMode');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.EventFlag');



/**
 * Event data table.
 * Caches detailed aggregate information about events.
 *
 * @param {!wtf.analysis.db.EventDatabase} db Event database.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.db.EventDataTable = function(db) {
  goog.base(this);

  /**
   * Event database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  // Hacky, but stash the well-known event types that we will be comparing
  // with to dramatically improve performance.
  var traceListener = db.getTraceListener();
  /**
   * Lookup for common event types.
   * @type {!Object.<wtf.analysis.EventType>}
   * @private
   */
  this.eventTypes_ = {
    scopeLeave: traceListener.getEventType('wtf.scope.leave')
  };

  /**
   * Event data keyed on event name.
   * @type {!Object.<!wtf.analysis.db.EventDataEntry>}
   * @private
   */
  this.table_ = {};

  /**
   * A list of all event entries.
   * @type {!Array.<!wtf.analysis.db.EventDataEntry>}
   * @private
   */
  this.list_ = [];

  /**
   * The current sort mode of the list.
   * This is used to prevent successive sorts of the list.
   * @type {wtf.analysis.db.SortMode}
   * @private
   */
  this.listSortMode_ = wtf.analysis.db.SortMode.ANY;

  /**
   * Total number of filtered events.
   * @type {number}
   * @private
   */
  this.filteredEventCount_ = 0;
};
goog.inherits(wtf.analysis.db.EventDataTable, goog.Disposable);


/**
 * Rebuilds the event data table.
 * @param {number} startTime Starting time.
 * @param {number} endTime Ending time.
 * @param {function(!wtf.analysis.Event):boolean} evaluator Event filter.
 */
wtf.analysis.db.EventDataTable.prototype.rebuild = function(
    startTime, endTime, evaluator) {
  // TODO(benvanik): cache? etc?
  var table = {};
  var list = [];
  this.filteredEventCount_ = 0;

  var zoneIndices = this.db_.getZoneIndices();
  for (var n = 0; n < zoneIndices.length; n++) {
    var zoneIndex = zoneIndices[n];
    zoneIndex.forEach(startTime, endTime, function(e) {
      // Skip leaves, they aren't interesting here.
      if (e.eventType.flags & wtf.data.EventFlag.INTERNAL ||
          e.eventType == this.eventTypes_.scopeLeave) {
        return;
      }

      // Ignore the event if it doesn't match.
      if (!evaluator(e)) {
        return;
      }

      var eventName = e.eventType.name;
      var entry = table[eventName];
      if (!entry) {
        switch (e.eventType.eventClass) {
          case wtf.data.EventClass.SCOPE:
            entry = new wtf.analysis.db.ScopeEventDataEntry(e.eventType);
            break;
          case wtf.data.EventClass.INSTANCE:
            entry = new wtf.analysis.db.InstanceEventDataEntry(e.eventType);
            break;
        }
        table[eventName] = entry;
        list.push(entry);
      }
      if (entry) {
        entry.appendEvent(e);
        this.filteredEventCount_++;
      }
    }, this);
  }

  this.table_ = table;
  this.list_ = list;
  this.listSortMode_ = wtf.analysis.db.SortMode.ANY;
};


/**
 * Gets the total number of events included in the table.
 * @return {number} Event count.
 */
wtf.analysis.db.EventDataTable.prototype.getFilteredEventCount = function() {
  return this.filteredEventCount_;
};


/**
 * Gets the entry for an event type, if it exists.
 * @param {string} eventName Event name.
 * @return {wtf.analysis.db.EventDataEntry} Event entry, if it exists.
 */
wtf.analysis.db.EventDataTable.prototype.getEventTypeEntry =
    function(eventName) {
  return this.table_[eventName] || null;
};


/**
 * Enumerates all event type entries in the data table.
 * @param {function(this: T, !wtf.analysis.db.EventDataEntry)} callback
 *     A function called for each entry.
 * @param {T=} opt_scope Callback scope.
 * @param {wtf.analysis.db.SortMode=} opt_sortMode Sort mode.
 * @template T
 */
wtf.analysis.db.EventDataTable.prototype.forEach = function(
    callback, opt_scope, opt_sortMode) {
  if (opt_sortMode && this.listSortMode_ != opt_sortMode) {
    // Sort before enumerating if the sort order does not match the cached
    // value.
    this.listSortMode_ = opt_sortMode;
    switch (this.listSortMode_) {
      case wtf.analysis.db.SortMode.COUNT:
        this.list_.sort(function(a, b) {
          return b.count - a.count;
        });
        break;
      case wtf.analysis.db.SortMode.TOTAL_TIME:
        this.list_.sort(function(a, b) {
          if (a instanceof wtf.analysis.db.ScopeEventDataEntry &&
              b instanceof wtf.analysis.db.ScopeEventDataEntry) {
            return b.totalTime_ - a.totalTime_;
          } else if (a instanceof wtf.analysis.db.ScopeEventDataEntry) {
            return -1;
          } else if (b instanceof wtf.analysis.db.ScopeEventDataEntry) {
            return 1;
          } else {
            return b.count - a.count;
          }
        });
        break;
      case wtf.analysis.db.SortMode.MEAN_TIME:
        this.list_.sort(function(a, b) {
          if (a instanceof wtf.analysis.db.ScopeEventDataEntry &&
              b instanceof wtf.analysis.db.ScopeEventDataEntry) {
            return b.getMeanTime() - a.getMeanTime();
          } else if (a instanceof wtf.analysis.db.ScopeEventDataEntry) {
            return -1;
          } else if (b instanceof wtf.analysis.db.ScopeEventDataEntry) {
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


goog.exportSymbol(
    'wtf.analysis.db.EventDataTable',
    wtf.analysis.db.EventDataTable);
goog.exportProperty(
    wtf.analysis.db.EventDataTable.prototype, 'rebuild',
    wtf.analysis.db.EventDataTable.prototype.rebuild);
goog.exportProperty(
    wtf.analysis.db.EventDataTable.prototype, 'getFilteredEventCount',
    wtf.analysis.db.EventDataTable.prototype.getFilteredEventCount);
goog.exportProperty(
    wtf.analysis.db.EventDataTable.prototype, 'getEventTypeEntry',
    wtf.analysis.db.EventDataTable.prototype.getEventTypeEntry);
goog.exportProperty(
    wtf.analysis.db.EventDataTable.prototype, 'forEach',
    wtf.analysis.db.EventDataTable.prototype.forEach);



/**
 * Abstract base type for entries in the {@see wtf.analysis.db.EventDataTable}.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @constructor
 */
wtf.analysis.db.EventDataEntry = function(eventType) {
  /**
   * Event type.
   * @type {!wtf.analysis.EventType}
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
 * @param {!wtf.analysis.Event} e Event.
 */
wtf.analysis.db.EventDataEntry.prototype.appendEvent = goog.abstractMethod;


/**
 * Gets the event type this entry describes.
 * @return {!wtf.analysis.EventType} Event type.
 */
wtf.analysis.db.EventDataEntry.prototype.getEventType = function() {
  return this.eventType;
};


/**
 * Gets the total number of events encountered.
 * @return {number} Event count.
 */
wtf.analysis.db.EventDataEntry.prototype.getCount = function() {
  return this.count;
};


/**
 * Gets the frequency of the events as a measure of instances/sec.
 * @return {number} Instances/second.
 */
wtf.analysis.db.EventDataEntry.prototype.getFrequency = function() {
  // TODO(benvanik): compute frequency of events.
  return 0;
};


goog.exportSymbol(
    'wtf.analysis.db.EventDataEntry',
    wtf.analysis.db.EventDataEntry);
goog.exportProperty(
    wtf.analysis.db.EventDataEntry.prototype, 'getEventType',
    wtf.analysis.db.EventDataEntry.prototype.getEventType);
goog.exportProperty(
    wtf.analysis.db.EventDataEntry.prototype, 'getCount',
    wtf.analysis.db.EventDataEntry.prototype.getCount);
goog.exportProperty(
    wtf.analysis.db.EventDataEntry.prototype, 'getFrequency',
    wtf.analysis.db.EventDataEntry.prototype.getFrequency);



/**
 * An entry in the {@see wtf.analysis.db.EventDataTable} describing scope
 * event types.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @constructor
 * @extends {wtf.analysis.db.EventDataEntry}
 */
wtf.analysis.db.ScopeEventDataEntry = function(eventType) {
  goog.base(this, eventType);

  /**
   * Total time taken by all scopes.
   * @type {number}
   * @private
   */
  this.totalTime_ = 0;

  /**
   * Total time taken by all scopes, minus system time.
   * @type {number}
   * @private
   */
  this.userTime_ = 0;
};
goog.inherits(wtf.analysis.db.ScopeEventDataEntry,
    wtf.analysis.db.EventDataEntry);


/**
 * @override
 */
wtf.analysis.db.ScopeEventDataEntry.prototype.appendEvent = function(e) {
  this.count++;

  var scope = e.scope;
  this.totalTime_ += scope.getTotalDuration();
  this.userTime_ += scope.getUserDuration();
};


/**
 * Gets the total time spent within all scopes of this type, including
 * system time.
 * @return {number} Total time.
 */
wtf.analysis.db.ScopeEventDataEntry.prototype.getTotalTime = function() {
  return this.totalTime_;
};


/**
 * Gets the total time spent within all scopes of this type, excluding
 * system time.
 * @return {number} Total time.
 */
wtf.analysis.db.ScopeEventDataEntry.prototype.getUserTime = function() {
  return this.userTime_;
};


/**
 * Gets the mean time of scopes of this type.
 * @return {number} Average mean time.
 */
wtf.analysis.db.ScopeEventDataEntry.prototype.getMeanTime = function() {
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


goog.exportSymbol(
    'wtf.analysis.db.ScopeEventDataEntry',
    wtf.analysis.db.ScopeEventDataEntry);
goog.exportProperty(
    wtf.analysis.db.ScopeEventDataEntry.prototype, 'getTotalTime',
    wtf.analysis.db.ScopeEventDataEntry.prototype.getTotalTime);
goog.exportProperty(
    wtf.analysis.db.ScopeEventDataEntry.prototype, 'getUserTime',
    wtf.analysis.db.ScopeEventDataEntry.prototype.getUserTime);
goog.exportProperty(
    wtf.analysis.db.ScopeEventDataEntry.prototype, 'getMeanTime',
    wtf.analysis.db.ScopeEventDataEntry.prototype.getMeanTime);



/**
 * An entry in the {@see wtf.analysis.db.EventDataTable} describing instance
 * event types.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @constructor
 * @extends {wtf.analysis.db.EventDataEntry}
 */
wtf.analysis.db.InstanceEventDataEntry = function(eventType) {
  goog.base(this, eventType);
};
goog.inherits(wtf.analysis.db.InstanceEventDataEntry,
    wtf.analysis.db.EventDataEntry);


/**
 * @override
 */
wtf.analysis.db.InstanceEventDataEntry.prototype.appendEvent = function(e) {
  this.count++;
};


goog.exportSymbol(
    'wtf.analysis.db.InstanceEventDataEntry',
    wtf.analysis.db.InstanceEventDataEntry);
