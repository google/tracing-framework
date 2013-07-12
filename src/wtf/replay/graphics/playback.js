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
goog.require('goog.events');
goog.require('goog.fs');
goog.require('goog.object');
goog.require('goog.webgl');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.replay.graphics.Step');
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
   * List of steps for an entire animation.
   * @type {!Array.<!wtf.replay.graphics.Step>}
   * @private
   */
  this.steps_ = this.constructStepsList_(eventList, frameList);

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
   * A mapping of handles to contexts.
   * @type {!Object.<WebGLRenderingContext>}
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
   * the event that has just executed. null if no event in a step has executed.
   * @type {?number}
   * @private
   */
  this.subStepId_ = null;

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
   * The set of supported extensions.
   * @type {!Object.<boolean>}
   * @private
   */
  this.supportedExtensions_ = this.getSupportedExtensions_();
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
   * The current step changed.
   */
  STEP_CHANGED: goog.events.getUniqueId('step_changed'),

  /**
   * A backwards seek was performed.
   */
  BACKWARDS_SEEK: goog.events.getUniqueId('backwards_seek'),

  /**
   * A context was created. Has the context and its handle as its arguments.
   */
  CONTEXT_CREATED: goog.events.getUniqueId('context_created'),

  /**
   * A canvas was resized. Has the context of the canvas.
   */
  CANVAS_RESIZED: goog.events.getUniqueId('canvas_resized'),

  /**
   * Playing stopped. Could be due to finishing the animation, pausing,
   * or resetting.
   */
  PLAY_STOPPED: goog.events.getUniqueId('play_stopped'),

  /**
   * Resources finished loading.
   */
  RESOURCES_DONE: goog.events.getUniqueId('resources_done')
};


/**
 * @override
 */
wtf.replay.graphics.Playback.prototype.disposeInternal = function() {
  if (this.loadDeferred_) {
    this.loadDeferred_.cancel();
  }
  this.clearWebGLObjects_();
  goog.base(this, 'disposeInternal');
};


/**
 * Gets a set of supported extensions.
 * @return {!Object.<boolean>} An object whose keys are the supported
 *     extensions.
 * @private
 */
wtf.replay.graphics.Playback.prototype.getSupportedExtensions_ = function() {
  var webglContext = this.contextPool_.getContext('webgl') ||
      this.contextPool_.getContext('experimental-webgl');
  var supportedExtensions =
      goog.object.createSet(webglContext.getSupportedExtensions());
  this.contextPool_.releaseContext(webglContext);
  return supportedExtensions;
};


/**
 * Constructs a list of steps.
 * @param {!wtf.db.EventList} eventList A list of events.
 * @param {!wtf.db.FrameList} frameList A list of frames.
 * @return {!Array.<!wtf.replay.graphics.Step>} A list of steps.
 * @private
 */
wtf.replay.graphics.Playback.prototype.constructStepsList_ = function(
    eventList, frameList) {
  var steps = [];
  if (!eventList.getCount()) {
    return steps;
  }

  // Get the IDs for start/end frame events if those IDs exist.
  var frameStartEventId =
      this.getEventTypeId_(eventList, 'wtf.timing#frameStart');
  var frameEndEventId =
      this.getEventTypeId_(eventList, 'wtf.timing#frameEnd');
  var contextCreatedEventId =
      this.getEventTypeId_(eventList, 'wtf.webgl#createContext');

  var it = eventList.begin();
  var currentStartId = it.getId();
  var currentEndId = currentStartId;
  var currentFrame = (frameList.getCount()) ?
      frameList.getAllFrames()[0] : null;
  var noEventsForPreviousStep = true; // Ensure no empty steps are made.

  // Keep track of the handles of contexts that are made.
  var contextsMade = {};
  var contextsMadeSoFar = {};
  while (!it.done()) {
    var currentEventTypeId = it.getTypeId();
    if (currentEventTypeId == frameStartEventId) {
      // Only store previous step if it has at least 1 event.
      if (!noEventsForPreviousStep) {
        var contexts = goog.object.clone(contextsMade);
        steps.push(new wtf.replay.graphics.Step(
            eventList, currentStartId, currentEndId, null, contexts));
        contextsMade = goog.object.clone(contextsMadeSoFar);
      }
      currentStartId = it.getId();
      it.next();
    } else if (currentEventTypeId == frameEndEventId) {
      // Include the end frame event in the step for drawing the frame.
      var contexts = goog.object.clone(contextsMade);
      steps.push(new wtf.replay.graphics.Step(
          eventList, currentStartId, it.getId(), currentFrame, contexts));
      contextsMade = goog.object.clone(contextsMadeSoFar);
      noEventsForPreviousStep = true;
      if (currentFrame) {
        currentFrame = frameList.getNextFrame(currentFrame);
      }
      it.next();
      if (!it.done()) {
        currentStartId = it.getId();
      }
    } else if (currentEventTypeId == contextCreatedEventId) {
      // A new context was made. Include it in the current step.
      contextsMadeSoFar[it.getArgument('handle')] = true;
      it.next();
    } else {
      currentEndId = it.getId();
      noEventsForPreviousStep = false; // This step has at least 1 event.
      it.next();
    }
  }

  // Store any events still left if there are any.
  if (!noEventsForPreviousStep) {
    steps.push(new wtf.replay.graphics.Step(
        eventList, currentStartId, currentEndId, null));
  }
  return steps;
};


/**
 * Gets the ID of an event type or -1 if the event type never surfaces in the
 * desired event list.
 * @param {!wtf.db.EventList} eventList Event list.
 * @param {string} eventName The name of the event type.
 * @return {number} The ID of the event type or -1 if the event never appears.
 * @private
 */
wtf.replay.graphics.Playback.prototype.getEventTypeId_ = function(
    eventList, eventName) {
  var eventType = eventList.eventTypeTable.getByName(eventName);
  return (eventType) ? eventType.id : -1;
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
  this.checkExtensions_().addCallbacks(function() {
    this.fetchResources_().chainDeferred(deferred);
  }, function(e) {
    deferred.errback(e);
  }, this);
  this.loadDeferred_ = deferred;
  return deferred;
};


/**
 * Issues an error that lists unsupported extensions if there are any.
 * @return {!goog.async.Deferred} A deferred for checking extensions.
 * @private
 */
wtf.replay.graphics.Playback.prototype.checkExtensions_ = function() {
  var numUnsupportedExtensions = 0;
  var unsupportedExtensions = {};
  var getExtensionEventId =
      this.getEventTypeId_(
          this.eventList_, 'WebGLRenderingContext#getExtension');

  for (var it = this.eventList_.begin(); !it.done(); it.next()) {
    if (it.getTypeId() == getExtensionEventId) {
      var extensionName = it.getArgument('name');
      if (!this.supportedExtensions_[extensionName]) {
        if (!unsupportedExtensions[extensionName]) {
          unsupportedExtensions[extensionName] = true;
          ++numUnsupportedExtensions;
        }
      }
    }
  }

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
  this.clearWebGLObjects_();
  this.currentStepIndex_ = 0;
};


/**
 * Clears WebGL objects.
 * @private
 */
wtf.replay.graphics.Playback.prototype.clearWebGLObjects_ = function() {
  if (this.isPlaying()) {
    this.pause();
  }

  // Clear resources on the GPU.
  for (var objectKey in this.objects_) {
    this.clearGPUResource_(this.objects_[objectKey]);
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
 * Clears a GPU resource.
 * @param {Object} obj A GPU resource.
 * @private
 */
wtf.replay.graphics.Playback.prototype.clearGPUResource_ = function(obj) {
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
    ctx.deleteProgram(obj);
  } else if (obj instanceof WebGLRenderbuffer) {
    ctx.deleteRenderbuffer(obj);
  } else if (obj instanceof WebGLShader) {
    ctx.deleteShader(obj);
  } else if (obj instanceof WebGLTexture) {
    ctx.deleteTexture(obj);
  }
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
      this.getEventTypeId_(
          this.eventList_, 'WebGLRenderingContext#texImage2D');
  var texSubImage2DEventId =
      this.getEventTypeId_(
          this.eventList_, 'WebGLRenderingContext#texSubImage2D');

  // Add deferreds for loading each resource.
  var blobUrls = [];
  for (var it = this.eventList_.begin(); !it.done(); it.next()) {
    var typeId = it.getTypeId();
    if (typeId == texImage2DEventId || typeId == texSubImage2DEventId) {
      var args = it.getArguments();
      var dataType = args['dataType'];
      if (dataType != 'pixels' && dataType != 'null') {
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
    this.emitEvent(
        wtf.replay.graphics.Playback.EventType.RESOURCES_DONE);
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
  // Stop if we finished playing, paused, or a new play has occurred.
  if (this.currentStepIndex_ >= this.steps_.length || !this.playing_) {
    // Done playing.
    this.playing_ = false;
    this.emitEvent(wtf.replay.graphics.Playback.EventType.PLAY_STOPPED);
    return;
  }

  // If currently within a step, finish the step first.
  if (this.subStepId_ !== null) {
    var it = this.getCurrentStep().getEventIterator();
    for (var i = 0; i <= this.subStepId_; ++i) {
      it.next();
    }
    while (!it.done()) {
      this.realizeEvent_(it);
      it.next();
    }
    ++this.currentStepIndex_;
  }

  var stepToPlayFrom = this.steps_[this.currentStepIndex_];
  var self = this;
  var handler = function() {
    self.subStepId_ = null;
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
 * @param {number} targetEventId ID of the event to seek.
 * @private
 */
wtf.replay.graphics.Playback.prototype.seekEvent_ = function(targetEventId) {
  if (this.isPlaying()) {
    this.pause();
  }
  var currentStep = this.getCurrentStep();
  if (!currentStep || currentStep.getStartEventId() >= targetEventId) {
    this.setToInitialState_(); // Backwards seek, so reset.
    currentStep = this.getCurrentStep();
  }
  var currentEvent = this.eventList_.beginEventRange(
      currentStep.getStartEventId(), this.eventList_.getCount() - 1);
  // TODO(chizeng): Fix this comparison of event Ids.
  while (currentEvent.getId() != targetEventId) {
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
  var previousStepIndex = this.currentStepIndex_;
  this.seekEvent_(this.steps_[index].getStartEventId());
  this.subStepId_ = null;
  this.currentStepIndex_ = index;
  if (index != previousStepIndex) {
    this.emitEvent(wtf.replay.graphics.Playback.EventType.STEP_CHANGED);
    if (index < previousStepIndex) {
      this.emitEvent(wtf.replay.graphics.Playback.EventType.BACKWARDS_SEEK);
    }
  }
};


/**
 * Seeks to an event within a step. Does nothing if no current step.
 * @param {number} index The 0-based index of the event within the step.
 */
wtf.replay.graphics.Playback.prototype.seekSubStepEvent = function(index) {
  var currentStep = this.getCurrentStep();
  if (!currentStep) {
    return;
  }

  // If seeking backwards, go to the beginning of the step first.
  var it = currentStep.getEventIterator();
  var startEventId;
  if (index < this.subStepId_) {
    this.seekStep(this.getCurrentStepIndex());
    startEventId = 0;
    this.emitEvent(wtf.replay.graphics.Playback.EventType.BACKWARDS_SEEK);
  } else {
    startEventId = this.subStepId_ + 1;

    // Do not rely on the event ID, so manually plow forward a few events.
    for (var i = 0; i < startEventId; ++i) {
      it.next();
    }
  }

  for (var i = startEventId; i <= index; ++i) {
    this.realizeEvent_(it);
    it.next();
  }
  this.subStepId_ = index;
};


/**
 * Gets the 0-based index of the substep event ID.
 * @return {?number} The index of the substep event ID or null if it does not
 *     exist (It does not exist if we are no playing within a step.).
 */
wtf.replay.graphics.Playback.prototype.getSubStepEventId = function() {
  return this.subStepId_;
};


/**
 * Seeks to an event within the current step. The event ID is relative to the
 * event iterator returned by {@see getEventIterator} of the step. Can only
 * be called if the current step exists (We are not at the very end.).
 * @param {number} index [description].
 */
wtf.replay.graphics.Playback.prototype.seekToEventInStep = function(index) {
  var eventIterator = this.getCurrentStep().getEventIterator();
  this.seekStep(this.currentStepIndex_);
  while (eventIterator.getId() != index) {
    this.realizeEvent_(eventIterator);
    eventIterator.next();
  }
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
  // TODO(chizeng): Realize current event. Update the current event and the
  // current frame as we do so.
  // argument data.
  var args = it.getArguments();
  var objs = this.objects_;
  var currentContext = this.currentContext_;

  // parse functions and arguments.
  switch (it.getName()) {
    case 'WebGLRenderingContext#attachShader':
      currentContext.attachShader(
          /** @type {WebGLProgram} */ (objs[args['program']]),
          /** @type {WebGLShader} */ (objs[args['shader']]));
      break;
    case 'WebGLRenderingContext#activeTexture':
      currentContext.activeTexture(args['texture']);
      break;
    case 'WebGLRenderingContext#bindAttribLocation':
      currentContext.bindAttribLocation(
          /** @type {WebGLProgram} */ (objs[args['program']]),
          args['index'], args['name']);
      // TODO(chizeng): Figure out if we want to build a mapping.
      // addAttribToProgram(
      //     args['program'], args['index'], args['index']);
      break;
    case 'WebGLRenderingContext#bindBuffer':
      currentContext.bindBuffer(
          args['target'], /** @type {WebGLBuffer} */ (objs[args['buffer']]));
      break;
    case 'WebGLRenderingContext#bindFramebuffer':
      currentContext.bindFramebuffer(
          args['target'],
          /** @type {WebGLFramebuffer} */ (objs[args['framebuffer']]));
      break;
    case 'WebGLRenderingContext#bindRenderbuffer':
      currentContext.bindRenderbuffer(
          args['target'],
          /** @type {WebGLRenderbuffer} */ (objs[args['renderbuffer']]));
      break;
    case 'WebGLRenderingContext#bindTexture':
      currentContext.bindTexture(
          args['target'], /** @type {WebGLTexture} */ (objs[args['texture']]));
      break;
    case 'WebGLRenderingContext#blendColor':
      currentContext.blendColor(
          args['red'], args['green'], args['blue'],
          args['alpha']);
      break;
    case 'WebGLRenderingContext#blendEquation':
      currentContext.blendEquation(args['mode']);
      break;
    case 'WebGLRenderingContext#blendEquationSeparate':
      currentContext.blendEquationSeparate(
          args['modeRGB'], args['modeAlpha']);
      break;
    case 'WebGLRenderingContext#blendFunc':
      currentContext.blendFunc(args['sfactor'], args['dfactor']);
      break;
    case 'WebGLRenderingContext#blendFuncSeparate':
      currentContext.blendFuncSeparate(
          args['srcRGB'], args['dstRGB'], args['srcAlpha'],
          args['dstAlpha']);
      break;
    case 'WebGLRenderingContext#bufferData':
      var data = args['data'];
      // TODO(chizeng): Remove the length check after db is fixed.
      if (!data || data.byteLength != args['size']) {
        data = args['size'];
      }
      currentContext.bufferData(
          args['target'], data, args['usage']);
      break;
    case 'WebGLRenderingContext#bufferSubData':
      currentContext.bufferSubData(
          args['target'], args['offset'], args['data']);
      break;
    case 'WebGLRenderingContext#checkFramebufferStatus':
      currentContext.checkFramebufferStatus(args['target']);
      break;
    case 'WebGLRenderingContext#clear':
      currentContext.clear(args['mask']);
      break;
    case 'WebGLRenderingContext#clearColor':
      currentContext.clearColor(
          args['red'], args['green'], args['blue'],
          args['alpha']);
      break;
    case 'WebGLRenderingContext#clearDepth':
      currentContext.clearDepth(args['depth']);
      break;
    case 'WebGLRenderingContext#clearStencil':
      currentContext.clearStencil(args['s']);
      break;
    case 'WebGLRenderingContext#colorMask':
      currentContext.colorMask(
          args['red'], args['green'], args['blue'],
          args['alpha']);
      break;
    case 'WebGLRenderingContext#compileShader':
      currentContext.compileShader(
          /** @type {WebGLShader} */ (objs[args['shader']]));
      break;
    case 'WebGLRenderingContext#compressedTexImage2D':
      currentContext.compressedTexImage2D(
          args['target'], args['level'], args['internalformat'],
          args['width'], args['height'], args['border'],
          args['data']);
      break;
    case 'WebGLRenderingContext#compressedTexSubImage2D':
      currentContext.compressedTexSubImage2D(
          args['target'], args['level'], args['xoffset'],
          args['yoffset'], args['width'], args['height'],
          args['format'], args['data']);
      break;
    case 'WebGLRenderingContext#copyTexImage2D':
      currentContext.copyTexImage2D(
          args['target'], args['level'], args['internalformat'],
          args['x'], args['y'], args['width'],
          args['height'], args['border']);
      break;
    case 'WebGLRenderingContext#copyTexSubImage2D':
      currentContext.copyTexSubImage2D(
          args['target'], args['level'], args['xoffset'],
          args['yoffset'], args['x'], args['y'],
          args['width'], args['height']);
      break;
    case 'WebGLRenderingContext#createBuffer':
      objs[args['value']] = currentContext.createBuffer();
      this.setOwningContext_(objs[args['value']], currentContext);
      break;
    case 'WebGLRenderingContext#createFramebuffer':
      objs[args['value']] = currentContext.createFramebuffer();
      this.setOwningContext_(objs[args['value']], currentContext);
      break;
    case 'WebGLRenderingContext#createRenderbuffer':
      objs[args['value']] = currentContext.createRenderbuffer();
      this.setOwningContext_(objs[args['value']], currentContext);
      break;
    case 'WebGLRenderingContext#createTexture':
      objs[args['value']] = currentContext.createTexture();
      this.setOwningContext_(objs[args['value']], currentContext);
      break;
    case 'WebGLRenderingContext#createProgram':
      objs[args['value']] = currentContext.createProgram();
      objs[args['value']]['__num_attribs__'] =
          currentContext.getProgramParameter(
              /** @type {WebGLProgram} */ (objs[args['value']]),
              goog.webgl.ACTIVE_ATTRIBUTES);
      this.setOwningContext_(objs[args['value']], currentContext);
      break;
    case 'WebGLRenderingContext#createShader':
      objs[args['value']] =
          currentContext.createShader(args['type']);
      this.setOwningContext_(objs[args['value']], currentContext);
      break;
    case 'WebGLRenderingContext#cullFace':
      currentContext.cullFace(args['mode']);
      break;
    // And now, we have a slew of fxns that delete resources.
    case 'WebGLRenderingContext#deleteBuffer':
      currentContext.deleteBuffer(
          /** @type {WebGLBuffer} */ (objs[args['value']]));
      break;
    case 'WebGLRenderingContext#deleteFramebuffer':
      currentContext.deleteFramebuffer(
          /** @type {WebGLFramebuffer} */ (objs[args['value']]));
      break;
    case 'WebGLRenderingContext#deleteProgram':
      currentContext.deleteProgram(
          /** @type {WebGLProgram} */ (objs[args['value']]));
      break;
    case 'WebGLRenderingContext#deleteRenderbuffer':
      currentContext.deleteRenderbuffer(
          /** @type {WebGLRenderbuffer} */ (objs[args['value']]));
      break;
    case 'WebGLRenderingContext#deleteShader':
      currentContext.deleteShader(
          /** @type {WebGLShader} */ (objs[args['value']]));
      break;
    case 'WebGLRenderingContext#deleteTexture':
      currentContext.deleteTexture(
          /** @type {WebGLTexture} */ (objs[args['value']]));
      break;
    case 'WebGLRenderingContext#depthFunc':
      currentContext.depthFunc(args['func']);
      break;
    case 'WebGLRenderingContext#depthMask':
      currentContext.depthMask(args['flag']);
      break;
    case 'WebGLRenderingContext#depthRange':
      currentContext.depthRange(args['zNear'], args['zFar']);
      break;
    case 'WebGLRenderingContext#detachShader':
      currentContext.detachShader(
          args['program'], args['shader']);
      break;
    case 'WebGLRenderingContext#disable':
      currentContext.disable(args['cap']);
      break;
    case 'WebGLRenderingContext#disableVertexAttribArray':
      currentContext.disableVertexAttribArray(args['index']);
      break;
    case 'WebGLRenderingContext#drawArrays':
      currentContext.drawArrays(
          args['mode'], args['first'], args['count']);
      break;
    case 'WebGLRenderingContext#drawElements':
      currentContext.drawElements(
          args['mode'], args['count'], args['type'],
          args['offset']);
      break;
    case 'WebGLRenderingContext#enable':
      currentContext.enable(args['cap']);
      break;
    case 'WebGLRenderingContext#enableVertexAttribArray':
      currentContext.enableVertexAttribArray(args['index']);
      break;
    case 'WebGLRenderingContext#finish':
      currentContext.finish();
      break;
    case 'WebGLRenderingContext#flush':
      currentContext.flush();
      break;
    case 'WebGLRenderingContext#framebufferRenderbuffer':
      currentContext.framebufferRenderbuffer(args['target'],
          args['attachment'], args['renderbuffertarget'],
          /** @type {WebGLRenderbuffer} */ (objs[args['renderbuffer']]));
      break;
    case 'WebGLRenderingContext#framebufferTexture2D':
      currentContext.framebufferTexture2D(args['target'],
          args['attachment'], args['textarget'],
          /** @type {WebGLTexture} */ (objs[args['texture']]), args['level']);
      break;
    case 'WebGLRenderingContext#frontFace':
      currentContext.frontFace(args['mode']);
      break;
    case 'WebGLRenderingContext#generateMipmap':
      currentContext.generateMipmap(args['target']);
      break;
    case 'WebGLRenderingContext#getActiveAttrib':
      // TODO(chizeng): modify this to make it work with varying locations.
      currentContext.getActiveAttrib(
          /** @type {WebGLProgram} */ (objs[args['program']]), args['index']);
      break;
    case 'WebGLRenderingContext#getActiveUniform':
      // maybe we must modify this to obtain the new active uniform.
      currentContext.getActiveUniform(
          /** @type {WebGLProgram} */ (objs[args['program']]), args['index']);
      break;
    case 'WebGLRenderingContext#getAttachedShaders':
      currentContext.getAttachedShaders(
          /** @type {WebGLProgram} */ (objs[args['program']]));
      break;
    case 'WebGLRenderingContext#getAttribLocation':
      currentContext.getAttribLocation(
          /** @type {WebGLProgram} */ (objs[args['program']]), args['name']);
      break;
    case 'WebGLRenderingContext#getBufferParameter':
      currentContext.getBufferParameter(
          args['target'], args['pname']);
      break;
    case 'WebGLRenderingContext#getError':
      currentContext.getError();
      break;
    case 'WebGLRenderingContext#getFramebufferAttachmentParameter':
      currentContext.getFramebufferAttachmentParameter(
          args['target'], args['attachment'], args['pname']);
      break;
    case 'WebGLRenderingContext#getExtension':
      // TODO(chizeng): Possibly store the extension?
      currentContext.getExtension(args['name']);
      break;
    case 'WebGLRenderingContext#getParameter':
      currentContext.getParameter(args['pname']);
      break;
    case 'WebGLRenderingContext#getFramebufferAttachmentParameter':
      currentContext.getFramebufferAttachmentParameter(
          args['target'], args['attachment'], args['pname']);
      break;
    case 'WebGLRenderingContext#getProgramParameter':
      currentContext.getProgramParameter(
          /** @type {WebGLProgram} */ (objs[args['program']]), args['pname']);
      break;
    case 'WebGLRenderingContext#getProgramInfoLog':
      currentContext.getProgramInfoLog(
          /** @type {WebGLProgram} */ (objs[args['program']]));
      break;
    case 'WebGLRenderingContext#getRenderbufferParameter':
      currentContext.getRenderbufferParameter(
          args['target'], args['pname']);
      break;
    case 'WebGLRenderingContext#getShaderParameter':
      currentContext.getShaderParameter(
          /** @type {WebGLShader} */ (objs[args['shader']]), args['pname']);
      break;
    case 'WebGLRenderingContext#getShaderPrecisionFormat':
      currentContext.getShaderPrecisionFormat(
          args['shadertype'], args['precisiontype']);
      break;
    case 'WebGLRenderingContext#getShaderInfoLog':
      currentContext.getShaderInfoLog(
          /** @type {WebGLShader} */ (objs[args['shader']]));
      break;
    case 'WebGLRenderingContext#getShaderSource':
      currentContext.getShaderSource(
          /** @type {WebGLShader} */ (objs[args['shader']]));
      break;
    case 'WebGLRenderingContext#getTexParameter':
      currentContext.getTexParameter(
          args['target'], args['pname']);
      break;
    case 'WebGLRenderingContext#getUniform':
      currentContext.getUniform(
          /** @type {WebGLProgram} */ (objs[args['program']]),
          /** @type {WebGLUniformLocation} */ (objs[args['location']]));
      break;
    case 'WebGLRenderingContext#getUniformLocation':
      // TODO(chizeng): Maybe this must change because we need a mapping.
      objs[args['value']] = /** @type {!Object} */ (
          currentContext.getUniformLocation(/** @type {WebGLProgram} */ (
              objs[args['program']]), args['name']));
      if (objs[args['value']]) {
        this.setOwningContext_(objs[args['value']], currentContext);
      }
      break;
    case 'WebGLRenderingContext#getVertexAttrib':
      currentContext.getVertexAttrib(
          args['index'], args['pname']);
      break;
    case 'WebGLRenderingContext#getVertexAttribOffset':
      currentContext.getVertexAttribOffset(
          args['index'], args['pname']);
      break;
    case 'WebGLRenderingContext#hint':
      currentContext.hint(args['target'], args['mode']);
      break;
    case 'WebGLRenderingContext#isBuffer':
      currentContext.isBuffer(
          /** @type {WebGLBuffer} */ (objs[args['buffer']]));
      break;
    case 'WebGLRenderingContext#isEnabled':
      currentContext.isEnabled(args['cap']);
      break;
    case 'WebGLRenderingContext#isFramebuffer':
      currentContext.isFramebuffer(
          /** @type {WebGLFramebuffer} */ (objs[args['framebuffer']]));
      break;
    case 'WebGLRenderingContext#isProgram':
      currentContext.isProgram(
          /** @type {WebGLProgram} */ (objs[args['program']]));
      break;
    case 'WebGLRenderingContext#isRenderbuffer':
      currentContext.isRenderbuffer(
          /** @type {WebGLRenderbuffer} */ (objs[args['renderbuffer']]));
      break;
    case 'WebGLRenderingContext#isShader':
      currentContext.isShader(
          /** @type {WebGLShader} */ (objs[args['shader']]));
      break;
    case 'WebGLRenderingContext#isTexture':
      currentContext.isTexture(
          /** @type {WebGLTexture} */ (objs[args['texture']]));
      break;
    case 'WebGLRenderingContext#lineWidth':
      currentContext.lineWidth(args['width']);
      break;
    case 'WebGLRenderingContext#linkProgram':
      // Do all the attribute bindings, then link.
      var attribMap = args['attribs'];
      for (var attribName in attribMap) {
        currentContext.bindAttribLocation(
            /** @type {WebGLProgram} */ (objs[args['program']]),
            attribMap[attribName], attribName);
      }
      currentContext.linkProgram(
          /** @type {WebGLProgram} */ (objs[args['program']]));
      break;
    case 'WebGLRenderingContext#pixelStorei':
      currentContext.pixelStorei(args['pname'], args['param']);
      break;
    case 'WebGLRenderingContext#polygonOffset':
      currentContext.polygonOffset(
          args['factor'], args['units']);
      break;
    case 'WebGLRenderingContext#readPixels':
      currentContext.readPixels(args['x'], args['y'],
          args['width'], args['height'], args['format'],
          args['type'], args['pixels']);
      break;
    case 'WebGLRenderingContext#renderbufferStorage':
      currentContext.renderbufferStorage(args['target'],
          args['internalformat'], args['width'], args['height']);
      break;
    case 'WebGLRenderingContext#sampleCoverage':
      currentContext.sampleCoverage(
          args['value'], args['invert']);
      break;
    case 'WebGLRenderingContext#scissor':
      currentContext.scissor(args['x'], args['y'],
          args['width'], args['height']);
      break;
    case 'WebGLRenderingContext#shaderSource':
      currentContext.shaderSource(
          /** @type {WebGLShader} */ (objs[args['shader']]), args['source']);
      break;
    case 'WebGLRenderingContext#stencilFunc':
      currentContext.stencilFunc(
          args['func'], args['ref'], args['mask']);
      break;
    case 'WebGLRenderingContext#stencilFuncSeparate':
      currentContext.stencilFuncSeparate(
          args['face'], args['func'], args['ref'],
          args['mask']);
      break;
    case 'WebGLRenderingContext#stencilMask':
      currentContext.stencilMask(args['mask']);
      break;
    case 'WebGLRenderingContext#stencilMaskSeparate':
      currentContext.stencilMaskSeparate(
          args['face'], args['mask']);
      break;
    case 'WebGLRenderingContext#stencilOp':
      currentContext.stencilOp(
          args['fail'], args['zfail'], args['zpass']);
      break;
    case 'WebGLRenderingContext#stencilOpSeparate':
      currentContext.stencilOpSeparate(
          args['face'], args['fail'], args['zfail'],
          args['zpass']);
      break;
    case 'WebGLRenderingContext#texImage2D':
      // TODO(chi): double check to ensure we covered all cases.
      // texImage2D is overloaded.
      var dataType = args['dataType'];
      if (dataType == 'pixels') {
        currentContext.texImage2D(
            args['target'],
            args['level'],
            args['internalformat'],
            args['width'],
            args['height'],
            args['border'],
            args['format'],
            args['type'],
            args['pixels']
        );
      } else if (dataType == 'null') {
        currentContext.texImage2D(
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
        currentContext.texImage2D(
            args['target'],
            args['level'],
            args['internalformat'],
            args['format'],
            args['type'],
            /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */
            (this.resources_[it.getId()])
        );
      }
      break;
    case 'WebGLRenderingContext#texSubImage2D':
      var dataType = args['dataType'];
      if (dataType == 'pixels') {
        currentContext.texSubImage2D(
            args['target'],
            args['level'],
            args['xoffset'],
            args['yoffset'],
            args['width'],
            args['height'],
            args['format'],
            args['type'],
            args['pixels']
        );
      } else if (dataType == 'null') {
        currentContext.texSubImage2D(
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
        currentContext.texSubImage2D(
            args['target'],
            args['level'],
            args['xoffset'],
            args['yoffset'],
            args['format'],
            args['type'],
            /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */
            (this.resources_[it.getId()])
        );
      }
      break;
    case 'WebGLRenderingContext#texParameterf':
      currentContext.texParameterf(
          args['target'], args['pname'], args['param']);
      break;
    case 'WebGLRenderingContext#texParameteri':
      currentContext.texParameteri(
          args['target'], args['pname'], args['param']);
      break;
    case 'WebGLRenderingContext#uniform1f':
      currentContext.uniform1f(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x']);
      break;
    case 'WebGLRenderingContext#uniform1fv':
      currentContext.uniform1fv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniform1i':
      currentContext.uniform1i(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x']);
      break;
    case 'WebGLRenderingContext#uniform1iv':
      currentContext.uniform1iv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniform2f':
      currentContext.uniform2f(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x'], args['y']);
      break;
    case 'WebGLRenderingContext#uniform2fv':
      currentContext.uniform2fv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniform2i':
      currentContext.uniform2i(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x'], args['y']);
      break;
    case 'WebGLRenderingContext#uniform2iv':
      currentContext.uniform2iv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniform3f':
      currentContext.uniform3f(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x'], args['y'],
          args['z']);
      break;
    case 'WebGLRenderingContext#uniform3fv':
      currentContext.uniform3fv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniform3i':
      currentContext.uniform3i(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x'], args['y'], args['z']);
      break;
    case 'WebGLRenderingContext#uniform3iv':
      currentContext.uniform3iv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniform4f':
      currentContext.uniform4f(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x'], args['y'], args['z'],
          args['w']);
      break;
    case 'WebGLRenderingContext#uniform4fv':
      currentContext.uniform4fv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniform4i':
      currentContext.uniform4i(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['x'], args['y'], args['z'],
          args['w']);
      break;
    case 'WebGLRenderingContext#uniform4iv':
      currentContext.uniform4iv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['v']);
      break;
    case 'WebGLRenderingContext#uniformMatrix2fv':
      currentContext.uniformMatrix2fv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['transpose'], args['value']);
      break;
    case 'WebGLRenderingContext#uniformMatrix3fv':
      currentContext.uniformMatrix3fv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['transpose'], args['value']);
      break;
    case 'WebGLRenderingContext#uniformMatrix4fv':
      currentContext.uniformMatrix4fv(
          /** @type {WebGLUniformLocation} */ (
              objs[args['location']]), args['transpose'], args['value']);
      break;
    case 'WebGLRenderingContext#useProgram':
      currentContext.useProgram(
          /** @type {WebGLProgram} */ (objs[args['program']]));
      break;
    case 'WebGLRenderingContext#validateProgram':
      currentContext.validateProgram(
          /** @type {WebGLProgram} */ (objs[args['program']]));
      break;
    case 'WebGLRenderingContext#vertexAttrib1fv':
      currentContext.vertexAttrib1fv(args['indx'], args['values']);
      break;
    case 'WebGLRenderingContext#vertexAttrib2fv':
      currentContext.vertexAttrib2fv(args['indx'], args['values']);
      break;
    case 'WebGLRenderingContext#vertexAttrib3fv':
      currentContext.vertexAttrib3fv(args['indx'], args['values']);
      break;
    case 'WebGLRenderingContext#vertexAttrib4fv':
      currentContext.vertexAttrib4fv(args['indx'], args['values']);
      break;
    case 'WebGLRenderingContext#vertexAttrib1f':
      currentContext.vertexAttrib1f(args['indx'], args['x']);
      break;
    case 'WebGLRenderingContext#vertexAttrib2f':
      currentContext.vertexAttrib2f(
          args['indx'], args['x'], args['y']);
      break;
    case 'WebGLRenderingContext#vertexAttrib3f':
      currentContext.vertexAttrib3f(
          args['indx'], args['x'], args['y'], args['z']);
      break;
    case 'WebGLRenderingContext#vertexAttrib4f':
      currentContext.vertexAttrib4f(
          args['indx'], args['x'], args['y'], args['z'],
          args['w']);
      break;
    case 'WebGLRenderingContext#vertexAttribPointer':
      currentContext.vertexAttribPointer(args['indx'],
          args['size'], args['type'], args['normalized'],
          args['stride'], args['offset']);
      break;
    case 'WebGLRenderingContext#viewport':
      currentContext.viewport(args['x'], args['y'], args['width'],
          args['height']);
      break;
    case 'wtf.webgl#createContext':
      var attributes = args['attributes'];
      // Assume that the context is webgl for now.
      currentContext =
          this.contextPool_.getContext('webgl', attributes) ||
          this.contextPool_.getContext('experimental-webgl', attributes);

      // We don't support WebGL.
      if (!currentContext) {
        throw new Error('This machine does not support WebGL.');
      }

      var contextHandle = args['handle'];
      this.contexts_[contextHandle] =
          /** @type {WebGLRenderingContext} */ (currentContext);
      this.currentContext_ = currentContext;
      this.emitEvent(wtf.replay.graphics.Playback.EventType.CONTEXT_CREATED,
          currentContext, contextHandle);
      break;
    case 'wtf.webgl#setContext':
      var contextHandle = args['handle'];
      var height = args['height'];
      var width = args['width'];
      currentContext = this.contexts_[contextHandle];
      if (currentContext.canvas.height != height ||
          currentContext.canvas.width != width) {
        currentContext.canvas.height = height;
        currentContext.canvas.width = width;
        this.emitEvent(wtf.replay.graphics.Playback.EventType.CANVAS_RESIZED,
            currentContext);
      }
      currentContext.viewport(0, 0, width, height);
      this.currentContext_ = currentContext;
      break;
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
 * Gets the number of steps.
 * @return {number} The number of steps.
 */
wtf.replay.graphics.Playback.prototype.getStepCount = function() {
  return this.steps_.length;
};
