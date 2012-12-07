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
goog.require('wtf.data.EventClass');



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

  /**
   * Event data keyed on event name.
   * @type {!Object.<!wtf.analysis.db.EventDataEntry>}
   * @private
   */
  this.table_ = {};
};
goog.inherits(wtf.analysis.db.EventDataTable, goog.Disposable);


/**
 * Rebuilds the event data table.
 */
wtf.analysis.db.EventDataTable.prototype.rebuild = function(filter) {
  var table = {};

  var startTime = filter.getStartTime();
  var endTime = filter.getEndTime();
  var evaluator = filter.getEvaluator() || Boolean;

  var zoneIndices = this.db_.getZoneIndices();
  for (var n = 0; n < zoneIndices.length; n++) {
    var zoneIndex = zoneIndices[n];
    zoneIndex.forEach(startTime, endTime, function(e) {
      if (evaluator(e)) {
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
        }
        if (entry) {
          entry.appendEvent(e);
        }
      }
    }, this);
  }

  this.table_ = table;
};


/**
 * Enumerates all event type entries in the data table.
 * @param {function(this: T, !wtf.analysis.db.EventDataEntry)} callback
 *     A function called for each entry.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.analysis.db.EventDataTable.prototype.forEach = function(
    callback, opt_scope) {
  for (var eventName in this.table_) {
    callback.call(opt_scope, this.table_[eventName]);
  }
};



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
    return this.totalTime_ / this.count;
  } else {
    return 0;
  }
};



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
