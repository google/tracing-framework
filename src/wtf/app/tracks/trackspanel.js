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

goog.provide('wtf.app.tracks.TracksPanel');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.FramePainter');
goog.require('wtf.app.Granularity');
goog.require('wtf.app.MarkPainter');
goog.require('wtf.app.SelectionPainter');
goog.require('wtf.app.TabPanel');
goog.require('wtf.app.tracks.TimeRangePainter');
goog.require('wtf.app.tracks.TrackInfoBar');
goog.require('wtf.app.tracks.ZonePainter');
goog.require('wtf.app.tracks.trackspanel');
goog.require('wtf.db.Database');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.timing');
goog.require('wtf.ui.GridPainter');
goog.require('wtf.ui.LayoutMode');
goog.require('wtf.ui.Painter');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.RulerPainter');
goog.require('wtf.ui.Tooltip');
goog.require('wtf.ui.zoom.TransitionMode');
goog.require('wtf.ui.zoom.Viewport');



/**
 * Tracks panel, showing a list of tracks on a time graph.
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @constructor
 * @extends {wtf.app.TabPanel}
 */
wtf.app.tracks.TracksPanel = function(documentView) {
  goog.base(this, documentView, 'tracks', 'Tracks');
  var dom = this.getDom();

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  /**
   * Database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Infobar control.
   * @type {!wtf.app.tracks.TrackInfoBar}
   * @private
   */
  this.infobar_ = new wtf.app.tracks.TrackInfoBar(this,
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
      1000 / wtf.app.tracks.TracksPanel.MIN_GRANULARITY_ / 100,
      1000 / wtf.app.tracks.TracksPanel.MAX_GRANULARITY_);
  var reentry = 0;
  this.viewport_.addListener(wtf.events.EventType.INVALIDATED, function() {
    if (reentry) {
      return;
    }
    reentry++;
    this.viewportChanged_();
    reentry--;
  }, this);
  // TODO(benvanik): set to something larger to get more precision.
  this.viewport_.setSceneSize(1, 1);

  // Watch for view changes and update.
  var localView = documentView.getLocalView();
  localView.addListener(wtf.events.EventType.INVALIDATED, function(immediate) {
    if (reentry) {
      return;
    }

    var firstEventTime = db.getFirstEventTime();
    var startTime = localView.getVisibleTimeStart() - firstEventTime;
    var endTime = localView.getVisibleTimeEnd() - firstEventTime - startTime;
    this.viewport_.zoomToBounds(
        startTime, 0, endTime, 0.001,
        immediate ? wtf.ui.zoom.TransitionMode.IMMEDIATE : undefined);
  }, this);

  // Setup keyboard hooks. These are only valid when the panel is active.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  /**
   * Keyboard scope.
   * @type {!wtf.events.KeyboardScope}
   * @private
   */
  this.keyboardScope_ = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(this.keyboardScope_);
  this.setupKeyboardShortcuts_();

  /**
   * Track canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.trackCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('tracksCanvas')));

  var tooltip = new wtf.ui.Tooltip(this.getDom());
  this.registerDisposable(tooltip);
  this.setTooltip(tooltip);

  var paintContext = new wtf.ui.Painter(this.trackCanvas_);
  this.setPaintContext(paintContext);
  this.setScrollablePaintContext(true);

  // Clicking on non-handled space will clear the filter.
  var commandManager = wtf.events.getCommandManager();
  paintContext.setDefaultClickHandler(function(x, y, modifiers, bounds) {
    commandManager.execute('filter_events', this, null, '');
  }, this);

  /**
   * A list of all paint contexts that extend {@see wtf.ui.TimePainter}.
   * This is used to update all of the painters when the current time range
   * changes.
   * @type {!Array.<!wtf.ui.TimePainter>}
   * @private
   */
  this.timePainters_ = [];

  var gridPainter = new wtf.ui.GridPainter(this.trackCanvas_);
  paintContext.addChildPainter(gridPainter);
  gridPainter.setGranularities(
      wtf.app.tracks.TracksPanel.MIN_GRANULARITY_,
      wtf.app.tracks.TracksPanel.MAX_GRANULARITY_);
  this.timePainters_.push(gridPainter);

  /**
   * Selection painter.
   * @type {!wtf.app.SelectionPainter}
   * @private
   */
  this.selectionPainter_ = new wtf.app.SelectionPainter(
      this.trackCanvas_, documentView.getSelection(), this.viewport_);
  paintContext.addChildPainter(this.selectionPainter_);
  this.timePainters_.push(this.selectionPainter_);

  /**
   * Vertical stack of painters that make up the main view.
   * @type {!wtf.ui.Painter}
   * @private
   */
  this.painterStack_ = new wtf.ui.Painter(this.trackCanvas_);
  paintContext.addChildPainter(this.painterStack_);
  this.painterStack_.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);

  /**
   * Ruler painter.
   * @type {!wtf.ui.RulerPainter}
   * @private
   */
  this.rulerPainter_ = new wtf.ui.RulerPainter(this.trackCanvas_);
  this.painterStack_.addChildPainter(this.rulerPainter_);
  this.rulerPainter_.setGranularities(
      wtf.app.tracks.TracksPanel.MIN_GRANULARITY_,
      wtf.app.tracks.TracksPanel.MAX_GRANULARITY_);
  this.timePainters_.push(this.rulerPainter_);

  // Watch for zones and add as needed.
  db.addListener(wtf.db.Database.EventType.ZONES_ADDED, function(zones) {
    goog.array.forEach(zones, this.addZoneTrack_, this);
  }, this);
  var zones = db.getZones();

  // Right now, this will ensure that worker zones (which don't have frames) are
  // on the top. This is arbitrary, but main thread tracks tend to be deeper, so
  // it seems reasonable to put that on the bottom.
  goog.array.sort(zones, function(zoneA, zoneB) {
    return goog.array.defaultCompare(
        zoneA.getFrameList().getCount(),
        zoneB.getFrameList().getCount());
  });
  goog.array.forEach(zones, this.addZoneTrack_, this);

  // Done last so any other handlers are properly registered.
  this.viewport_.registerElement(this.trackCanvas_);

  wtf.timing.setImmediate(this.layout, this);
  this.requestRepaint();
};
goog.inherits(wtf.app.tracks.TracksPanel, wtf.app.TabPanel);


/**
 * @override
 */
wtf.app.tracks.TracksPanel.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.tracks.trackspanel.control, undefined, undefined, dom));
};


/**
 * Sets up some simple keyboard shortcuts.
 * @private
 */
wtf.app.tracks.TracksPanel.prototype.setupKeyboardShortcuts_ = function() {
  var db = this.db_;
  var viewport = this.viewport_;

  var commandManager = wtf.events.getCommandManager();
  var keyboardScope = this.keyboardScope_;

  keyboardScope.addShortcut('space', function() {
    var width = viewport.getScreenWidth();
    viewport.panDelta((width * 0.8) / viewport.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('shift+space', function() {
    var width = viewport.getScreenWidth();
    viewport.panDelta(-(width * 0.8) / viewport.getScale(), 0);
  }, this);

  function moveFrames(delta, framesOnly) {
    // Find a frame list.
    var frameList = db.getFirstFrameList();
    if (!frameList) {
      return;
    }

    // Find center time.
    var time = viewport.screenToScene(viewport.getScreenWidth() / 2, 0).x;
    time += db.getFirstEventTime();

    // Find the frame at the center of the viewport.
    var hit = frameList.getFrameAtTime(time);
    if (hit) {
      // Frame, move to adjacent intra-frame space or frame.
      if (framesOnly) {
        var newFrame;
        if (delta < 0) {
          newFrame = frameList.getPreviousFrame(hit);
        } else {
          newFrame = frameList.getNextFrame(hit);
        }
        commandManager.execute('goto_frame', this, null, newFrame);
      } else {
        var startTime;
        var endTime;
        if (delta < 0) {
          var otherFrame = frameList.getPreviousFrame(hit);
          startTime = otherFrame ?
              otherFrame.getEndTime() : db.getFirstEventTime();
          endTime = hit.getTime();
        } else {
          var otherFrame = frameList.getNextFrame(hit);
          startTime = hit.getEndTime();
          endTime = otherFrame ?
              otherFrame.getTime() : db.getLastEventTime();
        }
        commandManager.execute('goto_range', this, null, startTime, endTime);
      }
    } else {
      // If in a intra-frame space, move to a frame.
      hit = frameList.getIntraFrameAtTime(time);
      if (hit) {
        var newFrame = delta < 0 ? hit[0] : hit[1];
        commandManager.execute('goto_frame', this, null, newFrame);
      }
    }
  };
  keyboardScope.addShortcut('z', function() {
    moveFrames(-1, true);
  }, this);
  keyboardScope.addShortcut('x', function() {
    moveFrames(1, true);
  }, this);
  keyboardScope.addShortcut('shift+z', function() {
    moveFrames(-1, false);
  }, this);
  keyboardScope.addShortcut('shift+x', function() {
    moveFrames(1, false);
  }, this);

  keyboardScope.addShortcut('left|a', function() {
    viewport.panDelta(-160 / viewport.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('right|d', function() {
    viewport.panDelta(160 / viewport.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('shift+left|shift+a', function() {
    viewport.panDelta(-160 * 3 / viewport.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('shift+right|shift+d', function() {
    viewport.panDelta(160 * 3 / viewport.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('up|w', function() {
    viewport.zoomDelta(2.5);
  }, this);
  keyboardScope.addShortcut('down|s', function() {
    viewport.zoomDelta(1 / 2.5);
  }, this);

  keyboardScope.addShortcut('home', function() {
    var firstEventTime = db.getFirstEventTime();
    var lastEventTime = db.getLastEventTime();
    commandManager.execute('goto_range', this, null,
        firstEventTime, lastEventTime);
  }, this);
};


/**
 * Minimum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.tracks.TracksPanel.MIN_GRANULARITY_ =
    100 * wtf.app.Granularity.SECOND;


/**
 * Maximum granularity, in ms.
 * @const
 * @type {number}
 * @private
 */
wtf.app.tracks.TracksPanel.MAX_GRANULARITY_ =
    0.001;


/**
 * @override
 */
wtf.app.tracks.TracksPanel.prototype.setVisible = function(value) {
  goog.base(this, 'setVisible', value);
  this.keyboardScope_.setEnabled(value);
};


/**
 * @override
 */
wtf.app.tracks.TracksPanel.prototype.navigate = function(pathParts) {
  // TODO(benvanik): support navigation
};


/**
 * @override
 */
wtf.app.tracks.TracksPanel.prototype.layoutInternal = function() {
  var canvas = this.trackCanvas_;
  var canvasOuter = goog.dom.getParentElement(canvas);

  var infobarWidth = this.infobar_.getSplitterSize();
  goog.style.setStyle(canvasOuter, 'margin-right', (infobarWidth + 2) + 'px');

  var currentSize = goog.style.getSize(canvasOuter);
  this.viewport_.setScreenSize(currentSize.width, currentSize.height);

  this.infobar_.layout();
};


/**
 * Handles viewport invalidations.
 * @private
 */
wtf.app.tracks.TracksPanel.prototype.viewportChanged_ = function() {
  var documentView = this.getDocumentView();
  var db = this.db_;

  var firstEventTime = db.getFirstEventTime();

  // Update from viewport.
  var width = this.viewport_.getScreenWidth();
  if (width <= 1) {
    return;
  }
  var timeLeft = this.viewport_.screenToScene(0, 0).x;
  var timeRight = this.viewport_.screenToScene(width, 0).x;
  timeLeft += firstEventTime;
  timeRight += firstEventTime;

  // Update the main view.
  // This will be ignored if our invalidation came from the view.
  var localView = documentView.getLocalView();
  localView.setVisibleRange(timeLeft, timeRight);

  // Reset painter time ranges.
  for (var n = 0; n < this.timePainters_.length; n++) {
    var painter = this.timePainters_[n];
    painter.setTimeRange(timeLeft, timeRight);
    painter.setUnits(db.getUnits());
  }

  // Update the tooltip, if it's visible.
  this.updateTooltip();

  this.requestRepaint();
};


/**
 * Adds a new zone track for the given zone.
 * @param {!wtf.db.Zone} zone Zone to add the tracks for.
 * @private
 */
wtf.app.tracks.TracksPanel.prototype.addZoneTrack_ = function(zone) {
  var zonePainterStack = new wtf.ui.Painter(this.trackCanvas_);
  this.painterStack_.addChildPainter(zonePainterStack);
  zonePainterStack.setLayoutMode(wtf.ui.LayoutMode.VERTICAL);
  zonePainterStack.setPadding(new goog.math.Rect(0, 0, 0, 5));

  var markPainter = new wtf.app.MarkPainter(
      this.trackCanvas_, zone.getMarkList());
  zonePainterStack.addChildPainter(markPainter);
  this.timePainters_.push(markPainter);

  var framePainter = new wtf.app.FramePainter(
      this.trackCanvas_, this.db_, zone.getFrameList());
  zonePainterStack.addChildPainter(framePainter);
  this.timePainters_.push(framePainter);
  framePainter.setPadding(new goog.math.Rect(0, 5, 0, 0));

  var timeRangePainter = new wtf.app.tracks.TimeRangePainter(
      this.trackCanvas_, zone.getTimeRangeList());
  zonePainterStack.addChildPainter(timeRangePainter);
  this.timePainters_.push(timeRangePainter);
  timeRangePainter.setPadding(new goog.math.Rect(0, 5, 0, 0));

  var docView = this.getDocumentView();
  var zonePainter = new wtf.app.tracks.ZonePainter(
      this.trackCanvas_, zone, docView.getSelection());
  zonePainterStack.addChildPainter(zonePainter);
  this.timePainters_.push(zonePainter);
  zonePainter.setPadding(new goog.math.Rect(0, 8, 0, 0));

  // Always fire a viewport change so that we update the time ranges/etc.
  this.viewportChanged_();
};
