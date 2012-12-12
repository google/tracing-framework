/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event-based index.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.EventIndex');

goog.require('wtf.analysis.db.EventList');



/**
 * An in-memory index of all events of a given type.
 *
 * @param {string} eventName Event name this index matches.
 * @constructor
 * @extends {wtf.analysis.db.EventList}
 */
wtf.analysis.db.EventIndex = function(eventName) {
  goog.base(this);

  /**
   * Event name this index is matching.
   * @type {string}
   * @private
   */
  this.eventName_ = eventName;
};
goog.inherits(wtf.analysis.db.EventIndex, wtf.analysis.db.EventList);


/**
 * Gets the name of the event this index is matching.
 * @return {string} Event name.
 */
wtf.analysis.db.EventIndex.prototype.getEventName = function() {
  return this.eventName_;
};


/**
 * @override
 */
wtf.analysis.db.EventIndex.prototype.insertEvent = function(e) {
  if (e.eventType.name == this.eventName_) {
    // We manually call base method instead of using goog.base because this
    // method is called often enough to have a major impact on load time in
    // debug mode.
    wtf.analysis.db.EventList.prototype.insertEvent.call(this, e);
  }
};


goog.exportProperty(
    wtf.analysis.db.EventIndex.prototype, 'getEventName',
    wtf.analysis.db.EventIndex.prototype.getEventName);
