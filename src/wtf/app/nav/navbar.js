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

goog.provide('wtf.app.nav.Navbar');

goog.require('goog.array');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.math');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.FramePainter');
goog.require('wtf.app.Granularity');
goog.require('wtf.app.MarkPainter');
goog.require('wtf.app.nav.FpsStatsBox');
goog.require('wtf.app.nav.GcStatsBox');
goog.require('wtf.app.nav.HeatmapPainter');
goog.require('wtf.app.nav.TimelinePainter');
goog.require('wtf.app.nav.navbar');
goog.require('wtf.db.Database');
goog.require('wtf.db.PresentationHint');
goog.require('wtf.events.EventType');
goog.require('wtf.events.ListEventType');
goog.require('wtf.math');
goog.require('wtf.ui.GridPainter');
goog.require('wtf.ui.LayoutMode');
goog.require('wtf.ui.Painter');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.RulerPainter');
goog.require('wtf.ui.Tooltip');



/**
 * Navigation bar control.
 *
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.ResizableControl}
 */
wtf.app.nav.Navbar = function(documentView, parentElement) {
  var dom = documentView.getDom();
  goog.base(this,
      wtf.ui.ResizableControl.Orientation.HORIZONTAL,
      goog.getCssName('navbarSplitter'),
      parentElement, dom);
  this.setSplitterLimits(wtf.app.nav.Navbar.MIN_HEIGHT, undefined);

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  /**
   * Parent document view.
   * @type {!wtf.app.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Whether the navbar is enabled.
   * Some data sources disable us because they have nothing interesting to show.
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;
  var dataSources = db.getSources();
  for (var n = 0; n < dataSources.length; n++) {
    var presentationHints = dataSources[n].getPresentationHints();
    // If any datasource is not bare, show the UI.
    if (!(presentationHints & wtf.db.PresentationHint.BARE)) {
      this.enabled_ = true;
    }
  }
  if (!this.enabled_) {
    this.setSplitterLimits(0, undefined);
    this.setSplitterSize(0);
    return;
  }

  /**
   * Navbar canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.navbarCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('canvas')));

  // Create a tooltip.
  this.setTooltip(new wtf.ui.Tooltip(dom));

  /**
   * Statistics boxes.
   * @type {!Array.<!wtf.app.nav.StatsBox>}
   * @private
   */
  this.statsBoxes_ = [];
  var boxes = this.getChildElement(goog.getCssName('boxes'));
  this.statsBoxes_.push(new wtf.app.nav.FpsStatsBox(db, boxes, dom));
  this.statsBoxes_.push(new wtf.app.nav.GcStatsBox(db, boxes, dom));
  goog.array.forEach(this.statsBoxes_, this.registerDisposable, this);

  var paintContext = new wtf.ui.Painter(this.navbarCanvas_);
  this.setPaintContext(paintContext);

  // Clicking on non-handled space will center the viewport there.
  paintContext.setDefaultClickHandler(function(x, y, modifiers, bounds) {
    var localView = this.documentView_.getLocalView();
    var timeStart = localView.getVisibleTimeStart();
    var timeEnd = localView.getVisibleTimeEnd();
    var duration = timeEnd - timeStart;

    var width = this.painterStack_.getScaledCanvasWidth();
    var time = wtf.math.remap(x,
        0, width,
        this.db_.getFirstEventTime(), this.db_.getLastEventTime());

    localView.setVisibleRange(time - duration / 2, time + duration / 2);

    return true;
  }, this);

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
      wtf.app.nav.Navbar.MIN_GRANULARITY_,
      wtf.app.nav.Navbar.MAX_GRANULARITY_);
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
      wtf.app.nav.Navbar.MIN_GRANULARITY_,
      wtf.app.nav.Navbar.MAX_GRANULARITY_);
  this.timePainters_.push(this.rulerPainter_);

  /**
   * Vertical stack of painters for zone painters.
   * @type {!wtf.ui.Painter}
   * @private
   */
  this.zonePainterStack_ = new wtf.ui.Painter(this.navbarCanvas_);
  this.painterStack_.addChildPainter(this.zonePainterStack_);
  this.zonePainterStack_.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);

  // Watch for zones and add as needed.
  db.addListener(wtf.db.Database.EventType.ZONES_ADDED, function(zones) {
    goog.array.forEach(zones, this.addZoneTrack_, this);
  }, this);
  var zones = db.getZones();
  goog.array.forEach(zones, this.addZoneTrack_, this);

  var heatmapPainter = new wtf.app.nav.HeatmapPainter(
      this.navbarCanvas_, db);
  this.painterStack_.addChildPainter(heatmapPainter);
  this.timePainters_.push(heatmapPainter);

  // Hook the view list and bind to all existing views to track updates.
  // This allows us to show where each view is looking.
  var viewList = doc.getViewList();
  viewList.forEach(function(view) {
    this.setupView_(/** @type {!wtf.doc.View} */ (view));
  }, this);
  viewList.addListener(
      wtf.events.ListEventType.VALUES_ADDED,
      function(values) {
        for (var n = 0; n < values.length; n++) {
          this.setupView_(values[n]);
        }
      }, this);
  // TODO(benvanik): remove view widget when the view is removed.

  // Reset all painters on database change.
  db.addListener(
      wtf.events.EventType.INVALIDATED, this.databaseInvalidated_, this);
  this.databaseInvalidated_();

  this.requestRepaint();
};
goog.inherits(wtf.app.nav.Navbar, wtf.ui.ResizableControl);


/**
 * Minimum height of the navbar, in pixels.
 * @type {number}
 * @const
 */
wtf.app.nav.Navbar.MIN_HEIGHT = 80;


/**
 * Maximum height of the navbar, in pixels.
 * @type {number}
 * @const
 */
wtf.app.nav.Navbar.MAX_HEIGHT = 400;


/**
 * Minimum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.nav.Navbar.MIN_GRANULARITY_ =
    100 * wtf.app.Granularity.SECOND;


/**
 * Maximum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.nav.Navbar.MAX_GRANULARITY_ =
    0.001;


/**
 * @override
 */
wtf.app.nav.Navbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.nav.navbar.control, undefined, undefined, dom));
};


/**
 * Handles database invalidations.
 * @private
 */
wtf.app.nav.Navbar.prototype.databaseInvalidated_ = function() {
  var db = this.db_;
  var firstEventTime = db.getFirstEventTime();
  var lastEventTime = db.getLastEventTime();
  for (var n = 0; n < this.timePainters_.length; n++) {
    var painter = this.timePainters_[n];
    painter.setTimeRange(firstEventTime, lastEventTime);
    painter.setUnits(db.getUnits());
  }
  this.requestRepaint();
};


/**
 * Adds a new zone track for the given zone index.
 * @param {!wtf.db.Zone} zone Zone to add the track for.
 * @private
 */
wtf.app.nav.Navbar.prototype.addZoneTrack_ = function(zone) {
  var zonePainterStack = new wtf.ui.Painter(this.navbarCanvas_);
  this.zonePainterStack_.addChildPainter(zonePainterStack);
  zonePainterStack.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);

  var markPainter = new wtf.app.MarkPainter(
      this.navbarCanvas_, zone.getMarkList());
  zonePainterStack.addChildPainter(markPainter);
  this.timePainters_.push(markPainter);

  var timelinePainter = new wtf.app.nav.TimelinePainter(
      this.navbarCanvas_, this.db_, zone);
  zonePainterStack.addChildPainter(timelinePainter);
  this.timePainters_.push(timelinePainter);

  var framePainter = new wtf.app.FramePainter(
      this.navbarCanvas_, this.db_, zone.getFrameList());
  zonePainterStack.addChildPainter(framePainter);
  this.timePainters_.push(framePainter);
};


/**
 * Sets up a new view hover region.
 * @param {!wtf.doc.View} view View.
 * @private
 */
wtf.app.nav.Navbar.prototype.setupView_ = function(view) {
  var dom = this.getDom();
  var overlayEl = this.getChildElement(goog.getCssName('canvasOverlay'));

  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(el, goog.getCssName('view'));
  dom.appendChild(overlayEl, el);

  view.addListener(wtf.events.EventType.INVALIDATED, function() {
    var timeLeft = view.getVisibleTimeStart();
    var timeRight = view.getVisibleTimeEnd();

    var width = this.painterStack_.getScaledCanvasWidth();
    var left = wtf.math.remap(timeLeft,
        this.db_.getFirstEventTime(), this.db_.getLastEventTime(),
        0, width);
    left = goog.math.clamp(left, 0, width);
    var right = wtf.math.remap(timeRight,
        this.db_.getFirstEventTime(), this.db_.getLastEventTime(),
        0, width);
    right = goog.math.clamp(right, 0, width);
    goog.style.setStyle(el, {
      'left': left + 'px',
      'width': Math.max(1, right - left) + 'px'
    });
  }, this);
};


/**
 * @override
 */
wtf.app.nav.Navbar.prototype.layoutInternal = function() {
  goog.base(this, 'layoutInternal');

  if (!this.enabled_) {
    return;
  }

  // Update children.
  for (var n = 0; n < this.statsBoxes_.length; n++) {
    this.statsBoxes_[n].layout();
  }

  // Invalidate all views to update their positions.
  var doc = this.documentView_.getDocument();
  var viewList = doc.getViewList();
  viewList.forEach(function(view) {
    view.invalidate();
  }, this);
};
