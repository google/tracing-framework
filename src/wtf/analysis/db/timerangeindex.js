/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time range index.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.TimeRangeIndex');

goog.require('wtf.analysis.db.EventList');



/**
 * An in-memory index of begin/endTimeRange events in a zone.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener.
 * @param {!wtf.analysis.Zone} zone Zone this index matches.
 * @constructor
 * @extends {wtf.analysis.db.EventList}
 */
wtf.analysis.db.TimeRangeIndex = function(traceListener, zone) {
  goog.base(this);

  /**
   * Trace listener.
   * @type {!wtf.analysis.TraceListener}
   * @private
   */
  this.traceListener_ = traceListener;

  /**
   * Zone this index is matching.
   * @type {!wtf.analysis.Zone}
   * @private
   */
  this.zone_ = zone;

  /**
   * The maximum level of any time range in the zone.
   * @type {number}
   * @private
   */
  this.maximumLevel_ = 0;
};
goog.inherits(wtf.analysis.db.TimeRangeIndex, wtf.analysis.db.EventList);


/**
 * Gets the zone this index is matching.
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.db.TimeRangeIndex.prototype.getZone = function() {
  return this.zone_;
};


/**
 * Gets the maximum level of any time range in the zone.
 * @return {number} Maximum level.
 */
wtf.analysis.db.TimeRangeIndex.prototype.getMaximumLevel = function() {
  return this.maximumLevel_;
};


/**
 * Updates all time range levels based their overlap and the maximum level.
 * @private
 */
wtf.analysis.db.TimeRangeIndex.prototype.computeLevels_ = function() {
  var beginTimeRangeEvent =
      this.traceListener_.getEventType('wtf.timeRange#begin');
  var endTimeRangeEvent =
      this.traceListener_.getEventType('wtf.timeRange#end');

  var levels = [];
  this.forEach(Number.MIN_VALUE, Number.MAX_VALUE, function(e) {
    var timeRange = e.value;
    var n;
    if (e.eventType == beginTimeRangeEvent) {
      for (n = 0; levels[n]; n++) {}
      levels[n] = timeRange;
      timeRange.setLevel(n);
    } else {
      n = timeRange.getLevel();
      if (levels[n] == timeRange) {
        levels[n] = null;
      }
    }
  });

  this.maximumLevel_ = levels.length;
};


/**
 * @override
 */
wtf.analysis.db.TimeRangeIndex.prototype.invalidate = function() {
  goog.base(this, 'invalidate');
  this.computeLevels_();
};


goog.exportProperty(
    wtf.analysis.db.TimeRangeIndex.prototype, 'getZone',
    wtf.analysis.db.TimeRangeIndex.prototype.getZone);
goog.exportProperty(
    wtf.analysis.db.TimeRangeIndex.prototype, 'getMaximumLevel',
    wtf.analysis.db.TimeRangeIndex.prototype.getMaximumLevel);
