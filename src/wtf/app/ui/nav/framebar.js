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
goog.require('goog.string');
goog.require('goog.style');
goog.require('wtf.analysis.db.Granularity');
goog.require('wtf.app.ui.nav.FramebarPainter');
goog.require('wtf.app.ui.nav.HeatmapPainter');
goog.require('wtf.app.ui.nav.framebar');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
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
      this.getChildElement(goog.getCssName('wtfAppUiFramebarCanvas')));

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
   * A list of all paint contexts that extend {@see wtf.ui.TimeRangePainter}.
   * This is used to update all of the painters when the current time range
   * changes.
   * @type {!Array.<!wtf.ui.TimeRangePainter>}
   * @private
   */
  this.timeRangePainters_ = [];

  var gridPainter = new wtf.ui.GridPainter(this.framebarCanvas_);
  paintContext.addChildPainter(gridPainter);
  gridPainter.setGranularities(
      wtf.app.ui.nav.Framebar.MIN_GRANULARITY_,
      wtf.app.ui.nav.Framebar.MAX_GRANULARITY_);
  this.timeRangePainters_.push(gridPainter);

  var framebarPainter = new wtf.app.ui.nav.FramebarPainter(
      this.framebarCanvas_, db);
  paintContext.addChildPainter(framebarPainter);
  this.timeRangePainters_.push(framebarPainter);

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
          painter.setTimeRange(0, timeLeft, timeRight);
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

  this.setupKeyboardShortcuts_();

  this.requestRepaint();
};
goog.inherits(wtf.app.ui.nav.Framebar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.nav.Framebar.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  commandManager.unregisterCommand('goto_frame');
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.ui.nav.Framebar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.nav.framebar.control, undefined, undefined, dom));
};


// TODO(benvanik): move to the document view
/**
 * Sets up some simple keyboard shortcuts.
 * @private
 */
wtf.app.ui.nav.Framebar.prototype.setupKeyboardShortcuts_ = function() {
  var dom = this.getDom();
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addShortcut('space', function() {
    var width = this.viewport_.getScreenWidth();
    this.viewport_.panDelta((width * 0.8) / this.viewport_.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('shift+space', function() {
    var width = this.viewport_.getScreenWidth();
    this.viewport_.panDelta(-(width * 0.8) / this.viewport_.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('left|a', function() {
    this.viewport_.panDelta(-40 / this.viewport_.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('right|d', function() {
    this.viewport_.panDelta(40 / this.viewport_.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('shift+left|shift+a', function() {
    this.viewport_.panDelta(-160 / this.viewport_.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('shift+right|shift+d', function() {
    this.viewport_.panDelta(160 / this.viewport_.getScale(), 0);
  }, this);
  keyboardScope.addShortcut('up|w', function() {
    this.viewport_.zoomDelta(2.5);
  }, this);
  keyboardScope.addShortcut('down|s', function() {
    this.viewport_.zoomDelta(1 / 2.5);
  }, this);
  keyboardScope.addShortcut('home', function() {
    var firstEventTime = this.db_.getFirstEventTime();
    var lastEventTime = this.db_.getLastEventTime();
    this.viewport_.zoomToBounds(
        -1000, 0, lastEventTime - firstEventTime + 2000, 1);
  }, this);

  var commandManager = wtf.events.getCommandManager();
  commandManager.registerSimpleCommand(
      'goto_frame', function(source, target, frameNumber) {
        // Go to frame.
        // TODO(benvanik): move to document view?
        var frameIndex = this.db_.getEventIndex('timing.frameEnd');
        if (frameIndex) {
          frameIndex.forEach(0, Number.MAX_VALUE, function(e) {
            if (e.args['number'] == frameNumber) {
              var firstEventTime = this.db_.getFirstEventTime();
              var timeStart = e.time - e.args['duration'] / 1000;
              var timeEnd = e.time;
              this.viewport_.zoomToBounds(
                  timeStart - firstEventTime, 0, timeEnd - timeStart, 1);
            }
          }, this);
        }
      }, this);
  keyboardScope.addShortcut('ctrl+g', function() {
    var result;
    try {
      keyboard.suspend();
      result = goog.global.prompt('Frame number:');
    } finally {
      keyboard.resume();
    }
    if (!result) {
      return;
    }
    result = goog.string.toNumber(result);
    if (result === NaN) {
      return;
    }

    commandManager.execute('goto_frame', this, null, result);
  }, this);
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
