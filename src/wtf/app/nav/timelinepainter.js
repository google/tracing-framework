/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timeline painter for the timeline control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.nav.TimelinePainter');

goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.TimePainter');



/**
 * Timeline painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.db.Database} db Database.
 * @param {!wtf.db.Zone} zone Zone.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.app.nav.TimelinePainter = function TimelinePainter(canvas, db, zone) {
  goog.base(this, canvas);

  /**
   * Frame list.
   * @type {wtf.db.FrameList}
   * @private
   */
  this.frameList_ = zone.getFrameList();
  this.frameList_.addListener(wtf.events.EventType.INVALIDATED,
      this.requestRepaint, this);
};
goog.inherits(wtf.app.nav.TimelinePainter, wtf.ui.TimePainter);


/**
 * @override
 */
wtf.app.nav.TimelinePainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  if (this.frameList_.getCount()) {
    newBounds.height = 45;
  } else {
    newBounds.height = 0;
  }
  return newBounds;
};


/**
 * @override
 */
wtf.app.nav.TimelinePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  if (!this.isTimeRangeValid()) {
    return;
  }

  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  var timeScale = 1 / wtf.math.remap(45, 0, bounds.height, 0, 1);

  // Clip to extents.
  this.clip(bounds.left, bounds.top, bounds.width, bounds.height);

  // Draw frames.
  // TODO(benvanik): only redraw if needed (data has changed)
  // TODO(benvanik): custom pixel pushing? it'd be cool to color the chart by
  //     frame time, but the single-color-per-path API of canvas makes that
  //     difficult.
  ctx.fillStyle = '#444444';
  var pixelStep = (timeRight - timeLeft) / bounds.width;
  var pixelStart = 0;
  var pixelAccumulator = 0;
  var lastX = 0;
  ctx.beginPath();
  ctx.moveTo(bounds.left, bounds.top + bounds.height);
  this.frameList_.forEachIntersecting(timeLeft, timeRight, function(frame) {
    // Compute time of frame based on previous time.
    var previousFrame = this.frameList_.getPreviousFrame(frame);
    var frameTime = 0;
    if (previousFrame) {
      frameTime = frame.getEndTime() - previousFrame.getEndTime();
    }
    if (!frameTime) {
      return;
    }

    var endTime = frame.getEndTime();
    pixelAccumulator = Math.max(pixelAccumulator, frameTime);
    if (endTime > pixelStart + pixelStep) {
      var x = wtf.math.remap(pixelStart, timeLeft, timeRight, 0, bounds.width);
      lastX = x;
      var value = pixelAccumulator;
      var fy = Math.max(bounds.height - value * timeScale, 0);
      ctx.lineTo(bounds.left + x, bounds.top + fy);
      // Create a gap if the time is too large.
      var gapSize = endTime - pixelStart;
      pixelStart = endTime - (endTime % pixelStep);
      if (gapSize > 33) {
        var xr = wtf.math.remap(endTime, timeLeft, timeRight, 0, bounds.width);
        ctx.lineTo(bounds.left + xr, bounds.top + fy);
        ctx.lineTo(bounds.left + xr, bounds.top + bounds.height);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(bounds.left + x, bounds.top, 1, bounds.height);
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(bounds.left + wtf.math.remap(pixelStart,
            timeLeft, timeRight, 0, bounds.width), bounds.top + bounds.height);
      }
      pixelAccumulator = 0;
    }
  }, this);
  ctx.lineTo(bounds.left + lastX, bounds.top + bounds.height);
  ctx.lineTo(bounds.left, bounds.top + bounds.height);
  ctx.fill();

  // Draw frame time limits.
  ctx.fillStyle = '#DD4B39';
  ctx.fillRect(
      bounds.left, bounds.top + Math.floor(bounds.height - 17 * timeScale),
      bounds.width, 1);
  ctx.fillRect(
      bounds.left, bounds.top + Math.floor(bounds.height - 33 * timeScale),
      bounds.width, 1);

  // Draw borders.
  ctx.fillStyle = 'rgb(200,200,200)';
  ctx.fillRect(
      bounds.left, bounds.top + bounds.height - 1,
      bounds.width, 1);

  // Draw label on the left.
  this.drawLabel('frame time');
};
