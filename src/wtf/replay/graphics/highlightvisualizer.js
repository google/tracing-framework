/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HighlightVisualizer. Visualizer for draw call highlighting.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.HighlightVisualizer');

goog.require('goog.webgl');
goog.require('wtf.replay.graphics.OverdrawSurface');
goog.require('wtf.replay.graphics.OverdrawVisualizer');



/**
 * Visualizer for draw call highlighting using overdraw.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.replay.graphics.OverdrawVisualizer}
 */
wtf.replay.graphics.HighlightVisualizer = function(playback) {
  goog.base(this, playback);

  /**
   * If true, setup the stencil buffer for later draws to reference.
   * @type {boolean}
   * @private
   */
  this.firstDraw_ = true;
};
goog.inherits(wtf.replay.graphics.HighlightVisualizer,
    wtf.replay.graphics.OverdrawVisualizer);


/**
 * Returns whether the visualization for a target substep is stored.
 * @param {number} targetSubStepIndex Target substep.
 * @return {boolean} Whether the visualization is stored for a target substep.
 * @protected
 */
wtf.replay.graphics.HighlightVisualizer.prototype.visualizationStored =
    function(targetSubStepIndex) {
  // Highlight requires both the target and current substeps to match.
  var currentStepIndex = this.playback.getCurrentStepIndex();
  var currentSubStepIndex = this.playback.getSubStepEventIndex();

  return currentStepIndex == this.latestStepIndex &&
      targetSubStepIndex == this.latestTargetSubStepIndex &&
      currentSubStepIndex == this.latestSubStepIndex;
};


/**
 * Creates an OverdrawSurface and adds it to this.visualizerSurfaces.
 * @param {number|string} contextHandle Context handle from event arguments.
 * @param {!WebGLRenderingContext} gl The context.
 * @param {number} width The width of the surface.
 * @param {number} height The height of the surface.
 * @protected
 * @override
 */
wtf.replay.graphics.HighlightVisualizer.prototype.createSurface = function(
    contextHandle, gl, width, height) {
  var visualizerSurface = new wtf.replay.graphics.OverdrawSurface(gl,
      width, height, {stencil: true});
  this.visualizerSurfaces[contextHandle] = visualizerSurface;
  this.registerDisposable(visualizerSurface);
};


/**
 * Calls drawFunction onto the active visualizerSurface using custom GL state.
 * The caller of this function is responsible for restoring state.
 * @param {!function()} drawFunction The draw function to call.
 * @protected
 * @override
 */
wtf.replay.graphics.HighlightVisualizer.prototype.drawToSurface = function(
    drawFunction) {
  var contextHandle = this.latestContextHandle;
  var gl = this.contexts[contextHandle];

  // Do not edit calls where the target is not the visible framebuffer.
  var originalFramebuffer = /** @type {WebGLFramebuffer} */ (
      gl.getParameter(goog.webgl.FRAMEBUFFER_BINDING));
  if (originalFramebuffer != null) {
    return;
  }

  // Render with the highlight program into the visualizer surface.
  var visualizerSurface = this.visualizerSurfaces[contextHandle];
  visualizerSurface.bindFramebuffer();

  gl.enable(goog.webgl.BLEND);
  gl.blendFunc(goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA);
  gl.blendEquation(goog.webgl.FUNC_ADD);
  gl.enable(goog.webgl.STENCIL_TEST);
  if (this.firstDraw_) {
    gl.colorMask(true, true, true, true);
    gl.disable(goog.webgl.DEPTH_TEST);
    gl.disable(goog.webgl.CULL_FACE);
    // The stencil should already be cleared to all 0s.
    // Draw 1s into the stencil for the highlighted call.
    gl.stencilMask(0xff); // Allow writing to all bits in the buffer.
    gl.stencilFunc(goog.webgl.ALWAYS, 1, 0xff); // Always write 1.
    // Keep 0 on failure, replace with 1 on depth and stencil test success.
    gl.stencilOp(goog.webgl.KEEP, goog.webgl.KEEP, goog.webgl.REPLACE);
  } else {
    // Only draw where the stencil has a value of 1.
    gl.stencilFunc(goog.webgl.EQUAL, 1, 0xff);
    // Keep stencil buffer values no matter the test status.
    gl.stencilOp(goog.webgl.KEEP, goog.webgl.KEEP, goog.webgl.KEEP);
  }

  drawFunction();
};


/**
 * Runs visualization, manipulating playback and surfaces as needed.
 * @param {number} targetSubStepIndex Target subStep event index.
 * @protected
 * @override
 */
wtf.replay.graphics.HighlightVisualizer.prototype.trigger = function(
    targetSubStepIndex) {
  var playback = this.playback;
  var currentSubStepIndex = playback.getSubStepEventIndex();

  this.setupVisualization();

  // Seek to the substep event immediately before the target index.
  playback.seekSubStepEvent(targetSubStepIndex - 1);

  var contextHandle = this.latestContextHandle;
  // Finish early if there is no active context yet.
  if (!contextHandle) {
    this.completed = true;
    return;
  }

  // Perform the call at the target index.
  this.modifyDraws = true;
  this.firstDraw_ = true;
  playback.seekSubStepEvent(targetSubStepIndex);
  this.firstDraw_ = false;

  // If playback continues forward from here, continue modifying draw calls.
  // Otherwise, seek will go from the beginning, so do not modify draw calls.
  if (currentSubStepIndex <= targetSubStepIndex) {
    this.modifyDraws = false;
  }

  // Prevent resizing during seek, since that would destroy surface contents.
  for (contextHandle in this.contexts) {
    this.visualizerSurfaces[contextHandle].disableResize();
  }
  playback.seekSubStepEvent(currentSubStepIndex);
  this.modifyDraws = false;

  // Save current framebuffers as textures to restore when finished.
  for (contextHandle in this.contexts) {
    this.playbackSurfaces[contextHandle].captureTexture();
  }

  // Draw captured visualizer textures.
  for (contextHandle in this.contexts) {
    // Draw without thresholding to calculate overdraw.
    this.visualizerSurfaces[contextHandle].drawTexture(false);

    // Calculate overdraw and update the context's message.
    var stats = this.visualizerSurfaces[contextHandle].calculateOverdraw();
    if (stats) {
      var overdrawAmount;
      if (stats.numAffected < 0.001) {
        overdrawAmount = 0;
      } else {
        overdrawAmount = (stats.numOverdraw / stats.numAffected).toFixed(2);
      }

      var affectedPercent = stats.numAffected / stats.numPixels;
      affectedPercent = (affectedPercent * 100.0).toFixed(0);

      var message = 'Overdraw: ' + overdrawAmount + ', ' + affectedPercent +
          '% of screen';
      this.playback.changeContextMessage(contextHandle, message);
      this.latestMessages[contextHandle] = message;
    }

    this.playbackSurfaces[contextHandle].drawTexture(false);
    // Draw for display, with thresholding and blending (to not overwrite).
    this.visualizerSurfaces[contextHandle].drawOverdraw(true);
  }

  this.completed = true;
};


/**
 * Draws the recorded visualization for the provided context handle.
 * @param {number|string} contextHandle The context handle to draw to.
 * @protected
 * @override
 */
wtf.replay.graphics.HighlightVisualizer.prototype.drawVisualization = function(
    contextHandle) {
  this.visualizerSurfaces[contextHandle].drawOverdraw(true);
};
