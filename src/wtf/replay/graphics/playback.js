/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Playback. Represents a single playback of the animation.
 * Contains all objects and resources needed to play.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.Playback');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.fs');
goog.require('goog.object');
goog.require('goog.webgl');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.replay.graphics.ExtensionManager');
goog.require('wtf.replay.graphics.Step');
goog.require('wtf.replay.graphics.Visualizer');
goog.require('wtf.timing.util');



/**
 * Plays an animation once. Does not load or play immediately after
 * construction. Load must be manually called.
 *
 * @param {!wtf.db.EventList} eventList Event list for an entire animation.
 * @param {!wtf.db.FrameList} frameList Frame list for an entire animation.
 * @param {!wtf.replay.graphics.ContextPool} contextPool Pool of contexts.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.replay.graphics.Playback = function(eventList, frameList, contextPool) {
  goog.base(this);

  /**
   * List of events for an entire animation.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = eventList;

  /**
   * A mapping from event type IDs to functions.
   * @type {!Object.<!wtf.replay.graphics.Playback.Call_>}
   * @private
   */
  this.callLookupTable_ = this.constructCallLookupTable_();

  /**
   * List of steps for an entire animation.
   * @type {!Array.<!wtf.replay.graphics.Step>}
   * @private
   */
  this.steps_ = wtf.replay.graphics.Step.constructStepsList(
      eventList, frameList);

  /**
   * Set of event type IDs of draw calls.
   * @type {!Object.<number, boolean>}
   * @private
   */
  this.drawCallIds_ = this.getDrawCallIds_();

  /**
   * The index of the step that is about to be executed.
   * @type {number}
   * @private
   */
  this.currentStepIndex_ = 0;

  /**
   * A pool of contexts.
   * @type {!wtf.replay.graphics.ContextPool}
   * @private
   */
  this.contextPool_ = contextPool;

  /**
   * Cache of context attributes. Maps from context handles to attributes.
   * @type {!Object.<!WebGLContextAttributes>}
   * @private
   */
  this.contextAttributes_ = {};

  /**
   * A mapping of handles to contexts. Keys are context handles from event
   * arguments.
   * @type {!Object.<!WebGLRenderingContext>}
   * @private
   */
  this.contexts_ = {};

  /**
   * A mapping of event IDs to elements for resources such as images.
   * @type {!Object.<!Element>}
   * @private
   */
  this.resources_ = {};

  /**
   * A set of handles of cache-able programs. Keys are program handles from
   * event arguments.
   * @type {!Object.<boolean>}
   * @private
   */
  this.cacheableProgramHandles_ = {};

  /**
   * A cache of programs. Keys are program handles from event arguments.
   * @type {!Object.<!WebGLProgram>}
   * @private
   */
  this.programs_ = {};

  /**
   * Array of Visualizers. Add these using addVisualizer.
   * @type {!Array.<wtf.replay.graphics.Visualizer>}
   * @private
   */
  this.visualizers_ = [];

  /**
   * Array of Visualizer names corresponding to entries in this.visualizers_.
   * @type {!Array.<string>}
   * @private
   */
  this.visualizerNames_ = [];

  /**
   * Whether resources have finished loading. Set to true after a
   * {@see #fetchResources_} process finishes.
   * @type {boolean}
   * @private
   */
  this.resourcesDoneLoading_ = false;

  /**
   * The deferred for loading resources. Used in {@see #load}.
   * @type {goog.async.Deferred}
   * @private
   */
  this.loadDeferred_ = null;

  /**
   * A mapping of handles to WebGL objects.
   * @type {!Object.<!Object>}
   * @private
   */
  this.objects_ = {};

  /**
   * True if and only if the playback is playing.
   * @type {boolean}
   * @private
   */
  this.playing_ = false;

  /**
   * The ID of the event (relative to the step iterator) within a step. This is
   * the event that has just executed. -1 if no event in a step has executed.
   * @type {number}
   * @private
   */
  this.subStepId_ = -1;

  /**
   * Handler for animation request.
   * @type {?number}
   * @private
   */
  this.animationRequest_ = null;

  /**
   * The function for requesting an animation frame.
   * @type {?function(Function):(number|undefined)}
   * @private
   */
  this.requestAnimationFrame_ = wtf.timing.util.getRequestAnimationFrame();

  /**
   * The function for canceling an animation frame.
   * @type {?function(number): void}
   * @private
   */
  this.cancelAnimationFrame_ = wtf.timing.util.getCancelAnimationFrame();

  /**
   * Handler for setTimeout for preparing for a frame.
   * @type {?number}
   * @private
   */
  this.prepareFrameTimeout_ = null;

  /**
   * The current context.
   * @type {WebGLRenderingContext}
   * @private
   */
  this.currentContext_ = null;

  /**
   * Attribute values that override those of created contexts.
   * For example, setting 'preserveDrawingBuffer: true' will force the value to
   * true regardless of what the original recording specified.
   * @type {!Object}
   * @private
   */
  this.contextAttributeOverrides_ = {};

  /**
   * The extension manager.
   * @type {!wtf.replay.graphics.ExtensionManager}
   * @private
   */
  this.extensionManager_ =
      new wtf.replay.graphics.ExtensionManager(contextPool);
  this.registerDisposable(this.extensionManager_);
};
goog.inherits(wtf.replay.graphics.Playback, wtf.events.EventEmitter);


/**
 * Name of the property used to store an object's context.
 * @const
 * @type {string}
 * @private
 */
wtf.replay.graphics.Playback.GL_CONTEXT_PROPERTY_NAME_ = '__gl_context__';


/**
 * Events related to playing.
 * @enum {string}
 */
wtf.replay.graphics.Playback.EventType = {
  /**
   * Playback was reset.
   */
  RESET: goog.events.getUniqueId('reset'),

  /**
   * Playing began.
   */
  PLAY_BEGAN: goog.events.getUniqueId('play_began'),

  /**
   * A new step started during continuous playback.
   */
  STEP_STARTED: goog.events.getUniqueId('step_started'),

  /**
   * The current step changed.
   */
  STEP_CHANGED: goog.events.getUniqueId('step_changed'),

  /**
   * The event within the current step changed.
   */
  SUB_STEP_EVENT_CHANGED: goog.events.getUniqueId('sub_step_event_changed'),

  /**
   * A backwards seek was performed.
   */
  BACKWARDS_SEEK: goog.events.getUniqueId('backwards_seek'),

  /**
   * A new context was set. Has the context and its handle as its arguments.
   */
  CONTEXT_SET: goog.events.getUniqueId('context_set'),

  /**
   * Programs were cleared.
   */
  CLEAR_PROGRAMS: goog.events.getUniqueId('clear_programs'),

  /**
   * Playing stopped. Could be due to finishing the animation, pausing,
   * or resetting.
   */
  PLAY_STOPPED: goog.events.getUniqueId('play_stopped'),

  /**
   * A context message was changed.
   */
  CONTEXT_MESSAGE_CHANGED: goog.events.getUniqueId('context_message_changed'),

  /**
   * A Visualizer's continuous playback affecting state changed.
   */
  VISUALIZER_STATE_CHANGED: goog.events.getUniqueId('visualizer_state_changed')
};


/**
 * @override
 */
wtf.replay.graphics.Playback.prototype.disposeInternal = function() {
  if (this.loadDeferred_) {
    this.loadDeferred_.cancel();
  }

  // Make sure to clear cached objects too, lest we leak GPU memory.
  this.clearWebGlObjects_(true);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the current context attribute overrides.
 * @return {!Object} Attribute overrides.
 */
wtf.replay.graphics.Playback.prototype.getContextAttributeOverrides =
    function() {
  return goog.object.clone(this.contextAttributeOverrides_);
};


/**
 * Sets new context attribute overrides.
 * Changes only take effect after resetting the playback.
 * @param {!Object} value New override values.
 */
wtf.replay.graphics.Playback.prototype.setContextAttributeOverrides = function(
    value) {
  this.contextAttributeOverrides_ = goog.object.clone(value);
};


/**
 * Gets the event list this playback is using.
 * @return {!wtf.db.EventList} Event list.
 */
wtf.replay.graphics.Playback.prototype.getEventList = function() {
  return this.eventList_;
};


/**
 * Constructs a mapping from the IDs of event types to functions.
 * @return {!Object.<!wtf.replay.graphics.Playback.Call_>} An object mapping
 *     event type IDs to functions to call.
 * @private
 */
wtf.replay.graphics.Playback.prototype.constructCallLookupTable_ = function() {
  var eventTypes = this.eventList_.eventTypeTable.getAll();
  var lookupTable = {};
  for (var i = 0; i < eventTypes.length; ++i) {
    var call = wtf.replay.graphics.Playback.CALLS_[eventTypes[i].name];
    if (call) {
      lookupTable[eventTypes[i].id] = call;
    }
  }

  return lookupTable;
};


/**
 * Gets the set of draw call event IDs.
 * @return {!Object.<number, boolean>} A set of draw call event IDs.
 * @private
 */
wtf.replay.graphics.Playback.prototype.getDrawCallIds_ = function() {
  var namesOfDrawEvents = [
    'WebGLRenderingContext#clear',
    'WebGLRenderingContext#drawArrays',
    'WebGLRenderingContext#drawElements',
    'WebGLRenderingContext#finish',
    'WebGLRenderingContext#flush',
    'ANGLEInstancedArrays#drawArraysInstancedANGLE',
    'ANGLEInstancedArrays#drawElementsInstancedANGLE'
  ];
  var drawCallIds = {};
  var eventList = this.eventList_;
  for (var i = 0; i < namesOfDrawEvents.length; ++i) {
    var eventId = eventList.getEventTypeId(namesOfDrawEvents[i]);
    if (eventId >= 0) {
      drawCallIds[eventId] = true;
    }
  }
  return drawCallIds;
};


/**
 * Loads the playback. Should only be called once.
 * @return {!goog.async.Deferred} A deferred that loads the playback.
 */
wtf.replay.graphics.Playback.prototype.load = function() {
  // This function should only be called once.
  if (this.resourcesDoneLoading_) {
    throw new Error('Attempted to load twice.');
  }
  var deferred = new goog.async.Deferred();
  this.initialize_().addCallbacks(function() {
    this.fetchResources_().chainDeferred(deferred);
  }, function(e) {
    deferred.errback(e);
  }, this);
  this.loadDeferred_ = deferred;
  return deferred;
};


/**
 * Initializes the playback. Performs functions such as checking for
 * unsupported extensions and caching programs.
 * @return {!goog.async.Deferred} A deferred for initializing the playback.
 * @private
 */
wtf.replay.graphics.Playback.prototype.initialize_ = function() {
  var numUnsupportedExtensions = 0;
  var unsupportedExtensions = {};
  var getExtensionEventId =
      this.eventList_.getEventTypeId('WebGLRenderingContext#getExtension');
  var linkProgramEventId =
      this.eventList_.getEventTypeId('WebGLRenderingContext#linkProgram');
  var deleteProgramEventId =
      this.eventList_.getEventTypeId('WebGLRenderingContext#deleteProgram');

  // Track programs to cache.
  var visitedProgramHandles = {};
  var cacheableProgramHandles = {};

  for (var it = this.eventList_.begin(); !it.done(); it.next()) {
    var args = it.getArguments();
    var typeId = it.getTypeId();
    if (typeId == getExtensionEventId) {

      // Ignore getExtension calls that failed.
      if (!args['result']) {
        continue;
      }

      var extensionName = /** @type {string} */ (args['name']);
      var relatedExtensionName =
          this.extensionManager_.getRelatedExtension(extensionName);

      if (!relatedExtensionName) {
        // The extension and variants of it are not supported.
        if (!unsupportedExtensions[extensionName]) {
          unsupportedExtensions[extensionName] = true;
          ++numUnsupportedExtensions;
        }
      }
    } else if (typeId == linkProgramEventId) {
      var programHandle = args['program'];
      if (visitedProgramHandles[programHandle]) {
        // Do not cache a program that is linked more than once.
        delete cacheableProgramHandles[programHandle];
      } else {
        // New program linked. Cache it for now, and note that we visited it.
        cacheableProgramHandles[programHandle] = true;
        visitedProgramHandles[programHandle] = true;
      }
    } else if (typeId == deleteProgramEventId) {
      // Do not cache programs that are deleted at some point.
      delete cacheableProgramHandles[args['program']];
    }
  }

  this.cacheableProgramHandles_ = cacheableProgramHandles;

  // If any unsupported extensions, provide an error with a list of them.
  var deferred = new goog.async.Deferred();
  if (numUnsupportedExtensions) {
    var errorMessage = 'The following extension names are not supported: ';
    errorMessage +=
        goog.object.getKeys(unsupportedExtensions).join(', ') + '.';
    deferred.errback(new Error(errorMessage));
  } else {
    deferred.callback();
  }
  return deferred;
};


/**
 * Resets the playback to an initial state, from which playing can occur from
 * the beginning of the animation. First pauses playing if currently playing.
 */
wtf.replay.graphics.Playback.prototype.reset = function() {
  this.setToInitialState_();
  this.emitEvent(wtf.replay.graphics.Playback.EventType.RESET);
  this.emitEvent(wtf.replay.graphics.Playback.EventType.STEP_CHANGED);
};


/**
 * Sets playing to an initial state.
 * @private
 */
wtf.replay.graphics.Playback.prototype.setToInitialState_ = function() {
  this.clearWebGlObjects_();
  this.currentStepIndex_ = 0;
  this.subStepId_ = -1;
};


/**
 * Adds a new visualizer. The name provided is used by getVisualizer.
 * @param {!wtf.replay.graphics.Visualizer} visualizer The Visualizer.
 * @param {string} name The name for this Visualizer.
 */
wtf.replay.graphics.Playback.prototype.addVisualizer = function(
    visualizer, name) {
  this.visualizers_.push(visualizer);
  this.visualizerNames_.push(name);
  this.registerDisposable(visualizer);

  visualizer.addListener(wtf.replay.graphics.Visualizer.EventType.STATE_CHANGED,
      function() {
        this.emitEvent(
            wtf.replay.graphics.Playback.EventType.VISUALIZER_STATE_CHANGED);
      }, this);
};


/**
 * Gets all visualizers that have been added.
 * @return {!Array.<wtf.replay.graphics.Visualizer>} All visualizers.
 */
wtf.replay.graphics.Playback.prototype.getVisualizers = function() {
  return this.visualizers_;
};


/**
 * Gets a visualizer by the name used to add it with addVisualizer.
 * @param {string} name The name of the Visualizer.
 * @return {?wtf.replay.graphics.Visualizer} The Visualizer.
 */
wtf.replay.graphics.Playback.prototype.getVisualizer = function(name) {
  for (var i = 0; i < this.visualizers_.length; ++i) {
    if (this.visualizerNames_[i] == name) {
      return this.visualizers_[i];
    }
  }
  goog.global.console.log('Could not find a visualizer with name \'' + name +
      '\'.');
  return null;
};


/**
 * Runs a Visualizer with the given name at a substep of the current step.
 * @param {string} name Visualizer name.
 * @param {number=} opt_subStepIndex Target substep, or the current by default.
 */
wtf.replay.graphics.Playback.prototype.visualizeSubStep = function(
    name, opt_subStepIndex) {
  var visualizer = this.getVisualizer(name);
  if (visualizer) {
    visualizer.applyToSubStep(opt_subStepIndex);
  }
};


/**
 * Runs a Visualizer with the given name in continuous mode.
 * @param {string} name Visualizer name.
 */
wtf.replay.graphics.Playback.prototype.visualizeContinuous = function(name) {
  var visualizer = this.getVisualizer(name);
  if (visualizer) {
    visualizer.startContinuous();
  }
};


/**
 * Signals that visualizer state was changed.
 */
wtf.replay.graphics.Playback.prototype.triggerVisualizerChange = function() {
  this.emitEvent(
      wtf.replay.graphics.Playback.EventType.VISUALIZER_STATE_CHANGED);
};


/**
 * Resets all visualizers.
 */
wtf.replay.graphics.Playback.prototype.resetVisualizers = function() {
  for (var i = 0; i < this.visualizers_.length; ++i) {
    this.visualizers_[i].reset();
  }
  this.emitEvent(
      wtf.replay.graphics.Playback.EventType.VISUALIZER_STATE_CHANGED);
};


/**
 * Signals that the message for a context should be changed.
 * @param {string} contextHandle Context handle matching the context to update.
 * @param {string} message New message for the context.
 */
wtf.replay.graphics.Playback.prototype.changeContextMessage = function(
    contextHandle, message) {
  this.emitEvent(wtf.replay.graphics.Playback.EventType.CONTEXT_MESSAGE_CHANGED,
      contextHandle, message);
};


/**
 * Clears WebGL objects.
 * @param {boolean=} opt_clearCached True if cached programs should be cleared
 *     too. False by default.
 * @private
 */
wtf.replay.graphics.Playback.prototype.clearWebGlObjects_ = function(
    opt_clearCached) {
  if (this.isPlaying()) {
    this.pause();
  }

  // Clear resources on the GPU.
  for (var objectKey in this.objects_) {
    if (!this.programs_[objectKey] || opt_clearCached) {
      // Do not clear cached programs.
      this.clearGpuResource_(this.objects_[objectKey]);
    }
  }
  this.objects_ = {};

  // Release all the contexts.
  for (var contextKey in this.contexts_) {
    var ctx = this.contexts_[contextKey];
    goog.asserts.assert(ctx);
    this.contextPool_.releaseContext(ctx);
  }
  this.contexts_ = {};
};


/**
 * Clears the cache of programs. Useful when the cache has been invalidated.
 */
wtf.replay.graphics.Playback.prototype.clearProgramsCache = function() {
  var programs = this.programs_;
  for (var handle in programs) {
    this.clearGpuResource_(programs[handle]);
    delete this.objects_[handle];
  }
  this.programs_ = {};

  this.emitEvent(wtf.replay.graphics.Playback.EventType.CLEAR_PROGRAMS);
};


/**
 * Clears a GPU resource.
 * @param {Object} obj A GPU resource.
 * @private
 */
wtf.replay.graphics.Playback.prototype.clearGpuResource_ = function(obj) {
  if (!obj) {
    return;
  }
  var ctx = obj[wtf.replay.graphics.Playback.GL_CONTEXT_PROPERTY_NAME_];
  goog.asserts.assert(ctx);
  if (obj instanceof WebGLBuffer) {
    ctx.deleteBuffer(obj);
  } else if (obj instanceof WebGLFramebuffer) {
    ctx.deleteFramebuffer(obj);
  } else if (obj instanceof WebGLProgram) {
    // Reset the uniforms, and then delete the program.
    this.resetProgramUniforms_(obj);
    ctx.deleteProgram(obj);
  } else if (obj instanceof WebGLRenderbuffer) {
    ctx.deleteRenderbuffer(obj);
  } else if (obj instanceof WebGLShader) {
    ctx.deleteShader(obj);
  } else if (obj instanceof WebGLTexture) {
    ctx.deleteTexture(obj);
  } else if (obj.constructor.name == 'WebGLVertexArrayObjectOES') {
    ctx.getExtension('OES_vertex_array_object').deleteVertexArrayOES(obj);
  }
};


/**
 * Resets the uniforms of a program.
 * @param {!WebGLProgram} program WebGL program.
 * @private
 */
wtf.replay.graphics.Playback.prototype.resetProgramUniforms_ = function(
    program) {
  var context =
      program[wtf.replay.graphics.Playback.GL_CONTEXT_PROPERTY_NAME_];
  var uniformsCount =
      context.getProgramParameter(program, goog.webgl.ACTIVE_UNIFORMS);
  context.useProgram(program);
  for (var n = 0; n < uniformsCount; n++) {
    var uniformInfo = context.getActiveUniform(program, n);
    var uniformLocation =
        context.getUniformLocation(program, uniformInfo.name);
    var size = uniformInfo.size;
    switch (uniformInfo.type) {
      case goog.webgl.BOOL:
        context.uniform1i(uniformLocation, new Int32Array(size));
        break;
      case goog.webgl.BOOL_VEC2:
        context.uniform2iv(uniformLocation, new Int32Array(2 * size));
        break;
      case goog.webgl.BOOL_VEC3:
        context.uniform3iv(uniformLocation, new Int32Array(3 * size));
        break;
      case goog.webgl.INT:
        context.uniform1i(uniformLocation, new Int32Array(size));
        break;
      case goog.webgl.INT_VEC2:
        context.uniform2iv(uniformLocation, new Int32Array(2 * size));
        break;
      case goog.webgl.INT_VEC3:
        context.uniform3iv(uniformLocation, new Int32Array(3 * size));
        break;
      case goog.webgl.INT_VEC4:
        context.uniform4iv(uniformLocation, new Int32Array(4 * size));
        break;
      case goog.webgl.FLOAT:
        context.uniform1f(uniformLocation, new Float32Array(size));
        break;
      case goog.webgl.FLOAT_VEC2:
        context.uniform2fv(uniformLocation, new Float32Array(2 * size));
        break;
      case goog.webgl.FLOAT_VEC3:
        context.uniform3fv(uniformLocation, new Float32Array(3 * size));
        break;
      case goog.webgl.FLOAT_VEC4:
        context.uniform4fv(uniformLocation, new Float32Array(4 * size));
        break;
      case goog.webgl.FLOAT_MAT2:
        context.uniformMatrix2fv(
            uniformLocation, false, new Float32Array(4 * size));
        break;
      case goog.webgl.FLOAT_MAT3:
        context.uniformMatrix3fv(
            uniformLocation, false, new Float32Array(9 * size));
        break;
      case goog.webgl.FLOAT_MAT4:
        context.uniformMatrix4fv(
            uniformLocation, false, new Float32Array(16 * size));
        break;
      case goog.webgl.SAMPLER_2D:
        context.uniform1i(uniformLocation, new Int32Array(size));
        break;
      case goog.webgl.SAMPLER_CUBE:
        context.uniform1i(uniformLocation, new Int32Array(size));
        break;
      default:
        goog.asserts.fail('Unsupported uniform type.');
        break;
    }
  }

  context.useProgram(null);
};


/**
 * Plays from the beginning. Does not load resources before starting.
 */
wtf.replay.graphics.Playback.prototype.restart = function() {
  this.reset();
  this.play();
};


/**
 * Fetches all the resources needed for playback. Also checks for unsupported
 *     extensions and throws an event if there are any.
 * @return {!goog.async.Deferred} A promise to load resources.
 * @private
 */
wtf.replay.graphics.Playback.prototype.fetchResources_ = function() {
  // Make a promise to load some images.
  this.resourcesDoneLoading_ = false;
  var deferreds = [];

  // Get the type IDs of resource-loading events if they exist.
  var texImage2DEventId =
      this.eventList_.getEventTypeId('WebGLRenderingContext#texImage2D');
  var texSubImage2DEventId =
      this.eventList_.getEventTypeId('WebGLRenderingContext#texSubImage2D');

  // Add deferreds for loading each resource.
  var blobUrls = [];
  for (var it = this.eventList_.begin(); !it.done(); it.next()) {
    var typeId = it.getTypeId();
    if (typeId == texImage2DEventId || typeId == texSubImage2DEventId) {
      var args = it.getArguments();
      var dataType = args['dataType'];
      if (dataType == 'canvas') {
        // TODO(benvanik): use the canvas pool?
        var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
        canvas.width = args['width'];
        canvas.height = args['height'];
        var ctx = canvas.getContext('2d');
        var imageData = ctx.createImageData(args['width'], args['height']);
        var targetData = imageData.data;
        var sourceData = args['pixels'];
        if (targetData.set) {
          targetData.set(sourceData);
        } else {
          for (var n = 0; n < sourceData.length; n++) {
            targetData[n] = sourceData[n];
          }
        }
        ctx.putImageData(imageData, 0, 0);
        this.resources_[it.getId()] = canvas;
      } else if (dataType != 'pixels' && dataType != 'null') {
        var url;
        if (dataType.indexOf('image/') == 0) {
          url = goog.fs.createObjectUrl(
              new Blob([args['pixels']], {type: dataType}));
          blobUrls.push(url);
        } else {
          url = dataType;
        }
        deferreds.push(this.loadImage_(it.getId(), url));
      }
    }
  }

  // Check if the resource loads were successful.
  var deferredList = new goog.async.DeferredList(deferreds, false, false);
  var deferred = new goog.async.Deferred(deferredList.cancel, deferredList);
  deferredList.addCallback(function(results) {
    // Revoke blob URLs.
    for (var i = 0; i < blobUrls.length; ++i) {
      goog.fs.revokeObjectUrl(blobUrls[i]);
    }

    // Get number of resources that failed to load.
    var numFailed = 0;
    for (var i = 0; i < results.length; ++i) {
      if (!results[i]) {
        ++numFailed;
      }
    }

    // If any resources failed to load, call errback.
    if (numFailed) {
      deferred.errback(new Error(numFailed + ' resources failed to load.'));
    } else {
      deferred.callback();
    }

    // Let user know that resources have finished loading.
    this.resourcesDoneLoading_ = true;
  }, this);
  return deferred;
};


/**
 * Loads a single image from a URL.
 * @param {number} eventId the ID of the event.
 * @param {string} url The URL of the resource to load.
 * @return {!goog.async.Deferred} A deferred to load the image.
 * @private
 */
wtf.replay.graphics.Playback.prototype.loadImage_ = function(eventId, url) {
  var img = new Image();
  var deferred = new goog.async.Deferred(function() {
    img.src = '';
  });
  img.onload = function() {
    deferred.callback();
  };
  img.onerror = function() {
    deferred.errback(new Error('Image \'' + url + '\' failed to load.'));
  };
  img.src = url;
  this.resources_[eventId] = img;
  return deferred;
};


/**
 * Clears all timeouts and animation requests for playing frames.
 * @private
 */
wtf.replay.graphics.Playback.prototype.clearTimeouts_ = function() {
  var currentAnimationRequest = this.animationRequest_;
  if (currentAnimationRequest) {
    this.cancelAnimationFrame_(currentAnimationRequest);
    this.animationRequest_ = null;
  }
  var currentPrepareFrameRequest = this.prepareFrameTimeout_;
  if (currentPrepareFrameRequest) {
    goog.global.clearTimeout(currentPrepareFrameRequest);
    this.prepareFrameTimeout_ = null;
  }
};


/**
 * Begins playing starting at the current event. Must be called after all
 * resources have loaded. Can only be called if not currently playing.
 */
wtf.replay.graphics.Playback.prototype.play = function() {

  // Throw an exception if play was called while already playing.
  if (this.isPlaying()) {
    throw new Error('Play attempted while already playing.');
  }
  // Throw an exception if play was called before resources finished loading.
  if (!this.resourcesDoneLoading_) {
    throw new Error('Play attempted before resources finished loading.');
  }

  // Each play sequence gets a unique ID.
  this.playing_ = true;
  this.emitEvent(wtf.replay.graphics.Playback.EventType.PLAY_BEGAN);
  this.issueStep_();
};


/**
 * Gets whether playing is occuring.
 * @return {boolean} True if and only if playing is occuring.
 */
wtf.replay.graphics.Playback.prototype.isPlaying = function() {
  return this.playing_;
};


/**
 * Plays all the calls in a step and then subsequent steps.
 * @private
 */
wtf.replay.graphics.Playback.prototype.issueStep_ = function() {

  // If currently within a step, finish the step first.
  if (this.subStepId_ != -1) {
    var it = this.getCurrentStep().getEventIterator(true);
    it.seek(this.subStepId_);

    // This event has already been realized, so skip it.
    it.next();
    while (!it.done()) {
      this.realizeEvent_(it);
      it.next();
    }
    ++this.currentStepIndex_;
  }

  // Stop if we finished playing, paused, or a new play has occurred.
  if (this.currentStepIndex_ >= this.steps_.length || !this.playing_) {
    // Done playing.
    this.playing_ = false;
    this.emitEvent(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED);
    return;
  }

  var stepToPlayFrom = this.steps_[this.currentStepIndex_];
  var self = this;
  var handler = function() {
    self.emitEvent(wtf.replay.graphics.Playback.EventType.STEP_STARTED);
    self.subStepId_ = -1;
    for (var it = stepToPlayFrom.getEventIterator(); !it.done(); it.next()) {
      self.realizeEvent_(it);
    }
    ++self.currentStepIndex_;
    self.emitEvent(wtf.replay.graphics.Playback.EventType.STEP_CHANGED);
    self.issueStep_();
  };
  if (stepToPlayFrom.getFrame()) {
    this.animationRequest_ = /** @type {number} */
        (this.requestAnimationFrame_(handler));
  } else {
    this.prepareFrameTimeout_ = goog.global.setTimeout(handler, 0);
  }
};


/**
 * Pauses playing. Throws an error if not currently playing.
 */
wtf.replay.graphics.Playback.prototype.pause = function() {
  if (!this.isPlaying()) {
    throw new Error('Pause attempted while not playing.');
  }
  this.playing_ = false;
  this.clearTimeouts_();
  this.emitEvent(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED);
};


/**
 * Seeks to an event. Does not realize the event yet. A backwards seek will
 * trigger a release of contexts and other WebGL objects. Does not update the
 * current Step. Pauses before seek if not paused already.
 * @param {number} targetEventIndex Index of the event to seek.
 * @private
 */
wtf.replay.graphics.Playback.prototype.seekEvent_ = function(targetEventIndex) {
  if (this.isPlaying()) {
    this.pause();
  }

  var currentStep = this.getCurrentStep();
  if (!currentStep) {
    // We are at the end, so reset.
    this.setToInitialState_();
    currentStep = this.getCurrentStep();
  }

  // Compare event indices to determine which event came first.
  var currentIndex = currentStep.getStartEventId();
  var startIndex;
  if (currentIndex >= targetEventIndex) {
    // We are seeking to a previous step, so reset first.
    this.setToInitialState_();
    startIndex = this.getCurrentStep().getEventIterator().getIndex();
  } else {
    // We are seeking to a later step, so finish this one first.
    var subStepId = this.subStepId_;
    if (subStepId != -1) {
      var it = currentStep.getEventIterator(true);
      for (it.seek(subStepId + 1); !it.done(); it.next()) {
        this.realizeEvent_(it);
      }
      startIndex = currentStep.getEndEventId() + 1;
    } else {
      startIndex = currentStep.getEventIterator().getIndex();
    }
  }

  var currentEvent = this.eventList_.beginEventRange(
      startIndex, targetEventIndex);

  // The target event must come after the current event.
  while (!currentEvent.done()) {
    this.realizeEvent_(currentEvent);
    currentEvent.next();
  }
};


/**
 * Seeks to the start of a step, but does not run the events in the step.
 * Pauses before seek if not paused already. Can only be called after
 * resources have finished loading.
 * @param {number} index The index of the step from the beginning of the
 *     animation. The first step has index 0. A step consists of either the
 *     events within a frame or a continuous sequence of events outside of a
 *     frame.
 */
wtf.replay.graphics.Playback.prototype.seekStep = function(index) {
  if (!this.resourcesDoneLoading_) {
    throw new Error('Seek attempted before resources finished loading.');
  }

  var currentStepIndex = this.currentStepIndex_;
  var currentStepChanges = index != currentStepIndex;
  var isBackwardsSeek = index <= currentStepIndex;

  this.seekEvent_(this.steps_[index].getStartEventId());
  this.subStepId_ = -1;
  this.currentStepIndex_ = index;

  if (currentStepChanges) {
    this.emitEvent(wtf.replay.graphics.Playback.EventType.STEP_CHANGED);
  }

  if (isBackwardsSeek) {
    this.emitEvent(wtf.replay.graphics.Playback.EventType.BACKWARDS_SEEK);
  }
};


/**
 * Seeks to an event within a step. Does nothing if no current step.
 * @param {number} index The 0-based index of the event within the step.
 */
wtf.replay.graphics.Playback.prototype.seekSubStepEvent = function(index) {
  var currentStep = this.getCurrentStep();
  if (!currentStep || this.subStepId_ == index) {
    return;
  }

  var prevSubstepId = this.subStepId_;
  var isBackwardsSeek = prevSubstepId != -1 && index < prevSubstepId;

  // If backwards seek, go to beginning of frame.
  var it = currentStep.getEventIterator(true);
  if (isBackwardsSeek) {
    this.seekStep(this.currentStepIndex_);
  } else {
    // If not backwards seek, go to the point in a step at which we left off.
    it.seek(prevSubstepId + 1);
  }

  while (it.getIndex() <= index) {
    this.realizeEvent_(it);
    it.next();
  }

  this.subStepId_ = index;
  this.emitEvent(
      wtf.replay.graphics.Playback.EventType.SUB_STEP_EVENT_CHANGED);
};


/**
 * Gets the index of the substep event (which is 0-based from the first event
 * in the current step) or -1 if the substep event does not exist.
 * @return {number} The index of the substep event or -1 if it does not
 *     exist (It does not exist if we are not playing within a step or if we
 *     are at the very beginning of a step.).
 */
wtf.replay.graphics.Playback.prototype.getSubStepEventIndex = function() {
  return this.subStepId_;
};


/**
 * Seeks to the last call within the current step.
 */
wtf.replay.graphics.Playback.prototype.seekToLastCall = function() {
  var currentStep = this.getCurrentStep();
  if (!currentStep) {
    throw new Error('Seek to last call attempted with no current step.');
  }

  var it = currentStep.getEventIterator(true);
  var eventJustFinished = this.subStepId_;

  // Keep calling events in the step until the step is done.
  it.seek(eventJustFinished + 1);
  while (!it.done()) {
    this.realizeEvent_(it);
    it.next();
  }

  this.subStepId_ = it.getIndex() - 1;
  this.emitEvent(
      wtf.replay.graphics.Playback.EventType.SUB_STEP_EVENT_CHANGED);
};


/**
 * Returns whether a given EventIterator is at a draw call.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @return {boolean} True if 'it' is a draw call, false otherwise.
 */
wtf.replay.graphics.Playback.prototype.isDrawCall = function(it) {
  return this.drawCallIds_[it.getTypeId()];
};


/**
 * Seeks to the previous draw call within the current step. If no draw call is
 * before the current call within the step, seeks to the start of the step.
 */
wtf.replay.graphics.Playback.prototype.seekToPreviousDrawCall = function() {
  var currentStep = this.getCurrentStep();
  if (!currentStep) {
    throw new Error(
        'Seek to previous draw call attempted with no current step.');
  }

  var it = currentStep.getEventIterator(true);
  var eventJustFinishedIndex = this.subStepId_;

  if (eventJustFinishedIndex == -1) {
    // No draw call can be before the start of the step.
    return;
  }

  --eventJustFinishedIndex;
  while (eventJustFinishedIndex >= 0) {
    it.seek(eventJustFinishedIndex);
    if (this.isDrawCall(it)) {
      // Found a previous draw call. Seek to it.
      this.seekSubStepEvent(eventJustFinishedIndex);
      return;
    }
    --eventJustFinishedIndex;
  }

  // No previous draw call found. Seek to the start of the step.
  this.seekStep(this.getCurrentStepIndex());
  this.emitEvent(
      wtf.replay.graphics.Playback.EventType.SUB_STEP_EVENT_CHANGED);
};


/**
 * Seeks to the next draw call within the current step. If no draw is call left,
 * finishes running the step.
 */
wtf.replay.graphics.Playback.prototype.seekToNextDrawCall = function() {
  var currentStep = this.getCurrentStep();
  if (!currentStep) {
    throw new Error('Seek to next draw call attempted with no current step.');
  }

  var it = currentStep.getEventIterator(true);
  var eventJustFinished = this.subStepId_;

  // Keep calling events in the step until either the step is done or we
  // encounter a draw call.
  it.seek(eventJustFinished + 1);
  while (!it.done()) {
    this.realizeEvent_(it);
    if (this.isDrawCall(it)) {
      this.subStepId_ = it.getIndex();
      this.emitEvent(
          wtf.replay.graphics.Playback.EventType.SUB_STEP_EVENT_CHANGED);
      return;
    }
    it.next();
  }

  this.subStepId_ = it.getIndex() - 1;
  this.emitEvent(
      wtf.replay.graphics.Playback.EventType.SUB_STEP_EVENT_CHANGED);
};


/**
 * Gets the current step. Or null if no current step.
 * @return {wtf.replay.graphics.Step} The current step if it exists or null.
 */
wtf.replay.graphics.Playback.prototype.getCurrentStep = function() {
  return (this.currentStepIndex_ >= this.steps_.length) ?
      null : this.steps_[this.currentStepIndex_];
};


/**
 * Gets the index of the current step. Playing has stopped after the animation
 * is done if the index >= the total number of steps.
 * @return {number} The index of the current step.
 */
wtf.replay.graphics.Playback.prototype.getCurrentStepIndex = function() {
  return this.currentStepIndex_;
};


/**
 * Realizes the current event. Updates the current event and frame as events
 * are realized.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @private
 */
wtf.replay.graphics.Playback.prototype.realizeEvent_ = function(it) {
  var i;
  for (i = 0; i < this.visualizers_.length; ++i) {
    this.visualizers_[i].handlePreEvent(it, this.currentContext_);
  }

  var associatedFunction = this.callLookupTable_[it.getTypeId()];
  if (associatedFunction) {
    try {
      // If any handleReplaceEvent returns true, do not call the function.
      var skipCall = false;
      for (i = 0; i < this.visualizers_.length; ++i) {
        skipCall = skipCall ||
            this.visualizers_[i].handleReplaceEvent(it, this.currentContext_);
      }

      if (!skipCall) {
        associatedFunction.call(null, it.getId(), this, this.currentContext_,
            it.getArguments(), this.objects_);
      }
    } catch (e) {
      // TODO(benvanik): log to status bar? this usually happens with
      //     cross-origin texture uploads.
      goog.global.console.log('Error realizing event ' + it.getLongString() +
          ': ' + e);
    }
  }

  for (i = 0; i < this.visualizers_.length; ++i) {
    this.visualizers_[i].handlePostEvent(it, this.currentContext_);
  }
};


/**
 * Stores the context of a canvas-related object as a property of that object.
 * @param {!Object} obj The object to set the context of.
 * @param {!WebGLRenderingContext} ctx The context of the object.
 * @private
 */
wtf.replay.graphics.Playback.prototype.setOwningContext_ = function(
    obj, ctx) {
  obj[wtf.replay.graphics.Playback.GL_CONTEXT_PROPERTY_NAME_] = ctx;
};


/**
 * Gets a context by handle.
 * @param {string} contextHandle Context handle.
 * @return {WebGLRenderingContext} Rendering context, if found.
 */
wtf.replay.graphics.Playback.prototype.getContext = function(contextHandle) {
  return this.contexts_[contextHandle] || null;
};


/**
 * Gets the attributes of a context by handle.
 * This is the original set of attributes the context was created with, not
 * the ones used by the playback engine (which may differ).
 * @param {string} contextHandle Context handle.
 * @return {Object} Attributes.
 */
wtf.replay.graphics.Playback.prototype.getContextAttributes = function(
    contextHandle) {
  return this.contextAttributes_[contextHandle] || null;
};


/**
 * Gets an object associated with an event handle.
 * @param {string|number} objectHandle Object handle.
 * @return {Object} The object, or null if not found.
 */
wtf.replay.graphics.Playback.prototype.getObject = function(objectHandle) {
  return this.objects_[objectHandle] || null;
};


/**
 * Gets the number of steps.
 * @return {number} The number of steps.
 */
wtf.replay.graphics.Playback.prototype.getStepCount = function() {
  return this.steps_.length;
};


/**
 * Coerces a typed array into the proper format as required by WebGL.
 * Certain methods, like texImage2D, require the ArrayBufferView passed in to
 * be in the same type as the target texture.
 * @param {number} type WebGL data type.
 * @param {!(ArrayBuffer|ArrayBufferView)} source Source data.
 * @return {!ArrayBufferView} Array buffer view in the correct type.
 * @private
 */
wtf.replay.graphics.Playback.prototype.coercePixelType_ =
    function(type, source) {
  var buffer = source.buffer ? source.buffer : source;
  switch (type) {
    case goog.webgl.UNSIGNED_BYTE:
      return new Uint8Array(buffer);
    case goog.webgl.UNSIGNED_SHORT_5_6_5:
    case goog.webgl.UNSIGNED_SHORT_5_5_5_1:
    case goog.webgl.UNSIGNED_SHORT_4_4_4_4:
      return new Uint16Array(buffer);
    case goog.webgl.FLOAT:
      return new Float32Array(buffer);
    default:
      goog.asserts.fail('Unsupported texture type');
      return new Uint8Array(buffer);
  }
};


/**
 * @typedef {function(
 *     number, !wtf.replay.graphics.Playback, WebGLRenderingContext,
 *         wtf.db.ArgumentData, !Object.<!Object>)}
 * @private
 */
wtf.replay.graphics.Playback.Call_;


/**
 * A mapping from event names to functions.
 * @type {!Object.<wtf.replay.graphics.Playback.Call_>}
 * @private
 */
wtf.replay.graphics.Playback.CALLS_ = {
  'WebGLRenderingContext#attachShader': function(
      eventId, playback, gl, args, objs) {
    if (playback.programs_[args['program']]) {
      // Do not attach a shader if the program is cached.
      return;
    }

    gl.attachShader(
        /** @type {WebGLProgram} */ (objs[args['program']]),
        /** @type {WebGLShader} */ (objs[args['shader']]));
  },
  'WebGLRenderingContext#activeTexture': function(
      eventId, playback, gl, args, objs) {
    gl.activeTexture(args['texture']);
  },
  'WebGLRenderingContext#bindAttribLocation': function(
      eventId, playback, gl, args, objs) {
    gl.bindAttribLocation(
        /** @type {WebGLProgram} */ (objs[args['program']]),
        args['index'], args['name']);
    // TODO(chizeng): Figure out if we want to build a mapping.
    // addAttribToProgram(
    //     args['program'], args['index'], args['index']);
  },
  'WebGLRenderingContext#bindBuffer': function(
      eventId, playback, gl, args, objs) {
    gl.bindBuffer(
        args['target'], /** @type {WebGLBuffer} */ (objs[args['buffer']]));
  },
  'WebGLRenderingContext#bindFramebuffer': function(
      eventId, playback, gl, args, objs) {
    gl.bindFramebuffer(
        args['target'],
        /** @type {WebGLFramebuffer} */ (objs[args['framebuffer']]));
  },
  'WebGLRenderingContext#bindRenderbuffer': function(
      eventId, playback, gl, args, objs) {
    gl.bindRenderbuffer(
        args['target'],
        /** @type {WebGLRenderbuffer} */ (objs[args['renderbuffer']]));
  },
  'WebGLRenderingContext#bindTexture': function(
      eventId, playback, gl, args, objs) {
    gl.bindTexture(
        args['target'], /** @type {WebGLTexture} */ (objs[args['texture']]));
  },
  'WebGLRenderingContext#blendColor': function(
      eventId, playback, gl, args, objs) {
    gl.blendColor(
        args['red'], args['green'], args['blue'],
        args['alpha']);
  },
  'WebGLRenderingContext#blendEquation': function(
      eventId, playback, gl, args, objs) {
    gl.blendEquation(args['mode']);
  },
  'WebGLRenderingContext#blendEquationSeparate': function(
      eventId, playback, gl, args, objs) {
    gl.blendEquationSeparate(
        args['modeRGB'], args['modeAlpha']);
  },
  'WebGLRenderingContext#blendFunc': function(
      eventId, playback, gl, args, objs) {
    gl.blendFunc(args['sfactor'], args['dfactor']);
  },
  'WebGLRenderingContext#blendFuncSeparate': function(
      eventId, playback, gl, args, objs) {
    gl.blendFuncSeparate(
        args['srcRGB'], args['dstRGB'], args['srcAlpha'],
        args['dstAlpha']);
  },
  'WebGLRenderingContext#bufferData': function(
      eventId, playback, gl, args, objs) {
    var data = args['data'];
    // TODO(chizeng): Remove the length check after db is fixed.
    if (!data || data.byteLength != args['size']) {
      data = args['size'];
    }
    gl.bufferData(
        args['target'], data, args['usage']);
  },
  'WebGLRenderingContext#bufferSubData': function(
      eventId, playback, gl, args, objs) {
    gl.bufferSubData(
        args['target'], args['offset'], args['data']);
  },
  'WebGLRenderingContext#checkFramebufferStatus': function(
      eventId, playback, gl, args, objs) {
    gl.checkFramebufferStatus(args['target']);
  },
  'WebGLRenderingContext#clear': function(
      eventId, playback, gl, args, objs) {
    gl.clear(args['mask']);
  },
  'WebGLRenderingContext#clearColor': function(
      eventId, playback, gl, args, objs) {
    gl.clearColor(
        args['red'], args['green'], args['blue'],
        args['alpha']);
  },
  'WebGLRenderingContext#clearDepth': function(
      eventId, playback, gl, args, objs) {
    gl.clearDepth(args['depth']);
  },
  'WebGLRenderingContext#clearStencil': function(
      eventId, playback, gl, args, objs) {
    gl.clearStencil(args['s']);
  },
  'WebGLRenderingContext#colorMask': function(
      eventId, playback, gl, args, objs) {
    gl.colorMask(
        args['red'], args['green'], args['blue'],
        args['alpha']);
  },
  'WebGLRenderingContext#compileShader': function(
      eventId, playback, gl, args, objs) {
    gl.compileShader(
        /** @type {WebGLShader} */ (objs[args['shader']]));
  },
  'WebGLRenderingContext#compressedTexImage2D': function(
      eventId, playback, gl, args, objs) {
    gl.compressedTexImage2D(
        args['target'], args['level'], args['internalformat'],
        args['width'], args['height'], args['border'],
        args['data']);
  },
  'WebGLRenderingContext#compressedTexSubImage2D': function(
      eventId, playback, gl, args, objs) {
    gl.compressedTexSubImage2D(
        args['target'], args['level'], args['xoffset'],
        args['yoffset'], args['width'], args['height'],
        args['format'], args['data']);
  },
  'WebGLRenderingContext#copyTexImage2D': function(
      eventId, playback, gl, args, objs) {
    gl.copyTexImage2D(
        args['target'], args['level'], args['internalformat'],
        args['x'], args['y'], args['width'],
        args['height'], args['border']);
  },
  'WebGLRenderingContext#copyTexSubImage2D': function(
      eventId, playback, gl, args, objs) {
    gl.copyTexSubImage2D(
        args['target'], args['level'], args['xoffset'],
        args['yoffset'], args['x'], args['y'],
        args['width'], args['height']);
  },
  'WebGLRenderingContext#createBuffer': function(
      eventId, playback, gl, args, objs) {
    objs[args['buffer']] = gl.createBuffer();
    playback.setOwningContext_(objs[args['buffer']], gl);
  },
  'WebGLRenderingContext#createFramebuffer': function(
      eventId, playback, gl, args, objs) {
    objs[args['framebuffer']] = gl.createFramebuffer();
    playback.setOwningContext_(objs[args['framebuffer']], gl);
  },
  'WebGLRenderingContext#createRenderbuffer': function(
      eventId, playback, gl, args, objs) {
    objs[args['renderbuffer']] = gl.createRenderbuffer();
    playback.setOwningContext_(objs[args['renderbuffer']], gl);
  },
  'WebGLRenderingContext#createTexture': function(
      eventId, playback, gl, args, objs) {
    objs[args['texture']] = gl.createTexture();
    playback.setOwningContext_(objs[args['texture']], gl);
  },
  'WebGLRenderingContext#createProgram': function(
      eventId, playback, gl, args, objs) {
    if (playback.programs_[args['program']]) {
      // Use the cached program.
      objs[args['program']] = playback.programs_[args['program']];
    } else {
      var newProgram = gl.createProgram();
      playback.setOwningContext_(newProgram, gl);
      objs[args['program']] = newProgram;
    }

    playback.setOwningContext_(objs[args['program']], gl);
  },
  'WebGLRenderingContext#createShader': function(
      eventId, playback, gl, args, objs) {
    objs[args['shader']] = gl.createShader(args['type']);
    playback.setOwningContext_(objs[args['shader']], gl);
  },
  'WebGLRenderingContext#cullFace': function(
      eventId, playback, gl, args, objs) {
    gl.cullFace(args['mode']);
  },
  // And now, we have a slew of fxns that delete resources.
  'WebGLRenderingContext#deleteBuffer': function(
      eventId, playback, gl, args, objs) {
    gl.deleteBuffer(
        /** @type {WebGLBuffer} */ (objs[args['buffer']]));
  },
  'WebGLRenderingContext#deleteFramebuffer': function(
      eventId, playback, gl, args, objs) {
    gl.deleteFramebuffer(
        /** @type {WebGLFramebuffer} */ (objs[args['framebuffer']]));
  },
  'WebGLRenderingContext#deleteProgram': function(
      eventId, playback, gl, args, objs) {
    var programHandle = args['program'];
    gl.deleteProgram(
        /** @type {WebGLProgram} */ (objs[programHandle]));
    delete objs[programHandle];
  },
  'WebGLRenderingContext#deleteRenderbuffer': function(
      eventId, playback, gl, args, objs) {
    gl.deleteRenderbuffer(
        /** @type {WebGLRenderbuffer} */ (objs[args['renderbuffer']]));
  },
  'WebGLRenderingContext#deleteShader': function(
      eventId, playback, gl, args, objs) {
    gl.deleteShader(
        /** @type {WebGLShader} */ (objs[args['shader']]));
  },
  'WebGLRenderingContext#deleteTexture': function(
      eventId, playback, gl, args, objs) {
    gl.deleteTexture(
        /** @type {WebGLTexture} */ (objs[args['texture']]));
  },
  'WebGLRenderingContext#depthFunc': function(
      eventId, playback, gl, args, objs) {
    gl.depthFunc(args['func']);
  },
  'WebGLRenderingContext#depthMask': function(
      eventId, playback, gl, args, objs) {
    gl.depthMask(args['flag']);
  },
  'WebGLRenderingContext#depthRange': function(
      eventId, playback, gl, args, objs) {
    gl.depthRange(args['zNear'], args['zFar']);
  },
  'WebGLRenderingContext#detachShader': function(
      eventId, playback, gl, args, objs) {
    gl.detachShader(
        /** @type {WebGLProgram} */ (objs[args['program']]),
        /** @type {WebGLShader} */ (objs[args['shader']]));
  },
  'WebGLRenderingContext#disable': function(
      eventId, playback, gl, args, objs) {
    gl.disable(args['cap']);
  },
  'WebGLRenderingContext#disableVertexAttribArray': function(
      eventId, playback, gl, args, objs) {
    gl.disableVertexAttribArray(args['index']);
  },
  'WebGLRenderingContext#drawArrays': function(
      eventId, playback, gl, args, objs) {
    gl.drawArrays(
        args['mode'], args['first'], args['count']);
  },
  'WebGLRenderingContext#drawElements': function(
      eventId, playback, gl, args, objs) {
    gl.drawElements(
        args['mode'], args['count'], args['type'],
        args['offset']);
  },
  'WebGLRenderingContext#enable': function(
      eventId, playback, gl, args, objs) {
    gl.enable(args['cap']);
  },
  'WebGLRenderingContext#enableVertexAttribArray': function(
      eventId, playback, gl, args, objs) {
    gl.enableVertexAttribArray(args['index']);
  },
  'WebGLRenderingContext#finish': function(
      eventId, playback, gl, args, objs) {
    gl.finish();
  },
  'WebGLRenderingContext#flush': function(
      eventId, playback, gl, args, objs) {
    gl.flush();
  },
  'WebGLRenderingContext#framebufferRenderbuffer': function(
      eventId, playback, gl, args, objs) {
    gl.framebufferRenderbuffer(args['target'],
        args['attachment'], args['renderbuffertarget'],
        /** @type {WebGLRenderbuffer} */ (objs[args['renderbuffer']]));
  },
  'WebGLRenderingContext#framebufferTexture2D': function(
      eventId, playback, gl, args, objs) {
    gl.framebufferTexture2D(args['target'],
        args['attachment'], args['textarget'],
        /** @type {WebGLTexture} */ (objs[args['texture']]), args['level']);
  },
  'WebGLRenderingContext#frontFace': function(
      eventId, playback, gl, args, objs) {
    gl.frontFace(args['mode']);
  },
  'WebGLRenderingContext#generateMipmap': function(
      eventId, playback, gl, args, objs) {
    gl.generateMipmap(args['target']);
  },
  'WebGLRenderingContext#getActiveAttrib': function(
      eventId, playback, gl, args, objs) {
    // TODO(chizeng): modify playback to make it work with varying locations.
    gl.getActiveAttrib(
        /** @type {WebGLProgram} */ (objs[args['program']]), args['index']);
  },
  'WebGLRenderingContext#getActiveUniform': function(
      eventId, playback, gl, args, objs) {
    // maybe we must modify playback to obtain the new active uniform.
    gl.getActiveUniform(
        /** @type {WebGLProgram} */ (objs[args['program']]), args['index']);
  },
  'WebGLRenderingContext#getAttachedShaders': function(
      eventId, playback, gl, args, objs) {
    gl.getAttachedShaders(
        /** @type {WebGLProgram} */ (objs[args['program']]));
  },
  'WebGLRenderingContext#getAttribLocation': function(
      eventId, playback, gl, args, objs) {
    gl.getAttribLocation(
        /** @type {WebGLProgram} */ (objs[args['program']]), args['name']);
  },
  'WebGLRenderingContext#getBufferParameter': function(
      eventId, playback, gl, args, objs) {
    gl.getBufferParameter(
        args['target'], args['pname']);
  },
  'WebGLRenderingContext#getError': function(
      eventId, playback, gl, args, objs) {
    gl.getError();
  },
  'WebGLRenderingContext#getExtension': function(
      eventId, playback, gl, args, objs) {
    // TODO(chizeng): Possibly store the extension?
    var originalExtension = args['name'];
    var relatedExtension =
        playback.extensionManager_.getRelatedExtension(originalExtension);
    gl.getExtension(relatedExtension || originalExtension);
  },
  'WebGLRenderingContext#getParameter': function(
      eventId, playback, gl, args, objs) {
    gl.getParameter(args['pname']);
  },
  'WebGLRenderingContext#getFramebufferAttachmentParameter': function(
      eventId, playback, gl, args, objs) {
    gl.getFramebufferAttachmentParameter(
        args['target'], args['attachment'], args['pname']);
  },
  'WebGLRenderingContext#getProgramParameter': function(
      eventId, playback, gl, args, objs) {
    gl.getProgramParameter(
        /** @type {WebGLProgram} */ (objs[args['program']]), args['pname']);
  },
  'WebGLRenderingContext#getProgramInfoLog': function(
      eventId, playback, gl, args, objs) {
    gl.getProgramInfoLog(
        /** @type {WebGLProgram} */ (objs[args['program']]));
  },
  'WebGLRenderingContext#getRenderbufferParameter': function(
      eventId, playback, gl, args, objs) {
    gl.getRenderbufferParameter(
        args['target'], args['pname']);
  },
  'WebGLRenderingContext#getShaderParameter': function(
      eventId, playback, gl, args, objs) {
    gl.getShaderParameter(
        /** @type {WebGLShader} */ (objs[args['shader']]), args['pname']);
  },
  'WebGLRenderingContext#getShaderPrecisionFormat': function(
      eventId, playback, gl, args, objs) {
    gl.getShaderPrecisionFormat(
        args['shadertype'], args['precisiontype']);
  },
  'WebGLRenderingContext#getShaderInfoLog': function(
      eventId, playback, gl, args, objs) {
    gl.getShaderInfoLog(
        /** @type {WebGLShader} */ (objs[args['shader']]));
  },
  'WebGLRenderingContext#getShaderSource': function(
      eventId, playback, gl, args, objs) {
    gl.getShaderSource(
        /** @type {WebGLShader} */ (objs[args['shader']]));
  },
  'WebGLRenderingContext#getTexParameter': function(
      eventId, playback, gl, args, objs) {
    gl.getTexParameter(
        args['target'], args['pname']);
  },
  'WebGLRenderingContext#getUniform': function(
      eventId, playback, gl, args, objs) {
    gl.getUniform(
        /** @type {WebGLProgram} */ (objs[args['program']]),
        /** @type {WebGLUniformLocation} */ (objs[args['location']]));
  },
  'WebGLRenderingContext#getUniformLocation': function(
      eventId, playback, gl, args, objs) {
    // TODO(chizeng): Maybe playback must change because we need a mapping.
    objs[args['value']] = /** @type {!Object} */ (
        gl.getUniformLocation(/** @type {WebGLProgram} */ (
        objs[args['program']]), args['name']));
    if (objs[args['value']]) {
      playback.setOwningContext_(objs[args['value']], gl);
    }
  },
  'WebGLRenderingContext#getVertexAttrib': function(
      eventId, playback, gl, args, objs) {
    gl.getVertexAttrib(
        args['index'], args['pname']);
  },
  'WebGLRenderingContext#getVertexAttribOffset': function(
      eventId, playback, gl, args, objs) {
    gl.getVertexAttribOffset(
        args['index'], args['pname']);
  },
  'WebGLRenderingContext#hint': function(
      eventId, playback, gl, args, objs) {
    gl.hint(args['target'], args['mode']);
  },
  'WebGLRenderingContext#isBuffer': function(
      eventId, playback, gl, args, objs) {
    gl.isBuffer(
        /** @type {WebGLBuffer} */ (objs[args['buffer']]));
  },
  'WebGLRenderingContext#isEnabled': function(
      eventId, playback, gl, args, objs) {
    gl.isEnabled(args['cap']);
  },
  'WebGLRenderingContext#isFramebuffer': function(
      eventId, playback, gl, args, objs) {
    gl.isFramebuffer(
        /** @type {WebGLFramebuffer} */ (objs[args['framebuffer']]));
  },
  'WebGLRenderingContext#isProgram': function(
      eventId, playback, gl, args, objs) {
    gl.isProgram(
        /** @type {WebGLProgram} */ (objs[args['program']]));
  },
  'WebGLRenderingContext#isRenderbuffer': function(
      eventId, playback, gl, args, objs) {
    gl.isRenderbuffer(
        /** @type {WebGLRenderbuffer} */ (objs[args['renderbuffer']]));
  },
  'WebGLRenderingContext#isShader': function(
      eventId, playback, gl, args, objs) {
    gl.isShader(
        /** @type {WebGLShader} */ (objs[args['shader']]));
  },
  'WebGLRenderingContext#isTexture': function(
      eventId, playback, gl, args, objs) {
    gl.isTexture(
        /** @type {WebGLTexture} */ (objs[args['texture']]));
  },
  'WebGLRenderingContext#lineWidth': function(
      eventId, playback, gl, args, objs) {
    gl.lineWidth(args['width']);
  },
  'WebGLRenderingContext#linkProgram': function(
      eventId, playback, gl, args, objs) {
    var linkProgram = true;
    if (playback.cacheableProgramHandles_[args['program']]) {
      if (playback.programs_[args['program']]) {
        // Already cached program. No need to link.
        linkProgram = false;
        objs[args['program']] = playback.programs_[args['program']];
      } else {
        // Program was created, but not linked yet.
        playback.programs_[args['program']] = objs[args['program']];
      }
    }

    // Do all the attribute bindings, then link.
    var attribMap = args['attributes'];
    for (var attribName in attribMap) {
      gl.bindAttribLocation(
          /** @type {WebGLProgram} */ (objs[args['program']]),
          attribMap[attribName], attribName);
    }

    if (linkProgram) {
      // Link the program only if the program was not cached.
      gl.linkProgram(
          /** @type {WebGLProgram} */ (objs[args['program']]));
    }
  },
  'WebGLRenderingContext#pixelStorei': function(
      eventId, playback, gl, args, objs) {
    gl.pixelStorei(args['pname'], args['param']);
  },
  'WebGLRenderingContext#polygonOffset': function(
      eventId, playback, gl, args, objs) {
    gl.polygonOffset(
        args['factor'], args['units']);
  },
  'WebGLRenderingContext#readPixels': function(
      eventId, playback, gl, args, objs) {
    var pixels = new Uint8Array(args['size']);
    gl.readPixels(args['x'], args['y'],
        args['width'], args['height'], args['format'],
        args['type'], pixels);
  },
  'WebGLRenderingContext#renderbufferStorage': function(
      eventId, playback, gl, args, objs) {
    gl.renderbufferStorage(args['target'],
        args['internalformat'], args['width'], args['height']);
  },
  'WebGLRenderingContext#sampleCoverage': function(
      eventId, playback, gl, args, objs) {
    gl.sampleCoverage(
        args['value'], args['invert']);
  },
  'WebGLRenderingContext#scissor': function(
      eventId, playback, gl, args, objs) {
    gl.scissor(args['x'], args['y'],
        args['width'], args['height']);
  },
  'WebGLRenderingContext#shaderSource': function(
      eventId, playback, gl, args, objs) {
    gl.shaderSource(
        /** @type {WebGLShader} */ (objs[args['shader']]), args['source']);
  },
  'WebGLRenderingContext#stencilFunc': function(
      eventId, playback, gl, args, objs) {
    gl.stencilFunc(
        args['func'], args['ref'], args['mask']);
  },
  'WebGLRenderingContext#stencilFuncSeparate': function(
      eventId, playback, gl, args, objs) {
    gl.stencilFuncSeparate(
        args['face'], args['func'], args['ref'],
        args['mask']);
  },
  'WebGLRenderingContext#stencilMask': function(
      eventId, playback, gl, args, objs) {
    gl.stencilMask(args['mask']);
  },
  'WebGLRenderingContext#stencilMaskSeparate': function(
      eventId, playback, gl, args, objs) {
    gl.stencilMaskSeparate(
        args['face'], args['mask']);
  },
  'WebGLRenderingContext#stencilOp': function(
      eventId, playback, gl, args, objs) {
    gl.stencilOp(
        args['fail'], args['zfail'], args['zpass']);
  },
  'WebGLRenderingContext#stencilOpSeparate': function(
      eventId, playback, gl, args, objs) {
    gl.stencilOpSeparate(
        args['face'], args['fail'], args['zfail'],
        args['zpass']);
  },
  'WebGLRenderingContext#texImage2D': function(
      eventId, playback, gl, args, objs) {
    // TODO(chi): double check to ensure we covered all cases.
    // texImage2D is overloaded.

    var dataType = args['dataType'];
    if (dataType == 'pixels') {
      gl.texImage2D(
          args['target'],
          args['level'],
          args['internalformat'],
          args['width'],
          args['height'],
          args['border'],
          args['format'],
          args['type'],
          playback.coercePixelType_(args['type'], args['pixels'])
      );
    } else if (dataType == 'null') {
      gl.texImage2D(
          args['target'],
          args['level'],
          args['internalformat'],
          args['width'],
          args['height'],
          args['border'],
          args['format'],
          args['type'],
          null
      );
    } else {
      gl.texImage2D(
          args['target'],
          args['level'],
          args['internalformat'],
          args['format'],
          args['type'],
          /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */
          (playback.resources_[eventId])
      );
    }
  },
  'WebGLRenderingContext#texSubImage2D': function(
      eventId, playback, gl, args, objs) {
    var dataType = args['dataType'];
    if (dataType == 'pixels') {
      gl.texSubImage2D(
          args['target'],
          args['level'],
          args['xoffset'],
          args['yoffset'],
          args['width'],
          args['height'],
          args['format'],
          args['type'],
          playback.coercePixelType_(args['type'], args['pixels'])
      );
    } else if (dataType == 'null') {
      gl.texSubImage2D(
          args['target'],
          args['level'],
          args['xoffset'],
          args['yoffset'],
          args['width'],
          args['height'],
          args['format'],
          args['type'],
          null
      );
    } else {
      gl.texSubImage2D(
          args['target'],
          args['level'],
          args['xoffset'],
          args['yoffset'],
          args['format'],
          args['type'],
          /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */
          (playback.resources_[eventId])
      );
    }
  },
  'WebGLRenderingContext#texParameterf': function(
      eventId, playback, gl, args, objs) {
    gl.texParameterf(
        args['target'], args['pname'], args['param']);
  },
  'WebGLRenderingContext#texParameteri': function(
      eventId, playback, gl, args, objs) {
    gl.texParameteri(
        args['target'], args['pname'], args['param']);
  },
  'WebGLRenderingContext#uniform1f': function(
      eventId, playback, gl, args, objs) {
    gl.uniform1f(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x']);
  },
  'WebGLRenderingContext#uniform1fv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform1fv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniform1i': function(
      eventId, playback, gl, args, objs) {
    gl.uniform1i(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x']);
  },
  'WebGLRenderingContext#uniform1iv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform1iv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniform2f': function(
      eventId, playback, gl, args, objs) {
    gl.uniform2f(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x'], args['y']);
  },
  'WebGLRenderingContext#uniform2fv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform2fv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniform2i': function(
      eventId, playback, gl, args, objs) {
    gl.uniform2i(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x'], args['y']);
  },
  'WebGLRenderingContext#uniform2iv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform2iv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniform3f': function(
      eventId, playback, gl, args, objs) {
    gl.uniform3f(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x'], args['y'],
        args['z']);
  },
  'WebGLRenderingContext#uniform3fv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform3fv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniform3i': function(
      eventId, playback, gl, args, objs) {
    gl.uniform3i(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x'], args['y'], args['z']);
  },
  'WebGLRenderingContext#uniform3iv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform3iv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniform4f': function(
      eventId, playback, gl, args, objs) {
    gl.uniform4f(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x'], args['y'], args['z'],
        args['w']);
  },
  'WebGLRenderingContext#uniform4fv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform4fv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniform4i': function(
      eventId, playback, gl, args, objs) {
    gl.uniform4i(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['x'], args['y'], args['z'],
        args['w']);
  },
  'WebGLRenderingContext#uniform4iv': function(
      eventId, playback, gl, args, objs) {
    gl.uniform4iv(
        /** @type {WebGLUniformLocation} */ (
                  objs[args['location']]), args['v']);
  },
  'WebGLRenderingContext#uniformMatrix2fv': function(
      eventId, playback, gl, args, objs) {
    gl.uniformMatrix2fv(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['transpose'], args['value']);
  },
  'WebGLRenderingContext#uniformMatrix3fv': function(
      eventId, playback, gl, args, objs) {
    gl.uniformMatrix3fv(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['transpose'], args['value']);
  },
  'WebGLRenderingContext#uniformMatrix4fv': function(
      eventId, playback, gl, args, objs) {
    gl.uniformMatrix4fv(
        /** @type {WebGLUniformLocation} */ (
        objs[args['location']]), args['transpose'], args['value']);
  },
  'WebGLRenderingContext#useProgram': function(
      eventId, playback, gl, args, objs) {
    gl.useProgram(/** @type {WebGLProgram} */ (objs[args['program']]));
  },
  'WebGLRenderingContext#validateProgram': function(
      eventId, playback, gl, args, objs) {
    gl.validateProgram(/** @type {WebGLProgram} */ (objs[args['program']]));
  },
  'WebGLRenderingContext#vertexAttrib1fv': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib1fv(args['indx'], args['values']);
  },
  'WebGLRenderingContext#vertexAttrib2fv': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib2fv(args['indx'], args['values']);
  },
  'WebGLRenderingContext#vertexAttrib3fv': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib3fv(args['indx'], args['values']);
  },
  'WebGLRenderingContext#vertexAttrib4fv': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib4fv(args['indx'], args['values']);
  },
  'WebGLRenderingContext#vertexAttrib1f': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib1f(args['indx'], args['x']);
  },
  'WebGLRenderingContext#vertexAttrib2f': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib2f(args['indx'], args['x'], args['y']);
  },
  'WebGLRenderingContext#vertexAttrib3f': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib3f(args['indx'], args['x'], args['y'], args['z']);
  },
  'WebGLRenderingContext#vertexAttrib4f': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttrib4f(
        args['indx'], args['x'], args['y'], args['z'],
        args['w']);
  },
  'WebGLRenderingContext#vertexAttribPointer': function(
      eventId, playback, gl, args, objs) {
    gl.vertexAttribPointer(args['indx'],
        args['size'], args['type'], args['normalized'],
        args['stride'], args['offset']);
  },
  'WebGLRenderingContext#viewport': function(
      eventId, playback, gl, args, objs) {
    gl.viewport(args['x'], args['y'], args['width'], args['height']);
  },

  'ANGLEInstancedArrays#drawArraysInstancedANGLE': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('ANGLE_instanced_arrays');
    ext['drawArraysInstancedANGLE'](
        args['mode'], args['first'], args['count'], args['primcount']);
  },
  'ANGLEInstancedArrays#drawElementsInstancedANGLE': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('ANGLE_instanced_arrays');
    ext['drawElementsInstancedANGLE'](
        args['mode'], args['count'], args['type'], args['offset'],
        args['primcount']);
  },
  'ANGLEInstancedArrays#vertexAttribDivisorANGLE': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('ANGLE_instanced_arrays');
    ext['vertexAttribDivisorANGLE'](
        args['index'], args['divisor']);
  },

  'OESVertexArrayObject#createVertexArrayOES': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('OES_vertex_array_object');
    objs[args['arrayObject']] = ext.createVertexArrayOES();
    playback.setOwningContext_(objs[args['arrayObject']], gl);
  },
  'OESVertexArrayObject#deleteVertexArrayOES': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('OES_vertex_array_object');
    var vao = /** @type {Object} */ (objs[args['arrayObject']]);
    ext.deleteVertexArrayOES(vao);
  },
  'OESVertexArrayObject#isVertexArrayOES': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('OES_vertex_array_object');
    var vao = /** @type {Object} */ (objs[args['arrayObject']]);
    ext.isVertexArrayOES(vao);
  },
  'OESVertexArrayObject#bindVertexArrayOES': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('OES_vertex_array_object');
    var vao = /** @type {Object} */ (objs[args['arrayObject']]);
    ext.bindVertexArrayOES(vao);
  },

  'WebGLLoseContext#loseContext': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('WEBGL_lose_context');
    ext.loseContext();
  },
  'WebGLLoseContext#restoreContext': function(
      eventId, playback, gl, args, objs) {
    // TODO(benvanik): optimize extension fetch.
    var ext = gl.getExtension('WEBGL_lose_context');
    ext.restoreContext();
  },

  'wtf.webgl#createContext': function(eventId, playback, gl, args, objs) {
    var attributes = args['attributes'];
    var contextHandle = args['handle'];

    // Cache the attributes if there are any.
    if (attributes) {
      playback.contextAttributes_[contextHandle] = attributes;
    }
  },
  'wtf.webgl#setContext': function(eventId, playback, gl, args, objs) {
    var contextHandle = args['handle'];
    var height = args['height'];
    var width = args['width'];
    var attributes = playback.contextAttributes_[contextHandle] || null;

    gl = playback.contexts_[contextHandle];
    if (gl) {
      // If the context has already been made, alter its settings.
      gl.canvas.width = width;
      gl.canvas.height = height;
    } else {
      // Otherwise, make a new context.

      // Force overrides.
      var createAttributes = goog.object.clone(attributes || {});
      for (var key in playback.contextAttributeOverrides_) {
        if (playback.contextAttributeOverrides_[key] !== undefined) {
          createAttributes[key] = playback.contextAttributeOverrides_[key];
        }
      }

      // Assume that the context is a WebGL one for now.
      gl =
          playback.contextPool_.getContext(
              'webgl', createAttributes, width, height) ||
          playback.contextPool_.getContext(
              'experimental-webgl', createAttributes, width, height);

      if (!gl) {
        // WebGL is not supported.
        throw new Error('playback machine does not support WebGL.');
      }

      // Store the context.
      playback.contexts_[contextHandle] =
          /** @type {WebGLRenderingContext} */ (gl);
    }

    playback.currentContext_ = gl;
    gl.viewport(0, 0, width, height);

    playback.emitEvent(wtf.replay.graphics.Playback.EventType.CONTEXT_SET,
        gl, contextHandle);
  }
};
