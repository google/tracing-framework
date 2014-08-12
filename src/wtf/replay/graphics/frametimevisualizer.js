/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Records frame times during playback.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.FrameTimeVisualizer');

goog.require('goog.events');
goog.require('goog.webgl');
goog.require('wtf.replay.graphics.Experiment');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.Visualizer');



/**
 * Visualizer of time frames.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.replay.graphics.Visualizer}
 */
wtf.replay.graphics.FrameTimeVisualizer = function(playback) {
  goog.base(this, playback);

  /**
   * The index of the latest step encountered.
   * @type {number}
   * @private
   */
  this.latestStepIndex_ = -1;

  /**
   * Array of experiments. Each experiment contains recorded frames.
   * @type {!Array.<!wtf.replay.graphics.Experiment>}
   * @private
   */
  this.experiments_ = [];

  // Initialize with the default experiment.
  this.createExperiment_(wtf.replay.graphics.Experiment.DEFAULT_STATE);

  /**
   * The state of the current experiment.
   * @type {wtf.replay.graphics.Visualizer.State}
   * @private
   */
  this.currentExperimentState_ = null;

  /**
   * The index of the current experiment, or null if not created yet.
   * @type {?number}
   * @private
   */
  this.currentExperimentIndex_ = null;

  this.updateCurrentExperiment_();

  playback.addListener(wtf.replay.graphics.Playback.EventType.STEP_STARTED,
      this.recordStart_, this);

  playback.addListener(wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      this.recordStop_, this);

  playback.addListener(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
      function() {
        var previousFrame = this.getPreviousFrame_();
        if (previousFrame) {
          previousFrame.cancelTiming();
        }
      }, this);

  playback.addListener(
      wtf.replay.graphics.Playback.EventType.VISUALIZER_STATE_CHANGED,
      this.updateCurrentExperiment_, this);

  /**
   * A mapping of handles to contexts.
   * Keys are context handles from event arguments.
   * @type {!Object.<!WebGLRenderingContext>}
   * @private
   */
  this.contexts_ = {};
};
goog.inherits(wtf.replay.graphics.FrameTimeVisualizer,
    wtf.replay.graphics.Visualizer);


/**
 * Events related to this Visualizer.
 * @enum {string}
 */
wtf.replay.graphics.FrameTimeVisualizer.EventType = {
  /**
   * Frame times changed.
   */
  FRAMES_UPDATED: goog.events.getUniqueId('frames_updated'),

  /**
   * Experiments were updated.
   */
  EXPERIMENTS_UPDATED: goog.events.getUniqueId('experiments_updated')
};


/**
 * Adds mutators using registerMutator.
 * @protected
 * @override
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.setupMutators = function() {
  goog.base(this, 'setupMutators');

  this.registerMutator('wtf.webgl#setContext', {
    post: function(visualizer, gl, args) {
      var contextHandle = args['handle'];
      if (!visualizer.contexts_[contextHandle]) {
        visualizer.contexts_[contextHandle] = gl;
      }
    }
  });
};


/**
 * Creates an experiment, appending it to the experiments array.
 * @param {wtf.replay.graphics.Visualizer.State} state The visualizer state.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.createExperiment_ = function(
    state) {
  var experiment = new wtf.replay.graphics.Experiment(this.playback);
  this.experiments_.push(experiment);

  this.emitEvent(
      wtf.replay.graphics.FrameTimeVisualizer.EventType.EXPERIMENTS_UPDATED);
};


/**
 * Gets an experiment, creating it if it does not already exist.
 * @param {wtf.replay.graphics.Visualizer.State} state The visualizer state.
 * @return {!wtf.replay.graphics.Experiment} The experiment.
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getExperiment = function(
    state) {
  var index = this.getExperimentIndex(state);
  if (index == null) {
    this.createExperiment_(state);
    index = this.experiments_.length - 1;
  }
  return this.experiments_[index];
};


/**
 * Gets an experiment's index, or null if it does not exist.
 * @param {wtf.replay.graphics.Visualizer.State} state The visualizer state.
 * @return {?number} The experiment's index or null if it does not exist.
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getExperimentIndex = function(
    state) {
  for (var i = 0; i < this.experiments_.length; ++i) {
    var experimentState = this.experiments_[i].getState();
    if (wtf.replay.graphics.Visualizer.equalStates(state, experimentState)) {
      return i;
    }
  }

  return null;
};


/**
 * Gets the current experiment.
 * @return {!wtf.replay.graphics.Experiment} The experiment.
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getCurrentExperiment =
    function() {
  if (this.currentExperimentIndex_ == null) {
    this.createExperiment_(this.currentExperimentState_);
    this.currentExperimentIndex_ = this.experiments_.length - 1;
  }
  return this.experiments_[this.currentExperimentIndex_];
};


/**
 * Gets the current experiment index.
 * @return {?number} The experiment's index.
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getCurrentExperimentIndex =
    function() {
  if (this.currentExperimentIndex_ == null) {
    this.updateCurrentExperiment_();
  }
  return this.currentExperimentIndex_;
};


/**
 * Updates the current experiment.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.updateCurrentExperiment_ =
    function() {
  var state = wtf.replay.graphics.Experiment.constructState(this.playback);
  this.currentExperimentState_ = state;
  this.currentExperimentIndex_ = this.getExperimentIndex(state);

  if (this.currentExperimentIndex_ != null) {
    this.emitEvent(
        wtf.replay.graphics.FrameTimeVisualizer.EventType.EXPERIMENTS_UPDATED);
  }
};


/**
 * Gets all experiments.
 * @return {!Array.<!wtf.replay.graphics.Experiment>} All experiments.
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getExperiments = function() {
  return this.experiments_;
};


/**
 * Gets the current Frame object, creating a new Frame if needed.
 * @return {!wtf.replay.graphics.ReplayFrame} The current frame.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getCurrentFrame_ =
    function() {
  var experiment = this.getCurrentExperiment();
  var currentStepIndex = this.playback.getCurrentStepIndex();
  return experiment.getFrame(currentStepIndex);
};


/**
 * Gets the previous frame.
 * @return {!wtf.replay.graphics.ReplayFrame} The previous frame.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getPreviousFrame_ =
    function() {
  var experiment = this.getCurrentExperiment();
  return experiment.getFrame(this.latestStepIndex_);
};


/**
 * Updates the latest step index to match playback's current step index.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.updateStepIndex_ =
    function() {
  var currentStepIndex = this.playback.getCurrentStepIndex();
  this.latestStepIndex_ = currentStepIndex;
};


/**
 * Records start frame times. Call when a new step begins.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.recordStart_ = function() {
  if (this.playback.isPlaying()) {
    var previousFrame = this.getPreviousFrame_();
    if (previousFrame) {
      previousFrame.startNext();

      this.emitEvent(
          wtf.replay.graphics.FrameTimeVisualizer.EventType.FRAMES_UPDATED);
    }

    this.updateStepIndex_();

    var currentFrame = this.getCurrentFrame_();
    currentFrame.startTiming();
  }
};


/**
 * Records end frame times. Call when the step changes.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.recordStop_ = function() {
  if (this.playback.isPlaying()) {
    // Finish rendering in all contexts.
    for (var contextHandle in this.contexts_) {
      // gl.finish() does not actually wait for operations to complete.
      // gl.readPixels() requires all operations to finish, so use it instead.
      var pixelContents = new Uint8Array(4);
      var context = this.contexts_[contextHandle];
      context.readPixels(0, 0, 1, 1, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE,
          pixelContents);
    }

    // Record the end time for the previous step.
    var previousFrame = this.getPreviousFrame_();
    if (previousFrame) {
      previousFrame.stopTiming();
    }
  }
};
