/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Mark.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.Mark');



/**
 * A single mark in the trace.
 * This is constructed by the mark list from the marks present.
 *
 * @param {number} eventId Event ID.
 * @param {string} name Mark name.
 * @param {*} value Value, if any.
 * @param {number} time Start time.
 * @constructor
 */
wtf.db.Mark = function(eventId, name, value, time) {
  /**
   * Event ID of the mark.
   * @type {number}
   * @private
   */
  this.eventId_ = eventId;

  /**
   * Mark name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Mark value.
   * @type {*}
   * @private
   */
  this.value_ = value;

  /**
   * Start time for the mark.
   * @type {number}
   * @private
   */
  this.time_ = time;

  /**
   * End time for the mark.
   * @type {number}
   * @private
   */
  this.endTime_ = Number.MAX_VALUE;

  /**
   * Render data.
   * @type {Object|number|string}
   * @private
   */
  this.renderData_ = null;
};


/**
 * Gets the event ID of the mark.
 * @return {number} Event ID.
 */
wtf.db.Mark.prototype.getEventId = function() {
  return this.eventId_;
};


/**
 * Gets the mark name.
 * @return {string} Mark name.
 */
wtf.db.Mark.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets the mark value.
 * @return {*} Mark value, if any.
 */
wtf.db.Mark.prototype.getValue = function() {
  return this.value_;
};


/**
 * Gets the time the mark started at.
 * @return {number} Start time.
 */
wtf.db.Mark.prototype.getTime = function() {
  return this.time_;
};


/**
 * Gets the time the mark ended at.
 * @return {number} End time.
 */
wtf.db.Mark.prototype.getEndTime = function() {
  return this.endTime_;
};


/**
 * Sets the time the mark ended at.
 * @param {number} value End time.
 */
wtf.db.Mark.prototype.setEndTime = function(value) {
  this.endTime_ = value;
};


/**
 * Gets the duration of the mark.
 * @return {number} Mark duration.
 */
wtf.db.Mark.prototype.getDuration = function() {
  return this.endTime_ - this.time_;
};


/**
 * Gets the render data value.
 * @return {Object|number|string} Value, if any.
 */
wtf.db.Mark.prototype.getRenderData = function() {
  return this.renderData_;
};


/**
 * Sets the render data value.
 * @param {Object|number|string} value New value.
 */
wtf.db.Mark.prototype.setRenderData = function(value) {
  this.renderData_ = value;
};


/**
 * Comparer used with {@see goog.array#binarySearch}.
 * @param {!wtf.db.Mark} a LHS.
 * @param {!wtf.db.Mark} b RHS.
 * @return {number} <, =, >.
 */
wtf.db.Mark.comparer = function(a, b) {
  return a.time_ - b.time_;
};


/**
 * Selector used with {@see goog.array#binarySelect}.
 * @param {!wtf.db.Mark} target LHS.
 * @return {number} <, =, >.
 * @this {{time: number}}
 */
wtf.db.Mark.selector = function(target) {
  return this.time - target.time_;
};


goog.exportSymbol(
    'wtf.db.Mark',
    wtf.db.Mark);
goog.exportProperty(
    wtf.db.Mark.prototype, 'getEventId',
    wtf.db.Mark.prototype.getEventId);
goog.exportProperty(
    wtf.db.Mark.prototype, 'getName',
    wtf.db.Mark.prototype.getName);
goog.exportProperty(
    wtf.db.Mark.prototype, 'getValue',
    wtf.db.Mark.prototype.getValue);
goog.exportProperty(
    wtf.db.Mark.prototype, 'getTime',
    wtf.db.Mark.prototype.getTime);
goog.exportProperty(
    wtf.db.Mark.prototype, 'getEndTime',
    wtf.db.Mark.prototype.getEndTime);
goog.exportProperty(
    wtf.db.Mark.prototype, 'getDuration',
    wtf.db.Mark.prototype.getDuration);
