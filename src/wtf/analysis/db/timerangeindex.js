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
 * @param {!wtf.analysis.Zone} zone Zone this index matches.
 * @constructor
 * @extends {wtf.analysis.db.EventList}
 */
wtf.analysis.db.TimeRangeIndex = function(zone) {
  goog.base(this);

  /**
   * Zone this index is matching.
   * @type {!wtf.analysis.Zone}
   * @private
   */
  this.zone_ = zone;
};
goog.inherits(wtf.analysis.db.TimeRangeIndex, wtf.analysis.db.EventList);


/**
 * Gets the zone this index is matching.
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.db.TimeRangeIndex.prototype.getZone = function() {
  return this.zone_;
};


goog.exportProperty(
    wtf.analysis.db.TimeRangeIndex.prototype, 'getZone',
    wtf.analysis.db.TimeRangeIndex.prototype.getZone);
