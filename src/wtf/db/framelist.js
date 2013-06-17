/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Frame list.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.FrameList');

goog.require('goog.array');
goog.require('goog.math');
goog.require('wtf.db.Frame');
goog.require('wtf.db.IAncillaryList');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Frame list.
 *
 * @param {!wtf.db.EventList} eventList Event list.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.db.IAncillaryList}
 */
wtf.db.FrameList = function(eventList) {
  goog.base(this);

  /**
   * Event list that this instance is using to detect frames.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = eventList;

  /**
   * All frames, by frame number.
   * Note that this may be sparse.
   * @type {!Object.<number, wtf.db.Frame>}
   * @private
   */
  this.frames_ = {};

  /**
   * A densely packed list of frames.
   * @type {!Array.<!wtf.db.Frame>}
   * @private
   */
  this.frameList_ = [];

  this.eventList_.registerAncillaryList(this);
};
goog.inherits(wtf.db.FrameList, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.db.FrameList.prototype.disposeInternal = function() {
  this.eventList_.unregisterAncillaryList(this);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the total number of frames.
 * @return {number} Frame count.
 */
wtf.db.FrameList.prototype.getCount = function() {
  return this.frameList_.length;
};


/**
 * Gets a list of all frames.
 * This is a tightly packed list and the index does not correspond to the frame
 * number.
 * @return {!Array.<!wtf.db.Frame>} Frame list.
 */
wtf.db.FrameList.prototype.getAllFrames = function() {
  return this.frameList_;
};


/**
 * Gets the frame by frame number.
 * @param {number} value Frame number.
 * @return {wtf.db.Frame} Frame, if it exists.
 */
wtf.db.FrameList.prototype.getFrame = function(value) {
  return this.frames_[value] || null;
};


/**
 * Gets the frame preceeding the given frame.
 * @param {!wtf.db.Frame} frame Base frame.
 * @return {wtf.db.Frame} Preceeding frame, if any.
 */
wtf.db.FrameList.prototype.getPreviousFrame = function(frame) {
  var n = frame.getOrdinal();
  return n > 0 ? this.frameList_[n - 1] : null;
};


/**
 * Gets the frame following the given frame.
 * @param {!wtf.db.Frame} frame Base frame.
 * @return {wtf.db.Frame} Following frame, if any.
 */
wtf.db.FrameList.prototype.getNextFrame = function(frame) {
  var n = frame.getOrdinal();
  return n < this.frameList_.length - 1 ? this.frameList_[n + 1] : null;
};


/**
 * Gets the frame that contains the given time.
 * @param {number} time Time.
 * @return {wtf.db.Frame} Frame, if any.
 */
wtf.db.FrameList.prototype.getFrameAtTime = function(time) {
  if (!this.frameList_.length) {
    return null;
  }
  var index = goog.array.binarySelect(
      this.frameList_, wtf.db.Frame.selector, { time: time });
  if (index < 0) {
    index = -index - 2;
  }
  index = goog.math.clamp(index, 0, this.frameList_.length - 1);
  var frame = this.frameList_[index];
  if (frame &&
      frame.getTime() <= time &&
      frame.getEndTime() >= time) {
    return frame;
  }
  return null;
};


/**
 * Gets the two frames the given time is between.
 * The result is an array of [previous, next]. Either may be null if there is
 * no frame before or after. If the given search time falls inside of a frame
 * the result is undefined.
 * @param {number} time Search time.
 * @return {!Array.<wtf.db.Frame>} Surrounding frames.
 */
wtf.db.FrameList.prototype.getIntraFrameAtTime = function(time) {
  if (!this.frameList_.length) {
    return [null, null];
  }

  // Find the frame to the left of the time.
  var index = goog.array.binarySelect(
      this.frameList_, wtf.db.Frame.selector, { time: time });
  if (index < 0) {
    index = -index - 1;
    // Select the previous frame.
    index--;
  }
  if (index < 0) {
    // No frames before, return the first intra-frame time.
    return [null, this.frameList_[0]];
  }
  index = goog.math.clamp(index, 0, this.frameList_.length - 1);

  var previousFrame = this.frameList_[index];
  var nextFrame = this.getNextFrame(previousFrame);
  return [previousFrame, nextFrame];
};


/**
 * Iterates over the list of frames, returning each one that intersects the
 * given time range in order.
 *
 * @param {number} timeStart Start time range.
 * @param {number} timeEnd End time range.
 * @param {!function(this: T, !wtf.db.Frame)} callback Function to
 *     call with the time ranges.
 * @param {T=} opt_scope Scope to call the function in.
 * @template T
 */
wtf.db.FrameList.prototype.forEachIntersecting = function(
    timeStart, timeEnd, callback, opt_scope) {
  if (!this.frameList_.length) {
    return;
  }

  var index = goog.array.binarySelect(
      this.frameList_, wtf.db.Frame.selector, { time: timeStart });
  if (index < 0) {
    index = -index - 1;
    // Select the previous frame.
    // The loop will move it ahead if needed.
    index--;
  }
  index = goog.math.clamp(index, 0, this.frameList_.length - 1);

  for (var n = index; n < this.frameList_.length; n++) {
    var frame = this.frameList_[n];
    if (frame.getEndTime() < timeStart) {
      continue;
    }
    if (frame.getTime() > timeEnd) {
      break;
    }
    callback.call(opt_scope, frame);
  }
};


/**
 * @override
 */
wtf.db.FrameList.prototype.beginRebuild = function(eventTypeTable) {
  return [
    eventTypeTable.getByName('wtf.timing#frameStart'),
    eventTypeTable.getByName('wtf.timing#frameEnd')
  ];
};


/**
 * @override
 */
wtf.db.FrameList.prototype.handleEvent = function(
    eventTypeIndex, eventType, it) {
  var number = /** @type {number} */ (it.getArgument('number'));
  var frame = this.frames_[number];
  if (!frame) {
    frame = new wtf.db.Frame(number);
    this.frames_[number] = frame;
    this.frameList_.push(frame);
  }
  switch (eventTypeIndex) {
    case 0:
      frame.setStartEvent(it);
      break;
    case 1:
      frame.setEndEvent(it);
      break;
  }
};


/**
 * @override
 */
wtf.db.FrameList.prototype.endRebuild = function() {
  // Scan frames and remove any that are partial.
  // They aren't worth the extra work to render like that.
  var validFrames = [];
  for (var n = 0; n < this.frameList_.length; n++) {
    var frame = this.frameList_[n];
    if (frame.getTime() && frame.getEndTime()) {
      frame.setOrdinal(validFrames.length);
      validFrames.push(frame);
    } else {
      delete this.frames_[frame.getNumber()];
    }
  }
  this.frameList_ = validFrames;

  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


goog.exportProperty(
    wtf.db.FrameList.prototype, 'getCount',
    wtf.db.FrameList.prototype.getCount);
goog.exportProperty(
    wtf.db.FrameList.prototype, 'getAllFrames',
    wtf.db.FrameList.prototype.getAllFrames);
goog.exportProperty(
    wtf.db.FrameList.prototype, 'getFrame',
    wtf.db.FrameList.prototype.getFrame);
goog.exportProperty(
    wtf.db.FrameList.prototype, 'getPreviousFrame',
    wtf.db.FrameList.prototype.getPreviousFrame);
goog.exportProperty(
    wtf.db.FrameList.prototype, 'getNextFrame',
    wtf.db.FrameList.prototype.getNextFrame);
goog.exportProperty(
    wtf.db.FrameList.prototype, 'getFrameAtTime',
    wtf.db.FrameList.prototype.getFrameAtTime);
goog.exportProperty(
    wtf.db.FrameList.prototype, 'getIntraFrameAtTime',
    wtf.db.FrameList.prototype.getIntraFrameAtTime);
goog.exportProperty(
    wtf.db.FrameList.prototype, 'forEachIntersecting',
    wtf.db.FrameList.prototype.forEachIntersecting);
