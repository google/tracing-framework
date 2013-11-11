/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Selection painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.SelectionPainter');

goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.fx.Dragger');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.TimePainter');



/**
 * Paints a selection region and handles selection events.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.app.Selection} selection Selection.
 * @param {!wtf.ui.zoom.Viewport} viewport Zooming viewport.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.app.SelectionPainter = function(canvas, selection, viewport) {
  goog.base(this, canvas);

  /**
   * Selection.
   * @type {!wtf.app.Selection}
   * @private
   */
  this.selection_ = selection;
  this.selection_.addListener(wtf.events.EventType.INVALIDATED, function() {
    this.requestRepaint();
  }, this);

  var eh = new goog.events.EventHandler(this);
  this.registerDisposable(eh);

  var dragger = new goog.fx.Dragger(canvas);
  this.registerDisposable(dragger);
  // Bad dragger API...
  goog.events.unlisten(canvas, goog.events.EventType.MOUSEDOWN,
      dragger.startDrag, false, dragger);

  var downTime = 0;
  eh.listen(dragger, goog.fx.Dragger.EventType.START, function(e) {
    var width = this.getScaledCanvasWidth();
    var time = wtf.math.remap(
        e.clientX, 0, width, this.timeLeft, this.timeRight);
    downTime = time;
    //this.selection_.setTimeRange(time, time);
  }, false);
  eh.listen(dragger, goog.fx.Dragger.EventType.BEFOREDRAG, function(e) {
    var width = this.getScaledCanvasWidth();
    var time = wtf.math.remap(
        e.clientX, 0, width, this.timeLeft, this.timeRight);
    if (time < downTime) {
      this.selection_.setTimeRange(time, downTime);
    } else {
      this.selection_.setTimeRange(downTime, time);
    }
  }, false);
  eh.listen(dragger, goog.fx.Dragger.EventType.END, function(e) {
    if (Math.abs(e.left) < 2) {
      this.selection_.clearTimeRange();
    }
    viewport.setEnabled(true);
  }, false);

  // TODO(benvanik): move to painter onClick API.
  eh.listen(canvas, goog.events.EventType.MOUSEDOWN, function(e) {
    if (e.shiftKey) {
      viewport.setEnabled(false);
      dragger.startDrag(e);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
};
goog.inherits(wtf.app.SelectionPainter, wtf.ui.TimePainter);


/**
 * @override
 */
wtf.app.SelectionPainter.prototype.repaintInternal = function(
    ctx, bounds) {
  if (!this.isTimeRangeValid()) {
    return;
  }

  var width = bounds.width;
  var height = bounds.height;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  if (this.selection_.hasTimeRangeSpecified()) {
    var selectionLeft = this.selection_.getTimeStart();
    var selectionRight = this.selection_.getTimeEnd();

    var left = wtf.math.remap(selectionLeft, timeLeft, timeRight, 0, width);
    var right = wtf.math.remap(selectionRight, timeLeft, timeRight, 0, width);

    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, left, height);
    ctx.fillRect(right, 0, width - right, height);
  }
};
