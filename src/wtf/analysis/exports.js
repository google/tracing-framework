/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tracing API exports.
 * This file will export a bunch of public symbols allowing for use of the
 * tracing library from non-Closure code. The master enable define must be set
 * to true to enable this so that the exports are not performed when in
 * Closurized code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.exports');

goog.require('wtf.analysis');
goog.require('wtf.analysis.FlowEvent');
goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.analysis.ZoneEvent');


/**
 * @define {boolean} Whether to enable exporting of the wtf.analysis
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.analysis.exports.ENABLE_EXPORTS = false;


if (wtf.analysis.exports.ENABLE_EXPORTS) {
  // wtf.analysis controls
  goog.exportSymbol(
      'wtf.analysis.createTraceListener',
      wtf.analysis.createTraceListener);
  goog.exportSymbol(
      'wtf.analysis.run',
      wtf.analysis.run);

  goog.exportSymbol(
      'wtf.analysis.FlowEvent',
      wtf.analysis.FlowEvent);
  goog.exportSymbol(
      'wtf.analysis.ScopeEvent',
      wtf.analysis.ScopeEvent);
  goog.exportSymbol(
      'wtf.analysis.ZoneEvent',
      wtf.analysis.ZoneEvent);
}
