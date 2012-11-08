/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Root API exports.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.exports');

goog.require('wtf');


/**
 * @define {boolean} Whether to enable exporting of the wtf
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.exports.ENABLE_EXPORTS = false;


if (wtf.exports.ENABLE_EXPORTS) {
  // wtf utilities
  goog.exportSymbol(
      'wtf.hasHighResolutionTimes',
      wtf.hasHighResolutionTimes);
  goog.exportSymbol(
      'wtf.timebase',
      wtf.timebase);
  goog.exportSymbol(
      'wtf.now',
      wtf.now);
}
