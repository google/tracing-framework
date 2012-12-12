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
/** @suppress {extraRequire} */
goog.require('wtf.analysis.Event');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.EventType');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.Flow');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.FlowEvent');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.Scope');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.ScopeEvent');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.Zone');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.ZoneEvent');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.EventDataEntry');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.EventDataTable');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.EventDatabase');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.EventIndex');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.EventList');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.InstanceEventDataEntry');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.ScopeEventDataEntry');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.SortMode');
/** @suppress {extraRequire} */
goog.require('wtf.analysis.db.ZoneIndex');
/** @suppress {extraRequire} */
goog.require('wtf.data.EventClass');
/** @suppress {extraRequire} */
goog.require('wtf.data.EventFlag');
/** @suppress {extraRequire} */
goog.require('wtf.data.ZoneType');


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
}
