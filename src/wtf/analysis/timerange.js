/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time range tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.TimeRange');



/**
 * Time range tracking utility.
 * A stateful object that is used to help tracking time ranges.
 * @constructor
 */
wtf.analysis.TimeRange = function() {
  /**
   * Analysis-session-unique ID.
   * @type {number}
   * @private
   */
  this.id_ = wtf.analysis.TimeRange.nextId_++;

  /**
   * Begin event for the time range.
   * @type {wtf.analysis.TimeRangeEvent}
   * @private
   */
  this.beginEvent_ = null;

  /**
   * End event for the time range.
   * @type {wtf.analysis.Event}
   * @private
   */
  this.endEvent_ = null;
};


/**
 * ID allocator for session-unique time range IDs.
 * @type {number}
 * @private
 */
wtf.analysis.TimeRange.nextId_ = 0;


/**
 * Gets an ID that can be used to track the time range during the analysis
 * session.
 * @return {number} Analysis session unique ID.
 */
wtf.analysis.TimeRange.prototype.getId = function() {
  return this.id_;
};


/**
 * Gets the begin event for the time range.
 * @return {wtf.analysis.TimeRangeEvent} Enter event, if any.
 */
wtf.analysis.TimeRange.prototype.getBeginEvent = function() {
  return this.beginEvent_;
};


/**
 * Sets the begin event for the time range.
 * @param {!wtf.analysis.TimeRangeEvent} e Event.
 */
wtf.analysis.TimeRange.prototype.setBeginEvent = function(e) {
  this.beginEvent_ = e;
};


/**
 * Gets the end event for the time range.
 * @return {wtf.analysis.Event} Leave event, if any.
 */
wtf.analysis.TimeRange.prototype.getEndEvent = function() {
  return this.endEvent_;
};


/**
 * Sets the end event for the time range.
 * @param {!wtf.analysis.Event} e Event.
 */
wtf.analysis.TimeRange.prototype.setEndEvent = function(e) {
  this.endEvent_ = e;
};


/**
 * Gets the tiem range name (if it has been seen).
 * @return {string?} Time range name or null.
 */
wtf.analysis.TimeRange.prototype.getName = function() {
  return this.beginEvent_ ? this.beginEvent_.args['name'] : null;
};


/**
 * Gets the time range data as a key-value map.
 * @return {Object} Time range arguments/data, if any.
 */
wtf.analysis.TimeRange.prototype.getData = function() {
  var data = {};
  if (this.beginEvent_) {
    var value = this.beginEvent_.args['value'];
    if (value) {
      data['value'] = value;
    }
  }
  return data;
};


/**
 * Gets the duration of the time range.
 * @return {number} Total duration of the time range.
 */
wtf.analysis.TimeRange.prototype.getTotalDuration = function() {
  if (this.beginEvent_ && this.endEvent_) {
    return this.endEvent_.time - this.beginEvent_.time;
  }
  return 0;
};


goog.exportSymbol(
    'wtf.analysis.TimeRange',
    wtf.analysis.TimeRange);
goog.exportProperty(
    wtf.analysis.TimeRange.prototype, 'getId',
    wtf.analysis.TimeRange.prototype.getId);
goog.exportProperty(
    wtf.analysis.TimeRange.prototype, 'getBeginEvent',
    wtf.analysis.TimeRange.prototype.getBeginEvent);
goog.exportProperty(
    wtf.analysis.TimeRange.prototype, 'getEndEvent',
    wtf.analysis.TimeRange.prototype.getEndEvent);
goog.exportProperty(
    wtf.analysis.TimeRange.prototype, 'getName',
    wtf.analysis.TimeRange.prototype.getName);
goog.exportProperty(
    wtf.analysis.TimeRange.prototype, 'getData',
    wtf.analysis.TimeRange.prototype.getData);
goog.exportProperty(
    wtf.analysis.TimeRange.prototype, 'getTotalDuration',
    wtf.analysis.TimeRange.prototype.getTotalDuration);
