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

goog.provide('wtf.ui.TimePainter');

goog.require('wtf.db.Unit');
goog.require('wtf.ui.Painter');



/**
 * Paints a time range into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @constructor
 * @extends {wtf.ui.Painter}
 */
wtf.ui.TimePainter = function(canvas) {
  goog.base(this, canvas);

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

  /**
   * Units to display labels in.
   * @type {wtf.db.Unit}
   * @protected
   */
  this.units = wtf.db.Unit.TIME_MILLISECONDS;
};
goog.inherits(wtf.ui.TimePainter, wtf.ui.Painter);


/**
 * Sets the visible time range.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 */
wtf.ui.TimePainter.prototype.setTimeRange = function(timeLeft, timeRight) {
  this.timeLeft = timeLeft;
  this.timeRight = timeRight;
};


/**
 * @return {boolean} True if the time range is valid for painting.
 */
wtf.ui.TimePainter.prototype.isTimeRangeValid = function() {
  return this.timeLeft != this.timeRight;
};


/**
 * Sets the units the painter draws labels in.
 * @param {wtf.db.Unit} value Units.
 */
wtf.ui.TimePainter.prototype.setUnits = function(value) {
  this.units = value;
};
