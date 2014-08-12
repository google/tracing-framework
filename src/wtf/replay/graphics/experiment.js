/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Set of ReplayFrames sharing the same Visualizer state.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.Experiment');

goog.require('goog.object');
goog.require('wtf.replay.graphics.ReplayFrame');



/**
 * Set of {@see wtf.replay.graphics.ReplayFrame} objects.
 * Each frame shares the same playback-affecting Visualizer state.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 */
wtf.replay.graphics.Experiment = function(playback) {
  /**
   * The playback instance.
   * @type {!wtf.replay.graphics.Playback}
   * @private
   */
  this.playback_ = playback;

  /**
   * The state of this experiment.
   * @type {wtf.replay.graphics.Visualizer.State}
   * @private
   */
  this.state_ = wtf.replay.graphics.Experiment.constructState(playback);

  /**
   * The name of this experiment.
   * @type {string}
   * @private
   */
  this.name_ = wtf.replay.graphics.Experiment.constructName(playback);

  /**
   * All recorded frames.
   * @type {!Array.<!wtf.replay.graphics.ReplayFrame>}
   * @private
   */
  this.frames_ = [];
};


/**
 * Gets the state of this experiment.
 * @return {wtf.replay.graphics.Visualizer.State} The state of this experiment.
 */
wtf.replay.graphics.Experiment.prototype.getState = function() {
  return this.state_;
};


/**
 * Applies the visualizer state.
 */
wtf.replay.graphics.Experiment.prototype.applyState = function() {
  var visualizers = this.playback_.getVisualizers();

  for (var i = 0; i < visualizers.length; ++i) {
    visualizers[i].setState(this.state_);
  }

  this.playback_.triggerVisualizerChange();
};


/**
 * Gets the name of this experiment.
 * @return {string} The name of this experiment.
 */
wtf.replay.graphics.Experiment.prototype.getName = function() {
  return this.name_;
};


/**
 * Sets a frame.
 * @param {number} number The frame number.
 * @param {!wtf.replay.graphics.ReplayFrame} frame The frame to set.
 */
wtf.replay.graphics.Experiment.prototype.setFrame = function(number, frame) {
  this.frames_[number] = frame;
};


/**
 * Gets a frame, creating a new frame if one does not already exist.
 * @param {number} number The frame number.
 * @return {!wtf.replay.graphics.ReplayFrame} The frame at that index.
 */
wtf.replay.graphics.Experiment.prototype.getFrame = function(number) {
  if (!this.frames_[number]) {
    this.frames_[number] = new wtf.replay.graphics.ReplayFrame(number);
  }
  return this.frames_[number];
};


/**
 * Gets all frames.
 * @return {!Array.<!wtf.replay.graphics.ReplayFrame>} All frames.
 */
wtf.replay.graphics.Experiment.prototype.getFrames = function() {
  return this.frames_;
};


/**
 * Gets the average FPS across all recorded frames.
 * @return {number} The average FPS of all recorded frames.
 */
wtf.replay.graphics.Experiment.prototype.getAverageFPS = function() {
  var totalDuration = 0;
  var totalFrames = 0;
  for (var i = 0; i < this.frames_.length; ++i) {
    var frame = this.frames_[i];
    if (frame) {
      var duration = frame.getAverageDuration();
      if (duration) {
        totalDuration += duration;
        totalFrames++;
      }
    }
  }
  if (!totalFrames) {
    return 0;
  }
  var averageDuration = totalDuration / totalFrames;
  var averageFPS = 1000.0 / averageDuration;
  return averageFPS;
};


/**
 * The default state.
 * @type {wtf.replay.graphics.Visualizer.State}
 * @const
 */
wtf.replay.graphics.Experiment.DEFAULT_STATE = null;


/**
 * Constructs the combined state from the current Visualizer states.
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @return {wtf.replay.graphics.Visualizer.State} The current state.
 */
wtf.replay.graphics.Experiment.constructState = function(playback) {
  var visualizers = playback.getVisualizers();

  var state = {};
  for (var i = 0; i < visualizers.length; ++i) {
    var visualizerState = visualizers[i].getState();
    if (visualizerState) {
      for (var name in visualizerState) {
        state[name] = visualizerState[name];
      }
    }
  }

  if (goog.object.isEmpty(state)) {
    return wtf.replay.graphics.Experiment.DEFAULT_STATE;
  }
  return state;
};


/**
 * The default name.
 * @type {string}
 * @const
 */
wtf.replay.graphics.Experiment.DEFAULT_NAME = 'Standard Playback';


/**
 * Constructs the state name for the current Visualizer states.
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @return {string} The name of this experiment.
 */
wtf.replay.graphics.Experiment.constructName = function(playback) {
  var visualizers = playback.getVisualizers();

  var name = '';
  for (var i = 0; i < visualizers.length; ++i) {
    name += visualizers[i].getStateName();
  }

  if (!name) {
    return wtf.replay.graphics.Experiment.DEFAULT_NAME;
  }
  return name;
};
