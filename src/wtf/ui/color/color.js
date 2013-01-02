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

goog.require('wtf.util');



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
  this.string_ = '#' +
      wtf.util.pad0(r.toString(16), 2) +
      wtf.util.pad0(g.toString(16), 2) +
      wtf.util.pad0(b.toString(16), 2);
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
  return new wtf.ui.color.RgbColor(
      parseInt(value.substr(1, 2), 16),
      parseInt(value.substr(3, 2), 16),
      parseInt(value.substr(5, 2), 16));
};


/**
 * @typedef {{r: number, g: number, b: number}}
 */
wtf.ui.color.RgbColor.Object;
