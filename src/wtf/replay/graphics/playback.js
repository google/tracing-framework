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
goog.require('wtf.replay.graphics.ExtensionManager');
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
  this.steps_ = this.constructStepsList_(eventList, frameList);

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
   * Contexts were released.
   */
  CONTEXTS_RELEASED: goog.events.getUniqueId('contexts_released'),

  /**
   * Playing began.
   */
  PLAY_BEGAN: goog.events.getUniqueId('play_began'),

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
    'WebGLRenderingContext#flush'
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

  // Get the set of IDs of events that should be displayed.
  var visibleEventsRegex = /^((WebGLRenderingContext#)|(wtf.webgl#))/;
  var displayedEventsIds =
      this.eventList_.eventTypeTable.getSetMatching(visibleEventsRegex);

  // Get the IDs for start/end frame events if those IDs exist.
  var frameStartEventId =
      eventList.getEventTypeId('wtf.timing#frameStart');
  var frameEndEventId =
      eventList.getEventTypeId('wtf.timing#frameEnd');
  var contextCreatedEventId =
      eventList.getEventTypeId('wtf.webgl#createContext');
  var contextSetEventId =
      eventList.getEventTypeId('wtf.webgl#setContext');

  var it = eventList.begin();
  var currentStartId = it.getId();
  var currentEndId = currentStartId;
  var currentFrame = (frameList.getCount()) ?
      frameList.getAllFrames()[0] : null;

  // Ensure no empty steps are made.
  var noEventsForPreviousStep = true;

  // Keep track of the context that is current at the beginning of each step.
  var currentContext = -1;
  var stepBeginContext = currentContext;

  // Whether there is at least 1 visible event in the step just made.
  var visibleEventExists = false;

  // Keep track of the handles of contexts that are made.
  var contextsMade = {};
  var contextsMadeSoFar = {};
  while (!it.done()) {
    var currentEventTypeId = it.getTypeId();
    if (currentEventTypeId == frameStartEventId) {
      // Only store previous step if it has at least 1 event.
      if (!noEventsForPreviousStep) {
        var contexts = goog.object.clone(contextsMade);

        // Only include this step if it has visible events.
        if (visibleEventExists) {
          var newStep = new wtf.replay.graphics.Step(
              eventList, currentStartId, currentEndId, null, contexts,
              displayedEventsIds, stepBeginContext);
          steps.push(newStep);
        }

        visibleEventExists = false;
        stepBeginContext = currentContext;
        contextsMade = goog.object.clone(contextsMadeSoFar);
      }
      currentStartId = it.getId();
      it.next();
    } else if (currentEventTypeId == frameEndEventId) {
      // Include the end frame event in the step for drawing the frame.
      var contexts = goog.object.clone(contextsMade);

      // Only include this step if it has visible events.
      if (visibleEventExists) {
        var newStep = new wtf.replay.graphics.Step(
            eventList, currentStartId, it.getId(), currentFrame, contexts,
            displayedEventsIds, stepBeginContext);
        steps.push(newStep);
      }

      visibleEventExists = false;
      stepBeginContext = currentContext;
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
      var handleValue = /** @type {number} */ (it.getArgument('handle'));
      contextsMadeSoFar[handleValue] = true;
      currentContext = handleValue;
      visibleEventExists = true;
      it.next();
    } else if (currentEventTypeId == contextSetEventId) {
      currentContext = /** @type {number} */ (it.getArgument('handle'));
      visibleEventExists = true;
      it.next();
    } else {
      currentEndId = it.getId();

      // This step has at least 1 event.
      noEventsForPreviousStep = false;
      if (displayedEventsIds[currentEventTypeId]) {
        visibleEventExists = true;
      }

      it.next();
    }
  }

  // Store any events still left if there are any.
  if (!noEventsForPreviousStep && visibleEventExists) {
    var newStep = new wtf.replay.graphics.Step(
        eventList, currentStartId, currentEndId, null, null,
        displayedEventsIds, stepBeginContext);
    steps.push(newStep);
  }
  return steps;
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
      this.eventList_.getEventTypeId('WebGLRenderingContext#getExtension');

  for (var it = this.eventList_.begin(); !it.done(); it.next()) {
    if (it.getTypeId() == getExtensionEventId) {
      var extensionName = /** @type {string} */ (it.getArgument('name'));
      var relatedExtensionName =
          this.extensionManager_.getRelatedExtension(extensionName);

      if (!relatedExtensionName) {
        // The extension and variants of it are not supported.
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
  this.subStepId_ = -1;
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
  this.emitEvent(wtf.replay.graphics.Playback.EventType.CONTEXTS_RELEASED);
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
 * Gets the 0-based index of the substep event ID or -1 if it does not exist.
 * @return {number} The index of the substep event ID or -1 if it does not
 *     exist (It does not exist if we are not playing within a step or if we
 *     are at the very beginning of a step.).
 */
wtf.replay.graphics.Playback.prototype.getSubStepEventId = function() {
  return this.subStepId_;
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
    if (this.drawCallIds_[it.getTypeId()]) {
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
 * Seeks to the next draw call within the current step. If no draw call left,
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
    if (this.drawCallIds_[it.getTypeId()]) {
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
  var associatedFunction = this.callLookupTable_[it.getTypeId()];
  if (associatedFunction) {
    associatedFunction.call(null, it.getId(), this, this.currentContext_,
        it.getArguments(), this.objects_);
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
    objs[args['value']] = gl.createBuffer();
    playback.setOwningContext_(objs[args['value']], gl);
  },
  'WebGLRenderingContext#createFramebuffer': function(
      eventId, playback, gl, args, objs) {
    objs[args['value']] = gl.createFramebuffer();
    playback.setOwningContext_(objs[args['value']], gl);
  },
  'WebGLRenderingContext#createRenderbuffer': function(
      eventId, playback, gl, args, objs) {
    objs[args['value']] = gl.createRenderbuffer();
    playback.setOwningContext_(objs[args['value']], gl);
  },
  'WebGLRenderingContext#createTexture': function(
      eventId, playback, gl, args, objs) {
    objs[args['value']] = gl.createTexture();
    playback.setOwningContext_(objs[args['value']], gl);
  },
  'WebGLRenderingContext#createProgram': function(
      eventId, playback, gl, args, objs) {
    objs[args['value']] = gl.createProgram();
    objs[args['value']]['__num_attribs__'] =
        gl.getProgramParameter(
        /** @type {WebGLProgram} */ (objs[args['value']]),
        goog.webgl.ACTIVE_ATTRIBUTES);
    playback.setOwningContext_(objs[args['value']], gl);
  },
  'WebGLRenderingContext#createShader': function(
      eventId, playback, gl, args, objs) {
    objs[args['value']] =
        gl.createShader(args['type']);
    playback.setOwningContext_(objs[args['value']], gl);
  },
  'WebGLRenderingContext#cullFace': function(
      eventId, playback, gl, args, objs) {
    gl.cullFace(args['mode']);
  },
  // And now, we have a slew of fxns that delete resources.
  'WebGLRenderingContext#deleteBuffer': function(
      eventId, playback, gl, args, objs) {
    gl.deleteBuffer(
        /** @type {WebGLBuffer} */ (objs[args['value']]));
  },
  'WebGLRenderingContext#deleteFramebuffer': function(
      eventId, playback, gl, args, objs) {
    gl.deleteFramebuffer(
        /** @type {WebGLFramebuffer} */ (objs[args['value']]));
  },
  'WebGLRenderingContext#deleteProgram': function(
      eventId, playback, gl, args, objs) {
    gl.deleteProgram(
        /** @type {WebGLProgram} */ (objs[args['value']]));
  },
  'WebGLRenderingContext#deleteRenderbuffer': function(
      eventId, playback, gl, args, objs) {
    gl.deleteRenderbuffer(
        /** @type {WebGLRenderbuffer} */ (objs[args['value']]));
  },
  'WebGLRenderingContext#deleteShader': function(
      eventId, playback, gl, args, objs) {
    gl.deleteShader(
        /** @type {WebGLShader} */ (objs[args['value']]));
  },
  'WebGLRenderingContext#deleteTexture': function(
      eventId, playback, gl, args, objs) {
    gl.deleteTexture(
        /** @type {WebGLTexture} */ (objs[args['value']]));
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
        args['program'], args['shader']);
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
    // Do all the attribute bindings, then link.
    var attribMap = args['attributes'];
    for (var attribName in attribMap) {
      gl.bindAttribLocation(
          /** @type {WebGLProgram} */ (objs[args['program']]),
          attribMap[attribName], attribName);
    }
    gl.linkProgram(
        /** @type {WebGLProgram} */ (objs[args['program']]));
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
    gl.readPixels(args['x'], args['y'],
        args['width'], args['height'], args['format'],
        args['type'], args['pixels']);
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
          args['pixels']
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
          args['pixels']
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
  'wtf.webgl#createContext': function(eventId, playback, gl, args, objs) {
    var attributes = args['attributes'];
    // Assume that the context is webgl for now.
    gl =
        playback.contextPool_.getContext('webgl', attributes) ||
        playback.contextPool_.getContext('experimental-webgl', attributes);

    // We don't support WebGL.
    if (!gl) {
      throw new Error('playback machine does not support WebGL.');
    }

    var contextHandle = args['handle'];
    playback.contexts_[contextHandle] =
        /** @type {WebGLRenderingContext} */ (gl);
    playback.currentContext_ = gl;
    playback.emitEvent(wtf.replay.graphics.Playback.EventType.CONTEXT_CREATED,
        gl, contextHandle);
  },
  'wtf.webgl#setContext': function(eventId, playback, gl, args, objs) {
    var contextHandle = args['handle'];
    var height = args['height'];
    var width = args['width'];
    gl = playback.contexts_[contextHandle];
    if (gl.canvas.height != height ||
        gl.canvas.width != width) {
      gl.canvas.height = height;
      gl.canvas.width = width;
      playback.emitEvent(
          wtf.replay.graphics.Playback.EventType.CANVAS_RESIZED, gl);
    }
    gl.viewport(0, 0, width, height);
    playback.currentContext_ = gl;
  }
};
