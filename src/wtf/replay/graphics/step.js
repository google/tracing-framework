/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Step. Represents the flow either between 2 frames or within a
 *     frame.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.Step');



/**
 * Step.
 * Encapsulates events between 2 frames or within a frame.
 *
 * @param {!wtf.db.EventList} eventList Event list for an entire animation.
 * @param {number} startEventId Start event ID.
 * @param {number} endEventId End event ID.
 * @param {wtf.db.Frame=} frame Frame this step draws if and only if the step
 *     draws one.
 * @constructor
 */
wtf.replay.graphics.Step = function(
    eventList, startEventId, endEventId, frame) {

  /**
   * List of events for entire animation.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = eventList;

  /**
   * Start event ID.
   * @type {number}
   * @private
   */
  this.startEventId_ = startEventId;

  /**
   * End event ID.
   * @type {number}
   * @private
   */
  this.endEventId_ = endEventId;

  /**
   * Either the frame this step draws or null if this step is not responsible
   *     for drawing a frame.
   * @type {wtf.db.Frame}
   * @private
   */
  this.frame_ = frame || null;
};


/**
 * Creates an event iterator that spans the events for the step.
 * @return {!wtf.db.EventIterator} The created event iterator.
 */
wtf.replay.graphics.Step.prototype.getEventIterator = function() {
  return this.eventList_.beginEventRange(
      this.startEventId_, this.endEventId_);
};


/**
 * Returns the frame this step draws if the step draws one.
 * @return {wtf.db.Frame} The frame.
 */
wtf.replay.graphics.Step.prototype.getFrame = function() {
  return this.frame_;
};


/**
 * Gets the ID of the begin event.
 * @return {number} ID of the begin event.
 */
wtf.replay.graphics.Step.prototype.getStartEventId = function() {
  return this.startEventId_;
};


/**
 * Gets the ID of the end event.
 * @return {number} ID of the end event.
 */
wtf.replay.graphics.Step.prototype.getEndEventId = function() {
  return this.endEventId_;
};
