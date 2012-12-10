/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Grid painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.GridPainter');

goog.require('wtf.math');
goog.require('wtf.ui.TimeRangePainter');



/**
 * Paints a grid into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {number=} opt_y Y offset, in pixels.
 * @constructor
 * @extends {wtf.ui.TimeRangePainter}
 */
wtf.ui.GridPainter = function(canvas, opt_y) {
  goog.base(this, canvas);

  /**
   * Y offset, in pixels.
   * @type {number}
   * @private
   */
  this.y_ = opt_y || 0;

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
};
goog.inherits(wtf.ui.GridPainter, wtf.ui.TimeRangePainter);


/**
 * Sets the minimum/maximum granularities.
 * @param {number} min Minimum granularity.
 * @param {number} max Maximum granularity.
 */
wtf.ui.GridPainter.prototype.setGranularities = function(min, max) {
  this.minGranularity_ = min;
  this.maxGranularity_ = max;
};


/**
 * @override
 */
wtf.ui.GridPainter.prototype.repaintInternal = function(ctx, width, height) {
  var y = this.y_;
  var h = height - y;

  // Clip to extents.
  this.clip(0, y, width, h);

  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  var duration = timeRight - timeLeft;
  var granularity = this.minGranularity_;
  var n = 0;
  ctx.strokeStyle = '#000000';
  while (granularity >= this.maxGranularity_ / 100) {
    var lineCount = duration / granularity;
    var lineSpacing = granularity / duration * width;
    if (lineSpacing < 5) {
      break;
    }

    ctx.globalAlpha = wtf.math.remap(lineSpacing, 5, 100, 0, 1);

    ctx.beginPath();
    var lineLeft = timeLeft - (timeLeft % granularity);
    var lineRight = timeRight;
    for (var time = lineLeft; time < lineRight; time += granularity) {
      if (n && time % (granularity * 10) == 0) {
        continue;
      }
      var x = wtf.math.remap(time, timeLeft, timeRight, 0, width);
      x = Math.round(x) + 0.5;
      if (x >= 0) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, height);
      }
    }
    ctx.stroke();

    granularity /= 10;
    n++;
  }
};
