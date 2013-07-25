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

goog.require('goog.events.EventType');
goog.require('goog.soy');
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
   * The reset button.
   * @type {!Element}
   * @private
   */
  this.resetButton_ =
      this.getChildElement(goog.getCssName('graphicsReplayResetButton'));

  /**
   * The backwards-1-step button.
   * @type {!Element}
   * @private
   */
  this.backButton_ =
      this.getChildElement(goog.getCssName('graphicsReplayBackButton'));

  /**
   * The play button.
   * @type {!Element}
   * @private
   */
  this.playButton_ =
      this.getChildElement(goog.getCssName('graphicsReplayPlayButton'));

  /**
   * The forward button.
   * @type {!Element}
   * @private
   */
  this.forwardButton_ =
      this.getChildElement(goog.getCssName('graphicsReplayForwardButton'));


  // Only enable this toolbar after the playback has loaded.
  deferred.addCallback(function() {
    this.setInitialButtonStates_();
    this.listenToButtonStateEvents_();
    this.listenToClickEvents_();
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
 * Sets which buttons are initially enabled.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.setInitialButtonStates_ =
    function() {
  // If no steps to play, no need to enable toolbar.
  if (!this.playback_.getStepCount()) {
    return;
  }

  this.toggleButton(goog.getCssName('graphicsReplayResetButton'), true);
  this.toggleButton(goog.getCssName('graphicsReplayPlayButton'), true);
  this.toggleButton(goog.getCssName('graphicsReplayForwardButton'), true);
};


/**
 * Listens to click events.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.listenToClickEvents_ =
    function() {
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
};


/**
 * Listens to events that change whether buttons are enabled.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.listenToButtonStateEvents_ =
    function() {
  var dom = this.getDom();
  var playback = this.playback_;
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      function() {
        // There are still steps left.
        if (this.playback_.getCurrentStep()) {
          this.toggleButton(
              goog.getCssName('graphicsReplayPlayButton'), true);
          this.toggleButton(
              goog.getCssName('graphicsReplayForwardButton'),
              playback.getCurrentStepIndex() < playback.getStepCount() - 1);

          // If we are at the beginning, disable back button.
          this.toggleButton(goog.getCssName('graphicsReplayBackButton'),
              !!this.playback_.getCurrentStepIndex());
        } else {
          // We are at the end. No steps left.
          this.toggleButton(
              goog.getCssName('graphicsReplayPlayButton'), false);
          this.toggleButton(
              goog.getCssName('graphicsReplayForwardButton'), false);
        }
      }, this);

  playback.addListener(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
      function() {
        dom.setTextContent(this.playButton_, 'Play');
        if (!playback.getCurrentStep()) {
          this.toggleButton(
              goog.getCssName('graphicsReplayPlayButton'), false);
        }
      }, this);
};


/**
 * Handles clicks of the reset button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.resetClickHandler_ =
    function() {
  this.playback_.reset();
};


/**
 * Handles clicks of the backwards button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.backClickHandler_ =
    function() {
  var playback = this.playback_;
  var currentStepIndex = playback.getCurrentStepIndex();
  if (currentStepIndex <= 0) {
    throw new Error('Lowest step index is 0.');
  }
  playback.seekStep(currentStepIndex - 1);
};


/**
 * Handles clicks of the play button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.playClickHandler_ =
    function() {
  var dom = this.getDom();
  var playback = this.playback_;
  if (playback.isPlaying()) {
    dom.setTextContent(this.playButton_, 'Play');
    playback.pause();
  } else {
    dom.setTextContent(this.playButton_, 'Pause');
    playback.play();
  }
};


/**
 * Handles clicks of the forward button.
 * @private
 */
wtf.replay.graphics.ui.GraphicsToolbar.prototype.forwardClickHandler_ =
    function() {
  var playback = this.playback_;
  var currentStepIndex = playback.getCurrentStepIndex();
  var lastStepIndex = playback.getStepCount() - 1;
  if (currentStepIndex >= lastStepIndex) {
    throw new Error(
        'Can\'t seek beyond last step index of ' + lastStepIndex + '.');
  }
  playback.seekStep(currentStepIndex + 1);
};
