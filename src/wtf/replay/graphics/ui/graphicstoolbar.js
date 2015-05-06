/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Toolbar control for graphics replay.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.GraphicsToolbar');

goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.events');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.replay.graphics.Experiment');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.ui.graphicsToolbar');
goog.require('wtf.ui.Control');



/**
 * Toolbar control for graphics replay.
 *
 * @param {!Element} parentElement The parent element.
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @param {!goog.async.Deferred} deferred The deferred that marks when the
 *     buttons for this toolbar can be activated.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.GraphicsToolbar = function(
    parentElement, playback, deferred, opt_domHelper) {
  goog.base(this, parentElement, opt_domHelper);

  /**
   * The playback.
   * @type {!wtf.replay.graphics.Playback}
   * @private
   */
  this.playback_ = playback;

  /**
   * Whether the UI is currently enabled.
   * Set by {@see #setReady_} and upon state change.
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;

  /**
   * The reset button.
   * @type {!Element}
   * @private
   */
  this.resetButton_ =
      this.getChildElement(goog.getCssName('resetButton'));

  /**
   * The backwards-1-step button.
   * @type {!Element}
   * @private
   */
  this.backButton_ =
      this.getChildElement(goog.getCssName('backButton'));

  /**
   * The play button.
   * @type {!Element}
   * @private
   */
  this.playButton_ =
      this.getChildElement(goog.getCssName('playButton'));

  /**
   * The forward button.
   * @type {!Element}
   * @private
   */
  this.forwardButton_ =
      this.getChildElement(goog.getCssName('forwardButton'));

  /**
   * The reset visualizers button.
   * @type {!Element}
   * @private
   */
  this.resetVisualizersButton_ =
      this.getChildElement(goog.getCssName('resetVisualizersButton'));

  /**
   * The current visualizer state.
   * @type {wtf.replay.graphics.Visualizer.State}
   * @private
   */
  this.currentVisualizerState_ = null;

  // Only enable this toolbar after the playback has loaded.
  deferred.addCallback(function() {
    this.setReady_();
  }, this);
};
goog.inherits(wtf.replay.graphics.ui.GraphicsToolbar, wtf.ui.Control);


/**
 * @override
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.graphicsToolbar.controller, {}, undefined, dom));
};


/**
 * Sets the toolbar as ready for use.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.setReady_ =
    function() {
  // If no steps to play, no need to enable toolbar.
  if (!this.playback_.getStepCount()) {
    return;
  }

  // Listen to events that change whether buttons are enabled.
  var playback = this.playback_;
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      function() {
        this.setEnabled_(true);
      }, this);
  playback.addListener(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
      function() {
        this.setPlayButtonState_(false);
        this.setEnabled_(true);
      }, this);
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.VISUALIZER_STATE_CHANGED,
      function() {
        this.currentVisualizerState_ =
            wtf.replay.graphics.Experiment.constructState(this.playback_);
        this.setEnabled_(true);
      }, this);
  this.setPlayButtonState_(false);

  // Handle button clicks.
  var eh = this.getHandler();
  eh.listen(
      this.resetButton_,
      goog.events.EventType.CLICK,
      this.resetClickHandler_, false, this);
  eh.listen(
      this.backButton_,
      goog.events.EventType.CLICK,
      this.backClickHandler_, false, this);
  eh.listen(
      this.playButton_,
      goog.events.EventType.CLICK,
      this.playClickHandler_, false, this);
  eh.listen(
      this.forwardButton_,
      goog.events.EventType.CLICK,
      this.forwardClickHandler_, false, this);
  eh.listen(
      this.resetVisualizersButton_,
      goog.events.EventType.CLICK,
      this.resetVisualizersClickHandler_, false, this);

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.getWindowKeyboard(this.getDom());
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addShortcut('ctrl+shift+left', function() {
    this.resetClickHandler_();
  }, this);
  keyboardScope.addShortcut('ctrl+left', function() {
    this.backClickHandler_();
  }, this);
  keyboardScope.addShortcut('ctrl+space', function() {
    this.playClickHandler_();
  }, this);
  keyboardScope.addShortcut('ctrl+right', function() {
    this.forwardClickHandler_();
  }, this);
  keyboardScope.addShortcut('c', function() {
    this.resetVisualizersClickHandler_();
  }, this);

  this.setEnabled_(true);
};


/**
 * Toggle all of the buttons and other UI elements on/off.
 * @param {boolean} enabled Whether the elements are enabled.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.setEnabled_ =
    function(enabled) {
  this.enabled_ = enabled;
  this.toggleButton(goog.getCssName('resetButton'), enabled);
  this.toggleButton(goog.getCssName('backButton'), this.canMoveBack_());
  this.toggleButton(goog.getCssName('playButton'), this.canPlay_());
  this.toggleButton(goog.getCssName('forwardButton'), this.canMoveForward_());
  this.toggleButton(goog.getCssName('resetVisualizersButton'),
      this.canResetVisualizers_());
};


/**
 * Handles clicks of the reset button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.resetClickHandler_ =
    function() {
  if (!this.enabled_) {
    return;
  }
  this.playback_.reset();
};


/**
 * @return {boolean} True if the back button can be used.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.canMoveBack_ = function() {
  return this.enabled_ && !!this.playback_.getCurrentStepIndex();
};


/**
 * Handles clicks of the backwards button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.backClickHandler_ =
    function() {
  if (!this.canMoveBack_()) {
    return;
  }

  var playback = this.playback_;
  var currentStepIndex = playback.getCurrentStepIndex();
  if (currentStepIndex <= 0) {
    throw new Error('Lowest step index is 0.');
  }
  playback.seekStep(currentStepIndex - 1);
};


/**
 * @return {boolean} True if the play button can be used.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.canPlay_ = function() {
  return this.enabled_ && !!this.playback_.getCurrentStep();
};


/**
 * Handles clicks of the play button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.playClickHandler_ =
    function() {
  if (!this.canPlay_()) {
    return;
  }

  var playback = this.playback_;
  if (playback.isPlaying()) {
    this.setPlayButtonState_(false);
    playback.pause();
  } else {
    this.setPlayButtonState_(true);
    playback.play();
  }
};


/**
 * Sets the play button state to playing or paused.
 * @param {boolean} playing True if currently playing.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.setPlayButtonState_ = function(
    playing) {
  goog.dom.classes.enable(
      this.playButton_, goog.getCssName('playing'), playing);
};


/**
 * @return {boolean} True if the forward button can be used.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.canMoveForward_ = function() {
  return this.enabled_ && !!this.playback_.getCurrentStep() &&
      this.playback_.getCurrentStepIndex() < this.playback_.getStepCount() - 1;
};


/**
 * Handles clicks of the forward button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.forwardClickHandler_ =
    function() {
  if (!this.canMoveForward_()) {
    return;
  }

  var playback = this.playback_;
  var currentStepIndex = playback.getCurrentStepIndex();
  var lastStepIndex = playback.getStepCount() - 1;
  if (currentStepIndex >= lastStepIndex) {
    throw new Error(
        'Can\'t seek beyond last step index of ' + lastStepIndex + '.');
  }
  playback.seekStep(currentStepIndex + 1);
};


/**
 * @return {boolean} True if the reset visualizers button can be used.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.canResetVisualizers_ =
    function() {
  var defaultState = wtf.replay.graphics.Experiment.DEFAULT_STATE;

  return this.enabled_ && this.currentVisualizerState_ != defaultState;
};


/**
 * Handles clicks of the reset visualizers button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.resetVisualizersClickHandler_ =
    function() {
  if (!this.canResetVisualizers_()) {
    return;
  }

  var playback = this.playback_;
  playback.resetVisualizers();
};
