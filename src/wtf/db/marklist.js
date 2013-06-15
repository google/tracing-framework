/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Mark list.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.MarkList');

goog.require('goog.array');
goog.require('goog.math');
goog.require('wtf.db.IAncillaryList');
goog.require('wtf.db.Mark');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Mark list.
 *
 * @param {!wtf.db.EventList} eventList Event list.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.db.IAncillaryList}
 */
wtf.db.MarkList = function(eventList) {
  goog.base(this);

  /**
   * Event list that this instance is using to detect marks.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = eventList;

  /**
   * A densely packed list of marks.
   * @type {!Array.<!wtf.db.Mark>}
   * @private
   */
  this.markList_ = [];

  this.eventList_.registerAncillaryList(this);
};
goog.inherits(wtf.db.MarkList, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.db.MarkList.prototype.disposeInternal = function() {
  this.eventList_.unregisterAncillaryList(this);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the total number of marks.
 * @return {number} Mark count.
 */
wtf.db.MarkList.prototype.getCount = function() {
  return this.markList_.length;
};


/**
 * Gets a list of all marks.
 * @return {!Array.<!wtf.db.Mark>} Mark list.
 */
wtf.db.MarkList.prototype.getAllMarks = function() {
  return this.markList_;
};


/**
 * Gets the mark that contains the given time.
 * @param {number} time Time.
 * @return {wtf.db.Mark} Mark, if any.
 */
wtf.db.MarkList.prototype.getMarkAtTime = function(time) {
  if (!this.markList_.length) {
    return null;
  }
  var index = goog.array.binarySelect(
      this.markList_, wtf.db.Mark.selector, { time: time });
  if (index < 0) {
    index = -index - 2;
  }
  index = goog.math.clamp(index, 0, this.markList_.length - 1);
  var mark = this.markList_[index];
  if (mark &&
      mark.getTime() <= time &&
      mark.getEndTime() >= time) {
    return mark;
  }
  return null;
};


/**
 * Iterates over the list of marks, returning each one that intersects the
 * given time range in order.
 *
 * @param {number} timeStart Start time range.
 * @param {number} timeEnd End time range.
 * @param {!function(this: T, !wtf.db.Mark)} callback Function to
 *     call with the time ranges.
 * @param {T=} opt_scope Scope to call the function in.
 * @template T
 */
wtf.db.MarkList.prototype.forEachIntersecting = function(
    timeStart, timeEnd, callback, opt_scope) {
  if (!this.markList_.length) {
    return;
  }

  var index = goog.array.binarySelect(
      this.markList_, wtf.db.Mark.selector, { time: timeStart });
  if (index < 0) {
    index = -index - 1;
    // Select the previous frame.
    // The loop will move it ahead if needed.
    index--;
  }
  index = goog.math.clamp(index, 0, this.markList_.length - 1);

  for (var n = index; n < this.markList_.length; n++) {
    var mark = this.markList_[n];
    if (mark.getEndTime() < timeStart) {
      continue;
    }
    if (mark.getTime() > timeEnd) {
      break;
    }
    callback.call(opt_scope, mark);
  }
};


/**
 * @override
 */
wtf.db.MarkList.prototype.beginRebuild = function(eventTypeTable) {
  this.markList_.length = 0;
  return [
    eventTypeTable.getByName('wtf.trace#mark')
  ];
};


/**
 * @override
 */
wtf.db.MarkList.prototype.handleEvent = function(
    eventTypeIndex, eventType, it) {
  // The mark events don't store their duration, but instead it's inferred from
  // the list of marks.
  // We just stash the mark here and fix up durations at the end.
  this.markList_.push(new wtf.db.Mark(
      it.getId(),
      /** @type {string} */ (it.getArgument('name')),
      it.getArgument('value'),
      it.getTime()));
};


/**
 * @override
 */
wtf.db.MarkList.prototype.endRebuild = function() {
  // Fixup end times.
  for (var n = 1; n < this.markList_.length; n++) {
    var previous = this.markList_[n - 1];
    var mark = this.markList_[n];
    previous.setEndTime(mark.getTime());
  }

  // Set the last mark to the end of the zone time.
  if (this.markList_.length) {
    var mark = this.markList_[this.markList_.length - 1];
    mark.setEndTime(this.eventList_.getLastEventTime());
  }

  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


goog.exportProperty(
    wtf.db.MarkList.prototype, 'getCount',
    wtf.db.MarkList.prototype.getCount);
goog.exportProperty(
    wtf.db.MarkList.prototype, 'getAllMarks',
    wtf.db.MarkList.prototype.getAllMarks);
goog.exportProperty(
    wtf.db.MarkList.prototype, 'getMarkAtTime',
    wtf.db.MarkList.prototype.getMarkAtTime);
goog.exportProperty(
    wtf.db.MarkList.prototype, 'forEachIntersecting',
    wtf.db.MarkList.prototype.forEachIntersecting);
