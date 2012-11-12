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
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.TimeRangePainter');



/**
 * Framebar painter.
 * @param {!wtf.ui.PaintContext} parentContext Parent paint context.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @constructor
 * @extends {wtf.ui.TimeRangePainter}
 */
wtf.app.ui.nav.FramebarPainter = function(parentContext, db) {
  goog.base(this, parentContext);

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
  deferreds.push(db.createEventIndex('browser.timing.frameEnd'));

  this.setReady(false);
  new goog.async.DeferredList(deferreds).addCallbacks(
      function() {
        // Grab indicies.
        var frameIndex = db.getEventIndex('browser.timing.frameEnd');
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
goog.inherits(wtf.app.ui.nav.FramebarPainter, wtf.ui.TimeRangePainter);


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
 * @override
 */
wtf.app.ui.nav.FramebarPainter.prototype.repaintInternal = function(
    ctx, width, height) {
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  var palette = wtf.app.ui.nav.FramebarPainter.FRAME_COLOR_PALETTE_;

  var y = 16;
  var h = Math.floor(0.5 * (height - y));

  // Draw frames.
  ctx.font = '12px bold verdana, sans-serif';
  this.frameIndex_.forEach(timeLeft, timeRight + 100, function(e) {
    var duration = e.args['duration'] / 1000;
    var startTime = e.time - duration;
    var endTime = e.time;

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
        var labelX = screenLeft + labelScreenWidth / 2 - labelWidth / 2;
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
