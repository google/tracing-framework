/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Frame painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.FramePainter');

goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.ModifierKey');
goog.require('wtf.ui.RangePainter');
goog.require('wtf.ui.color');
goog.require('wtf.util');



/**
 * Paints a ruler into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.db.Database} db Database.
 * @param {!wtf.db.FrameList} frameList Zone frame list.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.FramePainter = function FramePainter(canvas, db, frameList) {
  goog.base(this, canvas);

  /**
   * Database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Frame event list.
   * @type {wtf.db.FrameList}
   * @private
   */
  this.frameList_ = frameList;
  this.frameList_.addListener(
      wtf.events.EventType.INVALIDATED, this.requestRepaint, this);
};
goog.inherits(wtf.app.FramePainter, wtf.ui.RangePainter);


/**
 * Colors used for drawing frames.
 * @type {!Array.<!wtf.ui.color.RgbColorValue>}
 * @private
 * @const
 */
wtf.app.FramePainter.FRAME_COLORS_ = [
  wtf.ui.color.createValue(26, 152, 80),
  wtf.ui.color.createValue(206, 215, 39),
  wtf.ui.color.createValue(215, 48, 39)
];


/**
 * Height of the frame region, in pixels.
 * @type {number}
 * @const
 */
wtf.app.FramePainter.HEIGHT = 26;


/**
 * @override
 */
wtf.app.FramePainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  if (this.frameList_.getCount()) {
    newBounds.height = wtf.app.FramePainter.HEIGHT;
  } else {
    newBounds.height = 0;
  }
  return newBounds;
};


/**
 * @override
 */
wtf.app.FramePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  if (!this.isTimeRangeValid()) {
    return;
  }

  var colors = wtf.app.FramePainter.FRAME_COLORS_;

  // Clip to extents.
  this.clip(bounds.left, bounds.top, bounds.width, bounds.height);

  this.beginRenderingRanges(bounds, 1);

  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  // Draw all visible frames.
  this.frameList_.forEachIntersecting(timeLeft, timeRight, function(frame) {
    var startTime = frame.getTime();
    var endTime = frame.getEndTime();

    // Compute screen size.
    var left = wtf.math.remap(startTime,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var right = wtf.math.remap(endTime,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var screenWidth = right - left;

    // Clip with the screen.
    var screenLeft = Math.max(bounds.left, left);
    var screenRight = Math.min((bounds.left + bounds.width) - 0.999, right);
    if (screenLeft >= screenRight) {
      return;
    }

    // Pick a color.
    var duration = frame.getDuration();
    var color;
    if (duration < 17) {
      color = colors[0];
    } else if (duration < 34) {
      color = colors[1];
    } else {
      color = colors[2];
    }

    // Draw bar.
    this.drawRange(0, screenLeft, screenRight, color, 1);

    if (screenWidth > 15) {
      var label = '#' + String(frame.getNumber()) +
          ' (' + wtf.util.formatSmallTime(frame.getDuration()) + ')';
      this.drawRangeLabel(
          bounds, left, right, screenLeft, screenRight, -1, label);
    }
  }, this);

  // Now blit the nicely rendered ranges onto the screen.
  var y = 0;
  var h = bounds.height;
  this.endRenderingRanges(bounds, y, h);

  // Draw label on the left.
  this.drawLabel('frames');
};


/**
 * @override
 */
wtf.app.FramePainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  var hit = this.hitTest_(x, y, bounds);
  if (!hit) {
    return false;
  }

  var commandManager = wtf.events.getCommandManager();
  if (goog.isArray(hit)) {
    var frameLeft = hit[0];
    var frameRight = hit[1];
    var timeLeft = frameLeft ?
        frameLeft.getEndTime() : this.db_.getFirstEventTime();
    var timeRight = frameRight ?
        frameRight.getTime() : this.db_.getLastEventTime();
    commandManager.execute('goto_range', this, null, timeLeft, timeRight);
    if (modifiers & wtf.ui.ModifierKey.SHIFT) {
      commandManager.execute('select_range', this, null, timeLeft, timeRight);
    }
  } else {
    var frame = hit;
    commandManager.execute('goto_frame', this, null, frame);
    if (modifiers & wtf.ui.ModifierKey.SHIFT) {
      commandManager.execute('select_range', this, null,
          frame.getTime(), frame.getEndTime());
    }
  }

  return true;
};


/**
 * @override
 */
wtf.app.FramePainter.prototype.getInfoStringInternal =
    function(x, y, bounds) {
  var hit = this.hitTest_(x, y, bounds);
  if (!hit) {
    return undefined;
  }

  var lines = [
  ];
  if (goog.isArray(hit)) {
    var frameLeft = hit[0];
    var frameRight = hit[1];
    var timeLeft = frameLeft ?
        frameLeft.getEndTime() : this.db_.getFirstEventTime();
    var timeRight = frameRight ?
        frameRight.getTime() : this.db_.getLastEventTime();
    var duration = timeRight - timeLeft;
    lines.push(
        '(' + wtf.util.formatTime(duration) + ': between ' +
        (frameLeft ? 'frame #' + frameLeft.getNumber() : 'start') +
        ' and ' +
        (frameRight ? '#' + frameRight.getNumber() : 'end') +
        ')');
  } else {
    var frame = hit;
    lines.push(
        wtf.util.formatTime(frame.getDuration()) + ': frame #' +
            frame.getNumber());
  }
  return lines.join('\n');
};


/**
 * Finds the frame at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {wtf.db.Frame|Array.<wtf.db.Frame>} Frame or an array
 *     containing the two frames on either side of the time.
 * @private
 */
wtf.app.FramePainter.prototype.hitTest_ = function(
    x, y, bounds) {
  var time = wtf.math.remap(x,
      bounds.left, bounds.left + bounds.width,
      this.timeLeft, this.timeRight);
  var frame = this.frameList_.getFrameAtTime(time);
  if (frame) {
    return frame;
  }
  return this.frameList_.getIntraFrameAtTime(time);
};
