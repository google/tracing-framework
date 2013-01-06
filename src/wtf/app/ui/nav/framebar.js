/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Framebar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.nav.Framebar');

goog.require('goog.dom');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.analysis.db.Granularity');
goog.require('wtf.app.ui.nav.HeatmapPainter');
goog.require('wtf.app.ui.nav.framebar');
goog.require('wtf.events.EventType');
goog.require('wtf.events.ListEventType');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.GridPainter');
goog.require('wtf.ui.Painter');
goog.require('wtf.ui.RulerPainter');
goog.require('wtf.ui.Tooltip');
goog.require('wtf.ui.zoom.Viewport');



/**
 * Framebar control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.nav.Framebar = function(documentView, parentElement) {
  var dom = documentView.getDom();
  goog.base(this, parentElement, dom);

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

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
  this.db_ = db;

  /**
   * Framebar canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.framebarCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('canvas')));

  var paintContext = new wtf.ui.Painter(this.framebarCanvas_);
  this.setPaintContext(paintContext);

  /**
   * Framebar tooltip.
   * @type {!wtf.ui.Tooltip}
   * @private
   */
  this.tooltip_ = new wtf.ui.Tooltip(dom);
  this.registerDisposable(this.tooltip_);
  this.setTooltip(this.tooltip_);

  /**
   * A list of all paint contexts that extend {@see wtf.ui.TimePainter}.
   * This is used to update all of the painters when the current time range
   * changes.
   * @type {!Array.<!wtf.ui.TimePainter>}
   * @private
   */
  this.timeRangePainters_ = [];

  var gridPainter = new wtf.ui.GridPainter(this.framebarCanvas_);
  paintContext.addChildPainter(gridPainter);
  gridPainter.setGranularities(
      wtf.app.ui.nav.Framebar.MIN_GRANULARITY_,
      wtf.app.ui.nav.Framebar.MAX_GRANULARITY_);
  this.timeRangePainters_.push(gridPainter);

  var heatmapPainter = new wtf.app.ui.nav.HeatmapPainter(
      this.framebarCanvas_, db);
  paintContext.addChildPainter(heatmapPainter);
  this.timeRangePainters_.push(heatmapPainter);

  var rulerPainter = new wtf.ui.RulerPainter(this.framebarCanvas_);
  paintContext.addChildPainter(rulerPainter);
  rulerPainter.setGranularities(
      wtf.app.ui.nav.Framebar.MIN_GRANULARITY_,
      wtf.app.ui.nav.Framebar.MAX_GRANULARITY_);
  this.timeRangePainters_.push(rulerPainter);

  /**
   * Zooming viewport.
   * @type {!wtf.ui.zoom.Viewport}
   * @private
   */
  this.viewport_ = new wtf.ui.zoom.Viewport();
  this.registerDisposable(this.viewport_);
  this.viewport_.setAllowedScales(
      1000 / wtf.app.ui.nav.Framebar.MIN_GRANULARITY_,
      1000 / wtf.app.ui.nav.Framebar.MAX_GRANULARITY_);
  this.viewport_.addListener(
      wtf.events.EventType.INVALIDATED,
      function() {
        var firstEventTime = db.getFirstEventTime();

        // Update from viewport.
        var width = this.viewport_.getScreenWidth();
        var timeLeft = this.viewport_.screenToScene(0, 0).x;
        var timeRight = this.viewport_.screenToScene(width, 0).x;
        timeLeft += firstEventTime;
        timeRight += firstEventTime;

        // Update the main view.
        // TODO(benvanik): better data flow
        var localView = documentView.getLocalView();
        localView.setVisibleRange(timeLeft, timeRight);

        for (var n = 0; n < this.timeRangePainters_.length; n++) {
          var painter = this.timeRangePainters_[n];
          painter.setTimeRange(timeLeft, timeRight);
        }

        this.requestRepaint();
      }, this);
  this.viewport_.registerElement(this.framebarCanvas_);
  // TODO(benvanik): set to something larger to get more precision.
  this.viewport_.setSceneSize(1, 1);
  documentView.registerViewport(this.viewport_);

  // HACK(benvanik): zoom to fit on change - this should follow other behavior
  function zoomToBounds() {
    var firstEventTime = db.getFirstEventTime();
    var lastEventTime = db.getLastEventTime();
    var width = this.viewport_.getScreenWidth();
    if (lastEventTime) {
      this.viewport_.set(
          -1000, 0, width / (lastEventTime - firstEventTime + 2000));
    }
  };
  db.addListener(wtf.events.EventType.INVALIDATED, zoomToBounds, this);

  // Hook the view list and bind to all existing views to track updates.
  // This allows us to show where each view is looking.
  var viewList = doc.getViewList();
  viewList.forEach(function(view) {
    view.addListener(
        wtf.events.EventType.INVALIDATED, this.requestRepaint, this);
  }, this);
  viewList.addListener(
      wtf.events.ListEventType.VALUES_ADDED,
      function(values) {
        for (var n = 0; n < values.length; n++) {
          var view = values[n];
          view.addListener(
              wtf.events.EventType.INVALIDATED, this.requestRepaint, this);
        }
      }, this);

  this.requestRepaint();
};
goog.inherits(wtf.app.ui.nav.Framebar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.nav.Framebar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.nav.framebar.control, undefined, undefined, dom));
};


/**
 * Minimum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.nav.Framebar.MIN_GRANULARITY_ =
    100 * wtf.analysis.db.Granularity.SECOND;


/**
 * Maximum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.nav.Framebar.MAX_GRANULARITY_ =
    0.001;


/**
 * @override
 */
wtf.app.ui.nav.Framebar.prototype.layoutInternal = function() {
  var canvas = this.framebarCanvas_;
  var currentSize = goog.style.getSize(goog.dom.getParentElement(canvas));
  this.viewport_.setScreenSize(currentSize.width, currentSize.height);
};
