/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time range list.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.TimeRangeList');

goog.require('goog.array');
goog.require('goog.math');
goog.require('wtf.db.IAncillaryList');
goog.require('wtf.db.TimeRange');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Time range list.
 *
 * @param {!wtf.db.EventList} eventList Event list.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.db.IAncillaryList}
 */
wtf.db.TimeRangeList = function(eventList) {
  goog.base(this);

  /**
   * Event list that this instance is using to detect time ranges.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = eventList;

  /**
   * A map of time ranges by global time range ID.
   * @type {!Object.<number, !wtf.db.TimeRange>}
   * @private
   */
  this.timeRanges_ = {};

  /**
   * A densely packed list of time ranges.
   * @type {!Array.<!wtf.db.TimeRange>}
   * @private
   */
  this.timeRangeList_ = [];

  /**
   * The maximum level of any time range in the zone.
   * @type {number}
   * @private
   */
  this.maximumLevel_ = 0;

  /**
   * State used during a rebuild.
   * @type {!Object}
   * @private
   */
  this.rebuildState_ = {
    levels: [],
    overlap: 0
  };

  this.eventList_.registerAncillaryList(this);
};
goog.inherits(wtf.db.TimeRangeList, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.db.TimeRangeList.prototype.disposeInternal = function() {
  this.eventList_.unregisterAncillaryList(this);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the maximum level of any time range in the list.
 * @return {number} Maximum level.
 */
wtf.db.TimeRangeList.prototype.getMaximumLevel = function() {
  return this.maximumLevel_;
};


/**
 * Gets the total number of time ranges.
 * @return {number} Time range count.
 */
wtf.db.TimeRangeList.prototype.getCount = function() {
  return this.timeRangeList_.length;
};


/**
 * Gets a list of all time ranges.
 * @return {!Array.<!wtf.db.TimeRange>} Time range list.
 */
wtf.db.TimeRangeList.prototype.getAllTimeRanges = function() {
  return this.timeRangeList_;
};


/**
 * Gets a time range by ID.
 * @param {number} id Time range ID.
 * @return {wtf.db.TimeRange} Time range, if it exists.
 */
wtf.db.TimeRangeList.prototype.getTimeRange = function(id) {
  return this.timeRanges_[id] || null;
};


/**
 * Gets the time ranges that contains the given time.
 * @param {number} time Time.
 * @return {!Array.<!wtf.db.TimeRange>} Time ranges, if any.
 */
wtf.db.TimeRangeList.prototype.getTimeRangesAtTime = function(time) {
  if (!this.timeRangeList_.length) {
    return [];
  }

  var matches = [];
  this.forEachIntersecting(time, time, function(timeRange) {
    matches.push(timeRange);
  });
  return matches;
};


/**
 * Iterates over the list of time ranges, returning each one that intersects the
 * given time range in order.
 *
 * @param {number} timeStart Start time range.
 * @param {number} timeEnd End time range.
 * @param {!function(this: T, !wtf.db.TimeRange)} callback Function to
 *     call with the time ranges.
 * @param {T=} opt_scope Scope to call the function in.
 * @template T
 */
wtf.db.TimeRangeList.prototype.forEachIntersecting = function(
    timeStart, timeEnd, callback, opt_scope) {
  if (!this.timeRangeList_.length) {
    return;
  }

  var index = goog.array.binarySelect(
      this.timeRangeList_, wtf.db.TimeRange.selector, { time: timeStart });
  if (index < 0) {
    index = -index - 1;
    // Select the previous frame.
    // The loop will move it ahead if needed.
    index--;
  }
  index = goog.math.clamp(index, 0, this.timeRangeList_.length - 1);

  // Scan backwards until we have an overlap = 0.
  for (; index >= 0; index--) {
    var timeRange = this.timeRangeList_[index];
    if (!timeRange.getOverlap()) {
      break;
    }
  }

  for (var n = index; n < this.timeRangeList_.length; n++) {
    var timeRange = this.timeRangeList_[n];
    if (timeRange.getTime() > timeEnd) {
      break;
    }
    if (timeRange.getTime() <= timeEnd &&
        timeRange.getEndTime() >= timeStart) {
      callback.call(opt_scope, timeRange);
    }
  }
};


/**
 * @override
 */
wtf.db.TimeRangeList.prototype.beginRebuild = function(eventTypeTable) {
  this.rebuildState_.levels.length = 0;
  this.rebuildState_.overlap = 0;
  this.rebuildState_.maximumLevel = 0;
  return [
    eventTypeTable.getByName('wtf.timeRange#begin'),
    eventTypeTable.getByName('wtf.timeRange#end')
  ];
};


/**
 * @override
 */
wtf.db.TimeRangeList.prototype.handleEvent = function(
    eventTypeIndex, eventType, it) {
  var id = /** @type {number} */ (it.getArgument('id'));
  var timeRange = this.timeRanges_[id];
  if (!timeRange) {
    timeRange = new wtf.db.TimeRange();
    this.timeRanges_[id] = timeRange;
    this.timeRangeList_.push(timeRange);
  }

  var state = this.rebuildState_;
  switch (eventTypeIndex) {
    case 0:
      for (var n = 0; state.levels[n]; n++) {}
      state.levels[n] = timeRange;
      timeRange.setBeginEvent(it, n, state.overlap++);
      break;
    case 1:
      var n = timeRange.getLevel();
      if (state.levels[n] == timeRange) {
        state.levels[n] = null;
        state.overlap--;
      }
      timeRange.setEndEvent(it);
      break;
  }
};


/**
 * @override
 */
wtf.db.TimeRangeList.prototype.endRebuild = function() {
  this.maximumLevel_ = this.rebuildState_.levels.length;

  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


goog.exportProperty(
    wtf.db.TimeRangeList.prototype, 'getMaximumLevel',
    wtf.db.TimeRangeList.prototype.getMaximumLevel);
goog.exportProperty(
    wtf.db.TimeRangeList.prototype, 'getCount',
    wtf.db.TimeRangeList.prototype.getCount);
goog.exportProperty(
    wtf.db.TimeRangeList.prototype, 'getAllTimeRanges',
    wtf.db.TimeRangeList.prototype.getAllTimeRanges);
goog.exportProperty(
    wtf.db.TimeRangeList.prototype, 'getTimeRangesAtTime',
    wtf.db.TimeRangeList.prototype.getTimeRangesAtTime);
goog.exportProperty(
    wtf.db.TimeRangeList.prototype, 'forEachIntersecting',
    wtf.db.TimeRangeList.prototype.forEachIntersecting);
