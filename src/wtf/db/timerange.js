/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time range.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.TimeRange');



/**
 * A single time range in the trace.
 *
 * @constructor
 */
wtf.db.TimeRange = function() {
  /**
   * Event ID of the begin.
   * @type {number}
   * @private
   */
  this.beginEventId_ = -1;

  /**
   * Event ID of the end.
   * @type {number}
   * @private
   */
  this.endEventId_ = -1;

  /**
   * Time range name.
   * @type {string}
   * @private
   */
  this.name_ = '';

  /**
   * Time range value.
   * @type {*}
   * @private
   */
  this.value_ = null;

  /**
   * Start time for the frame.
   * @type {number}
   * @private
   */
  this.time_ = 0;

  /**
   * End time for the frame.
   * @type {number}
   * @private
   */
  this.endTime_ = 0;

  /**
   * Level (depth from the root).
   * This is used to compute the Y offset of the time range when drawing.
   * It's updated by the index as new overlapping time ranges are added.
   * @type {number}
   * @private
   */
  this.level_ = 0;

  /**
   * The number of overlapping time ranges.
   * This is only used for bookkeeping by the time range index and should not
   * be trusted.
   * @type {number}
   * @private
   */
  this.overlap_ = 0;

  /**
   * Render data.
   * @type {Object|number|string}
   * @private
   */
  this.renderData_ = null;
};


/**
 * Gets the event ID of the time range begin event, if any.
 * @return {number} Event ID or -1 if no event was set.
 */
wtf.db.TimeRange.prototype.getBeginEventId = function() {
  return this.beginEventId_;
};


/**
 * Sets the time range data from the given start event.
 * @param {!wtf.db.EventIterator} it Event.
 * @param {number} level Level.
 * @param {number} overlap Overlap value.
 */
wtf.db.TimeRange.prototype.setBeginEvent = function(it, level, overlap) {
  this.beginEventId_ = it.getId();
  this.name_ = /** @type {string} */ (it.getArgument('name'));
  this.value_ = it.getArgument('value');
  this.time_ = it.getTime();
  this.level_ = level;
  this.overlap_ = overlap;
};


/**
 * Gets the event ID of the time range end event, if any.
 * @return {number} Event ID or -1 if no event was set.
 */
wtf.db.TimeRange.prototype.getEndEventId = function() {
  return this.endEventId_;
};


/**
 * Sets the time range data from the given end event.
 * @param {!wtf.db.EventIterator} it Event.
 */
wtf.db.TimeRange.prototype.setEndEvent = function(it) {
  this.endEventId_ = it.getId();
  this.endTime_ = it.getTime();
};


/**
 * Gets the time range name.
 * @return {string} Time range name.
 */
wtf.db.TimeRange.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets the time range value.
 * @return {*} Time range value, if any.
 */
wtf.db.TimeRange.prototype.getValue = function() {
  return this.value_;
};


/**
 * Gets the time the time range started at.
 * @return {number} Start time.
 */
wtf.db.TimeRange.prototype.getTime = function() {
  return this.time_;
};


/**
 * Gets the time the time range ended at.
 * @return {number} End time.
 */
wtf.db.TimeRange.prototype.getEndTime = function() {
  return this.endTime_;
};


/**
 * Gets the duration of the time range.
 * @return {number} TimeRange duration.
 */
wtf.db.TimeRange.prototype.getDuration = function() {
  return this.endTime_ - this.time_;
};


/**
 * Gets the level (depth from the root).
 * @return {number} Level.
 */
wtf.db.TimeRange.prototype.getLevel = function() {
  return this.level_;
};


/**
 * Gets the overlap count.
 * @return {number} Overlap.
 */
wtf.db.TimeRange.prototype.getOverlap = function() {
  return this.overlap_;
};


/**
 * Gets the render data value.
 * @return {Object|number|string} Value, if any.
 */
wtf.db.TimeRange.prototype.getRenderData = function() {
  return this.renderData_;
};


/**
 * Sets the render data value.
 * @param {Object|number|string} value New value.
 */
wtf.db.TimeRange.prototype.setRenderData = function(value) {
  this.renderData_ = value;
};


/**
 * Comparer used with {@see goog.array#binarySearch}.
 * @param {!wtf.db.TimeRange} a LHS.
 * @param {!wtf.db.TimeRange} b RHS.
 * @return {number} <, =, >.
 */
wtf.db.TimeRange.comparer = function(a, b) {
  return a.time_ - b.time_;
};


/**
 * Selector used with {@see goog.array#binarySelect}.
 * @param {!wtf.db.TimeRange} target LHS.
 * @return {number} <, =, >.
 * @this {{time: number}}
 */
wtf.db.TimeRange.selector = function(target) {
  return this.time - target.time_;
};


/**
 * The next available ID for {@see #allocateId}.
 * @type {number}
 * @private
 */
wtf.db.TimeRange.nextGlobalId_ = 0;


/**
 * Allocates a global ID used for creating a shared time range ID namespace.
 * @return {number} New ID.
 */
wtf.db.TimeRange.allocateId = function() {
  return ++wtf.db.TimeRange.nextGlobalId_;
};


goog.exportSymbol(
    'wtf.db.TimeRange',
    wtf.db.TimeRange);
goog.exportProperty(
    wtf.db.TimeRange.prototype, 'getBeginEventId',
    wtf.db.TimeRange.prototype.getBeginEventId);
goog.exportProperty(
    wtf.db.TimeRange.prototype, 'getEndEventId',
    wtf.db.TimeRange.prototype.getEndEventId);
goog.exportProperty(
    wtf.db.TimeRange.prototype, 'getName',
    wtf.db.TimeRange.prototype.getName);
goog.exportProperty(
    wtf.db.TimeRange.prototype, 'getValue',
    wtf.db.TimeRange.prototype.getValue);
goog.exportProperty(
    wtf.db.TimeRange.prototype, 'getTime',
    wtf.db.TimeRange.prototype.getTime);
goog.exportProperty(
    wtf.db.TimeRange.prototype, 'getEndTime',
    wtf.db.TimeRange.prototype.getEndTime);
goog.exportProperty(
    wtf.db.TimeRange.prototype, 'getDuration',
    wtf.db.TimeRange.prototype.getDuration);
