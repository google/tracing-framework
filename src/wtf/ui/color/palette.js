/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Color palette.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.color.Palette');

goog.require('goog.string');
goog.require('wtf.ui.color.RgbColor');



/**
 * Color palette.
 * @param {!Array.<string|!wtf.ui.color.RgbColor.Object>} colors Palette colors.
 * @constructor
 */
wtf.ui.color.Palette = function(colors) {
  /**
   * Colors.
   * @type {!Array.<!wtf.ui.color.RgbColor>}
   * @private
   */
  this.colors_ = [];

  /**
   * The last index that was chosen in a call to {@see #getRandomColor}.
   * @type {number}
   * @private
   */
  this.previousRandomIndex_ = -1;

  // TODO(benvanik): clear periodically?
  /**
   * A cache of color values keyed by string.
   * This is used by {@see #getColorForString} to prevent the need for
   * constant hashing.
   * @type {!Object.<!wtf.ui.color.RgbColor>}
   * @private
   */
  this.stringCache_ = {};

  for (var n = 0; n < colors.length; n++) {
    var sourceColor = colors[n];
    var color;
    if (goog.isString(sourceColor)) {
      color = wtf.ui.color.RgbColor.fromString(sourceColor);
    } else {
      color = wtf.ui.color.RgbColor.fromRgb(sourceColor);
    }
    this.colors_.push(color);
  }
};


/**
 * Gets a random color from the palette.
 * @return {!wtf.ui.color.RgbColor} A color.
 */
wtf.ui.color.Palette.prototype.getRandomColor = function() {
  var colorIndex = (Math.random() * this.colors_.length) | 0;
  if (colorIndex == this.previousRandomIndex_) {
    // If the color is the same as the last picked just move to the next.
    colorIndex = (colorIndex + 1) % this.colors_.length;
  }
  this.previousRandomIndex_ = colorIndex;
  return this.colors_[colorIndex];
};


/**
 * Gets a color for the given string.
 * This hashes the string and looks up the value in the palette. The returned
 * color should be cached.
 * @param {string} value String value to base the color on.
 * @return {!wtf.ui.color.RgbColor} A color.
 */
wtf.ui.color.Palette.prototype.getColorForString = function(value) {
  var cacheValue = this.stringCache_[value];
  if (cacheValue) {
    return cacheValue;
  }

  var hash = goog.string.hashCode(value);
  var colorIndex = hash % this.colors_.length;
  var color = this.colors_[colorIndex];
  this.stringCache_[value] = color;
  return color;
};


// TODO(benvanik): interpolation/etc for linear/pow scales


/**
 * Color palette for scopes.
 * @type {!Array.<!wtf.ui.color.RgbColor.Object>}
 */
wtf.ui.color.Palette.SCOPE_COLORS = [
  // TODO(benvanik): prettier colors - these are from chrome://tracing
  {r: 138, g: 113, b: 152},
  {r: 175, g: 112, b: 133},
  {r: 127, g: 135, b: 225},
  {r: 93, g: 81, b: 137},
  {r: 116, g: 143, b: 119},
  {r: 178, g: 214, b: 122},
  {r: 87, g: 109, b: 147},
  {r: 119, g: 155, b: 95},
  {r: 114, g: 180, b: 160},
  {r: 132, g: 85, b: 103},
  {r: 157, g: 210, b: 150},
  {r: 148, g: 94, b: 86},
  {r: 164, g: 108, b: 138},
  {r: 139, g: 191, b: 150},
  {r: 110, g: 99, b: 145},
  {r: 80, g: 129, b: 109},
  {r: 125, g: 140, b: 149},
  {r: 93, g: 124, b: 132},
  {r: 140, g: 85, b: 140},
  {r: 104, g: 163, b: 162},
  {r: 132, g: 141, b: 178},
  {r: 131, g: 105, b: 147},
  {r: 135, g: 183, b: 98},
  {r: 152, g: 134, b: 177},
  {r: 141, g: 188, b: 141},
  {r: 133, g: 160, b: 210},
  {r: 126, g: 186, b: 148},
  {r: 112, g: 198, b: 205},
  {r: 180, g: 122, b: 195},
  {r: 203, g: 144, b: 152}
];
