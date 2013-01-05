/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview 'Tracks' panel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.tracks.TracksPanel');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.analysis.db.Granularity');
goog.require('wtf.app.ui.SelectionPainter');
goog.require('wtf.app.ui.TabPanel');
goog.require('wtf.app.ui.tracks.MarkPainter');
goog.require('wtf.app.ui.tracks.TimeRangePainter');
goog.require('wtf.app.ui.tracks.TrackInfoBar');
goog.require('wtf.app.ui.tracks.ZonePainter');
goog.require('wtf.app.ui.tracks.trackspanel');
goog.require('wtf.events.EventType');
goog.require('wtf.timing');
goog.require('wtf.ui.GridPainter');
goog.require('wtf.ui.LayoutMode');
goog.require('wtf.ui.Painter');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.RulerPainter');
goog.require('wtf.ui.Tooltip');
goog.require('wtf.ui.zoom.Viewport');



/**
 * Tracks panel, showing a list of tracks on a time graph.
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @constructor
 * @extends {wtf.app.ui.TabPanel}
 */
wtf.app.ui.tracks.TracksPanel = function(documentView) {
  goog.base(this, documentView, 'tracks', 'Tracks');

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  /**
   * Infobar control.
   * @type {!wtf.app.ui.tracks.TrackInfoBar}
   * @private
   */
  this.infobar_ = new wtf.app.ui.tracks.TrackInfoBar(this,
      this.getChildElement(goog.getCssName('infoControl')));
  this.registerDisposable(this.infobar_);
  this.infobar_.addListener(
      wtf.ui.ResizableControl.EventType.SIZE_CHANGED,
      this.layout, this);

  /**
   * Zooming viewport.
   * @type {!wtf.ui.zoom.Viewport}
   * @private
   */
  this.viewport_ = new wtf.ui.zoom.Viewport();
  this.registerDisposable(this.viewport_);
  this.viewport_.setAllowedScales(
      1000 / wtf.app.ui.tracks.TracksPanel.MIN_GRANULARITY_,
      1000 / wtf.app.ui.tracks.TracksPanel.MAX_GRANULARITY_);
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
        // var localView = documentView.getLocalView();
        // localView.setVisibleRange(timeLeft, timeRight);

        for (var n = 0; n < this.timeRangePainters_.length; n++) {
          var painter = this.timeRangePainters_[n];
          painter.setTimeRange(timeLeft, timeRight);
        }

        this.requestRepaint();
      }, this);
  // TODO(benvanik): set to something larger to get more precision.
  this.viewport_.setSceneSize(1, 1);
  documentView.registerViewport(this.viewport_);

  /**
   * Track canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.trackCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('canvas')));

  /**
   * Tooltip.
   * @type {!wtf.ui.Tooltip}
   * @private
   */
  this.tooltip_ = new wtf.ui.Tooltip(this.getDom());
  this.registerDisposable(this.tooltip_);
  this.setTooltip(this.tooltip_);

  var paintContext = new wtf.ui.Painter(this.trackCanvas_);
  this.setPaintContext(paintContext);

  /**
   * A list of all paint contexts that extend {@see wtf.ui.TimePainter}.
   * This is used to update all of the painters when the current time range
   * changes.
   * @type {!Array.<!wtf.ui.TimePainter>}
   * @private
   */
  this.timeRangePainters_ = [];

  var gridPainter = new wtf.ui.GridPainter(this.trackCanvas_);
  paintContext.addChildPainter(gridPainter);
  gridPainter.setGranularities(
      wtf.app.ui.tracks.TracksPanel.MIN_GRANULARITY_,
      wtf.app.ui.tracks.TracksPanel.MAX_GRANULARITY_);
  this.timeRangePainters_.push(gridPainter);

  /**
   * Selection painter.
   * @type {!wtf.app.ui.SelectionPainter}
   * @private
   */
  this.selectionPainter_ = new wtf.app.ui.SelectionPainter(
      this.trackCanvas_, documentView.getSelection(), this.viewport_);
  paintContext.addChildPainter(this.selectionPainter_);
  this.timeRangePainters_.push(this.selectionPainter_);

  /**
   * Vertical stack of painters that make up the main view.
   * @type {!wtf.ui.Painter}
   * @private
   */
  this.painterStack_ = new wtf.ui.Painter(this.trackCanvas_);
  paintContext.addChildPainter(this.painterStack_);
  this.painterStack_.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);

  var markPainter = new wtf.app.ui.tracks.MarkPainter(this.trackCanvas_, db);
  this.painterStack_.addChildPainter(markPainter);
  this.timeRangePainters_.push(markPainter);

  /**
   * Ruler painter.
   * @type {!wtf.ui.RulerPainter}
   * @private
   */
  this.rulerPainter_ = new wtf.ui.RulerPainter(this.trackCanvas_);
  this.painterStack_.addChildPainter(this.rulerPainter_);
  this.rulerPainter_.setGranularities(
      wtf.app.ui.tracks.TracksPanel.MIN_GRANULARITY_,
      wtf.app.ui.tracks.TracksPanel.MAX_GRANULARITY_);
  this.timeRangePainters_.push(this.rulerPainter_);

  // Watch for zones and add as needed.
  db.addListener(wtf.analysis.db.EventDatabase.EventType.ZONES_ADDED,
      function(zoneIndices) {
        goog.array.forEach(zoneIndices, this.addZoneTrack_, this);
      }, this);
  var zoneIndices = db.getZoneIndices();
  goog.array.forEach(zoneIndices, this.addZoneTrack_, this);

  // Done last so any other handlers are properly registered.
  this.viewport_.registerElement(this.trackCanvas_);

  wtf.timing.setImmediate(this.layout, this);
  this.requestRepaint();
};
goog.inherits(wtf.app.ui.tracks.TracksPanel, wtf.app.ui.TabPanel);


/**
 * @override
 */
wtf.app.ui.tracks.TracksPanel.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.tracks.trackspanel.control, undefined, undefined, dom));
};


/**
 * Minimum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.TracksPanel.MIN_GRANULARITY_ =
    100 * wtf.analysis.db.Granularity.SECOND;


/**
 * Maximum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.TracksPanel.MAX_GRANULARITY_ =
    0.001;


/**
 * @override
 */
wtf.app.ui.tracks.TracksPanel.prototype.navigate = function(pathParts) {
  // TODO(benvanik): support navigation
};


/**
 * @override
 */
wtf.app.ui.tracks.TracksPanel.prototype.layoutInternal = function() {
  var canvas = this.trackCanvas_;
  var canvasOuter = goog.dom.getParentElement(canvas);

  var infobarWidth = this.infobar_.getSplitterSize();
  goog.style.setStyle(canvasOuter, 'margin-right', (infobarWidth + 1) + 'px');

  var currentSize = goog.style.getSize(canvasOuter);
  this.viewport_.setScreenSize(currentSize.width, currentSize.height);
};


/**
 * Adds a new zone track for the given zone index.
 * @param {!wtf.analysis.db.ZoneIndex} zoneIndex Zone index to add the track
 *     for.
 * @private
 */
wtf.app.ui.tracks.TracksPanel.prototype.addZoneTrack_ = function(zoneIndex) {
  var zonePainterStack = new wtf.ui.Painter(this.trackCanvas_);
  this.painterStack_.addChildPainter(zonePainterStack);
  zonePainterStack.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);
  zonePainterStack.setPadding(new goog.math.Rect(0, 5, 0, 5));

  var timeRangePainter = new wtf.app.ui.tracks.TimeRangePainter(
      this.trackCanvas_, this.db_, zoneIndex.getTimeRangeIndex());
  zonePainterStack.addChildPainter(timeRangePainter);
  this.timeRangePainters_.push(timeRangePainter);
  timeRangePainter.setPadding(new goog.math.Rect(0, 0, 0, 10));

  var docView = this.getDocumentView();
  var zonePainter = new wtf.app.ui.tracks.ZonePainter(
      this.trackCanvas_, this.db_, zoneIndex, docView.getSelection());
  zonePainterStack.addChildPainter(zonePainter);
  this.timeRangePainters_.push(zonePainter);
};
