/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Zone-based index.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.ZoneIndex');

goog.require('wtf.analysis.db.EventList');



/**
 * An in-memory index of events by the zone they occur in.
 *
 * @param {!wtf.analysis.Zone} zone Zone this index matches.
 * @constructor
 * @extends {wtf.analysis.db.EventList}
 */
wtf.analysis.db.ZoneIndex = function(zone) {
  goog.base(this);

  /**
   * Zone this index is matching.
   * @type {!wtf.analysis.Zone}
   * @private
   */
  this.zone_ = zone;
};
goog.inherits(wtf.analysis.db.ZoneIndex, wtf.analysis.db.EventList);


/**
 * Gets the zone this index is matching.
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.db.ZoneIndex.prototype.getZone = function() {
  return this.zone_;
};


/**
 * @override
 */
wtf.analysis.db.ZoneIndex.prototype.insertEvent = function(e) {
  if (e.zone == this.zone_) {
    // We manually call base method instead of using goog.base because this
    // method is called often enough to have a major impact on load time
    // in debug mode.
    wtf.analysis.db.EventList.prototype.insertEvent.call(this, e);
  }
};
