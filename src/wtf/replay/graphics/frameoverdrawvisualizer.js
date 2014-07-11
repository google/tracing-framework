/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview FrameOverdrawVisualizer. Visualizer for overdraw within an
 * entire frame. Shows overdraw from the start of the current frame up to a
 * target subStep.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.FrameOverdrawVisualizer');

goog.require('goog.webgl');
goog.require('wtf.replay.graphics.OverdrawVisualizer');



/**
 * Visualizer for overdraw within an entire frame.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.replay.graphics.OverdrawVisualizer}
 */
wtf.replay.graphics.FrameOverdrawVisualizer = function(playback) {
  goog.base(this, playback);
};
goog.inherits(wtf.replay.graphics.FrameOverdrawVisualizer,
    wtf.replay.graphics.OverdrawVisualizer);


/**
 * Calls drawFunction onto the active visualizerSurface using custom GL state.
 * The caller of this function is responsible for restoring state.
 * @param {!function()} drawFunction The draw function to call.
 * @protected
 * @override
 */
wtf.replay.graphics.FrameOverdrawVisualizer.prototype.drawToSurface = function(
    drawFunction) {
  var contextHandle = this.latestContextHandle;
  var gl = this.contexts[contextHandle];

  // Do not edit calls where the target is not the visible framebuffer.
  var originalFramebuffer = /** @type {WebGLFramebuffer} */ (
      gl.getParameter(goog.webgl.FRAMEBUFFER_BINDING));
  if (originalFramebuffer != null) {
    return;
  }

  var visualizerSurface = this.visualizerSurfaces[contextHandle];
  visualizerSurface.bindFramebuffer();

  gl.enable(goog.webgl.BLEND);
  gl.blendFunc(goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA);
  gl.blendEquation(goog.webgl.FUNC_ADD);
  // TODO(scotttodd): Add an option to not force this color mask?
  // Include draws to non-visible buffers in overdraw.
  gl.colorMask(true, true, true, true);

  drawFunction();
};


/**
 * Runs visualization, manipulating playback and surfaces as needed.
 * @param {number} targetSubStepIndex Target subStep event index.
 * @protected
 * @override
 */
wtf.replay.graphics.FrameOverdrawVisualizer.prototype.trigger = function(
    targetSubStepIndex) {
  this.setupVisualization();

  var contextHandle = this.latestContextHandle;
  // Finish early if there is no active context yet.
  if (!contextHandle) {
    this.completed = true;
    return;
  }

  this.modifyDraws = true;
  this.playback.seekSubStepEvent(targetSubStepIndex);
  this.modifyDraws = false;

  for (contextHandle in this.contexts) {
    var gl = this.contexts[contextHandle];
    var originalFramebuffer = /** @type {WebGLFramebuffer} */ (
        gl.getParameter(goog.webgl.FRAMEBUFFER_BINDING));
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);

    this.playbackSurfaces[contextHandle].captureTexture();

    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, originalFramebuffer);
  }

  for (contextHandle in this.contexts) {
    // Draw without thresholding to calculate overdraw.
    this.visualizerSurfaces[contextHandle].drawTexture(false);

    // Calculate overdraw and update the context's message.
    var stats = this.visualizerSurfaces[contextHandle].calculateOverdraw();
    if (stats) {
      var overdrawAmount = stats.numOverdraw / stats.numPixels;
      overdrawAmount = overdrawAmount.toFixed(2);

      var message = 'Overdraw: ' + overdrawAmount;
      this.playback.changeContextMessage(contextHandle, message);
      this.latestMessages[contextHandle] = message;
    }

    // Draw with thresholding for display.
    this.drawVisualization(contextHandle);

    this.visualizerSurfaces[contextHandle].disableResize();
    this.playbackSurfaces[contextHandle].disableResize();
  }

  this.completed = true;
};
