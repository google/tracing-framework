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

goog.provide('wtf.analysis.db.FrameIndex');

goog.require('wtf.analysis.EventType');
goog.require('wtf.analysis.Frame');
goog.require('wtf.analysis.FrameEvent');
goog.require('wtf.analysis.db.EventList');
goog.require('wtf.data.EventClass');



/**
 * An in-memory index of frames in a zone.
 * This index is zone-specific and there may exist several per database.
 * The events contained are syntetic events of type wtf.timing#frame at the
 * start time of the frame.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener.
 * @param {!wtf.analysis.Zone} zone Zone this index matches.
 * @constructor
 * @extends {wtf.analysis.db.EventList}
 */
wtf.analysis.db.FrameIndex = function(traceListener, zone) {
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
   * All frames, by frame number.
   * @type {!Array.<!wtf.analysis.Frame>}
   * @private
   */
  this.frames_ = [];

  /**
   * Synthetic frame event type.
   * @type {!wtf.analysis.EventType}
   * @private
   */
  this.frameEventType_ = traceListener.defineEventType(
      new wtf.analysis.EventType(
          'wtf.timing#frame', wtf.data.EventClass.INSTANCE, 0, []));

  // TODO(benvanik): cleanup, issue #196.
  /**
   * Lookup for common event types.
   * @type {!Object.<wtf.analysis.EventType>}
   * @private
   */
  this.eventTypes_ = {
    frameStart: null,
    frameEnd: null
  };
};
goog.inherits(wtf.analysis.db.FrameIndex, wtf.analysis.db.EventList);


/**
 * Gets the zone this index is matching.
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.db.FrameIndex.prototype.getZone = function() {
  return this.zone_;
};


/**
 * @override
 */
wtf.analysis.db.FrameIndex.prototype.insertEvent = function(e) {
  // TODO(benvanik): cleanup, issue #196.
  if (!this.eventTypes_.frameStart) {
    this.eventTypes_.frameStart =
        this.traceListener_.getEventType('wtf.timing#frameStart');
    this.eventTypes_.frameEnd =
        this.traceListener_.getEventType('wtf.timing#frameEnd');
  }

  // Get frame value, creating if needed.
  var frameNumber = e.args['number'];
  var frame = this.frames_[frameNumber];
  if (!frame) {
    frame = this.frames_[frameNumber] = new wtf.analysis.Frame(frameNumber);
  }

  // Track event on frame.
  if (e.eventType == this.eventTypes_.frameStart) {
    frame.setStartEvent(e);

    // Create synthetic event.
    var frameEvent = new wtf.analysis.FrameEvent(
        this.frameEventType_, e.zone, e.time, e.args, frame);

    // We manually call base method instead of using goog.base because this
    // method is called often enough to have a major impact on load time
    // in debug mode.
    wtf.analysis.db.EventList.prototype.insertEvent.call(this, frameEvent);
  } else {
    frame.setEndEvent(e);
  }
};


/**
 * Gets the frame with the given frame number.
 * @param {number} value Frame number.
 * @return {wtf.analysis.Frame} Frame with the given number, if any.
 */
wtf.analysis.db.FrameIndex.prototype.getFrame = function(value) {
  return this.frames_[value] || null;
};


/**
 * Gets the frame preceeding the given frame, if any.
 * @param {!wtf.analysis.Frame} value Base frame.
 * @return {wtf.analysis.Frame} Previous frame, if any.
 */
wtf.analysis.db.FrameIndex.prototype.getPreviousFrame = function(value) {
  return this.frames_[value.getNumber() - 1] || null;
};


/**
 * Gets the frame following the given frame, if any.
 * @param {!wtf.analysis.Frame} value Base frame.
 * @return {wtf.analysis.Frame} Next frame, if any.
 */
wtf.analysis.db.FrameIndex.prototype.getNextFrame = function(value) {
  return this.frames_[value.getNumber() + 1] || null;
};


/**
 * Gets the frame at the given time, if any.
 * @param {number} time Search time.
 * @return {wtf.analysis.Frame} Frame at the given time, if any.
 */
wtf.analysis.db.FrameIndex.prototype.getFrameAtTime = function(time) {
  var e = this.search(time, function(e) {
    var frame = e.value;
    return frame.getStartTime() <= time && time <= frame.getEndTime();
  });
  return e ? e.value : null;
};


/**
 * Gets the two frames the given time is between.
 * The result is an array of [previous, next]. Either may be null if there is
 * no frame before or after.
 * @param {number} time Search time.
 * @return {Array.<wtf.analysis.Frame>} Surrounding frames.
 */
wtf.analysis.db.FrameIndex.prototype.getIntraFrameAtTime = function(time) {
  if (!this.getCount()) {
    return null;
  }

  // Find the frame to the left of the time.
  var e = this.search(time, function(e) {
    return true;
  });
  if (!e) {
    // No frames before, return the first intra-frame time.
    var firstFrame = -1;
    while (!this.frames_[++firstFrame]) {}
    return [null, this.frames_[firstFrame]];
  }

  var previousNumber = e.value.getNumber();
  var nextFrame = this.frames_[previousNumber + 1] || null;
  return [e.value, nextFrame];
};


/**
 * Iterates over the list of frames, returning each one that intersects the
 * given time range in order.
 *
 * @param {number} timeStart Start time range.
 * @param {number} timeEnd End time range.
 * @param {!function(this: T, !wtf.analysis.Frame)} callback Function to
 *     call with the time ranges.
 * @param {T=} opt_scope Scope to call the function in.
 * @template T
 */
wtf.analysis.db.FrameIndex.prototype.forEachIntersecting = function(
    timeStart, timeEnd, callback, opt_scope) {
  // Search left to find the frame active at the start of the visible range.
  var firstEvent = this.search(timeStart, function(e) {
    return true;
  });
  var searchLeft = firstEvent ? firstEvent.time : timeStart;

  this.forEach(searchLeft, timeEnd, function(e) {
    var frame = e.value;
    var startEvent = frame.getStartEvent();
    var endEvent = frame.getEndEvent();
    if (!startEvent || !endEvent) {
      return;
    }

    callback.call(opt_scope, frame);
  });
};


goog.exportProperty(
    wtf.analysis.db.FrameIndex.prototype, 'getZone',
    wtf.analysis.db.FrameIndex.prototype.getZone);
goog.exportProperty(
    wtf.analysis.db.FrameIndex.prototype, 'getFrame',
    wtf.analysis.db.FrameIndex.prototype.getFrame);
goog.exportProperty(
    wtf.analysis.db.FrameIndex.prototype, 'getPreviousFrame',
    wtf.analysis.db.FrameIndex.prototype.getPreviousFrame);
goog.exportProperty(
    wtf.analysis.db.FrameIndex.prototype, 'getNextFrame',
    wtf.analysis.db.FrameIndex.prototype.getNextFrame);
goog.exportProperty(
    wtf.analysis.db.FrameIndex.prototype, 'getFrameAtTime',
    wtf.analysis.db.FrameIndex.prototype.getFrameAtTime);
goog.exportProperty(
    wtf.analysis.db.FrameIndex.prototype, 'getIntraFrameAtTime',
    wtf.analysis.db.FrameIndex.prototype.getIntraFrameAtTime);
goog.exportProperty(
    wtf.analysis.db.FrameIndex.prototype, 'forEachIntersecting',
    wtf.analysis.db.FrameIndex.prototype.forEachIntersecting);
