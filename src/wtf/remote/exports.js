/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Remote API exports.
 * Exports the remote control utilities to external code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.remote.exports');

goog.require('wtf.remote');


/**
 * @define {boolean} Whether to enable exporting of the wtf.remote
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.remote.exports.ENABLE_EXPORTS = false;


if (wtf.remote.exports.ENABLE_EXPORTS) {
  // wtf.remote controls
  goog.exportSymbol(
      'wtf.remote.connect',
      wtf.remote.connect);
  goog.exportSymbol(
      'wtf.remote.disconnect',
      wtf.remote.disconnect);
  goog.exportSymbol(
      'wtf.remote.isConnected',
      wtf.remote.isConnected);
}
