/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Helper class to very efficiently draw a bunch of
 * non-overlapping line segments. For very large numbers of ranges this is
 * much much faster than the same number of canvas draw calls. This class
 * can handle hundreds of thousands of ranges at high frame rate.
 *
 * @author rsturgell@google.com (Ryan Sturgell)
 */

goog.provide('wtf.ui.RangeRenderer');



/**
 * Range renderer.
 * @constructor
 */
wtf.ui.RangeRenderer = function() {
  /**
   * Width in pixels.
   * @type {number}
   * @private
   */
  this.width_ = 0;

  /**
   * @type {Float32Array}
   * @private
   */
  this.buffer_ = null;
};


/**
 * Clear the accumulated ranges. Resetting with a different width is somewhat
 * expensive so should not be done frequently.
 * @param {number} width Width.
 */
wtf.ui.RangeRenderer.prototype.reset = function(width) {
  if (this.width_ != width) {
    this.buffer_ = new Float32Array(width * 4);
    this.width_ = width;
  }
  var buff = this.buffer_;
  for (var i = 0; i < width; i++) {
    buff[4 * i + 0] = 0;
    buff[4 * i + 1] = 0;
    buff[4 * i + 2] = 0;
    // Initializing alpha to a very small value allows a uniform
    // un-premultiply in getPixels because we won't have to worry about
    // dividing by 0.
    buff[4 * i + 3] = .00001;
  }
};


/**
 * Draws a range into the buffer.
 * @param {number} left The left edge of the range.
 * @param {number} right The right edge of the range.
 * @param {wtf.ui.color.RgbColorValue} color The color for the range.
 * @param {number} alpha The alpha to use for drawing color, in the range 0 to
 *   1.
 */
wtf.ui.RangeRenderer.prototype.drawRange = function(left, right, color, alpha) {
  var leftFloor = Math.floor(left);
  var rightFloor = Math.floor(right);
  if (leftFloor == rightFloor) {
    // entire range is within one pixel
    this.accumPx_(leftFloor, right - left, color, alpha);
  } else {
    // first partial
    this.accumPx_(leftFloor, leftFloor + 1 - left, color, alpha);
    // complete pixels
    for (var x = leftFloor + 1; x < rightFloor; x++) {
      this.setPx_(x, color, alpha);
    }
    // final partial
    this.accumPx_(rightFloor, right - rightFloor, color, alpha);
  }
};


/**
 * Replace pixel x with 100% color.
 * @param {number} x Pixel coordinate.
 * @param {wtf.ui.color.RgbColorValue} color The color to write.
 * @param {number} alpha The alpha to draw with.
 * @private
 */
wtf.ui.RangeRenderer.prototype.setPx_ = function(x, color, alpha) {
  var buff = this.buffer_;
  buff[x * 4 + 0] = alpha * (color & 0xFF);
  buff[x * 4 + 1] = alpha * ((color >>> 8) & 0xFF);
  buff[x * 4 + 2] = alpha * ((color >>> 16) & 0xFF);
  buff[x * 4 + 3] = alpha;
};


/**
 * Accumulate a partial pixel into position x.
 * @param {number} x Pixel coordinate.
 * @param {number} d The fraction of the pixel covered.
 * @param {wtf.ui.color.RgbColorValue} color The color to write.
 * @param {number} alpha The alpha to draw with.
 * @private
 */
wtf.ui.RangeRenderer.prototype.accumPx_ = function(x, d, color, alpha) {
  var buff = this.buffer_;
  buff[x * 4 + 0] += d * alpha * (color & 0xFF);
  buff[x * 4 + 1] += d * alpha * ((color >>> 8) & 0xFF);
  buff[x * 4 + 2] += d * alpha * ((color >>> 16) & 0xFF);
  buff[x * 4 + 3] += d * alpha;
};


/**
 * Copy the accumulated buffer contents into a pixel array.
 * @param {Uint8ClampedArray} data The pixel array to fill.
 */
wtf.ui.RangeRenderer.prototype.getPixels = function(data) {
  var buff = this.buffer_;
  for (var j = 0; j < this.width_; j++) {
    var a = buff[4 * j + 3];
    data[4 * j + 0] = buff[4 * j + 0] / a;
    data[4 * j + 1] = buff[4 * j + 1] / a;
    data[4 * j + 2] = buff[4 * j + 2] / a;
    data[4 * j + 3] = 255 * a;
  }
};
