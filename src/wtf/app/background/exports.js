/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome app API exports.
 * Exports the background page to external code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.background.exports');

goog.require('wtf.app.background');


/**
 * @define {boolean} Whether to enable exporting of the wtf.app
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.app.background.exports.ENABLE_EXPORTS = false;


if (wtf.app.background.exports.ENABLE_EXPORTS) {
  // wtf.app controls
  goog.exportSymbol(
      'wtf.app.background.run',
      wtf.app.background.run);
  goog.exportSymbol(
      'wtf.app.background.dispose',
      wtf.app.background.dispose);
}
