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

goog.require('wtf.math');
goog.require('wtf.ui.TimePainter');
goog.require('wtf.util');



/**
 * Paints a ruler into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.ui.RulerPainter = function(canvas) {
  goog.base(this, canvas);

  /**
   * Y offset, in pixels.
   * @type {number}
   * @private
   */
  this.y_ = 0;

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
wtf.ui.RulerPainter.prototype.repaintInternal = function(ctx, bounds) {
  var width = bounds.width;
  var height = bounds.height;
  var y = this.y_;
  var h = wtf.ui.RulerPainter.HEIGHT;

  // Hover UI.
  if (this.showHoverTip_ && this.hoverX_) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.hoverX_, this.y_, 1, height);
  }

  // Clip to extents.
  this.clip(0, y, width, h);

  // Clear gutter.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, y, width, h);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, y + h - 1, width, 1);

  // Draw labels.
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  var duration = timeRight - timeLeft;
  var granularity = this.minGranularity_;
  var n = 0;
  ctx.fillStyle = '#000000';
  while (granularity >= this.maxGranularity_ / 10) {
    var lineCount = duration / granularity;
    var lineSpacing = granularity / duration * width;
    if (lineSpacing < 25) {
      break;
    }

    // Scalar used for text labels.
    var g = 1 / granularity * 1000;

    ctx.globalAlpha = wtf.math.remap(lineSpacing, 25, 100, 0, 1);

    var lineLeft = timeLeft - (timeLeft % granularity);
    var lineRight = timeRight;
    for (var time = lineLeft; time < lineRight; time += granularity) {
      if (n && time % (granularity * 10) == 0) {
        continue;
      }
      var x = wtf.math.remap(time, timeLeft, timeRight, 0, width);
      x = Math.round(x) + 0.5;
      var timeValue = (time / 1000);
      var timeString = (Math.round(timeValue * g) / g) + 's';
      ctx.fillText(timeString, x, y + 10);
    }

    granularity /= 10;
    n++;
  }

  // Draw the hover time.
  if (this.showHoverTip_ && this.hoverX_) {
    var time = wtf.math.remap(this.hoverX_, 0, width, timeLeft, timeRight);
    var timeString = wtf.util.formatTime(time);
    var timeWidth = ctx.measureText(timeString).width;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.hoverX_ - timeWidth / 2 - 3, 0, timeWidth + 6, h - 1);
    ctx.fillStyle = '#000000';
    ctx.fillText(timeString, this.hoverX_ - timeWidth / 2, 10);
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
