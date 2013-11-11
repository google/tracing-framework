/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace time range painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.tracks.TimeRangePainter');

goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.ModifierKey');
goog.require('wtf.ui.RangePainter');
goog.require('wtf.ui.color.Palette');
goog.require('wtf.util');



/**
 * Paints a time range region into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.db.TimeRangeList} timeRangeList Time range list.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.tracks.TimeRangePainter = function TimeRangePainter(
    canvas, timeRangeList) {
  goog.base(this, canvas);

  /**
   * Time range list.
   * @type {!wtf.db.TimeRangeList}
   * @private
   */
  this.timeRangeList_ = timeRangeList;

  /**
   * Color palette used for drawing marks.
   * @type {!wtf.ui.color.Palette}
   * @private
   */
  this.palette_ = new wtf.ui.color.Palette(
      wtf.ui.color.Palette.D3_10);

  this.timeRangeList_.addListener(wtf.events.EventType.INVALIDATED,
      this.requestRepaint, this);
};
goog.inherits(wtf.app.tracks.TimeRangePainter, wtf.ui.RangePainter);


/**
 * Height of a time range, in pixels.
 * @type {number}
 * @const
 * @private
 */
wtf.app.tracks.TimeRangePainter.TIME_RANGE_HEIGHT_ = 16;


/**
 * Don't draw more levels than this.
 * This helps to punish those who are misusing time ranges.
 * @type {number}
 * @const
 * @private
 */
wtf.app.tracks.TimeRangePainter.MAX_LEVELS_ = 5;


/**
 * @override
 */
wtf.app.tracks.TimeRangePainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  var maxLevel = Math.min(
      this.timeRangeList_.getMaximumLevel(),
      wtf.app.tracks.TimeRangePainter.MAX_LEVELS_);
  var levelHeight = wtf.app.tracks.TimeRangePainter.TIME_RANGE_HEIGHT_;
  newBounds.height = maxLevel * levelHeight;
  return newBounds;
};


/**
 * @override
 */
wtf.app.tracks.TimeRangePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  if (!this.isTimeRangeValid()) {
    return;
  }

  var palette = this.palette_;

  var timeRangeHeight = wtf.app.tracks.TimeRangePainter.TIME_RANGE_HEIGHT_;

  var maxLevel = Math.min(
      this.timeRangeList_.getMaximumLevel(),
      wtf.app.tracks.TimeRangePainter.MAX_LEVELS_);
  this.beginRenderingRanges(bounds, maxLevel + 1,
      wtf.ui.RangePainter.DrawStyle.TIME_SPAN);

  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  this.timeRangeList_.forEachIntersecting(timeLeft, timeRight,
      function(timeRange) {
        // Skip if excluded.
        var level = timeRange.getLevel();
        if (level >= wtf.app.tracks.TimeRangePainter.MAX_LEVELS_) {
          return;
        }

        // Compute screen size.
        var startTime = timeRange.getTime();
        var endTime = timeRange.getEndTime();
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

        // Compute color by name.
        var label = timeRange.getName();
        if (!label || !label.length) {
          return;
        }
        var color = /** @type {!wtf.ui.color.RgbColorValue} */ (
            timeRange.getRenderData());
        if (!color) {
          color = palette.getColorForString(label).toValue();
          timeRange.setRenderData(color);
        }

        // Draw bar.
        this.drawRange(level, screenLeft, screenRight, color, 1);

        if (screenWidth > 15) {
          var y = level * timeRangeHeight;
          this.drawRangeLabel(
              bounds, left, right, screenLeft, screenRight, y + 1, label);
        }
      }, this);

  // Now blit the nicely rendered ranges onto the screen.
  var y = 0;
  this.endRenderingRanges(bounds, y, timeRangeHeight);

  // Draw label on the left.
  this.drawLabel('time ranges');
};


/**
 * @override
 */
wtf.app.tracks.TimeRangePainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  var timeRange = this.hitTest_(x, y, bounds);
  if (!timeRange) {
    return false;
  }

  var timeStart = timeRange.getTime();
  var timeEnd = timeRange.getEndTime();

  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('goto_range', this, null, timeStart, timeEnd);
  if (modifiers & wtf.ui.ModifierKey.SHIFT) {
    commandManager.execute('select_range', this, null, timeStart, timeEnd);
  }

  return true;
};


/**
 * @override
 */
wtf.app.tracks.TimeRangePainter.prototype.getInfoStringInternal =
    function(x, y, bounds) {
  var timeRange = this.hitTest_(x, y, bounds);
  if (!timeRange) {
    return undefined;
  }

  var duration = timeRange.getDuration();
  var lines = [
    wtf.util.formatTime(duration) + ': ' + timeRange.getName()
  ];
  var value = timeRange.getValue();
  if (value) {
    wtf.util.addArgumentLines(lines, {
      'value': value
    });
  }
  return lines.join('\n');
};


/**
 * Finds the time range at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {wtf.db.TimeRange} Time range or nothing.
 * @private
 */
wtf.app.tracks.TimeRangePainter.prototype.hitTest_ = function(
    x, y, bounds) {
  var h = wtf.app.tracks.TimeRangePainter.TIME_RANGE_HEIGHT_;
  var level = ((y - bounds.top) / h) | 0;
  var time = wtf.math.remap(x,
      bounds.left, bounds.left + bounds.width,
      this.timeLeft, this.timeRight);
  var matches = this.timeRangeList_.getTimeRangesAtTime(time);
  for (var n = 0; n < matches.length; n++) {
    if (matches[n].getLevel() == level) {
      return matches[n];
    }
  }
  return null;
};
