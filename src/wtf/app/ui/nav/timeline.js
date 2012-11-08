/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timeline control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.nav.Timeline');

goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.ui.nav.timeline');
goog.require('wtf.doc.View');
goog.require('wtf.events.EventType');
goog.require('wtf.events.ListEventType');
goog.require('wtf.math');
goog.require('wtf.ui.Control');
goog.require('wtf.util.canvas');



/**
 * Timeline control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.nav.Timeline = function(documentView, parentElement) {
  var dom = documentView.getDom();
  goog.base(this, parentElement, dom);

  /**
   * Document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Timeline canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.timelineCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('wtfAppUiTimelineCanvas')));

  /**
   * Timeline canvas 2D context.
   * This will be the unhooked 2D context.
   * @type {!CanvasRenderingContext2D}
   * @private
   */
  this.timelineContext2d_ = /** @type {!CanvasRenderingContext2D} */ (
      this.timelineCanvas_.getContext('raw-2d') ||
      this.timelineCanvas_.getContext('2d'));

  /**
   * The current view in the main panel.
   * This is used to show where, in time, the track panel is looking.
   * @type {!wtf.doc.View}
   * @private
   */
  this.localView_ = documentView.getLocalView();

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  // Hook the view list and bind to all existing views to track updates.
  // This allows us to show where each view is looking.
  var viewList = doc.getViewList();
  viewList.forEach(function(view) {
    view.addListener(
        wtf.doc.View.EventType.VISIBLE_RANGE_CHANGED,
        this.requestRepaint, this);
  }, this);
  viewList.addListener(
      wtf.events.ListEventType.VALUES_ADDED,
      function(values) {
        for (var n = 0; n < values.length; n++) {
          var view = values[n];
          view.addListener(
              wtf.doc.View.EventType.VISIBLE_RANGE_CHANGED,
              this.requestRepaint, this);
        }
      }, this);

  var deferreds = [];
  deferreds.push(db.createEventIndex('browser.timing.frameMarker'));

  /**
   * Frame event index.
   * Each event should indicate the start of a new frame.
   * Only valid once it has been created and the control readied.
   * @type {wtf.analysis.db.EventIndex}
   * @private
   */
  this.frameIndex_ = null;

  /**
   * Whether the control is ready and can be drawn.
   * This will be false until required data (indices/etc) are ready.
   * @type {boolean}
   * @private
   */
  this.ready_ = false;

  new goog.async.DeferredList(deferreds).addCallbacks(
      function() {
        // Grab indicies.
        var frameIndex = db.getEventIndex('browser.timing.frameMarker');
        goog.asserts.assert(frameIndex);
        this.frameIndex_ = frameIndex;
        this.frameIndex_.addListener(
            wtf.events.EventType.INVALIDATED, this.requestRepaint, this);

        // Ready and redraw.
        this.ready_ = true;
        this.requestRepaint();
      },
      function(arg) {
        // Failued to create indices.
      }, this);

  this.requestRepaint();
};
goog.inherits(wtf.app.ui.nav.Timeline, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.nav.Timeline.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.nav.timeline.control, undefined, undefined, dom));
};


/**
 * Handles size changes from the parent control.
 */
wtf.app.ui.nav.Timeline.prototype.layout = function() {
  // Reshape the canvas.
  var currentSize = goog.style.getSize(this.timelineCanvas_.parentElement);
  wtf.util.canvas.reshape(
      this.timelineCanvas_, this.timelineContext2d_,
      currentSize.width, currentSize.height);

  // Draw immediately to prevent flicker.
  this.repaint();
};


/**
 * @override
 */
wtf.app.ui.nav.Timeline.prototype.repaint = function() {
  if (!this.ready_) {
    return;
  }

  var ctx = this.timelineContext2d_;
  var pixelRatio = wtf.util.canvas.getCanvasPixelRatio(ctx);
  var width = this.timelineCanvas_.width / pixelRatio;
  var height = this.timelineCanvas_.height / pixelRatio;
  wtf.util.canvas.reset(ctx, pixelRatio);

  ctx.clearRect(0, 0, width, height);

  // The timeline shows the entire time of the trace - to place events correctly
  // we need to scale their offsets and sizes.
  var timeLeft = this.frameIndex_.getFirstEventTime();
  var timeRight = this.frameIndex_.getLastEventTime();

  // Draw grid.

  // Draw frames.
  // TODO(benvanik): only redraw if needed (data has changed)
  ctx.strokeStyle = '#444444';
  ctx.beginPath();
  var previousEvent = null;
  this.frameIndex_.forEach(timeLeft, timeRight, function(e) {
    // Compute time of frame based on previous time.
    var frameTime = 0;
    if (previousEvent) {
      frameTime = e.time - previousEvent.time;
    }
    previousEvent = e;
    if (frameTime) {
      var x = wtf.math.remap(e.time, timeLeft, timeRight, 0, width);
      ctx.moveTo(x, Math.max(height - frameTime * 2, 0));
      ctx.lineTo(x, height);
    }
  });
  ctx.stroke();

  // Draw frame time limits.
  ctx.fillStyle = '#DD4B39';
  ctx.fillRect(0, height - 17 * 2, width, 1);
  ctx.fillRect(0, height - 33 * 2, width, 1);

  // Draw visible ranges for each view.
  var doc = this.documentView_.getDocument();
  var viewList = doc.getViewList();
  viewList.forEach(function(view) {
    // Draw the local view last.
    if (view != this.localView_) {
      this.drawVisibleRegion_(
          ctx, timeLeft, timeRight, width, height, view);
    }
  }, this);
  this.drawVisibleRegion_(
      ctx, timeLeft, timeRight, width, height, this.localView_);
};


/**
 * Draws a view's visible selection range on the timeline.
 * @param {!CanvasRenderingContext2D} ctx Render context.
 * @param {number} timeLeft Left-most time visible.
 * @param {number} timeRight Right-most time visible.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {!wtf.doc.View} view View to draw.
 * @private
 */
wtf.app.ui.nav.Timeline.prototype.drawVisibleRegion_ = function(
    ctx, timeLeft, timeRight, width, height, view) {
  var viewTimeLeft = view.getVisibleTimeStart();
  var viewTimeRight = view.getVisibleTimeEnd();
  var left = wtf.math.remap(viewTimeLeft, timeLeft, timeRight, 0, width);
  var right = wtf.math.remap(viewTimeRight, timeLeft, timeRight, 0, width);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(left, 0, right - left, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.strokeRect(left, 0, right - left, height);
  ctx.strokeStyle = 'rgb(255, 255, 255)';
  ctx.strokeRect(left + 1, + 1, right - left - 2, height - 2);
};
