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
goog.require('goog.positioning.Corner');
goog.require('goog.soy');
goog.require('goog.ui.Component');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.PopupMenu');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.replay.graphics.DrawCallVisualizer');
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
   * Whether the UI is currently enabled.
   * Set by {@see #setReady} and upon state change.
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;

  /**
   * The first call button.
   * @type {!Element}
   * @private
   */
  this.firstCallButton_ = this.getChildElement(
      goog.getCssName('firstCallButton'));

  /**
   * The previous draw call button.
   * @type {!Element}
   * @private
   */
  this.previousDrawCallButton_ = this.getChildElement(
      goog.getCssName('previousDrawCallButton'));

  /**
   * The next draw call button.
   * @type {!Element}
   * @private
   */
  this.nextDrawCallButton_ = this.getChildElement(
      goog.getCssName('nextDrawCallButton'));

  /**
   * The last call button.
   * @type {!Element}
   * @private
   */
  this.lastCallButton_ = this.getChildElement(
      goog.getCssName('lastCallButton'));

  /**
   * The toggle overdraw button.
   * @type {!Element}
   * @private
   */
  this.toggleOverdrawButton_ = this.getChildElement(
      goog.getCssName('toggleOverdrawButton'));

  /**
   * The options button.
   * @type {!Element}
   * @private
   */
  this.optionsButton_ = this.getChildElement(
      goog.getCssName('optionsButton'));

  /**
   * The search box.
   * @type {!wtf.ui.SearchControl}
   * @private
   */
  this.searchControl_ = new wtf.ui.SearchControl(
      this.getChildElement(goog.getCssName('searchBox')), this.getDom());
  this.searchControl_.setEnabled(false);
  this.registerDisposable(this.searchControl_);
  this.searchControl_.setPlaceholderText('Partial name or /regex/');
  this.searchControl_.addListener(
      wtf.events.EventType.INVALIDATED, this.handleSearchBoxChanges_, this);

  // Setup sort buttons.
  var dom = this.getDom();
  var menu = new goog.ui.PopupMenu(dom);
  this.registerDisposable(menu);
  menu.attach(this.optionsButton_, goog.positioning.Corner.BOTTOM_LEFT);
  menu.setToggleMode(true);
  menu.addChild(new goog.ui.MenuItem(
      'TODO', 'some_token', dom), true);
  menu.render();
  var eh = this.getHandler();
  menu.forEachChild(function(item) {
    item.setCheckable(true);
    eh.listen(item, goog.ui.Component.EventType.ACTION, function(e) {
      menu.forEachChild(function(otherItem) {
        otherItem.setChecked(false);
      });
      item.setChecked(true);
      this.searchControl_.focus();
      // TODO(benvanik): update with option.
    });
  });
  menu.getChildAt(0).setChecked(true);
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

  // Listen to events that change whether buttons are enabled.
  var playback = this.playback_;
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      function() {
        // There are still steps left.
        var isPlaying = playback.isPlaying();
        if (this.playback_.getCurrentStep()) {
          this.setEnabled_(!isPlaying);
        } else {
          this.setEnabled_(false);
        }
      }, this);
  playback.addListener(wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
      function() {
        // No seeking to the next draw call while playing.
        this.setEnabled_(false);
      }, this);
  playback.addListener(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
      function() {
        if (playback.getCurrentStep()) {
          // Enable intra-step navigation if stopped at a step.
          this.setEnabled_(true);
        }
      }, this);

  // Listen for overdraw visibility to select the overdraw button.
  var overdrawVisualizer = /** @type {wtf.replay.graphics.OverdrawVisualizer} */
      (playback.getVisualizer('overdraw'));
  if (overdrawVisualizer) {
    overdrawVisualizer.addListener(
        wtf.replay.graphics.DrawCallVisualizer.EventType.VISIBILITY_CHANGED,
        function() {
          this.toggleSelected(goog.getCssName('toggleOverdrawButton'),
              overdrawVisualizer.isVisible());
        }, this);
  }

  // Handle button clicks.
  var eh = this.getHandler();
  eh.listen(
      this.firstCallButton_,
      goog.events.EventType.CLICK,
      this.firstCallHandler_, false, this);
  eh.listen(
      this.previousDrawCallButton_,
      goog.events.EventType.CLICK,
      this.previousDrawCallHandler_, false, this);
  eh.listen(
      this.nextDrawCallButton_,
      goog.events.EventType.CLICK,
      this.nextDrawCallHandler_, false, this);
  eh.listen(
      this.lastCallButton_,
      goog.events.EventType.CLICK,
      this.lastCallHandler_, false, this);
  eh.listen(
      this.toggleOverdrawButton_,
      goog.events.EventType.CLICK,
      this.toggleOverdrawHandler_, false, this);

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.getWindowKeyboard(this.getDom());
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addShortcut('ctrl+shift+up', function() {
    this.firstCallHandler_();
  }, this);
  keyboardScope.addShortcut('ctrl+up', function() {
    this.previousDrawCallHandler_();
  }, this);
  keyboardScope.addShortcut('ctrl+down', function() {
    this.nextDrawCallHandler_();
  }, this);
  keyboardScope.addShortcut('ctrl+shift+down', function() {
    this.lastCallHandler_();
  }, this);
  keyboardScope.addShortcut('v', function() {
    this.toggleOverdrawHandler_();
  }, this);

  this.setEnabled_(true);
};


/**
 * Toggle all of the buttons and other UI elements on/off.
 * @param {boolean} enabled Whether the elements are enabled.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.setEnabled_ =
    function(enabled) {
  this.enabled_ = enabled;
  this.toggleButton(goog.getCssName('firstCallButton'), enabled);
  this.toggleButton(goog.getCssName('previousDrawCallButton'), enabled);
  this.toggleButton(goog.getCssName('nextDrawCallButton'), enabled);
  this.toggleButton(goog.getCssName('lastCallButton'), enabled);
  this.toggleButton(goog.getCssName('toggleOverdrawButton'), enabled);
  this.searchControl_.setEnabled(enabled);
  this.toggleButton(goog.getCssName('optionsButton'), enabled);
};


/**
 * Handles clicks of the first call button.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.firstCallHandler_ =
    function() {
  if (!this.enabled_) {
    return;
  }

  this.playback_.seekStep(this.playback_.getCurrentStepIndex());
  this.emitEvent(
      wtf.replay.graphics.ui.EventNavigatorToolbar.EventType
          .MANUAL_SUB_STEP_SEEK);
};


/**
 * Handles clicks of the previous draw call button.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.
    previousDrawCallHandler_ = function() {
  if (!this.enabled_) {
    return;
  }

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
  if (!this.enabled_) {
    return;
  }

  this.playback_.seekToNextDrawCall();
  this.emitEvent(
      wtf.replay.graphics.ui.EventNavigatorToolbar.EventType
          .MANUAL_SUB_STEP_SEEK);
};


/**
 * Handles clicks of the last call button.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.lastCallHandler_ =
    function() {
  if (!this.enabled_) {
    return;
  }

  this.playback_.seekToLastCall();
  this.emitEvent(
      wtf.replay.graphics.ui.EventNavigatorToolbar.EventType
          .MANUAL_SUB_STEP_SEEK);
};


/**
 * Handles clicks of the toggle overdraw button.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorToolbar.prototype.toggleOverdrawHandler_ =
    function() {
  if (!this.enabled_) {
    return;
  }

  var currentStep = this.playback_.getCurrentStep();
  var currentSubStep = this.playback_.getSubStepEventIndex();
  if (currentSubStep > 0) {
    this.playback_.visualizeSubStep('overdraw');
  } else {
    var eventIterator = currentStep.getEventIterator(true);
    var lastSubStep = eventIterator.getCount() - 1;
    this.playback_.visualizeSubStep('overdraw', lastSubStep);
  }
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
