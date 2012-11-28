/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timeline painter for the timeline control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.nav.TimelinePainter');

goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.TimeRangePainter');



/**
 * Timeline painter.
 * @param {!wtf.ui.PaintContext} parentContext Parent paint context.
 * @param {!wtf.app.ui.DocumentView} documentView Document view.
 * @constructor
 * @extends {wtf.ui.TimeRangePainter}
 */
wtf.app.ui.nav.TimelinePainter = function(parentContext, documentView) {
  goog.base(this, parentContext);

  /**
   * Document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = documentView.getDocument().getDatabase();

  /**
   * Frame event index.
   * Each event should indicate the start of a new frame.
   * Only valid once it has been created and the control readied.
   * @type {wtf.analysis.db.EventIndex}
   * @private
   */
  this.frameIndex_ = null;

  var deferreds = [];
  deferreds.push(this.db_.createEventIndex('timing.frameEnd'));

  this.setReady(false);
  new goog.async.DeferredList(deferreds).addCallbacks(
      function() {
        // Grab indicies.
        var frameIndex = this.db_.getEventIndex('timing.frameEnd');
        goog.asserts.assert(frameIndex);
        this.frameIndex_ = frameIndex;
        this.frameIndex_.addListener(wtf.events.EventType.INVALIDATED,
            function() {
              var timeLeft = this.frameIndex_.getFirstEventTime();
              var timeRight = this.frameIndex_.getLastEventTime();
              this.setTimeRange(0, timeLeft, timeRight);
              this.requestRepaint();
            }, this);

        // Ready and redraw.
        this.setReady(true);
      },
      function(arg) {
        // Failued to create indices.
      }, this);
};
goog.inherits(wtf.app.ui.nav.TimelinePainter, wtf.ui.TimeRangePainter);


/**
 * @override
 */
wtf.app.ui.nav.TimelinePainter.prototype.repaintInternal = function(
    ctx, width, height) {
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  var timeScale = 1 / wtf.math.remap(45, 0, height, 0, 1);

  // Draw frames.
  // TODO(benvanik): only redraw if needed (data has changed)
  // TODO(benvanik): custom pixel pushing? it'd be cool to color the chart by
  //     frame time, but the single-color-per-path API of canvas makes that
  //     difficult.
  ctx.fillStyle = '#444444';
  var pixelStep = (timeRight - timeLeft) / width;
  var pixelStart = 0;
  var pixelAccumulator = 0;
  var pixelCount = 0;
  ctx.beginPath();
  ctx.moveTo(0, height);
  var previousEvent = null;
  this.frameIndex_.forEach(timeLeft, timeRight, function(e) {
    // Compute time of frame based on previous time.
    var frameTime = 0;
    if (previousEvent) {
      frameTime = e.time - previousEvent.time;
    }
    previousEvent = e;
    if (!frameTime) {
      return;
    }

    if (e.time > pixelStart + pixelStep) {
      var x = wtf.math.remap(pixelStart, timeLeft, timeRight, 0, width);
      var value = pixelAccumulator / pixelCount;
      var fy = Math.max(height - value * timeScale, 0);
      ctx.lineTo(x, fy);
      // Create a gap if the time is too large.
      var gapSize = e.time - pixelStart;
      pixelStart = e.time - (e.time % pixelStep);
      if (gapSize > pixelStep * 2) {
        var xr = wtf.math.remap(e.time, timeLeft, timeRight, 0, width);
        ctx.lineTo(xr, fy);
        ctx.lineTo(xr, height);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, 0, 1, height);
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(
            wtf.math.remap(pixelStart, timeLeft, timeRight, 0, width),
            height);
      }
      pixelAccumulator = 0;
      pixelCount = 0;
    }
    pixelAccumulator += frameTime;
    pixelCount++;
  });
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // Draw frame time limits.
  ctx.fillStyle = '#DD4B39';
  ctx.fillRect(0, Math.floor(height - 17 * timeScale), width, 1);
  ctx.fillRect(0, Math.floor(height - 33 * timeScale), width, 1);

  // Draw visible ranges for each view.
  var localView = this.documentView_.getLocalView();
  var doc = this.documentView_.getDocument();
  var viewList = doc.getViewList();
  viewList.forEach(function(view) {
    // Draw the local view last.
    if (view != localView) {
      this.drawVisibleRegion_(
          ctx, width, height, timeLeft, timeRight, view);
    }
  }, this);
  this.drawVisibleRegion_(
      ctx, width, height, timeLeft, timeRight, localView);
};


/**
 * Draws a view's visible selection range on the timeline.
 * @param {!CanvasRenderingContext2D} ctx Render context.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {number} timeLeft Left-most time visible.
 * @param {number} timeRight Right-most time visible.
 * @param {!wtf.doc.View} view View to draw.
 * @private
 */
wtf.app.ui.nav.TimelinePainter.prototype.drawVisibleRegion_ = function(
    ctx, width, height, timeLeft, timeRight, view) {
  var viewTimeLeft = view.getVisibleTimeStart();
  var viewTimeRight = view.getVisibleTimeEnd();
  var left = wtf.math.remap(viewTimeLeft, timeLeft, timeRight, 0, width);
  var right = wtf.math.remap(viewTimeRight, timeLeft, timeRight, 0, width);
  left = Math.floor(left) + 0.5;
  right = Math.floor(right) + 0.5;

  // TODO(benvanik): color based on user

  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(left, 0, right - left, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.strokeRect(left, -5, right - left, height + 10);
};
