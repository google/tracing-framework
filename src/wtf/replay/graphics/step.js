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

goog.require('wtf.db.EventIterator');



/**
 * Encapsulates events between 2 frames or within a frame.
 *
 * @param {!wtf.db.EventList} eventList Event list for an entire animation.
 * @param {number} startEventId Start event ID.
 * @param {number} endEventId End event ID.
 * @param {wtf.db.Frame=} opt_frame Frame this step draws if and only if the
 *     step draws one.
 * @param {Object.<boolean>=} opt_contexts The set of contexts that exist at
 *     the start of this step.
 * @param {Object.<boolean>=} opt_visibleEventTypeIds A set of IDs of event
 *     types that should be visible.
 * @param {number=} opt_stepBeginContext The handle of the current context at
 *     the beginning of the step. If no current context exists, -1.
 * @constructor
 */
wtf.replay.graphics.Step = function(
    eventList, startEventId, endEventId, opt_frame, opt_contexts,
    opt_visibleEventTypeIds, opt_stepBeginContext) {

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
   * A set of IDs of event types that should be visible.
   * @type {!Object.<boolean>}
   * @private
   */
  this.visibleEventTypeIds_ = opt_visibleEventTypeIds || {};

  /**
   * Either the frame this step draws or null if this step is not responsible
   *     for drawing a frame.
   * @type {wtf.db.Frame}
   * @private
   */
  this.frame_ = opt_frame || null;

  /**
   * The set of contexts that exist at the start of this step.
   * @type {!Object.<boolean>}
   * @private
   */
  this.initialContexts_ = opt_contexts || {};

  /**
   * The handle of the current context at the beginning of the step. If no
   * current context exists, -1.
   * @type {number}
   * @private
   */
  this.stepBeginContextHandle_ = opt_stepBeginContext || -1;
};


/**
 * Creates an event iterator that spans the events for the step.
 * @param {boolean=} opt_visible True if only visible events should be included
 *     in the iteration. False by default.
 * @return {!wtf.db.EventIterator} The created event iterator.
 */
wtf.replay.graphics.Step.prototype.getEventIterator = function(opt_visible) {
  if (opt_visible) {
    var indirectionTable = this.createVisibleEventsList_();
    return new wtf.db.EventIterator(
        this.eventList_, 0, indirectionTable.length - 1, 0, indirectionTable);
  }
  return this.eventList_.beginEventRange(
      this.startEventId_, this.endEventId_);
};


/**
 * Gets the current context at the beginning of the step.
 * @return {number} The handle of the current context at the beginning of this
 *     step.
 */
wtf.replay.graphics.Step.prototype.getInitialCurrentContext = function() {
  return this.stepBeginContextHandle_;
};


/**
 * Returns a mapping from indices of events that change the current context to
 * the context that they switch to.
 * @return {!Array.<!Array.<number>>} A list of 2-tuples. Each 2-tuple
 *     contains the ID of a context-changing event and the new context handle.
 */
wtf.replay.graphics.Step.prototype.getContextChangingEvents = function() {
  var createContextEventId =
      this.eventList_.getEventTypeId('wtf.webgl#createContext');
  var setContextEventId =
      this.eventList_.getEventTypeId('wtf.webgl#setContext');
  var contextChangingEvents = [];
  for (var it = this.getEventIterator(true); !it.done(); it.next()) {
    var typeId = it.getTypeId();
    if (typeId == createContextEventId || typeId == setContextEventId) {
      contextChangingEvents.push([it.getIndex(), it.getArgument('handle')]);
    }
  }

  return contextChangingEvents;
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


/**
 * Gets a list of indices of visible events.
 * @return {!Array.<number>} A list of indices of visible events.
 * @private
 */
wtf.replay.graphics.Step.prototype.createVisibleEventsList_ = function() {
  // Filter for only visible events.
  var visibleEvents = [];
  for (var it = this.getEventIterator(); !it.done(); it.next()) {
    if (this.visibleEventTypeIds_[it.getTypeId()]) {
      visibleEvents.push(it.getIndex());
    }
  }

  return visibleEvents;
};


/**
 * Returns the set of handles of contexts that exist at the start of the step.
 * @return {!Object.<boolean>} The set of handles of initial contexts.
 */
wtf.replay.graphics.Step.prototype.getInitialContexts = function() {
  return this.initialContexts_;
};
