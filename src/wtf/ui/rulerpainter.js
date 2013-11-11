/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Ruler painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.RulerPainter');

goog.require('wtf.db.Unit');
goog.require('wtf.math');
goog.require('wtf.ui.TimePainter');



/**
 * Paints a ruler into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.ui.RulerPainter = function RulerPainter(canvas) {
  goog.base(this, canvas);

  /**
   * Minimum granularity.
   * @type {number}
   * @private
   */
  this.minGranularity_ = 0;

  /**
   * Maximum granularity.
   * @type {number}
   * @private
   */
  this.maxGranularity_ = 0;

  /**
   * Whether to show the hover bar/time.
   * @type {boolean}
   * @private
   */
  this.showHoverTip_ = true;

  /**
   * Current X of the mouse, if it is hovering over the context.
   * If this is zero then the mouse is not hovering.
   * @type {number}
   * @private
   */
  this.hoverX_ = 0;
};
goog.inherits(wtf.ui.RulerPainter, wtf.ui.TimePainter);


/**
 * Height of the ruler, in pixels.
 * @type {number}
 * @const
 */
wtf.ui.RulerPainter.HEIGHT = 16;


/**
 * Sets the minimum/maximum granularities.
 * @param {number} min Minimum granularity.
 * @param {number} max Maximum granularity.
 */
wtf.ui.RulerPainter.prototype.setGranularities = function(min, max) {
  this.minGranularity_ = min;
  this.maxGranularity_ = max;
};


/**
 * @override
 */
wtf.ui.RulerPainter.prototype.layoutInternal = function(availableBounds) {
  var newBounds = availableBounds.clone();
  newBounds.height = wtf.ui.RulerPainter.HEIGHT;
  return newBounds;
};


/**
 * @override
 */
wtf.ui.RulerPainter.prototype.repaintInternal = function(ctx, bounds) {
  if (!this.isTimeRangeValid()) {
    return;
  }

  var width = bounds.width;

  // Hover UI.
  // TODO(benvanik): this displays under other painters - it should be moved to
  //     its own painter.
  if (this.showHoverTip_ && this.hoverX_) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(
        bounds.left + this.hoverX_, bounds.top,
        1, this.getScaledCanvasHeight() - bounds.top);
  }

  // Clip to extents.
  this.clip(bounds.left, bounds.top, bounds.width, bounds.height);

  // Clear gutter.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
  ctx.fillStyle = '#000000';
  ctx.fillRect(bounds.left, bounds.top + bounds.height - 1, bounds.width, 1);

  // Draw labels.
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  var duration = timeRight - timeLeft;
  var granularity = this.minGranularity_;
  var n = 0;
  ctx.fillStyle = '#000000';
  while (granularity >= this.maxGranularity_ / 10) {
    var lineSpacing = granularity / duration * width;
    if (lineSpacing < 25) {
      break;
    }

    ctx.globalAlpha = wtf.math.remap(lineSpacing, 25, 100, 0, 1);

    var lineLeft = timeLeft - (timeLeft % granularity);
    var lineRight = timeRight;
    for (var time = lineLeft; time < lineRight; time += granularity) {
      if (n && time % (granularity * 10) == 0) {
        continue;
      }
      var x = wtf.math.remap(time, timeLeft, timeRight, 0, width);
      x = Math.round(x) + 0.5;
      var timeString = wtf.db.Unit.format(time, this.units, true);
      ctx.fillText(timeString, bounds.left + x, bounds.top + 11);
    }

    granularity /= 10;
    n++;
  }

  // Draw the hover time.
  if (this.showHoverTip_ && this.hoverX_) {
    var time = wtf.math.remap(this.hoverX_, 0, width, timeLeft, timeRight);
    var timeString = wtf.db.Unit.format(time, this.units);
    var timeWidth = ctx.measureText(timeString).width;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(
        bounds.left + this.hoverX_ - timeWidth / 2 - 3, bounds.top,
        timeWidth + 6, bounds.height - 1);
    ctx.fillStyle = '#000000';
    ctx.fillText(
        timeString,
        bounds.left + this.hoverX_ - timeWidth / 2, bounds.top + 11);
  }
};


/**
 * @override
 */
wtf.ui.RulerPainter.prototype.onMouseMoveInternal =
    function(x, y, modifiers, bounds) {
  if (!this.showHoverTip_) {
    return;
  }
  this.hoverX_ = x;
  this.requestRepaint();
};


/**
 * @override
 */
wtf.ui.RulerPainter.prototype.onMouseOutInternal = function() {
  if (!this.showHoverTip_) {
    return;
  }
  this.hoverX_ = 0;
  this.requestRepaint();
};
