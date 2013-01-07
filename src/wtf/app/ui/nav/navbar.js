/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Navigation bar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.nav.Navbar');

goog.require('goog.array');
goog.require('goog.soy');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.analysis.db.Granularity');
goog.require('wtf.app.ui.FramePainter');
goog.require('wtf.app.ui.MarkPainter');
goog.require('wtf.app.ui.nav.HeatmapPainter');
goog.require('wtf.app.ui.nav.TimelinePainter');
goog.require('wtf.app.ui.nav.navbar');
goog.require('wtf.events.EventType');
goog.require('wtf.events.ListEventType');
goog.require('wtf.ui.GridPainter');
goog.require('wtf.ui.LayoutMode');
goog.require('wtf.ui.Painter');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.RulerPainter');
goog.require('wtf.ui.Tooltip');



/**
 * Navigation bar control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.ResizableControl}
 */
wtf.app.ui.nav.Navbar = function(documentView, parentElement) {
  var dom = documentView.getDom();
  goog.base(this,
      wtf.ui.ResizableControl.Orientation.HORIZONTAL,
      goog.getCssName('navbarSplitter'),
      parentElement, dom);
  this.setSplitterLimits(wtf.app.ui.nav.Navbar.MIN_HEIGHT, undefined);

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  /**
   * Parent document view.
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
   * Navbar canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.navbarCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('canvas')));
  /**
   * Tooltip.
   * @type {!wtf.ui.Tooltip}
   * @private
   */
  this.tooltip_ = new wtf.ui.Tooltip(dom);
  this.registerDisposable(this.tooltip_);
  this.setTooltip(this.tooltip_);

  var paintContext = new wtf.ui.Painter(this.navbarCanvas_);
  this.setPaintContext(paintContext);

  /**
   * A list of all paint contexts that extend {@see wtf.ui.TimePainter}.
   * This is used to update all of the painters when the current time range
   * changes.
   * @type {!Array.<!wtf.ui.TimePainter>}
   * @private
   */
  this.timePainters_ = [];

  var gridPainter = new wtf.ui.GridPainter(this.navbarCanvas_);
  paintContext.addChildPainter(gridPainter);
  gridPainter.setGranularities(
      wtf.app.ui.nav.Navbar.MIN_GRANULARITY_,
      wtf.app.ui.nav.Navbar.MAX_GRANULARITY_);
  this.timePainters_.push(gridPainter);

  /**
   * Vertical stack of painters that make up the main view.
   * @type {!wtf.ui.Painter}
   * @private
   */
  this.painterStack_ = new wtf.ui.Painter(this.navbarCanvas_);
  paintContext.addChildPainter(this.painterStack_);
  this.painterStack_.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);

  /**
   * Ruler painter.
   * @type {!wtf.ui.RulerPainter}
   * @private
   */
  this.rulerPainter_ = new wtf.ui.RulerPainter(this.navbarCanvas_);
  this.painterStack_.addChildPainter(this.rulerPainter_);
  this.rulerPainter_.setGranularities(
      wtf.app.ui.nav.Navbar.MIN_GRANULARITY_,
      wtf.app.ui.nav.Navbar.MAX_GRANULARITY_);
  this.timePainters_.push(this.rulerPainter_);

  var markPainter = new wtf.app.ui.MarkPainter(this.navbarCanvas_, db);
  this.painterStack_.addChildPainter(markPainter);
  this.timePainters_.push(markPainter);

  /**
   * Vertical stack of painters for zone painters.
   * @type {!wtf.ui.Painter}
   * @private
   */
  this.zonePainterStack_ = new wtf.ui.Painter(this.navbarCanvas_);
  this.painterStack_.addChildPainter(this.zonePainterStack_);
  this.zonePainterStack_.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);

  // Watch for zones and add as needed.
  db.addListener(wtf.analysis.db.EventDatabase.EventType.ZONES_ADDED,
      function(zoneIndices) {
        goog.array.forEach(zoneIndices, this.addZoneTrack_, this);
      }, this);
  var zoneIndices = db.getZoneIndices();
  goog.array.forEach(zoneIndices, this.addZoneTrack_, this);

  var heatmapPainter = new wtf.app.ui.nav.HeatmapPainter(
      this.navbarCanvas_, db);
  this.painterStack_.addChildPainter(heatmapPainter);
  this.timePainters_.push(heatmapPainter);

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

  // Reset all painters on database change.
  db.addListener(wtf.events.EventType.INVALIDATED, function() {
    var firstEventTime = db.getFirstEventTime();
    var lastEventTime = db.getLastEventTime();
    for (var n = 0; n < this.timePainters_.length; n++) {
      this.timePainters_[n].setTimeRange(firstEventTime, lastEventTime);
    }
    this.requestRepaint();
  }, this);

  this.requestRepaint();
};
goog.inherits(wtf.app.ui.nav.Navbar, wtf.ui.ResizableControl);


/**
 * Minimum height of the navbar, in pixels.
 * @type {number}
 * @const
 */
wtf.app.ui.nav.Navbar.MIN_HEIGHT = 80;


/**
 * Maximum height of the navbar, in pixels.
 * @type {number}
 * @const
 */
wtf.app.ui.nav.Navbar.MAX_HEIGHT = 400;


/**
 * Minimum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.nav.Navbar.MIN_GRANULARITY_ =
    100 * wtf.analysis.db.Granularity.SECOND;


/**
 * Maximum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.nav.Navbar.MAX_GRANULARITY_ =
    0.001;


/**
 * @override
 */
wtf.app.ui.nav.Navbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.nav.navbar.control, undefined, undefined, dom));
};


/**
 * Adds a new zone track for the given zone index.
 * @param {!wtf.analysis.db.ZoneIndex} zoneIndex Zone index to add the track
 *     for.
 * @private
 */
wtf.app.ui.nav.Navbar.prototype.addZoneTrack_ = function(zoneIndex) {
  var zonePainterStack = new wtf.ui.Painter(this.navbarCanvas_);
  this.zonePainterStack_.addChildPainter(zonePainterStack);
  zonePainterStack.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);

  var timelinePainter = new wtf.app.ui.nav.TimelinePainter(
      this.navbarCanvas_, this.db_, zoneIndex);
  zonePainterStack.addChildPainter(timelinePainter);
  this.timePainters_.push(timelinePainter);

  var framePainter = new wtf.app.ui.FramePainter(
      this.navbarCanvas_, this.db_, zoneIndex.getFrameIndex());
  zonePainterStack.addChildPainter(framePainter);
  this.timePainters_.push(framePainter);
};
