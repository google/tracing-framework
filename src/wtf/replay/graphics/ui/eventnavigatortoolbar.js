/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Toolbar control for navigating within a step for graphics
 * replay.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.EventNavigatorToolbar');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.events.EventType');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.ui.eventNavigatorToolbar');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.SearchControl');



/**
 * Toolbar control for avigating within a step for graphics replay.
 *
 * @param {!Element} parentElement The parent element.
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.EventNavigatorToolbar = function(
    parentElement, playback, opt_domHelper) {
  goog.base(this, parentElement, opt_domHelper);

  /**
   * The playback.
   * @type {!wtf.replay.graphics.Playback}
   * @private
   */
  this.playback_ = playback;

  /**
   * The previous draw call button.
   * @type {!Element}
   * @private
   */
  this.previousDrawCallButton_ = this.getChildElement(
      goog.getCssName('graphicsReplayPreviousDrawCallButton'));

  /**
   * The next draw call button.
   * @type {!Element}
   * @private
   */
  this.nextDrawCallButton_ = this.getChildElement(
      goog.getCssName('graphicsReplayNextDrawCallButton'));

  /**
   * The search box.
   * @type {!wtf.ui.SearchControl}
   * @private
   */
  this.searchControl_ = new wtf.ui.SearchControl(
      this.getChildElement(goog.getCssName('graphicsReplayToolbarSearchBox')),
      this.getDom());
  this.searchControl_.setEnabled(false);
  this.registerDisposable(this.searchControl_);
  this.searchControl_.setPlaceholderText(
      'Partial name or /regex/');
  this.listenToSearchBox_();
};
goog.inherits(wtf.replay.graphics.ui.EventNavigatorToolbar, wtf.ui.Control);


/**
 * Events related to manipulating the toolbar.
 * @enum {string}
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.EventType = {
  /**
   * A seek was performed by the user to an event within the current step.
   */
  MANUAL_SUB_STEP_SEEK: goog.events.getUniqueId('manual_sub_step_seek'),

  /**
   * The value of the search box changed. The new value is an argument.
   */
  SEARCH_VALUE_CHANGED: goog.events.getUniqueId('search_value_changed')
};


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.createDom = function(
    dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.eventNavigatorToolbar.controller,
      {}, undefined, dom));
};


/**
 * Sets this toolbar as ready for use.
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.setReady = function() {
  // If no steps to play, no need to enable toolbar.
  if (!this.playback_.getStepCount()) {
    return;
  }

  this.toggleButton(
      goog.getCssName('graphicsReplayPreviousDrawCallButton'), true);
  this.toggleButton(goog.getCssName('graphicsReplayNextDrawCallButton'), true);
  this.searchControl_.setEnabled(true);
  this.listenToButtonStates_();

  var eh = this.getHandler();
  eh.listen(
      this.previousDrawCallButton_,
      goog.events.EventType.CLICK,
      this.prevDrawCallHandler_, false, this);
  eh.listen(
      this.nextDrawCallButton_,
      goog.events.EventType.CLICK,
      this.nextDrawCallHandler_, false, this);
};


/**
 * Listens to events that change whether buttons are enabled.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.listenToButtonStates_ =
    function() {
  var playback = this.playback_;
  var previousDrawCallClass =
      goog.getCssName('graphicsReplayPreviousDrawCallButton');
  var nextDrawCallClass = goog.getCssName('graphicsReplayNextDrawCallButton');

  playback.addListener(
      wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      function() {
        // There are still steps left.
        var isPlaying = playback.isPlaying();
        if (this.playback_.getCurrentStep()) {
          this.toggleButton(previousDrawCallClass, !isPlaying);
          this.toggleButton(nextDrawCallClass, !isPlaying);
          this.searchControl_.setEnabled(!isPlaying);
        } else {
          this.toggleButton(previousDrawCallClass, false);
          this.toggleButton(nextDrawCallClass, false);
          this.searchControl_.setEnabled(false);
        }
      }, this);

  playback.addListener(wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
      function() {
        // No seeking to the next draw call while playing.
        this.toggleButton(previousDrawCallClass, false);
        this.toggleButton(nextDrawCallClass, false);
        this.searchControl_.setEnabled(false);
      }, this);

  playback.addListener(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
      function() {
        if (playback.getCurrentStep()) {
          // Enable intra-step navigation if stopped at a step.
          this.toggleButton(previousDrawCallClass, true);
          this.toggleButton(nextDrawCallClass, true);
          this.searchControl_.setEnabled(true);
        }
      }, this);
};


/**
 * Handles clicks of the previous draw call button.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.prevDrawCallHandler_ =
    function() {
  this.playback_.seekToPreviousDrawCall();
  this.emitEvent(
      wtf.replay.graphics.ui.EventNavigatorToolbar.EventType
          .MANUAL_SUB_STEP_SEEK);
};


/**
 * Handles clicks of the next draw call button.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.nextDrawCallHandler_ =
    function() {
  this.playback_.seekToNextDrawCall();
  this.emitEvent(
      wtf.replay.graphics.ui.EventNavigatorToolbar.EventType
          .MANUAL_SUB_STEP_SEEK);
};


/**
 * Begins listening to changes in the search box.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.listenToSearchBox_ =
    function() {
  this.searchControl_.addListener(
      wtf.events.EventType.INVALIDATED, this.handleSearchBoxChanges_, this);
};


/**
 * Handles changes to the search box.
 * @param {string} value The new value of the search box.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.handleSearchBoxChanges_ =
    function(value) {
  this.emitEvent(
      wtf.replay.graphics.ui.EventNavigatorToolbar.EventType
          .SEARCH_VALUE_CHANGED,
      value);
};
