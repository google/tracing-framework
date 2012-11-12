/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time range painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.TimeRangePainter');

goog.require('wtf.ui.PaintContext');



/**
 * Paints a time range into the view.
 * @param {!wtf.ui.PaintContext} parentContext Parent paint context.
 * @constructor
 * @extends {wtf.ui.PaintContext}
 */
wtf.ui.TimeRangePainter = function(parentContext) {
  goog.base(this, parentContext.getCanvas(), parentContext);

  /**
   * Time offset (time of the first event in the database).
   * @type {number}
   * @protected
   */
  this.timeOffset = 0;

  /**
   * Left-most visible time.
   * @type {number}
   * @protected
   */
  this.timeLeft = 0;

  /**
   * Right-most visible time.
   * @type {number}
   * @protected
   */
  this.timeRight = 0;
};
goog.inherits(wtf.ui.TimeRangePainter, wtf.ui.PaintContext);


/**
 * Sets the visible time range.
 * @param {number} timeOffset Time of the first event in the database.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 */
wtf.ui.TimeRangePainter.prototype.setTimeRange = function(
    timeOffset, timeLeft, timeRight) {
  this.timeOffset = timeOffset;
  this.timeLeft = timeLeft;
  this.timeRight = timeRight;
};
