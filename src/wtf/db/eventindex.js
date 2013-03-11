/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Custom event index.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.EventIndex');

goog.require('wtf.db.EventIterator');
goog.require('wtf.db.IAncillaryList');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Custom event index.
 *
 * @param {!wtf.db.Zone} zone Parent zone.
 * @param {!Array.<string>} eventNames A list of event type names.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.db.IAncillaryList}
 */
wtf.db.EventIndex = function(zone, eventNames) {
  goog.base(this);

  /**
   * Parent zone.
   * @type {!wtf.db.Zone}
   * @private
   */
  this.zone_ = zone;

  /**
   * Event type names to match.
   * @type {!Array.<string>}
   * @private
   */
  this.eventNames_ = eventNames.slice();

  /**
   * Event indices.
   * @type {!Array.<number>}
   * @private
   */
  this.events_ = [];

  var eventList = this.zone_.getEventList();
  eventList.registerAncillaryList(this);
};
goog.inherits(wtf.db.EventIndex, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.db.EventIndex.prototype.disposeInternal = function() {
  var eventList = this.zone_.getEventList();
  eventList.unregisterAncillaryList(this);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the parent zone.
 * @return {!wtf.db.Zone} Parent zone.
 */
wtf.db.EventIndex.prototype.getZone = function() {
  return this.zone_;
};


/**
 * Gets the list of event names this index is tracking.
 * @return {!Array.<string>} Event names. Do not modify.
 */
wtf.db.EventIndex.prototype.getEventNames = function() {
  return this.eventNames_;
};


/**
 * Gets the total number of events.
 * @return {number} Event count.
 */
wtf.db.EventIndex.prototype.getCount = function() {
  return this.events_.length;
};


/**
 * Begins iterating the entire index.
 * @return {!wtf.db.EventIterator} Iterator.
 */
wtf.db.EventIndex.prototype.begin = function() {
  return new wtf.db.EventIterator(
      this.zone_.getEventList(), 0, this.getCount() - 1, 0,
      this.events_);
};


/**
 * @override
 */
wtf.db.EventIndex.prototype.beginRebuild = function(eventTypeTable) {
  this.events_.length = 0;

  var eventTypes = [];
  for (var n = 0; n < this.eventNames_.length; n++) {
    eventTypes.push(eventTypeTable.getByName(this.eventNames_[n]));
  }
  return eventTypes;
};


/**
 * @override
 */
wtf.db.EventIndex.prototype.handleEvent = function(
    eventTypeIndex, eventType, it) {
  this.events_.push(it.getId());
};


/**
 * @override
 */
wtf.db.EventIndex.prototype.endRebuild = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


goog.exportProperty(
    wtf.db.EventIndex.prototype, 'getZone',
    wtf.db.EventIndex.prototype.getZone);
goog.exportProperty(
    wtf.db.EventIndex.prototype, 'getEventNames',
    wtf.db.EventIndex.prototype.getEventNames);
goog.exportProperty(
    wtf.db.EventIndex.prototype, 'getCount',
    wtf.db.EventIndex.prototype.getCount);
goog.exportProperty(
    wtf.db.EventIndex.prototype, 'begin',
    wtf.db.EventIndex.prototype.begin);
