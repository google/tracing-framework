/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Color utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.color.RgbColor');

goog.require('goog.color');
goog.require('goog.math');



/**
 * Simple RGB color.
 * @param {number} r Red channel, 0-255.
 * @param {number} g Green channel, 0-255.
 * @param {number} b Blue channel, 0-255.
 * @constructor
 */
wtf.ui.color.RgbColor = function(r, g, b) {
  /**
   * Red channel, 0-255.
   * @type {number}
   */
  this.r = r;

  /**
   * Green channel, 0-255.
   * @type {number}
   */
  this.g = g;

  /**
   * Blue channel, 0-255.
   * @type {number}
   */
  this.b = b;

  /**
   * String form of #RRGGBB.
   * @type {string}
   * @private
   */
  this.string_ = goog.color.rgbToHex(r, g, b);
};


/**
 * Gets the #RRGGBB string.
 * @return {string} Value.
 */
wtf.ui.color.RgbColor.prototype.toString = function() {
  return this.string_;
};


/**
 * Creates a color from an object containing R, G, and B values.
 * @param {!wtf.ui.color.RgbColor.Object} value Source RGB object.
 * @return {!wtf.ui.color.RgbColor} Color value.
 */
wtf.ui.color.RgbColor.fromRgb = function(value) {
  return new wtf.ui.color.RgbColor(value.r, value.g, value.b);
};


/**
 * Parses a color from a #RRGGBB string.
 * @param {string} value Source value.
 * @return {!wtf.ui.color.RgbColor} Color value.
 */
wtf.ui.color.RgbColor.fromString = function(value) {
  var parsed;
  if (value[0] == '#') {
    parsed = goog.color.hexToRgb(value);
  } else {
    parsed = goog.color.parseRgb(value);
  }
  return new wtf.ui.color.RgbColor(parsed[0], parsed[1], parsed[2]);
};


/**
 * Linearly interpolates between two colors.
 * @param {!wtf.ui.color.RgbColor} a Color A.
 * @param {!wtf.ui.color.RgbColor} b Color B.
 * @param {number} x The proportion between a and b.
 * @return {!wtf.ui.color.RgbColor} Interpolated color.
 */
wtf.ui.color.RgbColor.lerp = function(a, b, x) {
  if (x <= 0) {
    return a;
  } else if (x >= 1) {
    return b;
  }
  return new wtf.ui.color.RgbColor(
      goog.math.lerp(a.r, b.r, x),
      goog.math.lerp(a.g, b.g, x),
      goog.math.lerp(a.b, b.b, x));
};


/**
 * @typedef {{r: number, g: number, b: number}}
 */
wtf.ui.color.RgbColor.Object;
