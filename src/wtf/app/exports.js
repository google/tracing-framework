/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome UI API exports.
 * Exports the UI to external code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.exports');

/** @suppress {extraRequire} */
goog.require('goog.events.EventWrapper');
/** @suppress {extraRequire} */
goog.require('goog.vec.Vec3');
goog.require('wtf.app');


/**
 * @define {boolean} Whether to enable exporting of the wtf.ui
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.app.exports.ENABLE_EXPORTS = false;


if (wtf.app.exports.ENABLE_EXPORTS) {
  // wtf.app controls
  goog.exportSymbol(
      'wtf.app.show',
      wtf.app.show);
}
