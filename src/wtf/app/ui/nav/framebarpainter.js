/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Framebar painter for the framebar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.nav.FramebarPainter');

goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.math');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.ModifierKey');
goog.require('wtf.ui.TimePainter');



/**
 * Framebar painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.app.ui.nav.FramebarPainter = function(canvas, db) {
  goog.base(this, canvas);

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  /**
   * Frame event index.
   * Each event should indicate the start of a new frame.
   * Only valid once it has been created and the control readied.
   * @type {wtf.analysis.db.EventIndex}
   * @private
   */
  this.frameIndex_ = null;

  var deferreds = [];
  deferreds.push(db.createEventIndex('wtf.timing#frameEnd'));

  this.setReady(false);
  new goog.async.DeferredList(deferreds).addCallbacks(
      function() {
        // Grab indicies.
        var frameIndex = db.getEventIndex('wtf.timing#frameEnd');
        goog.asserts.assert(frameIndex);
        this.frameIndex_ = frameIndex;
        this.frameIndex_.addListener(
            wtf.events.EventType.INVALIDATED, this.requestRepaint, this);

        // Ready and redraw.
        this.setReady(true);
      },
      function(arg) {
        // Failued to create indices.
      }, this);
};
goog.inherits(wtf.app.ui.nav.FramebarPainter, wtf.ui.TimePainter);


/**
 * Colors for frames based on x of 16.7ms.
 * @type {!Array.<string>}
 * @const
 * @private
 */
wtf.app.ui.nav.FramebarPainter.FRAME_COLOR_PALETTE_ = [
  'rgb(34,139,34)',
  'rgb(255,215,0)',
  'rgb(165,42,42)',
  'rgb(255,0,0)'
];


/**
 * Top pixel for drawing.
 * @type {number}
 * @const
 * @private
 */
wtf.app.ui.nav.FramebarPainter.FRAME_TOP_ = 16;


/**
 * @override
 */
wtf.app.ui.nav.FramebarPainter.prototype.repaintInternal = function(
    ctx, bounds) {
  var width = bounds.width;
  var height = bounds.height;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  var palette = wtf.app.ui.nav.FramebarPainter.FRAME_COLOR_PALETTE_;

  var y = wtf.app.ui.nav.FramebarPainter.FRAME_TOP_;
  var h = Math.floor(0.5 * (height - y));

  // Draw frames.
  // Since we are going off of frame end events we scan all the way forward in
  // time until we find the first event that spills out of view.
  ctx.font = '12px bold verdana, sans-serif';
  this.frameIndex_.forEach(timeLeft, Number.MAX_VALUE, function(e) {
    var duration = e.args['duration'] / 1000;
    var startTime = e.time - duration;
    var endTime = e.time;
    if (startTime > timeRight) {
      return false;
    }

    // TODO(benvanik): smoothly blend colors based on duration
    var colorIndex = Math.min((duration / 16.7777) | 0, palette.length - 1);
    ctx.fillStyle = palette[colorIndex];

    var lx = wtf.math.remap(startTime, timeLeft, timeRight, 0, width);
    var rx = wtf.math.remap(endTime, timeLeft, timeRight, 0, width);
    ctx.fillRect(lx, y, rx - lx, h);

    if (h > 10 && rx - lx > 10) {
      var label = e.args['number'] + ' (' + Math.round(duration) + 'ms)';
      var labelWidth = ctx.measureText(label).width;
      var screenLeft = Math.max(0, lx);
      var screenRight = Math.min(width, rx);
      var labelScreenWidth = screenRight - screenLeft;
      if (labelScreenWidth >= labelWidth) {
        var alpha = wtf.math.smoothRemap(
            labelScreenWidth, labelWidth, labelWidth + 15 * 2, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFFFFF';

        // Attempt to center the text within the box, but clamp to the screen.
        var labelX = lx + (rx - lx) / 2 - labelWidth / 2;
        labelX = goog.math.clamp(labelX, 0, width - labelWidth);

        ctx.fillText(label, labelX, y + h - 4);
        ctx.globalAlpha = 1;
      }
    }
  });

  // Label
  var nameHeight = 16;
  if (h > nameHeight + 4) {
    ctx.globalAlpha = 0.4;
    ctx.font = nameHeight + 'px bold verdana, sans-serif';
    var textSize = ctx.measureText('frames');
    ctx.fillStyle = '#000000';
    ctx.fillText('frames', 4, y + h - 4);
    ctx.globalAlpha = 1;
  }

  // Splitter border.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, y + h - 1, width, 1);
};


/**
 * @override
 */
wtf.app.ui.nav.FramebarPainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  var e = this.hitTestFrame_(x, y, bounds);
  if (e) {
    var commandManager = wtf.events.getCommandManager();
    commandManager.execute('goto_frame', this, null, e.args['number']);
    if (modifiers & wtf.ui.ModifierKey.SHIFT) {
      // Select frame time.
      commandManager.execute('select_range', this, null,
          e.time - e.args['duration'] / 1000, e.time);
    }
    return true;
  }
  return false;
};


/**
 * @override
 */
wtf.app.ui.nav.FramebarPainter.prototype.getInfoStringInternal = function(
    x, y, bounds) {
  var e = this.hitTestFrame_(x, y, bounds);
  if (e) {
    var duration = e.args['duration'] / 1000;
    return 'frame #' + e.args['number'] + ' (' +
        (Math.round(duration * 100) / 100) + 'ms)';
  }
  return undefined;
};


/**
 * Finds the frame at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {wtf.analysis.Event} Frame event, if any.
 * @private
 */
wtf.app.ui.nav.FramebarPainter.prototype.hitTestFrame_ = function(
    x, y, bounds) {
  var width = bounds.width;
  var height = bounds.height;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  var top = wtf.app.ui.nav.FramebarPainter.FRAME_TOP_;
  var bottom = top + Math.floor(0.5 * (height - top));

  if (y < top || y > bottom) {
    return null;
  }

  var time = wtf.math.remap(x, 0, width, timeLeft, timeRight);

  var result = null;
  this.frameIndex_.forEach(timeLeft, Number.MAX_VALUE, function(e) {
    var duration = e.args['duration'] / 1000;
    var startTime = e.time - duration;
    var endTime = e.time;
    if (startTime > timeRight) {
      return false;
    }
    if (startTime <= time && time <= endTime) {
      result = e;
      return false;
    }
  });

  return result;
};
