/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Frame.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.Frame');



/**
 * A single render frame in the trace.
 *
 * @param {number} number Frame number.
 * @constructor
 */
wtf.db.Frame = function(number) {
  /**
   * Ordinal in the frame list.
   * @type {number}
   * @private
   */
  this.ordinal_ = 0;

  /**
   * Frame number.
   * @type {number}
   * @private
   */
  this.number_ = number;

  /**
   * Event ID of the frameStart.
   * @type {number}
   * @private
   */
  this.frameStartEventId_ = 0;

  /**
   * Event ID of the frameEnd.
   * @type {number}
   * @private
   */
  this.frameEndEventId_ = 0;

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
};


/**
 * Sets the frame data from the given start event.
 * @param {!wtf.db.EventIterator} it Event.
 */
wtf.db.Frame.prototype.setStartEvent = function(it) {
  this.frameStartEventId_ = it.getId();
  this.time_ = it.getTime();
};


/**
 * Sets the frame data from the given end event.
 * @param {!wtf.db.EventIterator} it Event.
 */
wtf.db.Frame.prototype.setEndEvent = function(it) {
  this.frameEndEventId_ = it.getId();
  this.endTime_ = it.getTime();
};


/**
 * Gets the ordinal of the frame in the parent frame list.
 * @return {number} Ordinal in the frame list.
 */
wtf.db.Frame.prototype.getOrdinal = function() {
  return this.ordinal_;
};


/**
 * Sets the value of the ordinal of the frame in the parent frame list.
 * @param {number} value Ordinal.
 */
wtf.db.Frame.prototype.setOrdinal = function(value) {
  this.ordinal_ = value;
};


/**
 * Gets the frame number.
 * @return {number} Frame number.
 */
wtf.db.Frame.prototype.getNumber = function() {
  return this.number_;
};


/**
 * Gets the time the frame started at.
 * @return {number} Start time.
 */
wtf.db.Frame.prototype.getTime = function() {
  return this.time_;
};


/**
 * Gets the time the frame ended at.
 * @return {number} End time.
 */
wtf.db.Frame.prototype.getEndTime = function() {
  return this.endTime_;
};


/**
 * Gets the duration of the frame.
 * @return {number} Frame duration.
 */
wtf.db.Frame.prototype.getDuration = function() {
  return this.endTime_ - this.time_;
};


/**
 * Gets the ID of the start event.
 * @return {number} ID of the start event.
 */
wtf.db.Frame.prototype.getStartEventId = function() {
  return this.frameStartEventId_;
};


/**
 * Gets the ID of the end event.
 * @return {number} ID of the end event.
 */
wtf.db.Frame.prototype.getEndEventId = function() {
  return this.frameEndEventId_;
};


/**
 * Comparer used with {@see goog.array#binarySearch}.
 * @param {!wtf.db.Frame} a LHS.
 * @param {!wtf.db.Frame} b RHS.
 * @return {number} <, =, >.
 */
wtf.db.Frame.comparer = function(a, b) {
  return a.time_ - b.time_;
};


/**
 * Selector used with {@see goog.array#binarySelect}.
 * @param {!wtf.db.Frame} target LHS.
 * @return {number} <, =, >.
 * @this {{time: number}}
 */
wtf.db.Frame.selector = function(target) {
  return this.time - target.time_;
};


goog.exportSymbol(
    'wtf.db.Frame',
    wtf.db.Frame);
goog.exportProperty(
    wtf.db.Frame.prototype, 'getNumber',
    wtf.db.Frame.prototype.getNumber);
goog.exportProperty(
    wtf.db.Frame.prototype, 'getTime',
    wtf.db.Frame.prototype.getTime);
goog.exportProperty(
    wtf.db.Frame.prototype, 'getEndTime',
    wtf.db.Frame.prototype.getEndTime);
goog.exportProperty(
    wtf.db.Frame.prototype, 'getDuration',
    wtf.db.Frame.prototype.getDuration);
