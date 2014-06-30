/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Overdraw. Visualizer for overdraw.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.Overdraw');

goog.require('goog.events');
goog.require('goog.webgl');
goog.require('wtf.replay.graphics.DrawCallVisualizer');
goog.require('wtf.replay.graphics.Program');



/**
 * Visualizer for overdraw.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.replay.graphics.DrawCallVisualizer}
 */
wtf.replay.graphics.Overdraw = function(playback) {
  goog.base(this, playback);

  /**
   * The index of the latest step that was visualized.
   * @type {number}
   * @private
   */
  this.latestStepIndex_ = -1;

  /**
   * The index of the latest substep that was visualized.
   * @type {number}
   * @private
   */
  this.latestSubStepIndex_ = -1;

  /**
   * Toggled value, used when toggling overdraw for the same step and substep.
   * @type {boolean}
   * @private
   */
  this.visible_ = false;

  /**
   * The previous this.visible_ value, used for toggling for the same substep.
   * @type {boolean}
   * @private
   */
  this.previousVisibility_ = false;
};
goog.inherits(wtf.replay.graphics.Overdraw,
    wtf.replay.graphics.DrawCallVisualizer);


/**
 * Events related to this visualization.
 * @enum {string}
 */
wtf.replay.graphics.Overdraw.EventType = {
  /**
   * Visibility changed.
   */
  VISIBILITY_CHANGED: goog.events.getUniqueId('visibility_changed')
};


/**
 * Returns if this visualizer is visible.
 * @return {boolean} Whether this visualizer is visible.
 */
wtf.replay.graphics.Overdraw.prototype.isVisible = function() {
  return this.visible_;
};


/**
 * Creates a Program object with a overdraw variant.
 * @param {number} programHandle Program handle from event arguments.
 * @param {!WebGLProgram} originalProgram The original program.
 * @param {!WebGLRenderingContext} gl The associated rendering context.
 * @protected
 * @override
 */
wtf.replay.graphics.Overdraw.prototype.createProgram = function(
    programHandle, originalProgram, gl) {
  var program = new wtf.replay.graphics.Program(originalProgram, gl);
  this.registerDisposable(program);
  this.programs[programHandle] = program;

  var visualizerSurface = this.visualizerSurfaces[this.latestContextHandle];

  var overdrawFragmentSource = 'precision mediump float;' +
      'void main(void) { gl_FragColor = ' +
      visualizerSurface.getThresholdDrawColor() + '; }';

  program.createVariantProgram('overdraw', '', overdrawFragmentSource);
};


/**
 * Handles special logic associated with performing a draw call.
 * @param {function()} drawFunction The draw function to call.
 * @protected
 * @override
 */
wtf.replay.graphics.Overdraw.prototype.handleDrawCall = function(
    drawFunction) {
  if (!this.active) {
    this.previousVisibility_ = false;
    return;
  }

  // Render normally to the active framebuffer.
  drawFunction();

  var contextHandle = this.latestContextHandle;
  var programHandle = this.latestProgramHandle;

  if (!this.modifyDraws || !contextHandle || !programHandle) {
    return;
  }

  var gl = this.contexts[contextHandle];

  // Do not edit calls where the target is not the visible framebuffer.
  var originalFramebuffer = /** @type {WebGLFramebuffer} */ (
      gl.getParameter(goog.webgl.FRAMEBUFFER_BINDING));
  if (originalFramebuffer != null) {
    return;
  }

  var webGLState = this.webGLStates[contextHandle];
  var visualizerSurface = this.visualizerSurfaces[contextHandle];

  webGLState.backup();

  // Draw overdraw variant into visualizerSurface.
  var program = this.programs[programHandle];
  visualizerSurface.bindFramebuffer();

  gl.disable(goog.webgl.STENCIL_TEST);
  gl.enable(goog.webgl.BLEND);
  gl.blendFunc(goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA);
  gl.blendEquation(goog.webgl.FUNC_ADD);

  program.drawWithVariant(drawFunction, 'overdraw');

  // Restore state, including the active framebuffer.
  webGLState.restore();
};


/**
 * Runs visualization, manipulating playback and surfaces as needed.
 * @param {Object.<string, !Object>=} opt_args Visualizer trigger arguments.
 * @override
 */
wtf.replay.graphics.Overdraw.prototype.trigger = function(opt_args) {
  var contextHandle = this.latestContextHandle;
  if (!contextHandle) {
    this.playback.finishVisualizer(this);
    return;
  }

  var currentStepIndex = this.playback.getCurrentStepIndex();
  var currentSubStepIndex = this.playback.getSubStepEventIndex();

  // If latest step and substep match current, toggle between views.
  if (currentStepIndex == this.latestStepIndex_ &&
      currentSubStepIndex == this.latestSubStepIndex_) {
    if (this.previousVisibility_) {
      this.restoreState();
      this.previousVisibility_ = false;
    } else {
      for (contextHandle in this.contexts) {
        this.drawTexture(this.visualizerSurfaces[contextHandle]);
      }
      this.previousVisibility_ = true;
    }
    this.playback.finishVisualizer(this);
    return;
  }

  // Otherwise, clear surfaces, seek to the start of the step, and continue.
  this.reset();
  this.active = true;
  this.playback.seekStep(currentStepIndex);

  this.modifyDraws = true;
  this.playback.seekSubStepEvent(currentSubStepIndex);

  for (contextHandle in this.contexts) {
    var gl = this.contexts[contextHandle];
    var originalFramebuffer = /** @type {WebGLFramebuffer} */ (
        gl.getParameter(goog.webgl.FRAMEBUFFER_BINDING));
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);

    this.playbackSurfaces[contextHandle].captureTexture();

    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, originalFramebuffer);
  }

  for (contextHandle in this.contexts) {
    this.drawTexture(this.visualizerSurfaces[contextHandle]);
  }

  this.latestStepIndex_ = currentStepIndex;
  this.latestSubStepIndex_ = currentSubStepIndex;
  this.previousVisibility_ = true;

  for (var handle in this.visualizerSurfaces) {
    this.visualizerSurfaces[handle].disableResize();
  }
  for (var handle in this.playbackSurfaces) {
    this.playbackSurfaces[handle].disableResize();
  }

  this.playback.finishVisualizer(this);
};


/**
 * Resets properties to a pre-visualization state.
 * @override
 */
wtf.replay.graphics.Overdraw.prototype.reset = function() {
  goog.base(this, 'reset');

  for (var handle in this.visualizerSurfaces) {
    this.visualizerSurfaces[handle].enableResize();
  }
  for (var handle in this.playbackSurfaces) {
    this.playbackSurfaces[handle].enableResize();
  }
};


/**
 * Draws the texture within surface, using overdraw settings.
 * @param {wtf.replay.graphics.OffscreenSurface} surface The surface to draw.
 */
wtf.replay.graphics.Overdraw.prototype.drawTexture = function(surface) {
  // Disable blending to overwrite the framebuffer, enable thresholding.
  surface.drawTexture(false, true);
  this.visible_ = true;
  this.emitEvent(wtf.replay.graphics.Overdraw.EventType.VISIBILITY_CHANGED);
};


/**
 * Restores state back to standard playback.
 * @override
 */
wtf.replay.graphics.Overdraw.prototype.restoreState = function() {
  goog.base(this, 'restoreState');

  this.visible_ = false;
  this.emitEvent(wtf.replay.graphics.Overdraw.EventType.VISIBILITY_CHANGED);
};
