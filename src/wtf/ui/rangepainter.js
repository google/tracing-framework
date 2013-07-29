/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Paints a range using the range renderer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.RangePainter');

goog.require('goog.dom.TagName');
goog.require('goog.math');
goog.require('wtf.math');
goog.require('wtf.ui.RangeRenderer');
goog.require('wtf.ui.TimePainter');



/**
 * Optimized range renderer painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {wtf.ui.RangePainter.DrawStyle=} opt_drawStyle Draw style.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.ui.RangePainter = function(canvas, opt_drawStyle) {
  goog.base(this, canvas);
  var dom = this.getDom();

  /**
   * Each RangeRenderer rasterizes one scope depth. Indexed by depth.
   * @type {!Array.<!wtf.ui.RangeRenderer>}
   * @private
   */
  this.rangeRenderers_ = [];

  /**
   * Helper canvas for blitting ranges on the screen.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.rangeStamper_ = /** @type {!HTMLCanvasElement} */(
      dom.createElement(goog.dom.TagName.CANVAS));

  // Initialize range stamper to 1x1. The first time we redraw this will be
  // resized to be as wide as our draw area.
  this.rangeStamper_.width = 1;
  this.rangeStamper_.height = 1;

  /**
   * The context for rangeStamper_.
   * @type {!CanvasRenderingContext2D}
   * @private
   */
  this.rangeStamperContext_ = /** @type {!CanvasRenderingContext2D} */(
      this.rangeStamper_.getContext('2d'));

  /**
   * ImageData used for scribbling into rangeStamper.
   * @type {ImageData}
   * @private
   */
  this.rangeStamperImageData_ =
      this.rangeStamperContext_.createImageData(this.rangeStamper_.width, 1);

  /**
   * Draw style of the current draw block.
   * @type {wtf.ui.RangePainter.DrawStyle}
   * @private
   */
  this.drawStyle_ = wtf.ui.RangePainter.DrawStyle.SCOPE;

  /**
   * A list of labels to be drawn after the ranges have been blitted.
   * @type {!Array.<!Object>}
   * @private
   */
  this.labelsToDraw_ = [];
};
goog.inherits(wtf.ui.RangePainter, wtf.ui.TimePainter);


/**
 * Drawing style.
 * @enum {number}
 */
wtf.ui.RangePainter.DrawStyle = {
  /**
   * Draw lines as scopes - fat bars that fill all their row.
   */
  SCOPE: 0,

  /**
   * Draw lines as time spans - thin bars.
   */
  TIME_SPAN: 2
};


/**
 * Resets range renderer caches and prepares for drawing.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} count Renderer count.
 * @param {wtf.ui.RangePainter.DrawStyle=} opt_drawStyle Draw style.
 * @protected
 */
wtf.ui.RangePainter.prototype.beginRenderingRanges = function(
    bounds, count, opt_drawStyle) {
  this.drawStyle_ = goog.isDef(opt_drawStyle) ?
      opt_drawStyle : wtf.ui.RangePainter.DrawStyle.SCOPE;

  if (this.rangeRenderers_.length > count) {
    this.rangeRenderers_.length = count;
  }
  while (this.rangeRenderers_.length < count) {
    this.rangeRenderers_.push(new wtf.ui.RangeRenderer());
  }
  for (var n = 0; n < this.rangeRenderers_.length; n++) {
    this.rangeRenderers_[n].reset(bounds.width);
  }

  if (bounds.width != this.rangeStamper_.width) {
    this.rangeStamper_.width = bounds.width;
    this.rangeStamperImageData_ = this.rangeStamperContext_.createImageData(
        this.rangeStamper_.width, 1);
  }
};


/**
 * Draws a range into the buffer.
 * @param {number} depth Range depth.
 * @param {number} screenLeft The left edge of the range.
 * @param {number} screenRight The right edge of the range.
 * @param {!wtf.ui.color.RgbColorValue} color The color for the range.
 * @param {number} alpha The alpha to use for drawing color, in the range 0 to
 *   1.
 * @protected
 */
wtf.ui.RangePainter.prototype.drawRange = function(
    depth, screenLeft, screenRight, color, alpha) {
  this.rangeRenderers_[depth].drawRange(screenLeft, screenRight, color, alpha);
};


/**
 * Queues a label for drawing.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} left Unclamped X offset on the canvas.
 * @param {number} right Unclamped X+W offset on the canvas.
 * @param {number} screenLeft Clamped X offset on the canvas.
 * @param {number} screenRight Clamped X+W offset on the canvas.
 * @param {number} y Y offset on the canvas.
 * @param {string} label Label to draw.
 * @protected
 */
wtf.ui.RangePainter.prototype.drawRangeLabel = function(
    bounds, left, right, screenLeft, screenRight, y, label) {
  var ctx = this.getCanvasContext2d();

  // Calculate label width to determine fade.
  var labelWidth = ctx.measureText(label).width;
  var labelScreenWidth = screenRight - screenLeft + 5 + 5;
  if (labelScreenWidth >= labelWidth) {
    var labelAlpha = wtf.math.smoothRemap(
        labelScreenWidth, labelWidth, labelWidth + 15 * 2, 0, 1);

    // Center the label within the box then clamp to the screen.
    var x = left + (right - left) / 2 - labelWidth / 2;
    x = goog.math.clamp(x, 5, bounds.width - labelWidth - 5);

    this.labelsToDraw_.push({
      text: label,
      x: x,
      y: y,
      w: labelWidth,
      alpha: labelAlpha
    });
  }
};


/**
 * Draws the ranges to the context.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} top Blit Y offset.
 * @param {number} rowHeight Height of each row.
 * @protected
 */
wtf.ui.RangePainter.prototype.endRenderingRanges = function(
    bounds, top, rowHeight) {
  var ctx = this.getCanvasContext2d();
  top += bounds.top;

  var currentAlpha = 1;
  ctx.globalAlpha = 1;

  // Setup style information.
  var insetY = 0;
  var insetH = 0;
  var labelBackground = null;
  var labelForeground = '#FFFFFF';
  switch (this.drawStyle_) {
    case wtf.ui.RangePainter.DrawStyle.TIME_SPAN:
      insetY = insetH = rowHeight / 4;
      labelBackground = '#FFFFFF';
      labelForeground = '#000000';
      break;
  }

  // Draw all ranges.
  var y = top;
  for (var i = 0; i < this.rangeRenderers_.length; i++) {
    this.rangeRenderers_[i].getPixels(this.rangeStamperImageData_.data);
    this.rangeStamperContext_.putImageData(
        this.rangeStamperImageData_, 0, 0);
    // Draw the ranges for this depth, stretching to height h.
    ctx.drawImage(
        this.rangeStamper_,
        bounds.left, y + insetY,
        bounds.width, rowHeight - insetY - insetH);
    y += rowHeight;
  }

  // Draw the designated labels on top.
  ctx.fillStyle = labelForeground;
  for (var n = 0; n < this.labelsToDraw_.length; n++) {
    var label = this.labelsToDraw_[n];
    if (currentAlpha != label.alpha) {
      currentAlpha = label.alpha;
      ctx.globalAlpha = currentAlpha;
    }

    var labelHeight = 2 / 3 * rowHeight;

    if (labelBackground) {
      ctx.fillStyle = labelBackground;
      ctx.fillRect(
          label.x - 4, top + label.y - 1, label.w + 8, labelHeight + 4);
      ctx.fillStyle = labelForeground;
    }

    ctx.fillText(label.text, label.x, top + label.y + labelHeight);
  }
  this.labelsToDraw_.length = 0;
  ctx.globalAlpha = 1;
};
