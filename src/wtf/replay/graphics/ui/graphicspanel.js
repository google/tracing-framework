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

goog.require('goog.dom');
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
goog.require('wtf.timing');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.ErrorDialog');
goog.require('wtf.ui.ResizableControl');



/**
 * Graphics control panel.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @param {!wtf.db.EventList} eventList Event list for an entire animation.
 * @param {!Element} parentElement The parent element.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.GraphicsPanel = function(
    playback, eventList, parentElement, opt_domHelper) {
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
   * The toolbar for the graphics panel. Has widgets such as main buttons.
   * @type {!wtf.replay.graphics.ui.GraphicsToolbar}
   * @private
   */
  this.toolbar_ = new wtf.replay.graphics.ui.GraphicsToolbar(
      this.getChildElement(goog.getCssName('toolbar')),
      playback, this.loadDeferred_, this.getDom());
  this.registerDisposable(this.toolbar_);

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
  this.mainSplitter_ = new wtf.ui.ResizableControl(
      wtf.ui.ResizableControl.Orientation.VERTICAL,
      goog.getCssName('graphicsReplayMainSplitter'),
      this.getChildElement(
          goog.getCssName('graphicsReplayStepEventNavigation')),
      this.getDom());
  this.registerDisposable(this.mainSplitter_);
  this.mainSplitter_.setSplitterLimits(300, undefined);
  this.mainSplitter_.addListener(
      wtf.ui.ResizableControl.EventType.SIZE_CHANGED,
      this.layout, this);

  /**
   * For resizing the event navigator.
   * @type {!wtf.replay.graphics.ui.EventNavigator}
   * @private
   */
  this.eventNavigator_ = new wtf.replay.graphics.ui.EventNavigator(
      this.playback_, eventList, this.getChildElement(
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

  /**
   * A button for toggling whether canvases should be resized to fit.
   * @type {!Element}
   * @private
   */
  this.toggleResizeCanvasesButton_ = this.getChildElement(
      goog.getCssName('resizeCanvasesToFitButton'));
  this.getHandler().listen(
      this.toggleResizeCanvasesButton_,
      goog.events.EventType.CLICK,
      this.toggleResizeCanvases_, false, this);
  this.toggleResizeCanvases_();

  // Initial layout once the DOM is ready.
  wtf.timing.setImmediate(function() {
    this.layout();
  }, this);
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
 * @override
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.layoutInternal = function() {
  var rightHandSide =
      this.getChildElement(goog.getCssName('graphicsReplayMainDisplay'));
  goog.style.setStyle(
      rightHandSide,
      'left',
      this.mainSplitter_.getSplitterSize() + 'px');

  this.eventNavigator_.layout();
  this.canvasesArea_.layout();
};


/**
 * Creates a range seeker for steps.
 * @return {!wtf.replay.graphics.ui.RangeSeeker} A range seeker.
 * @private
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.createRangeSeeker_ =
    function() {
  var playback = this.playback_;

  var frameTimeVisualizer =
      /** @type {wtf.replay.graphics.FrameTimeVisualizer} */ (
      playback.getVisualizer('frameTime'));

  var slider = new wtf.replay.graphics.ui.RangeSeeker(
      0, playback.getStepCount() - 1,
      this.getChildElement(goog.getCssName('rangeSeeker')),
      this.getDom(), frameTimeVisualizer);

  // Enable the slider only after the playback has loaded.
  this.loadDeferred_.addCallback(function() {
    slider.setEnabled(true);
  });

  // If the playback is updated, update the slider.
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      function() {
        slider.setValue(playback.getCurrentStepIndex());

        if (!playback.isPlaying()) {
          this.dispatchSeekToFrame_();
        }
      }, this);
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
      function() {
        this.dispatchSeekToFrame_();
      }, this);

  // If the slider is updated, update the playback.
  slider.addListener(
      wtf.replay.graphics.ui.RangeSeeker.EventType.VALUE_CHANGED,
      function() {
        playback.seekStep(slider.getValue());
      }, this);

  return slider;
};


/**
 * Seeks to the frame representing the current step.
 * @private
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.dispatchSeekToFrame_ =
    function() {
  var playback = this.playback_;
  var step = playback.getCurrentStep();
  if (!step) {
    return;
  }

  var commandManager = wtf.events.getCommandManager();
  if (!commandManager) {
    return;
  }

  if (step.getFrame()) {
    commandManager.execute('goto_frame', this, null, step.getFrame(), true);
  } else {
    var it = step.getEventIterator();
    var timeLeft = it.getTime();
    it.seek(it.getCount() - 1);
    var timeRight = it.getTime();
    commandManager.execute('goto_range', this, null, timeLeft, timeRight, true);
  }
};


/**
 * Toggles the resize canvas mode.
 * @private
 */
wtf.replay.graphics.ui.GraphicsPanel.prototype.toggleResizeCanvases_ =
    function() {
  var newValue = !this.canvasesArea_.getResizeCanvasesToFit();
  this.canvasesArea_.setResizeCanvasesToFit(newValue);
  var button = this.toggleResizeCanvasesButton_;
  if (newValue) {
    goog.dom.setTextContent(button, 'Use Real Sizes');
  } else {
    goog.dom.setTextContent(button, 'Resize to Fit');
  }
};
