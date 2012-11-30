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
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.analysis.EventFilter');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.analysis.db.Granularity');
goog.require('wtf.app.ui.TabPanel');
goog.require('wtf.app.ui.tracks.TrackInfoBar');
goog.require('wtf.app.ui.tracks.ZonePainter');
goog.require('wtf.app.ui.tracks.trackspanel');
goog.require('wtf.events.EventType');
goog.require('wtf.ui.GridPainter');
goog.require('wtf.ui.PaintContext');
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
  var summaryIndex = db.getSummaryIndex();

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  /**
   * Active track filter.
   * @type {!wtf.analysis.EventFilter}
   * @private
   */
  this.filter_ = new wtf.analysis.EventFilter();
  this.registerDisposable(this.filter_);
  this.filter_.addListener(wtf.events.EventType.INVALIDATED,
      function() {
        this.requestRepaint();
      }, this);

  /**
   * Infobar control.
   * @type {!wtf.app.ui.tracks.TrackInfoBar}
   * @private
   */
  this.infobar_ = new wtf.app.ui.tracks.TrackInfoBar(this,
      this.getChildElement(goog.getCssName('wtfAppUiTracksPanelInfoControl')));
  this.registerDisposable(this.infobar_);

  /**
   * Track canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.trackCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('wtfAppUiTracksPanelCanvas')));

  var paintContext = new wtf.ui.PaintContext(this.trackCanvas_);
  this.setPaintContext(paintContext);

  var body = this.getDom().getDocument().body;
  goog.asserts.assert(body);
  /**
   * Tooltip.
   * @type {!wtf.ui.Tooltip}
   * @private
   */
  this.tooltip_ = new wtf.ui.Tooltip(body);
  this.registerDisposable(this.tooltip_);
  this.tooltip_.bindEvents(this);

  /**
   * A list of all paint contexts that extend {@see wtf.ui.TimeRangePainter}.
   * This is used to update all of the painters when the current time range
   * changes.
   * @type {!Array.<!wtf.ui.TimeRangePainter>}
   * @private
   */
  this.timeRangePainters_ = [];

  var gridPainter = new wtf.ui.GridPainter(paintContext);
  gridPainter.setGranularities(
      wtf.app.ui.tracks.TracksPanel.MIN_GRANULARITY_,
      wtf.app.ui.tracks.TracksPanel.MAX_GRANULARITY_);
  this.timeRangePainters_.push(gridPainter);

  var rulerPainter = new wtf.ui.RulerPainter(paintContext);
  rulerPainter.setGranularities(
      wtf.app.ui.tracks.TracksPanel.MIN_GRANULARITY_,
      wtf.app.ui.tracks.TracksPanel.MAX_GRANULARITY_);
  this.timeRangePainters_.push(rulerPainter);

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
        var firstEventTime = summaryIndex.getFirstEventTime();

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
          painter.setTimeRange(firstEventTime, timeLeft, timeRight);
        }

        this.requestRepaint();
      }, this);
  this.viewport_.registerElement(this.trackCanvas_);
  // TODO(benvanik): set to something larger to get more precision.
  this.viewport_.setSceneSize(1, 1);
  documentView.registerViewport(this.viewport_);

  // Watch for zones and add as needed.
  db.addListener(wtf.analysis.db.EventDatabase.EventType.ZONES_ADDED,
      function(zoneIndices) {
        goog.array.forEach(zoneIndices, this.addZoneTrack_, this);
      }, this);
  var zoneIndices = db.getZoneIndices();
  goog.array.forEach(zoneIndices, this.addZoneTrack_, this);

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
 * Get the active filter.
 * @return {!wtf.analysis.EventFilter} Gets the active track filter.
 */
wtf.app.ui.tracks.TracksPanel.prototype.getFilter = function() {
  return this.filter_;
};


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
  var currentSize = goog.style.getSize(goog.dom.getParentElement(canvas));
  this.viewport_.setScreenSize(currentSize.width, currentSize.height);
};


/**
 * Adds a new zone track for the given zone index.
 * @param {!wtf.analysis.db.ZoneIndex} zoneIndex Zone index to add the track
 *     for.
 * @private
 */
wtf.app.ui.tracks.TracksPanel.prototype.addZoneTrack_ = function(zoneIndex) {
  var paintContext = this.getPaintContext();
  goog.asserts.assert(paintContext);

  var zonePainter = new wtf.app.ui.tracks.ZonePainter(
      paintContext, this.db_, zoneIndex, this.filter_);
  this.timeRangePainters_.push(zonePainter);
};
