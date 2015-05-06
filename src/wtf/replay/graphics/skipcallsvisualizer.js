/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Skips calls during playback for select shader programs.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.SkipCallsVisualizer');

goog.require('wtf.replay.graphics.Visualizer');



/**
 * Visualizer that allows for skipping calls during playback.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.replay.graphics.Visualizer}
 */
wtf.replay.graphics.SkipCallsVisualizer = function(playback) {
  goog.base(this, playback);

  /**
   * A mapping of handles to contexts.
   * Keys are context handles from event arguments.
   * @type {!Object.<!WebGLRenderingContext>}
   * @private
   */
  this.contexts_ = {};

  /**
   * The program handle from event arguments for the latest used program.
   * @type {number}
   * @private
   */
  this.latestProgramHandle_ = 0;

  /**
   * Storage of which program handles should have their draw calls skipped.
   * Keys are program handles, values are whether the program handle is skipped.
   * @type {!Array.<boolean>}
   * @private
   */
  this.skippedProgramHandles_ = [];
};
goog.inherits(wtf.replay.graphics.SkipCallsVisualizer,
    wtf.replay.graphics.Visualizer);


/**
 * Adds mutators using registerMutator.
 * @protected
 * @override
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.setupMutators = function() {
  goog.base(this, 'setupMutators');

  this.registerMutator('wtf.webgl#setContext', {
    post: function(visualizer, gl, args) {
      var contextHandle = args['handle'];
      if (!visualizer.contexts_[contextHandle]) {
        visualizer.contexts_[contextHandle] = gl;
      }
    }
  });

  this.registerMutator('WebGLRenderingContext#useProgram', {
    post: function(visualizer, gl, args) {
      var programHandle = args['program'];
      visualizer.latestProgramHandle_ = programHandle;
      visualizer.skippedProgramHandles_[programHandle] =
          visualizer.skippedProgramHandles_[programHandle] || false;
    }
  });

  this.registerMutator('WebGLRenderingContext#drawArrays', {
    replace: function(visualizer, gl, args) {
      return visualizer.handleDrawCall_();
    }
  });

  this.registerMutator('WebGLRenderingContext#drawElements', {
    replace: function(visualizer, gl, args) {
      return visualizer.handleDrawCall_();
    }
  });

  this.registerMutator('ANGLEInstancedArrays#drawArraysInstancedANGLE', {
    replace: function(visualizer, gl, args) {
      return visualizer.handleDrawCall_();
    }
  });

  this.registerMutator('ANGLEInstancedArrays#drawElementsInstancedANGLE', {
    replace: function(visualizer, gl, args) {
      return visualizer.handleDrawCall_();
    }
  });
};


/**
 * Returns the current playback-affecting state.
 * @return {wtf.replay.graphics.Visualizer.State} The current state.
 * @override
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.getState = function() {
  if (!this.active) {
    return null;
  }

  var skipped = [];
  for (var i = 0; i < this.skippedProgramHandles_.length; ++i) {
    if (this.isProgramSkipped(i)) {
      skipped.push(i);
    }
  }

  if (skipped.length > 0) {
    var state = {'scv': JSON.stringify(skipped)};
    return state;
  }
  return null;
};


/**
 * Sets playback-affecting state.
 * @param {wtf.replay.graphics.Visualizer.State} state The new state.
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.setState = function(state) {
  for (var i = 0; i < this.skippedProgramHandles_.length; ++i) {
    this.skippedProgramHandles_[i] = false;
  }
  if (state && state['scv']) {
    var skipped = JSON.parse(state['scv']);
    for (var i = 0; i < skipped.length; ++i) {
      this.skippedProgramHandles_[skipped[i]] = true;
    }
  }
};


/**
 * Returns a nicely formatted version of the current playback-affecting state.
 * @return {string} Formatted version of the current playback-affecting state.
 * @override
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.getStateName = function() {
  if (!this.active) {
    return '';
  }

  var skipped = [];
  for (var i = 0; i < this.skippedProgramHandles_.length; ++i) {
    // TODO(scotttodd): Support naming programs using source code annotations?
    if (this.isProgramSkipped(i)) {
      skipped.push(i);
    }
  }

  if (skipped.length == 0) {
    return '';
  }
  return 'Skipped shader ids: ' + skipped.join(', ');
};


/**
 * Returns whether this draw call should be skipped in playback.
 * @return {boolean} Whether the event should be skipped in playback.
 * @private
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.handleDrawCall_ = function() {
  return this.isProgramSkipped(this.latestProgramHandle_);
};


/**
 * Resets any state that can affect playback.
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.reset = function() {
  for (var i = 0; i < this.skippedProgramHandles_.length; ++i) {
    this.skippedProgramHandles_[i] = false;
  }
};


/**
 * Runs this visualization on a substep of the current step.
 * @param {number=} opt_subStepIndex Target substep, or the current by default.
 * @override
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.applyToSubStep = function(
    opt_subStepIndex) {
  var currentSubStepIndex = this.playback.getSubStepEventIndex();
  var targetSubStepIndex = opt_subStepIndex || currentSubStepIndex;

  var latestProgramHandle = this.getLatestProgram_(targetSubStepIndex);

  this.skippedProgramHandles_[latestProgramHandle] =
      !this.skippedProgramHandles_[latestProgramHandle];

  this.emitEvent(wtf.replay.graphics.Visualizer.EventType.STATE_CHANGED);
};


/**
 * Gets the latest used program handle between it and the target substep index.
 * @param {number} targetSubStepIndex The substep index to search until.
 * @return {number} The latest program handle before the target substep index.
 * @private
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.getLatestProgram_ = function(
    targetSubStepIndex) {
  // TODO(scotttodd): Make this work even when the latest useProgram call was
  //   from a previous step.
  var currentStep = this.playback.getCurrentStep();
  var it = currentStep.getEventIterator(true);

  var latestProgramHandle = 0;
  while (it.getIndex() < targetSubStepIndex && !it.done()) {
    if (it.getName() == 'WebGLRenderingContext#useProgram') {
      var args = it.getArguments();
      latestProgramHandle = args['program'];
    }
    it.next();
  }

  return latestProgramHandle;
};


/**
 * Returns whether a program handle should be skipped in playback.
 * @param {number} programHandle The program handle in question.
 * @return {boolean} Whether the program handle should be skipped in playback.
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.isProgramSkipped = function(
    programHandle) {
  return this.skippedProgramHandles_[programHandle];
};


/**
 * Returns whether an event should be skipped in playback.
 * @param {!wtf.db.EventIterator} it Event iterator at the event in question.
 * @return {boolean} Whether the event should be skipped in playback.
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.isEventSkipped = function(
    it) {
  var latestProgramHandle = this.getLatestProgram_(it.getIndex());

  return this.isProgramSkipped(latestProgramHandle);
};


/**
 * Restores state back to standard playback.
 */
wtf.replay.graphics.SkipCallsVisualizer.prototype.restoreState = function() {
  this.active = false;

  // Seek from the start to the current step to update all internal state.
  var currentStepIndex = this.playback.getCurrentStepIndex();
  var currentSubStepIndex = this.playback.getSubStepEventIndex();

  this.playback.seekStep(0);
  this.playback.seekStep(currentStepIndex);
  this.playback.seekSubStepEvent(currentSubStepIndex);
};
