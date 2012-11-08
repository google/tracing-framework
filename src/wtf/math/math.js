/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Math utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.math');


/**
 * Remaps a value from one range to another.
 * @param {number} value Value in range 1.
 * @param {number} min1 Minimum value in range 1.
 * @param {number} max1 Maximum value in range 1.
 * @param {number} min2 Minimum value in range 2.
 * @param {number} max2 Maximum value in range 2.
 * @return {number} Remapped value in range 2.
 */
wtf.math.remap = function(value, min1, max1, min2, max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
};


/**
 * Remaps a value from one range to another using an easing function.
 * @param {number} value Value in range 1.
 * @param {number} min1 Minimum value in range 1.
 * @param {number} max1 Maximum value in range 1.
 * @param {number} min2 Minimum value in range 2.
 * @param {number} max2 Maximum value in range 2.
 * @return {number} Remapped value in range 2.
 */
wtf.math.smoothRemap = function(value, min1, max1, min2, max2) {
  if (value < min1) {
    return min2;
  } else if (value > max1) {
    return max2;
  }
  var v = (value - min1) / (max1 - min1);
  v = 3 * v * v - 2 * v * v * v;
  return min2 + v * (max2 - min2);
};
