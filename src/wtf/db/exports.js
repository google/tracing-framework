/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Database API exports.
 * This file will export a bunch of public symbols allowing for use of the
 * tracing library from non-Closure code. The master enable define must be set
 * to true to enable this so that the exports are not performed when in
 * Closurized code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.exports');

/** @suppress {extraRequire} */
goog.require('wtf.data.EventClass');
/** @suppress {extraRequire} */
goog.require('wtf.data.EventFlag');
/** @suppress {extraRequire} */
goog.require('wtf.data.ZoneType');
/** @suppress {extraRequire} */
goog.require('wtf.db');
/** @suppress {extraRequire} */
goog.require('wtf.db.ArgumentData');
/** @suppress {extraRequire} */
goog.require('wtf.db.DataSource');
/** @suppress {extraRequire} */
goog.require('wtf.db.Database');
/** @suppress {extraRequire} */
goog.require('wtf.db.EventDataEntry');
/** @suppress {extraRequire} */
goog.require('wtf.db.EventIndex');
/** @suppress {extraRequire} */
goog.require('wtf.db.EventIterator');
/** @suppress {extraRequire} */
goog.require('wtf.db.EventList');
/** @suppress {extraRequire} */
goog.require('wtf.db.EventStatistics');
/** @suppress {extraRequire} */
goog.require('wtf.db.EventType');
/** @suppress {extraRequire} */
goog.require('wtf.db.EventTypeTable');
/** @suppress {extraRequire} */
goog.require('wtf.db.Filter');
/** @suppress {extraRequire} */
goog.require('wtf.db.Frame');
/** @suppress {extraRequire} */
goog.require('wtf.db.FrameList');
/** @suppress {extraRequire} */
goog.require('wtf.db.HealthInfo');
/** @suppress {extraRequire} */
goog.require('wtf.db.InstanceEventDataEntry');
/** @suppress {extraRequire} */
goog.require('wtf.db.Mark');
/** @suppress {extraRequire} */
goog.require('wtf.db.MarkList');
/** @suppress {extraRequire} */
goog.require('wtf.db.QueryResult');
/** @suppress {extraRequire} */
goog.require('wtf.db.ScopeEventDataEntry');
/** @suppress {extraRequire} */
goog.require('wtf.db.SortMode');
/** @suppress {extraRequire} */
goog.require('wtf.db.TimeRange');
/** @suppress {extraRequire} */
goog.require('wtf.db.TimeRangeList');
/** @suppress {extraRequire} */
goog.require('wtf.db.Zone');
/** @suppress {extraRequire} */
goog.require('wtf.util');


/**
 * @define {boolean} Whether to enable exporting of the wtf.db
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.db.exports.ENABLE_EXPORTS = false;
