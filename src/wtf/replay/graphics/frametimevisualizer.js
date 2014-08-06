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

  /**
   * Mapping from experiment hashes to indeces in the experiments array.
   * Keys are visualizer state hashes, compiled from all active visualizers.
   * @type {!Object.<number>}
   * @private
   */
  this.experimentHashes_ = {};

  /**
   * The hash of the latest experiment.
   * @type {string}
   * @private
   */
  this.latestExperimentHash_ = '';
  this.updateExperimentHash_();

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
      this.updateExperimentHash_, this);

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
  FRAMES_UPDATED: goog.events.getUniqueId('frames_updated')
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
 * Gets an experiment, creating it if it does not already exist.
 * @param {string} stateHash Hash of the visualizer state.
 * @return {!wtf.replay.graphics.Experiment} The experiment.
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.getExperiment = function(
    stateHash) {
  var index = this.experimentHashes_[stateHash];

  if (index === undefined) {
    index = this.experiments_.length;
    var experiment = new wtf.replay.graphics.Experiment(this.playback);
    this.experiments_.push(experiment);
    this.experimentHashes_[stateHash] = index;
  }
  return this.experiments_[index];
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
  var experiment = this.getExperiment(this.latestExperimentHash_);
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
  var experiment = this.getExperiment(this.latestExperimentHash_);
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
 * Updates the latest experiment state hash.
 * @private
 */
wtf.replay.graphics.FrameTimeVisualizer.prototype.updateExperimentHash_ =
    function() {
  this.latestExperimentHash_ =
      wtf.replay.graphics.Experiment.constructStateHash(this.playback);
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
