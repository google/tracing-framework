/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Graphics panel control.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.GraphicsPanel');

goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.events');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.ui.CanvasesArea');
goog.require('wtf.replay.graphics.ui.EventNavigator');
goog.require('wtf.replay.graphics.ui.GraphicsToolbar');
goog.require('wtf.replay.graphics.ui.RangeSeeker');
goog.require('wtf.replay.graphics.ui.graphicsPanel');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.ErrorDialog');
goog.require('wtf.ui.ResizableControl');



/**
 * Graphics control panel.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @param {!Element} parentElement The parent element.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.GraphicsPanel = function(
    playback, parentElement, opt_domHelper) {
  goog.base(this, parentElement, opt_domHelper);

  /**
   * The current playback.
   * @type {!wtf.replay.graphics.Playback}
   * @private
   */
  this.playback_ = playback;

  /**
   * A deferred denoting if the playback has loaded.
   * @type {!goog.async.Deferred}
   * @private
   */
  this.loadDeferred_ = this.playback_.load();
  this.loadDeferred_.addErrback(this.handleLoadError_, this);

  /**
   * The viewport size monitor.
   * @type {!goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.viewportSizeMonitor_ = wtf.events.acquireViewportSizeMonitor();
  this.getHandler().listen(
      this.viewportSizeMonitor_,
      goog.events.EventType.RESIZE, this.layout, false, this);

  /**
   * A place where buttons for controlling playback reside.
   * @type {!wtf.replay.graphics.ui.GraphicsToolbar}
   * @private
   */
  this.buttons_ = new wtf.replay.graphics.ui.GraphicsToolbar(
      this.getChildElement(goog.getCssName('graphicsReplayToolbarContainer')),
      playback, this.loadDeferred_, this.getDom());
  this.registerDisposable(this.buttons_);

  /**
   * A slider for seeking quickly.
   * @type {!wtf.replay.graphics.ui.RangeSeeker}
   * @private
   */
  this.rangeSlider_ = this.createRangeSeeker_();
  this.registerDisposable(this.rangeSlider_);

  /**
   * The main resizable section divided by a splitter.
   * @type {!wtf.ui.ResizableControl}
   * @private
   */
  this.mainSplitSection_ = this.createMainSplitSection_();
  this.registerDisposable(this.mainSplitSection_);

  /**
   * For resizing the event navigator.
   * @type {!wtf.replay.graphics.ui.EventNavigator}
   * @private
   */
  this.eventNavigator_ = new wtf.replay.graphics.ui.EventNavigator(
      this.playback_, this.getChildElement(
          goog.getCssName('graphicsReplayEventNavigatorContainer')),
      this.getDom());
  this.registerDisposable(this.eventNavigator_);

  // Enable the event navigator only after the playback has loaded.
  this.loadDeferred_.addCallback(function() {
    this.eventNavigator_.setReady();
  }, this);

  /**
   * A place where canvases can be displayed.
   * @type {!wtf.replay.graphics.ui.CanvasesArea}
   * @private
   */
  this.canvasesArea_ = new wtf.replay.graphics.ui.CanvasesArea(
      this.playback_, this.getChildElement(
          goog.getCssName('graphicsReplayMainDisplay')), this.getDom());
  this.registerDisposable(this.canvasesArea_);

  // Listens to updates from the toolbar.
  this.listenToToolbarUpdates_();
};
goog.inherits(wtf.replay.graphics.ui.GraphicsPanel, wtf.ui.Control);


/**
 * @override
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.disposeInternal = function() {
  wtf.events.releaseViewportSizeMonitor(this.viewportSizeMonitor_);
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.graphicsPanel.controller,
      undefined, undefined, dom));
};


/**
 * Handles what happens if loading the playback fails.
 * @param {!Error} error The loading error.
 * @private
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.handleLoadError_ = function(
    error) {
  var dialogTitle = 'Loading Error';
  var dialogDetails = error.message;
  wtf.ui.ErrorDialog.show(dialogTitle, dialogDetails, this.getDom());
};


/**
 * Listens to updates from the toolbar.
 * @private
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.listenToToolbarUpdates_ =
    function() {
  this.buttons_.addListener(
      wtf.replay.graphics.ui.GraphicsToolbar.EventType.MANUAL_SUB_STEP_SEEK,
      function() {
        this.eventNavigator_.updateScrolling(this.playback_);
      }, this);
};


/**
 * Lays out the UI.
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.layout = function() {
  this.eventNavigator_.layout();
};


/**
 * Creates the main split section below the toolbar.
 * @return {!wtf.ui.ResizableControl} The resizable control.
 * @private
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.createMainSplitSection_ =
    function() {
  var splitter = new wtf.ui.ResizableControl(
      wtf.ui.ResizableControl.Orientation.VERTICAL,
      goog.getCssName('graphicsReplayMainSplitter'),
      this.getChildElement(
          goog.getCssName('graphicsReplayStepEventNavigation')),
      this.getDom());
  splitter.setSplitterLimits(300, undefined);
  splitter.setSplitterSize(300);
  var rightHandSide =
      this.getChildElement(goog.getCssName('graphicsReplayMainDisplay'));
  splitter.addListener(
      wtf.ui.ResizableControl.EventType.SIZE_CHANGED,
      function() {
        goog.style.setStyle(
            rightHandSide,
            'left',
            splitter.getSplitterSize() + 'px');
        this.eventNavigator_.layout();
      }, this);
  return splitter;
};


/**
 * Creates a range seeker for steps.
 * @return {!wtf.replay.graphics.ui.RangeSeeker} A range seeker.
 * @private
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.createRangeSeeker_ =
    function() {
  var playback = this.playback_;
  var slider = new wtf.replay.graphics.ui.RangeSeeker(
      0, playback.getStepCount() - 1,
      this.getChildElement(
          goog.getCssName('graphicsReplayRangeSeekerContainer')),
      this.getDom());

  // Enable the slider only after the playback has loaded.
  this.loadDeferred_.addCallback(function() {
    slider.setEnabled(true);
  });

  // If the playback is updated, update the slider.
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      function() {
        slider.setValue(playback.getCurrentStepIndex());
      });

  // If the slider is updated, update the playback.
  slider.addListener(
      wtf.replay.graphics.ui.RangeSeeker.EventType.VALUE_CHANGED,
      function() {
        playback.seekStep(slider.getValue());
      });

  return slider;
};
