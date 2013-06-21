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

goog.require('goog.events');
goog.require('goog.webgl');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.timing.util');



/**
 * Plays an animation once. Does not play immediately after construction.
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
   * List of frames for an entire animation.
   * @type {!wtf.db.FrameList}
   * @private
   */
  this.frameList_ = frameList;

  /**
   * An iterator through events. Updated while playing. Points to event about
   * to be realized.
   * @type {!wtf.db.EventIterator}
   * @private
   */
  this.currentEvent_ = eventList.begin();

  /**
   * The frame that has not yet finished being drawn (or the frame that will
   * be finished next).
   * @type {!wtf.db.Frame}
   * @private
   */
  this.currentFrame_ = frameList.getAllFrames()[0];

  /**
   * A pool of contexts.
   * @type {!wtf.replay.graphics.ContextPool}
   * @private
   */
  this.contextPool_ = contextPool;

  /**
   * A mapping of handles to contexts.
   * @type {!Object.<number, !WebGLRenderingContext>}
   * @private
   */
  this.contexts_ = {};

  /**
   * A mapping of event Ids to elements for resources such as images.
   * @type {!Array.<!Element>}
   * @private
   */
  this.resources_ = {};

  /**
   * The number of resources left to load.
   * @type {number}
   * @private
   */
  this.resourcesLeftToLoad_ = 0;

  /**
   * Whether resources have finished loading.
   * @type {boolean}
   * @private
   */
  this.resourcesDoneLoading_ = false;

  /**
   * A mapping of handles to WebGL objects.
   * @type {!Object.<number, !Object>}
   * @private
   */
  this.objects_ = {};

  /**
   * The frame we are aiming for while seeking. This exists because a seek may
   * occur while an asynchronous backwards seek is already going on.
   * @type {wtf.db.Frame}
   * @private
   */
  this.targetFrame_ = null;

  /**
   * Indicates whether a backwards seek is going on now.
   * @type {boolean}
   * @private
   */
  this.seekingBackwards_ = false;

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
  this.cancelAnimationFrame_ =
      wtf.timing.util.getCancelRequestAnimationFrame();

  /**
   * True if playing is occuring or if playing will occur as soon as possible.
   * @type {boolean}
   * @private
   */
  this.playing_ = false;

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
   * @type {!Object.<string, null>}
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
   * Playing began.
   */
  BEGIN_PLAY: goog.events.getUniqueId('play_began'),

  /**
   * The current frame changed.
   */
  NEW_FRAME: goog.events.getUniqueId('new_frame'),

  /**
   * A context was created. Has the context.
   */
  CONTEXT_CREATED: goog.events.getUniqueId('context_created'),

  /**
   * A context was set. Has the context.
   */
  CONTEXT_SET: goog.events.getUniqueId('context_set'),

  /**
   * Playing ended at the end of the animation.
   */
  END_PLAY: goog.events.getUniqueId('play_ended'),

  /**
   * Premature call to play was made.
   */
  PLAY_NOT_READY: goog.events.getUniqueId('play_not_ready'),

  /**
   * Resources finished loading.
   */
  RESOURCES_DONE: goog.events.getUniqueId('done_loading_playback_resources'),

  /**
   * Error on loading a resource.
   */
  RESOURCE_ERROR: goog.events.getUniqueId('resource_error'),

  /**
   * Unsupported extension(s) found. Has a list of unsupported extensions.
   */
  UNSUPPORTED_EXTENSIONS: goog.events.getUniqueId('unsupported_extension')
};


/**
 * Loads the playback.
 */
wtf.replay.graphics.Playback.prototype.load = function() {
  this.fetchResources_();
};


/**
 * Fetches all the resources needed for playback. Also checks for unsupported
 *     extensions and throws an event if there are any.
 * @private
 */
wtf.replay.graphics.Playback.prototype.fetchResources_ = function() {
  // First, find out what resources must be loaded, and check extensions.
  var eventsWithResourcesToLoad = [];
  var unsupportedExtensions = [];
  for (var ev = this.eventList_.begin(); !ev.done(); ev.next()) {
    switch (ev.getName()) {
      case 'WebGLRenderingContext#texImage2D':
      case 'WebGLRenderingContext#texSubImage2D':
        var dataType = ev.getArguments().get('dataType');
        if (dataType != 'pixels' && dataType != 'null') {
          eventsWithResourcesToLoad.push(ev.getId());
        }
        break;
      case 'WebGLRenderingContext#getExtension':
        var extensionName = ev.getArguments().get('name');
        if (!(extensionName in this.supportedExtensions_)) {
          unsupportedExtensions.push(extensionName);
        }
        break;
    }
  }
  // If at least one unsupported extension found, emit an event indicating so.
  if (unsupportedExtensions.length) {
    this.emitEvent(
        wtf.replay.graphics.Playback.EventType.UNSUPPORTED_EXTENSIONS,
        unsupportedExtensions);
  }
  this.resourcesLeftToLoad_ = eventsWithResourcesToLoad.length;
  // If no resources to load, just indicate that resources are done loading.
  if (!this.resourcesLeftToLoad_) {
    this.resourcesDoneLoading_ = true;
    this.emitEvent(wtf.replay.graphics.Playback.EventType.RESOURCES_DONE);
    return;
  }
  // Now, actually load the resources.
  for (var i = 0; i < eventsWithResourcesToLoad.length; ++i) {
    var ev = this.eventList_.getEvent(eventsWithResourcesToLoad[i]);
    var args = ev.getArguments();
    var dataType = args.get('dataType');
    var url = (dataType.indexOf('image/') == 0) ?
        this.createBlobURL_(dataType, args.get('pixels')) : dataType;
    this.loadImage_(eventsWithResourcesToLoad[i], url);
  }
};


/**
 * Gets a set of supported extensions.
 * @return {!Object.<string, null>} An object whose keys are the supported
 *     extensions.
 * @private
 */
wtf.replay.graphics.Playback.prototype.getSupportedExtensions_ = function() {
  var webglContext = this.contextPool_.getContext('webgl') ||
      this.contextPool_.getContext('experimental-webgl');
  var supportedExtensionsList = webglContext.getSupportedExtensions();
  var supportedExtensionsSet = {};
  for (var i = 0; i < supportedExtensionsList.length; ++i) {
    supportedExtensionsSet[supportedExtensionsList[i]] = null;
  }
  this.contextPool_.releaseContext(webglContext);
  return supportedExtensionsSet;
};


/**
 * Creates a blob URL for an image.
 * @param {string} mimeType The type of the image.
 * @param {!UInt8Array} data The pixel data.
 * @return {string} The blob URL that was created.
 * @private
 */
wtf.replay.graphics.Playback.prototype.createBlobURL_ =
    function(mimeType, data) {
  var blob = new Blob([data], {
    type: mimeType
  });
  // Use the right URL creation tool based on the browser.
  var standardURLObject = goog.global['URL'];
  var urlCreationObject = standardURLObject ?
      standardURLObject : goog.global['webkitURL'];
  return urlCreationObject.createObjectURL(blob);
};


/**
 * Loads a single image from a URL.
 * @param {number} eventId the Id of the event.
 * @param {string} url The URL of the resource to load.
 * @private
 */
wtf.replay.graphics.Playback.prototype.loadImage_ = function(eventId, url) {
  var img = new Image();
  var playback = this;
  img.onload = function() {
    playback.decrementResourcesLeftToLoad_();
  };
  img.onerror = function() {
    var error = new Error('Error while trying to load image with url ' + url);
    this.emitEvent(
        wtf.replay.graphics.Playback.EventType.RESOURCE_ERROR, error);
    playback.decrementResourcesLeftToLoad_();
  };
  img.src = url;
  this.resources_[eventId] = img;
};


/**
 * Decrements the number of resources that must still be loaded. Emits an
 * event indicating that all resources are done loaded when applicable.
 * @private
 */
wtf.replay.graphics.Playback.prototype.decrementResourcesLeftToLoad_ =
    function() {
  --this.resourcesLeftToLoad_;
  if (!this.resourcesLeftToLoad_) {
    this.resourcesDoneLoading_ = true;
    // Fire an event indicating that resources are done loading.
    this.emitEvent(wtf.replay.graphics.Playback.EventType.RESOURCES_DONE);
  }
};


/**
 * Clears all timeouts and animation requests for playing frames.
 * @private
 */
wtf.replay.graphics.Playback.prototype.clearTimeouts_ = function() {
  if (this.animationRequest_ !== null) {
    this.cancelAnimationFrame_(this.animationRequest_);
    this.animationRequest_ = null;
  }
  if (this.prepareFrameTimeout_ !== null) {
    clearTimeout(this.prepareFrameTimeout_);
    this.prepareFrameTimeout_ = null;
  }
};


/**
 * Begins playing starting at the current event. Must be called after all
 * resources have loaded.
 */
wtf.replay.graphics.Playback.prototype.play = function() {
  // Throw an exception if play was called before resources finished loading.
  if (!this.resourcesDoneLoading_) {
    var error = new Error('Playing began before resources loaded.');
    this.emitEvent(
        wtf.replay.graphics.Playback.EventType.PLAY_NOT_READY, error);
    return;
  }
  this.emitEvent(wtf.replay.graphics.Playback.EventType.PLAY);
  this.prepareFrame_();
};


/**
 * Prepares for the next frame.
 * @private
 */
wtf.replay.graphics.Playback.prototype.prepareFrame_ = function() {
  if (this.currentEvent_.done()) {
    this.emitEvent(wtf.replay.graphics.Playback.EventType.END_PLAY);
    return;
  }
  // Play up to start event of next frame (but don't call the start event).
  if (!this.currentFrame_) {
    // We're done playing.
    this.emitEvent(wtf.replay.graphics.Playback.EventType.END_PLAY);
    return;
  }
  var eventToPlayUpTo = this.currentFrame_.getStartEventId();
  this.prepareFrameTimeout_ = setTimeout(goog.bind(function() {
    this.playUpToEvent_(eventToPlayUpTo);
    this.drawFrame_();
  }, this), 0);
};


/**
 * Draws the next frame.
 * @private
 */
wtf.replay.graphics.Playback.prototype.drawFrame_ = function() {
  // Finish playing this frame.
  var finalEventId = this.currentFrame_.getEndEventId() + 1;
  this.animationRequest_ = this.requestAnimationFrame_(goog.bind(function() {
    this.playUpToEvent_(finalEventId);
    this.emitEvent(
        wtf.replay.graphics.Playback.EventType.NEW_FRAME,
        this.currentFrame_);
    this.prepareFrame_();
  }, this));
};


/**
 * Seeks to the beginning event of a certain frame. After this function, the
 * current frame will be |frame|, and the current event will be the beginning
 * event of |frame|. That event will not yet have been realized.
 * @param {!wtf.db.Frame} targetFrame The frame to seek.
 */
wtf.replay.graphics.Playback.prototype.seekFrame = function(targetFrame) {
  // If backwards seek in progress, record new frame target, seek it later.
  this.targetFrame_ = targetFrame;
  if (!this.backwardsSeek_) {
    this.clearTimeouts_();
    var currentFrame = this.currentFrame_;
    var targetFrameBeginEventId = currentFrame.getStartEventId();
    // If forward seek, go forward.
    if (targetFrame.getOrdinal() > currentFrame.getOrdinal()) {
      this.playUpToEvent_(targetFrameBeginEventId);
    } else if (targetFrame.getOrdinal() < currentFrame.getOrdinal()) {
      // TODO(chizeng): Do a backwards seek.
    }
  }
};


/**
 * Quickly plays events until the current event has the input Id. Does nothing
 * if the input Id is not greater than the Id of the current event.
 * Updates the current frame as events are realized. After this function, the
 * event to call next is the one with the input Id.
 * @param {number} targetEventId The Id of the current event after this
 *     function is called. Must be greater than the Id of the current event.
 * @private
 */
wtf.replay.graphics.Playback.prototype.playUpToEvent_ =
    function(targetEventId) {
  var currentEvent = this.currentEvent_;
  // TODO(chizeng): Fix this comparison of event Ids.
  while (currentEvent.getId() != targetEventId) {
    this.realizeEvent_();
    // If we just finished a frame, note that we're working on the next one.
    if (currentEvent.getName() == 'wtf.timing#frameEnd') {
      this.currentFrame_ = this.frameList_.getNextFrame(this.currentFrame_);
    }
    currentEvent.next();
  }
  // Note that the current frame changed.
  this.emitEvent(
      wtf.replay.graphics.Playback.EventType.NEW_FRAME, this.currentFrame_);
};


/**
 * Realizes the current event. Updates the current event and frame as events
 * are realized.
 * @private
 */
wtf.replay.graphics.Playback.prototype.realizeEvent_ = function() {
  // TODO(chizeng): Realize current event. Update the current event and the
  // current frame as we do so.
  // argument data.
  var args = this.currentEvent_.getArguments();
  var objs = this.objects_;
  var currentContext = this.currentContext_;

  // parse functions and arguments.
  switch (this.currentEvent_.getName()) {
    case 'WebGLRenderingContext#attachShader':
      currentContext.attachShader(
          objs[args.get('program')], objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#activeTexture':
      currentContext.activeTexture(args.get('texture'));
      break;
    case 'WebGLRenderingContext#bindAttribLocation':
      currentContext.bindAttribLocation(
          objs[args.get('program')], args.get('index'), args.get('name'));
      // TODO(chizeng): Figure out if we want to build a mapping.
      // addAttribToProgram(
      //     args.get('program'), args.get('index'), args.get('index'));
      break;
    case 'WebGLRenderingContext#bindBuffer':
      currentContext.bindBuffer(
          args.get('target'), objs[args.get('buffer')]);
      break;
    case 'WebGLRenderingContext#bindFramebuffer':
      currentContext.bindFramebuffer(
          args.get('target'), objs[args.get('framebuffer')]);
      break;
    case 'WebGLRenderingContext#bindRenderbuffer':
      currentContext.bindRenderbuffer(
          args.get('target'), objs[args.get('renderbuffer')]);
      break;
    case 'WebGLRenderingContext#bindTexture':
      currentContext.bindTexture(
          args.get('target'), objs[args.get('texture')]);
      break;
    case 'WebGLRenderingContext#blendColor':
      currentContext.blendColor(
          args.get('red'), args.get('green'), args.get('blue'),
          args.get('alpha'));
      break;
    case 'WebGLRenderingContext#blendEquation':
      currentContext.blendEquation(args.get('mode'));
      break;
    case 'WebGLRenderingContext#blendEquationSeparate':
      currentContext.blendEquationSeparate(
          args.get('modeRGB'), args.get('modeAlpha'));
      break;
    case 'WebGLRenderingContext#blendFunc':
      currentContext.blendFunc(args.get('sfactor'), args.get('dfactor'));
      break;
    case 'WebGLRenderingContext#blendFuncSeparate':
      currentContext.blendFuncSeparate(
          args.get('srcRGB'), args.get('dstRGB'), args.get('srcAlpha'),
          args.get('dstAlpha'));
      break;
    case 'WebGLRenderingContext#bufferData':
      var data = args.get('data');
      // TODO(chizeng): Remove the length check after db is fixed.
      if (!data || data.byteLength != args.get('size')) {
        data = args.get('size');
      }
      currentContext.bufferData(
          args.get('target'), data, args.get('usage'));
      break;
    case 'WebGLRenderingContext#bufferSubData':
      currentContext.bufferSubData(
          args.get('target'), args.get('offset'), args.get('data'));
      break;
    case 'WebGLRenderingContext#checkFramebufferStatus':
      currentContext.checkFramebufferStatus(args.get('target'));
      break;
    case 'WebGLRenderingContext#clear':
      currentContext.clear(args.get('mask'));
      break;
    case 'WebGLRenderingContext#clearColor':
      currentContext.clearColor(
          args.get('red'), args.get('green'), args.get('blue'),
          args.get('alpha'));
      break;
    case 'WebGLRenderingContext#clearDepth':
      currentContext.clearDepth(args.get('depth'));
      break;
    case 'WebGLRenderingContext#clearStencil':
      currentContext.clearStencil(args.get('s'));
      break;
    case 'WebGLRenderingContext#colorMask':
      currentContext.colorMask(
          args.get('red'), args.get('green'), args.get('blue'),
          args.get('alpha'));
      break;
    case 'WebGLRenderingContext#compileShader':
      currentContext.compileShader(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#compressedTexImage2D':
      currentContext.compressedTexImage2D(
          args.get('target'), args.get('level'), args.get('internalformat'),
          args.get('width'), args.get('height'), args.get('border'),
          args.get('data'));
      break;
    case 'WebGLRenderingContext#compressedTexSubImage2D':
      currentContext.compressedTexSubImage2D(
          args.get('target'), args.get('level'), args.get('xoffset'),
          args.get('yoffset'), args.get('width'), args.get('height'),
          args.get('format'), args.get('data'));
      break;
    case 'WebGLRenderingContext#copyTexImage2D':
      currentContext.copyTexImage2D(
          args.get('target'), args.get('level'), args.get('internalformat'),
          args.get('x'), args.get('y'), args.get('width'),
          args.get('height'), args.get('border'));
      break;
    case 'WebGLRenderingContext#copyTexSubImage2D':
      currentContext.copyTexSubImage2D(
          args.get('target'), args.get('level'), args.get('xoffset'),
          args.get('yoffset'), args.get('x'), args.get('y'),
          args.get('width'), args.get('height'));
      break;
    case 'WebGLRenderingContext#createBuffer':
      objs[args.get('value')] = currentContext.createBuffer();
      this.setOwningContext_(objs[args.get('value')], currentContext);
      break;
    case 'WebGLRenderingContext#createFramebuffer':
      objs[args.get('value')] = currentContext.createFramebuffer();
      this.setOwningContext_(objs[args.get('value')], currentContext);
      break;
    case 'WebGLRenderingContext#createRenderbuffer':
      objs[args.get('value')] = currentContext.createRenderbuffer();
      this.setOwningContext_(objs[args.get('value')], currentContext);
      break;
    case 'WebGLRenderingContext#createTexture':
      objs[args.get('value')] = currentContext.createTexture();
      this.setOwningContext_(objs[args.get('value')], currentContext);
      break;
    case 'WebGLRenderingContext#createProgram':
      objs[args.get('value')] = currentContext.createProgram();
      objs[args.get('value')]['__num_attribs__'] =
          currentContext.getProgramParameter(
              objs[args.get('value')], goog.webgl.ACTIVE_ATTRIBUTES);
      this.setOwningContext_(objs[args.get('value')], currentContext);
      break;
    case 'WebGLRenderingContext#createShader':
      objs[args.get('value')] =
          currentContext.createShader(args.get('type'));
      this.setOwningContext_(objs[args.get('value')], currentContext);
      break;
    case 'WebGLRenderingContext#cullFace':
      currentContext.cullFace(args.get('mode'));
      break;
    // And now, we have a slew of fxns that delete resources.
    case 'WebGLRenderingContext#deleteBuffer':
      currentContext.deleteBuffer(objs[args.get('value')]);
      break;
    case 'WebGLRenderingContext#deleteFramebuffer':
      currentContext.deleteFramebuffer(objs[args.get('value')]);
      break;
    case 'WebGLRenderingContext#deleteProgram':
      currentContext.deleteProgram(objs[args.get('value')]);
      break;
    case 'WebGLRenderingContext#deleteRenderbuffer':
      currentContext.deleteRenderbuffer(objs[args.get('value')]);
      break;
    case 'WebGLRenderingContext#deleteShader':
      currentContext.deleteShader(objs[args.get('value')]);
      break;
    case 'WebGLRenderingContext#deleteTexture':
      currentContext.deleteTexture(objs[args.get('value')]);
      break;
    case 'WebGLRenderingContext#depthFunc':
      currentContext.depthFunc(args.get('func'));
      break;
    case 'WebGLRenderingContext#depthMask':
      currentContext.depthMask(args.get('flag'));
      break;
    case 'WebGLRenderingContext#depthRange':
      currentContext.depthRange(args.get('zNear'), args.get('zFar'));
      break;
    case 'WebGLRenderingContext#detachShader':
      currentContext.detachShader(
          args.get('program'), args.get('shader'));
      break;
    case 'WebGLRenderingContext#disable':
      currentContext.disable(args.get('cap'));
      break;
    case 'WebGLRenderingContext#disableVertexAttribArray':
      currentContext.disableVertexAttribArray(args.get('index'));
      break;
    case 'WebGLRenderingContext#drawArrays':
      currentContext.drawArrays(
          args.get('mode'), args.get('first'), args.get('count'));
      break;
    case 'WebGLRenderingContext#drawElements':
      currentContext.drawElements(
          args.get('mode'), args.get('count'), args.get('type'),
          args.get('offset'));
      break;
    case 'WebGLRenderingContext#enable':
      currentContext.enable(args.get('cap'));
      break;
    case 'WebGLRenderingContext#enableVertexAttribArray':
      currentContext.enableVertexAttribArray(args.get('index'));
      break;
    case 'WebGLRenderingContext#finish':
      currentContext.finish();
      break;
    case 'WebGLRenderingContext#flush':
      currentContext.flush();
      break;
    case 'WebGLRenderingContext#framebufferRenderbuffer':
      currentContext.framebufferRenderbuffer(args.get('target'),
          args.get('attachment'), args.get('renderbuffertarget'),
          objs[args.get('renderbuffer')]);
      break;
    case 'WebGLRenderingContext#framebufferTexture2D':
      currentContext.framebufferTexture2D(args.get('target'),
          args.get('attachment'), args.get('textarget'),
          objs[args.get('texture')], args.get('level'));
      break;
    case 'WebGLRenderingContext#frontFace':
      currentContext.frontFace(args.get('mode'));
      break;
    case 'WebGLRenderingContext#generateMipmap':
      currentContext.generateMipmap(args.get('target'));
      break;
    case 'WebGLRenderingContext#getActiveAttrib':
      // TODO(chizeng): modify this to make it work with varying locations.
      currentContext.getActiveAttrib(
          objs[args.get('program')], args.get('index'));
      break;
    case 'WebGLRenderingContext#getActiveUniform':
      // maybe we must modify this to obtain the new active uniform.
      currentContext.getActiveUniform(
          objs[args.get('program')], args.get('index'));
      break;
    case 'WebGLRenderingContext#getAttachedShaders':
      currentContext.getAttachedShaders(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#getAttribLocation':
      currentContext.getAttribLocation(
          objs[args.get('program')], args.get('name'));
      break;
    case 'WebGLRenderingContext#getBufferParameter':
      currentContext.getBufferParameter(
          args.get('target'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getError':
      currentContext.getError();
      break;
    case 'WebGLRenderingContext#getFramebufferAttachmentParameter':
      currentContext.getFramebufferAttachmentParameter(
          args.get('target'), args.get('attachment'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getExtension':
      // TODO(chizeng): Possibly store the extension?
      currentContext.getExtension(args.get('name'));
      break;
    case 'WebGLRenderingContext#getParameter':
      currentContext.getParameter(args.get('pname'));
      break;
    case 'WebGLRenderingContext#getFramebufferAttachmentParameter':
      currentContext.getFramebufferAttachmentParameter(
          args.get('target'), args.get('attachment'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getProgramParameter':
      currentContext.getProgramParameter(
          objs[args.get('program')], args.get('pname'));
      break;
    case 'WebGLRenderingContext#getProgramInfoLog':
      currentContext.getProgramInfoLog(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#getRenderbufferParameter':
      currentContext.getRenderbufferParameter(
          args.get('target'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getShaderParameter':
      currentContext.getShaderParameter(
          objs[args.get('shader')], args.get('pname'));
      break;
    case 'WebGLRenderingContext#getShaderPrecisionFormat':
      currentContext.getShaderPrecisionFormat(
          args.get('shadertype'), args.get('precisiontype'));
      break;
    case 'WebGLRenderingContext#getShaderInfoLog':
      currentContext.getShaderInfoLog(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#getShaderSource':
      currentContext.getShaderSource(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#getTexParameter':
      currentContext.getTexParameter(
          args.get('target'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getUniform':
      currentContext.getUniform(
          objs[args.get('program')], objs[args.get('location')]);
      break;
    case 'WebGLRenderingContext#getUniformLocation':
      // TODO(chizeng): Maybe this must change because we need a mapping.
      objs[args.get('value')] = currentContext.getUniformLocation(
          objs[args.get('program')], args.get('name'));
      if (objs[args.get('value')]) {
        this.setOwningContext_(objs[args.get('value')], currentContext);
      }
      break;
    case 'WebGLRenderingContext#getVertexAttrib':
      currentContext.getVertexAttrib(
          args.get('index'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getVertexAttribOffset':
      currentContext.getVertexAttribOffset(
          args.get('index'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#hint':
      currentContext.hint(args.get('target'), args.get('mode'));
      break;
    case 'WebGLRenderingContext#isBuffer':
      currentContext.isBuffer(objs[args.get('buffer')]);
      break;
    case 'WebGLRenderingContext#isEnabled':
      currentContext.isEnabled(args.get('cap'));
      break;
    case 'WebGLRenderingContext#isFramebuffer':
      currentContext.isFramebuffer(objs[args.get('framebuffer')]);
      break;
    case 'WebGLRenderingContext#isProgram':
      currentContext.isProgram(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#isRenderbuffer':
      currentContext.isRenderbuffer(objs[args.get('renderbuffer')]);
      break;
    case 'WebGLRenderingContext#isShader':
      currentContext.isShader(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#isTexture':
      currentContext.isTexture(objs[args.get('texture')]);
      break;
    case 'WebGLRenderingContext#lineWidth':
      currentContext.lineWidth(args.get('width'));
      break;
    case 'WebGLRenderingContext#linkProgram':
      // Do all the attribute bindings, then link.
      var attribMap = args.get('attribs');
      for (var attribName in attribMap) {
        currentContext.bindAttribLocation(
            objs[args.get('program')], attribMap[attribName], attribName);
      }
      currentContext.linkProgram(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#pixelStorei':
      currentContext.pixelStorei(args.get('pname'), args.get('param'));
      break;
    case 'WebGLRenderingContext#polygonOffset':
      currentContext.polygonOffset(
          args.get('factor'), args.get('units'));
      break;
    case 'WebGLRenderingContext#readPixels':
      currentContext.readPixels(args.get('x'), args.get('y'),
          args.get('width'), args.get('height'), args.get('format'),
          args.get('type'), args.get('pixels'));
      break;
    case 'WebGLRenderingContext#renderbufferStorage':
      currentContext.renderbufferStorage(args.get('target'),
          args.get('internalformat'), args.get('width'), args.get('height'));
      break;
    case 'WebGLRenderingContext#sampleCoverage':
      currentContext.sampleCoverage(
          args.get('value'), args.get('invert'));
      break;
    case 'WebGLRenderingContext#scissor':
      currentContext.scissor(args.get('x'), args.get('y'),
          args.get('width'), args.get('height'));
      break;
    case 'WebGLRenderingContext#shaderSource':
      currentContext.shaderSource(
          objs[args.get('shader')], args.get('source'));
      break;
    case 'WebGLRenderingContext#stencilFunc':
      currentContext.stencilFunc(
          args.get('func'), args.get('ref'), args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilFuncSeparate':
      currentContext.stencilFuncSeparate(
          args.get('face'), args.get('func'), args.get('ref'),
          args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilMask':
      currentContext.stencilMask(args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilMaskSeparate':
      currentContext.stencilMaskSeparate(
          args.get('face'), args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilOp':
      currentContext.stencilOp(
          args.get('fail'), args.get('zfail'), args.get('zpass'));
      break;
    case 'WebGLRenderingContext#stencilOpSeparate':
      currentContext.stencilOpSeparate(
          args.get('face'), args.get('fail'), args.get('zfail'),
          args.get('zpass'));
      break;
    case 'WebGLRenderingContext#texImage2D':
      // TODO(chi): double check to ensure we covered all cases.
      // texImage2D is overloaded.
      var dataType = args.get('dataType');
      if (dataType == 'pixels') {
        currentContext.texImage2D(
            args.get('target'),
            args.get('level'),
            args.get('internalformat'),
            args.get('width'),
            args.get('height'),
            args.get('border'),
            args.get('format'),
            args.get('type'),
            args.get('pixels')
        );
      } else if (dataType == 'null') {
        currentContext.texImage2D(
            args.get('target'),
            args.get('level'),
            args.get('internalformat'),
            args.get('width'),
            args.get('height'),
            args.get('border'),
            args.get('format'),
            args.get('type'),
            null
        );
      } else {
        currentContext.texImage2D(
            args.get('target'),
            args.get('level'),
            args.get('internalformat'),
            args.get('format'),
            args.get('type'),
            this.resources_[this.currentEvent_.getId()]
        );
      }
      break;
    case 'WebGLRenderingContext#texSubImage2D':
      var dataType = args.get('dataType');
      if (dataType == 'pixels') {
        currentContext.texSubImage2D(
            args.get('target'),
            args.get('level'),
            args.get('xoffset'),
            args.get('yoffset'),
            args.get('width'),
            args.get('height'),
            args.get('format'),
            args.get('type'),
            args.get('pixels')
        );
      } else if (dataType == 'null') {
        currentContext.texSubImage2D(
            args.get('target'),
            args.get('level'),
            args.get('xoffset'),
            args.get('yoffset'),
            args.get('width'),
            args.get('height'),
            args.get('format'),
            args.get('type'),
            null
        );
      } else {
        currentContext.texSubImage2D(
            args.get('target'),
            args.get('level'),
            args.get('xoffset'),
            args.get('yoffset'),
            args.get('format'),
            args.get('type'),
            this.resources_[this.currentEvent_.getId()]
        );
      }
      break;
    case 'WebGLRenderingContext#texParameterf':
      currentContext.texParameterf(
          args.get('target'), args.get('pname'), args.get('param'));
      break;
    case 'WebGLRenderingContext#texParameteri':
      currentContext.texParameteri(
          args.get('target'), args.get('pname'), args.get('param'));
      break;
    case 'WebGLRenderingContext#uniform1f':
      currentContext.uniform1f(
          objs[args.get('location')], args.get('x'));
      break;
    case 'WebGLRenderingContext#uniform1fv':
      currentContext.uniform1fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform1i':
      currentContext.uniform1i(
          objs[args.get('location')], args.get('x'));
      break;
    case 'WebGLRenderingContext#uniform1iv':
      currentContext.uniform1iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform2f':
      currentContext.uniform2f(
          objs[args.get('location')], args.get('x'), args.get('y'));
      break;
    case 'WebGLRenderingContext#uniform2fv':
      currentContext.uniform2fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform2i':
      currentContext.uniform2i(
          objs[args.get('location')], args.get('x'), args.get('y'));
      break;
    case 'WebGLRenderingContext#uniform2iv':
      currentContext.uniform2iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform3f':
      currentContext.uniform3f(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'));
      break;
    case 'WebGLRenderingContext#uniform3fv':
      currentContext.uniform3fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform3i':
      currentContext.uniform3i(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'));
      break;
    case 'WebGLRenderingContext#uniform3iv':
      currentContext.uniform3iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform4f':
      currentContext.uniform4f(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'), args.get('w'));
      break;
    case 'WebGLRenderingContext#uniform4fv':
      currentContext.uniform4fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform4i':
      currentContext.uniform4i(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'), args.get('w'));
      break;
    case 'WebGLRenderingContext#uniform4iv':
      currentContext.uniform4iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniformMatrix2fv':
      currentContext.uniformMatrix2fv(
          objs[args.get('location')], args.get('transpose'), args.get('value'));
      break;
    case 'WebGLRenderingContext#uniformMatrix3fv':
      currentContext.uniformMatrix3fv(
          objs[args.get('location')], args.get('transpose'), args.get('value'));
      break;
    case 'WebGLRenderingContext#uniformMatrix4fv':
      currentContext.uniformMatrix4fv(
          objs[args.get('location')], args.get('transpose'), args.get('value'));
      break;
    case 'WebGLRenderingContext#useProgram':
      currentContext.useProgram(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#validateProgram':
      currentContext.validateProgram(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#vertexAttrib1fv':
      currentContext.vertexAttrib1fv(args.get('indx'), args.get('values'));
      break;
    case 'WebGLRenderingContext#vertexAttrib2fv':
      currentContext.vertexAttrib2fv(args.get('indx'), args.get('values'));
      break;
    case 'WebGLRenderingContext#vertexAttrib3fv':
      currentContext.vertexAttrib3fv(args.get('indx'), args.get('values'));
      break;
    case 'WebGLRenderingContext#vertexAttrib4fv':
      currentContext.vertexAttrib4fv(args.get('indx'), args.get('values'));
      break;
    case 'WebGLRenderingContext#vertexAttrib1f':
      currentContext.vertexAttrib1f(args.get('indx'), args.get('x'));
      break;
    case 'WebGLRenderingContext#vertexAttrib2f':
      currentContext.vertexAttrib2f(
          args.get('indx'), args.get('x'), args.get('y'));
      break;
    case 'WebGLRenderingContext#vertexAttrib3f':
      currentContext.vertexAttrib3f(
          args.get('indx'), args.get('x'), args.get('y'), args.get('z'));
      break;
    case 'WebGLRenderingContext#vertexAttrib4f':
      currentContext.vertexAttrib4f(
          args.get('indx'), args.get('x'), args.get('y'), args.get('z'),
          args.get('w'));
      break;
    case 'WebGLRenderingContext#vertexAttribPointer':
      currentContext.vertexAttribPointer(args.get('indx'),
          args.get('size'), args.get('type'), args.get('normalized'),
          args.get('stride'), args.get('offset'));
      break;
    case 'WebGLRenderingContext#viewport':
      currentContext.viewport(args.get('x'), args.get('y'), args.get('width'),
          args.get('height'));
      break;
    case 'wtf.webgl#createContext':
      var attributes = args.get('attributes');
      // Assume that the context is webgl for now.
      currentContext =
          contextPool.getContext('webgl', attributes) ||
          contextPool.getContext('experimental-webgl', attributes);
      this.contexts_[args.get('handle')] = currentContext;
      this.currentContext_ = currentContext;
      this.emitEvent(wtf.replay.graphics.Playback.EventType.CONTEXT_CREATED,
          currentContext);
      break;
    case 'wtf.webgl#setContext':
      var contextHandle = args.get('handle');
      var height = args.get('height');
      var width = args.get('width');
      currentContext = this.contexts_[contextHandle];
      currentContext.canvas.height = height;
      currentContext.canvas.width = width;
      currentContext.viewport(0, 0, width, height);
      this.currentContext_ = currentContext;
      this.emitEvent(wtf.replay.graphics.Playback.EventType.CONTEXT_SET,
          currentContext);
      break;
  }
};


/**
 * Stores the context of a canvas-related object as a property of that object.
 * @param {!Object} obj The object to set the context of.
 * @param {!WebGLRenderingContext} ctx The context of the object.
 * @private
 */
wtf.replay.graphics.Playback.prototype.setOwningContext_ = function(obj, ctx) {
  obj[wtf.replay.graphics.Playback.GL_CONTEXT_PROPERTY_NAME_] = ctx;
};
