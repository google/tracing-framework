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

goog.require('wtf.ui.Painter');



/**
 * Paints a time range into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @constructor
 * @extends {wtf.ui.Painter}
 */
wtf.ui.TimeRangePainter = function(canvas) {
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
};
goog.inherits(wtf.ui.TimeRangePainter, wtf.ui.Painter);


/**
 * Sets the visible time range.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 */
wtf.ui.TimeRangePainter.prototype.setTimeRange = function(timeLeft, timeRight) {
  this.timeLeft = timeLeft;
  this.timeRight = timeRight;
};
