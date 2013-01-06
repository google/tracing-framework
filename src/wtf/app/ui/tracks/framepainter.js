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

goog.provide('wtf.app.ui.tracks.FramePainter');

goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.ModifierKey');
goog.require('wtf.ui.RangePainter');
goog.require('wtf.ui.color.RgbColor');
goog.require('wtf.util');



/**
 * Paints a ruler into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @param {!wtf.analysis.db.FrameIndex} frameIndex Zone frame index.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.ui.tracks.FramePainter = function FramePainter(canvas, db, frameIndex) {
  goog.base(this, canvas);

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  /**
   * Frame event index.
   * @type {wtf.analysis.db.FrameIndex}
   * @private
   */
  this.frameIndex_ = frameIndex;
  this.frameIndex_.addListener(wtf.events.EventType.INVALIDATED,
      this.requestRepaint, this);
};
goog.inherits(wtf.app.ui.tracks.FramePainter, wtf.ui.RangePainter);


/**
 * Colors used for drawing frames.
 * @type {!Array.<!wtf.ui.color.RgbColor>}
 * @private
 * @const
 */
wtf.app.ui.tracks.FramePainter.FRAME_COLORS_ = [
  new wtf.ui.color.RgbColor(26, 152, 80),
  new wtf.ui.color.RgbColor(206, 215, 39),
  new wtf.ui.color.RgbColor(215, 48, 39)
];


/**
 * Height of the frame region, in pixels.
 * @type {number}
 * @const
 */
wtf.app.ui.tracks.FramePainter.HEIGHT = 26;


/**
 * @override
 */
wtf.app.ui.tracks.FramePainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  if (this.frameIndex_.getCount()) {
    newBounds.height = wtf.app.ui.tracks.FramePainter.HEIGHT;
  } else {
    newBounds.height = 0;
  }
  return newBounds;
};


/**
 * @override
 */
wtf.app.ui.tracks.FramePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  var colors = wtf.app.ui.tracks.FramePainter.FRAME_COLORS_;

  // Clip to extents.
  this.clip(bounds.left, bounds.top, bounds.width, bounds.height);

  this.beginRenderingRanges(bounds, 1);

  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  // Draw all visible frames.
  this.frameIndex_.forEachIntersecting(timeLeft, timeRight, function(frame) {
    var startTime = frame.getStartTime();
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
  var h = bounds.height - 1;
  this.endRenderingRanges(bounds, y, h);
};


/**
 * @override
 */
wtf.app.ui.tracks.FramePainter.prototype.onClickInternal =
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
        frameRight.getStartTime() : this.db_.getLastEventTime();
    commandManager.execute('goto_range', this, null, timeLeft, timeRight);
    if (modifiers & wtf.ui.ModifierKey.SHIFT) {
      commandManager.execute('select_range', this, null, timeLeft, timeRight);
    }
  } else {
    var frame = hit;
    commandManager.execute('goto_frame', this, null, frame);
    if (modifiers & wtf.ui.ModifierKey.SHIFT) {
      commandManager.execute('select_range', this, null,
          frame.getStartTime(), frame.getEndTime());
    }
  }

  return true;
};


/**
 * @override
 */
wtf.app.ui.tracks.FramePainter.prototype.getInfoStringInternal =
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
        frameRight.getStartTime() : this.db_.getLastEventTime();
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
 * @return {wtf.analysis.Frame|Array.<wtf.analysis.Frame>} Frame or an array
 *     containing the two frames on either side of the time.
 * @private
 */
wtf.app.ui.tracks.FramePainter.prototype.hitTest_ = function(
    x, y, bounds) {
  var time = wtf.math.remap(x,
      bounds.left, bounds.left + bounds.width,
      this.timeLeft, this.timeRight);
  var frame = this.frameIndex_.getFrameAtTime(time);
  if (frame) {
    return frame;
  }
  return this.frameIndex_.getIntraFrameAtTime(time);
};
