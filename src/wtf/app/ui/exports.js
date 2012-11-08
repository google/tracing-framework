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

goog.provide('wtf.app.ui.exports');

goog.require('wtf.app.ui');


/**
 * @define {boolean} Whether to enable exporting of the wtf.ui
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.app.ui.exports.ENABLE_EXPORTS = false;


if (wtf.app.ui.exports.ENABLE_EXPORTS) {
  // wtf.app.ui controls
  goog.exportSymbol(
      'wtf.app.ui.show',
      wtf.app.ui.show);
}
