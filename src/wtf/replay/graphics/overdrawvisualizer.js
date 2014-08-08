/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview OverdrawVisualizer. Abstract Visualizer for overdraw.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.OverdrawVisualizer');

goog.require('goog.webgl');
goog.require('wtf.replay.graphics.DrawCallVisualizer');
goog.require('wtf.replay.graphics.OverdrawSurface');
goog.require('wtf.replay.graphics.Program');



/**
 * Visualizer for overdraw.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.replay.graphics.DrawCallVisualizer}
 */
wtf.replay.graphics.OverdrawVisualizer = function(playback) {
  goog.base(this, playback);
};
goog.inherits(wtf.replay.graphics.OverdrawVisualizer,
    wtf.replay.graphics.DrawCallVisualizer);


/**
 * Adds mutators using registerMutator.
 * @protected
 * @override
 */
wtf.replay.graphics.OverdrawVisualizer.prototype.setupMutators = function() {
  goog.base(this, 'setupMutators');

  this.registerMutator('WebGLRenderingContext#clear', {
    post: function(visualizer, gl, args) {
      if (!visualizer.modifyDraws) {
        return;
      }

      var contextHandle = visualizer.latestContextHandle;
      var visualizerSurface = visualizer.visualizerSurfaces[contextHandle];
      var drawToSurfaceFunction = function() {
        visualizerSurface.drawQuad();
      };

      var webGLState = visualizer.webGLStates[contextHandle];
      webGLState.backup();

      // Force states to mimic clear behavior.
      gl.colorMask(true, true, true, true);
      gl.depthMask(false);
      gl.disable(goog.webgl.DEPTH_TEST);
      gl.disable(goog.webgl.CULL_FACE);
      gl.frontFace(goog.webgl.CCW);

      visualizer.drawToSurface(drawToSurfaceFunction);

      webGLState.restore();
    }
  });
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
wtf.replay.graphics.OverdrawVisualizer.prototype.createSurface = function(
    contextHandle, gl, width, height) {
  var visualizerSurface = new wtf.replay.graphics.OverdrawSurface(gl,
      width, height);
  this.visualizerSurfaces[contextHandle] = visualizerSurface;
  this.registerDisposable(visualizerSurface);
};


/**
 * Creates a Program object with a overdraw variant.
 * @param {number} programHandle Program handle from event arguments.
 * @param {!WebGLProgram} originalProgram The original program.
 * @param {!WebGLRenderingContext} gl The associated rendering context.
 * @protected
 * @override
 */
wtf.replay.graphics.OverdrawVisualizer.prototype.createProgram = function(
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
wtf.replay.graphics.OverdrawVisualizer.prototype.handleDrawCall = function(
    drawFunction) {
  var contextHandle = this.latestContextHandle;
  var programHandle = this.latestProgramHandle;

  if (!this.modifyDraws || !contextHandle || !programHandle) {
    return;
  }

  var program = this.programs[programHandle];
  var drawToSurfaceFunction = function() {
    program.drawWithVariant(drawFunction, 'overdraw');
  };

  var webGLState = this.webGLStates[contextHandle];
  webGLState.backup();

  var skipCallsVisualizer = this.playback.getVisualizer('skipCalls');
  if (!skipCallsVisualizer ||
      !skipCallsVisualizer.isProgramSkipped(programHandle)) {
    this.drawToSurface(drawToSurfaceFunction);
  }

  webGLState.restore();
};


/**
 * Calls drawFunction onto the active visualizerSurface using custom GL state.
 * The caller of this function is responsible for restoring state.
 * @param {!function()} drawFunction The draw function to call.
 * @protected
 */
wtf.replay.graphics.OverdrawVisualizer.prototype.drawToSurface =
    goog.nullFunction;


/**
 * Draws the recorded visualization for the provided context handle.
 * @param {number|string} contextHandle The context handle to draw to.
 * @protected
 * @override
 */
wtf.replay.graphics.OverdrawVisualizer.prototype.drawVisualization = function(
    contextHandle) {
  this.visualizerSurfaces[contextHandle].drawOverdraw(false);
};
