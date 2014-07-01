/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview DrawCallVisualizer. Abstract Visualizer that uses draw calls.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.DrawCallVisualizer');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.webgl');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.replay.graphics.IVisualizer');
goog.require('wtf.replay.graphics.OffscreenSurface');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.WebGLState');



/**
 * Abstract class for a Visualizer that operates on draw calls.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.replay.graphics.IVisualizer}
 */
wtf.replay.graphics.DrawCallVisualizer = function(playback) {
  goog.base(this);

  /**
   * The playback instance. Manipulated when visualization is triggered.
   * @type {!wtf.replay.graphics.Playback}
   * @protected
   */
  this.playback = playback;

  /**
   * A mapping of handles to contexts.
   * Keys are context handles from event arguments.
   * @type {!Object.<!WebGLRenderingContext>}
   * @protected
   */
  this.contexts = {};

  /**
   * A mapping of handles to Programs.
   * Keys are program handles from event arguments.
   * @type {!Object.<!wtf.replay.graphics.Program>}
   * @protected
   */
  this.programs = {};

  /**
   * Surfaces for playback state, mapping of handles to OffscreenSurfaces.
   * Keys are context handles from event arguments.
   * @type {!Object.<!wtf.replay.graphics.OffscreenSurface>}
   * @protected
   */
  this.playbackSurfaces = {};

  /**
   * Surfaces for visualization, mapping of handles to OffscreenSurfaces.
   * Keys are context handles from event arguments.
   * @type {!Object.<!wtf.replay.graphics.OffscreenSurface>}
   * @protected
   */
  this.visualizerSurfaces = {};

  /**
   * WebGLStates for backup/restore, mapping of handles to WebGLStates.
   * Keys are context handles from event arguments.
   * @type {!Object.<!wtf.replay.graphics.WebGLState>}
   * @protected
   */
  this.webGLStates = {};

  /**
   * Whether this Visualizer is active.
   * @type {boolean}
   * @protected
   */
  this.active = false;

  /**
   * Whether draw calls should be modified.
   * @type {boolean}
   * @protected
   */
  this.modifyDraws = false;

  /**
   * Mapping from event names to functions. Shallow clone to support overrides.
   * @type {!Object.<wtf.replay.graphics.DrawCallVisualizer.Call>}
   */
  this.calls = goog.object.clone(wtf.replay.graphics.DrawCallVisualizer.CALLS);

  /**
   * The current context handle from event arguments.
   * @type {?number}
   * @protected
   */
  this.latestContextHandle = null;

  /**
   * The program handle from event arguments for the latest used program.
   * @type {number}
   * @protected
   */
  this.latestProgramHandle = 0;

  playback.addListener(
      wtf.replay.graphics.Playback.EventType.CLEAR_PROGRAMS,
      function() {
        this.clearPrograms_();
      }, this);
};
goog.inherits(wtf.replay.graphics.DrawCallVisualizer, wtf.events.EventEmitter);


/**
 * Calls callFunction if active.
 * @param {function()} callFunction The function Playback was to call.
 * @protected
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.callIfActive = function(
    callFunction) {
  if (this.active) {
    callFunction();
  }
};


/**
 * Handles the provided event. If active, calls callFunction.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 * @param {function()} callFunction The function Playback was to call.
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.handleEvent = function(
    it, gl, callFunction) {
  var associatedFunction = this.calls[it.getName()];
  if (associatedFunction) {
    associatedFunction.call(null, this, gl, it.getArguments(), callFunction);
  } else {
    this.callIfActive(callFunction);
  }
};


/**
 * @typedef {function(
 *     !wtf.replay.graphics.DrawCallVisualizer, WebGLRenderingContext,
 *         wtf.db.ArgumentData, function())}
 */
wtf.replay.graphics.DrawCallVisualizer.Call;


/**
 * A mapping from event names to functions.
 * @type {!Object.<wtf.replay.graphics.DrawCallVisualizer.Call>}
 */
wtf.replay.graphics.DrawCallVisualizer.CALLS = {
  'wtf.webgl#setContext': function(
      visualizer, gl, args, callFunction) {
    visualizer.callIfActive(callFunction);

    // Track contexts, update internal dimensions to match context parameters.
    var contextHandle = args['handle'];
    gl = visualizer.playback.getContext(contextHandle);
    var height = args['height'];
    var width = args['width'];

    if (visualizer.contexts[contextHandle]) {
      visualizer.playbackSurfaces[contextHandle].resize(width, height);
      visualizer.visualizerSurfaces[contextHandle].resize(width, height);
    } else {
      visualizer.contexts[contextHandle] = gl;

      var playbackSurface = new wtf.replay.graphics.OffscreenSurface(gl,
          width, height);
      visualizer.playbackSurfaces[contextHandle] = playbackSurface;
      visualizer.registerDisposable(playbackSurface);

      visualizer.createSurface(contextHandle, gl, width, height);

      var webGLState = new wtf.replay.graphics.WebGLState(gl);
      visualizer.webGLStates[contextHandle] = webGLState;
    }

    visualizer.latestContextHandle = contextHandle;
  },
  'WebGLRenderingContext#linkProgram': function(
      visualizer, gl, args, callFunction) {
    visualizer.callIfActive(callFunction);

    // Create variant programs whenever a program is linked.
    var programHandle = /** @type {number} */ (args['program']);
    var originalProgram = /** @type {WebGLProgram} */ (
        visualizer.playback.getObject(programHandle));
    goog.asserts.assert(originalProgram);

    // Programs can be linked multiple times. Avoid leaking objects.
    if (visualizer.programs[programHandle]) {
      visualizer.deleteProgram_(programHandle);
    }

    visualizer.createProgram(programHandle, originalProgram, gl);
  },
  'WebGLRenderingContext#useProgram': function(
      visualizer, gl, args, callFunction) {
    visualizer.callIfActive(callFunction);
    visualizer.latestProgramHandle = args['program'];
  },
  'WebGLRenderingContext#deleteProgram': function(
      visualizer, gl, args, callFunction) {
    visualizer.callIfActive(callFunction);
    visualizer.deleteProgram_(args['program']);
  },
  'WebGLRenderingContext#drawArrays': function(
      visualizer, gl, args, callFunction) {
    visualizer.handleDrawCall(callFunction);
  },
  'WebGLRenderingContext#drawElements': function(
      visualizer, gl, args, callFunction) {
    visualizer.handleDrawCall(callFunction);
  },
  'ANGLEInstancedArrays#drawArraysInstancedANGLE': function(
      visualizer, gl, args, callFunction) {
    visualizer.handleDrawCall(callFunction);
  },
  'ANGLEInstancedArrays#drawElementsInstancedANGLE': function(
      visualizer, gl, args, callFunction) {
    visualizer.handleDrawCall(callFunction);
  },
  'WebGLRenderingContext#clear': function(
      visualizer, gl, args, callFunction) {
    visualizer.callIfActive(callFunction);
  },
  'WebGLRenderingContext#finish': function(
      visualizer, gl, args, callFunction) {
    visualizer.callIfActive(callFunction);
  },
  'WebGLRenderingContext#flush': function(
      visualizer, gl, args, callFunction) {
    visualizer.callIfActive(callFunction);
  }
};


/**
 * Creates an OffscreenSurface and adds it to this.visualizerSurfaces.
 * @param {!number|string} contextHandle Context handle from event arguments.
 * @param {!WebGLRenderingContext} gl The context.
 * @param {number} width The width of the surface.
 * @param {number} height The height of the surface.
 * @protected
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.createSurface = function(
    contextHandle, gl, width, height) {
  var args = {};
  args['stencil'] = true;
  var visualizerSurface = new wtf.replay.graphics.OffscreenSurface(gl,
      width, height, args);
  this.visualizerSurfaces[contextHandle] = visualizerSurface;
  this.registerDisposable(visualizerSurface);
};


/**
 * Deletes the specified program.
 * @param {!number|string} programHandle Program handle from event arguments.
 * @private
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.deleteProgram_ = function(
    programHandle) {
  goog.dispose(this.programs[programHandle]);
  delete this.programs[programHandle];
};


/**
 * Deletes all stored programs.
 * @private
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.clearPrograms_ = function() {
  for (var programHandle in this.programs) {
    this.deleteProgram_(programHandle);
  }
};


/**
 * Create a Program with variants for originalProgram.
 * @param {number} programHandle Program handle from event arguments.
 * @param {!WebGLProgram} originalProgram The original program.
 * @param {!WebGLRenderingContext} gl The associated rendering context.
 * @protected
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.createProgram =
    goog.nullFunction;


/**
 * Handles performing a draw call and any additional logic.
 * @param {function()} drawFunction The draw function to call.
 * @protected
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.handleDrawCall = function(
    drawFunction) {
  if (!this.active) {
    return;
  }
  drawFunction();
};


/**
 * Runs visualization, manipulating playback and surfaces as needed.
 * @param {Object.<string, !Object>=} opt_args Visualizer trigger arguments.
 * @override
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.trigger = goog.nullFunction;


/**
 * Resets properties to a pre-visualization state.
 * @protected
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.reset = function() {
  this.active = false;
  this.modifyDraws = false;

  for (var handle in this.visualizerSurfaces) {
    this.visualizerSurfaces[handle].clear([0.0, 0.0, 0.0, 0.0]);
  }
};


/**
 * Restores state back to standard playback.
 * @override
 */
wtf.replay.graphics.DrawCallVisualizer.prototype.restoreState = function() {
  // Draw playback surfaces to the visible framebuffers.
  for (var contextHandle in this.contexts) {
    var gl = this.contexts[contextHandle];
    var originalFramebuffer = /** @type {WebGLFramebuffer} */ (
        gl.getParameter(goog.webgl.FRAMEBUFFER_BINDING));
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);

    this.playbackSurfaces[contextHandle].drawTexture();

    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, originalFramebuffer);

    this.playback.changeContextMessage(contextHandle, ' ');
  }

  this.active = false;
};
