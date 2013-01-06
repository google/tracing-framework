/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Frame tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.Frame');



/**
 * Frame tracking utility.
 * @param {number} number Frame number.
 * @constructor
 */
wtf.analysis.Frame = function(number) {
  /**
   * Frame number.
   * @type {number}
   * @private
   */
  this.number_ = number;

  /**
   * Start event for the frame.
   * @type {wtf.analysis.Event}
   * @private
   */
  this.startEvent_ = null;

  /**
   * End event for the frame.
   * @type {wtf.analysis.Event}
   * @private
   */
  this.endEvent_ = null;
};


/**
 * Gets the frame number.
 * @return {number} Frame number.
 */
wtf.analysis.Frame.prototype.getNumber = function() {
  return this.number_;
};


/**
 * Gets the frame start event, if any.
 * @return {wtf.analysis.Event} Start event.
 */
wtf.analysis.Frame.prototype.getStartEvent = function() {
  return this.startEvent_;
};


/**
 * Sets the frame start event.
 * @param {!wtf.analysis.Event} e Event.
 */
wtf.analysis.Frame.prototype.setStartEvent = function(e) {
  this.startEvent_ = e;
};


/**
 * Gets the frame end event, if any.
 * @return {wtf.analysis.Event} End event.
 */
wtf.analysis.Frame.prototype.getEndEvent = function() {
  return this.endEvent_;
};


/**
 * Sets the frame end event.
 * @param {!wtf.analysis.Event} e Event.
 */
wtf.analysis.Frame.prototype.setEndEvent = function(e) {
  this.endEvent_ = e;
};


/**
 * Gets the time the frame started at.
 * @return {number} Start time.
 */
wtf.analysis.Frame.prototype.getStartTime = function() {
  return this.startEvent_ ? this.startEvent_.time : 0;
};


/**
 * Gets the time the frame ended at.
 * @return {number} End time.
 */
wtf.analysis.Frame.prototype.getEndTime = function() {
  return this.endEvent_ ? this.endEvent_.time : 0;
};


/**
 * Gets the duration of the frame.
 * If any of the frame events are missing this will return 0.
 * @return {number} Frame duration.
 */
wtf.analysis.Frame.prototype.getDuration = function() {
  if (this.startEvent_ && this.endEvent_) {
    return this.endEvent_.time - this.startEvent_.time;
  }
  return 0;
};


goog.exportSymbol(
    'wtf.analysis.Frame',
    wtf.analysis.Frame);
goog.exportProperty(
    wtf.analysis.Frame.prototype, 'getNumber',
    wtf.analysis.Frame.prototype.getNumber);
goog.exportProperty(
    wtf.analysis.Frame.prototype, 'getStartEvent',
    wtf.analysis.Frame.prototype.getStartEvent);
goog.exportProperty(
    wtf.analysis.Frame.prototype, 'getEndEvent',
    wtf.analysis.Frame.prototype.getEndEvent);
goog.exportProperty(
    wtf.analysis.Frame.prototype, 'getDuration',
    wtf.analysis.Frame.prototype.getDuration);
