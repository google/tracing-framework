/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HUD API exports.
 * Exports the HUD to external code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.hud.exports');

goog.require('wtf.hud');


/**
 * @define {boolean} Whether to enable exporting of the wtf.hud
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.hud.exports.ENABLE_EXPORTS = false;


if (wtf.hud.exports.ENABLE_EXPORTS) {
  // wtf.hud controls
  goog.exportSymbol(
      'wtf.hud.prepare',
      wtf.hud.prepare);
  goog.exportSymbol(
      'wtf.hud.show',
      wtf.hud.show);
  goog.exportSymbol(
      'wtf.hud.hide',
      wtf.hud.hide);
  goog.exportSymbol(
      'wtf.hud.advance',
      wtf.hud.advance);
  goog.exportSymbol(
      'wtf.hud.addButton',
      wtf.hud.addButton);
  goog.exportSymbol(
      'wtf.hud.sendSnapshotToWindow',
      wtf.hud.sendSnapshotToWindow);
}
