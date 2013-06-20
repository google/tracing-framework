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

goog.require('goog.webgl');
goog.require('wtf.events.EventEmitter');



/**
 * Playback.
 * Plays an animation once. Does not play immediately after construction.
 *
 * @param {!wtf.db.EventList} events Event list for an entire animation.
 * @param {!wtf.replay.graphics.ContextPool} contextPool Pool of contexts.
 * @param {number=} opt_startEvent ID of event to start playing from.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.replay.graphics.Playback =
    function(events, contextPool, opt_startEvent) {
  goog.base(this);

  /**
   * List of events for an entire animation.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.events_ = events;

  /**
   * An iterator through events. Updated while playing. Points to event about
   * to be realized.
   * @type {!wtf.db.EventIterator}
   * @private
   */
  this.currentEvent_ = events.begin();

  /**
   * The ID of the frame that has not yet finished being drawn (or the frame
   * that will be finished next).
   * @type {number}
   * @private
   */
  this.currentFrame_ = 1;

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
   * A mapping of event IDs to elements for resources such as images.
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
   * The ID of event at which playing begins.
   * @type {number}
   * @private
   */
  this.startEvent_ = opt_startEvent || 0;


  /**
   * A mapping of handles to WebGL objects.
   * @type {!Object.<number, !Object>}
   * @private
   */
  this.objs_ = {};

  /**
   * The frame we are aiming for while seeking. This exists because a seek may
   * occur while an asynchronous backwards seek is already going on.
   * @type {number}
   * @private
   */
  this.targetFrame_ = 0;

  /**
   * Indicates whether a backwards seek is going on now.
   * @type {boolean}
   * @private
   */
  this.backwardsSeek_ = false;

  /**
   * Handler for animation request.
   * @type {?number}
   * @private
   */
  this.animationRequest_ = null;

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

  // Obtain all resources and play from starting event.
  this.fetchResources_(goog.bind(function() {
    this.quicklyRealizeEvents_(this.startEvent_);
  }, this));
};
goog.inherits(wtf.replay.graphics.Playback, wtf.events.EventEmitter);


/**
 * Name of the property used to store an object's context.
 * @type {string}
 * @private
 */
wtf.replay.graphics.Playback.GL_CONTEXT_PROPERTY_NAME = '__gl_context__';


/**
 * Clears all requests for preparing for or executing a frame.
 * @private
 */
wtf.replay.graphics.Playback.prototype.clearRequests_ = function() {
  if (this.animationRequest_ !== null) {
    cancelAnimationFrame(this.animationRequest_);
    this.animationRequest_ = null;
  }
  if (this.prepareFrameTimeout_ !== null) {
    clearTimeout(this.prepareFrameTimeout_);
    this.prepareFrameTimeout_ = null;
  }
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
  return webkitURL.createObjectURL(new Blob([data], {
    type: mimeType
  }));
};


/**
 * Decrements the number of resources that must still be loaded.
 * @param {!Function} callback Function called when no resources left to load.
 * @private
 */
wtf.replay.graphics.Playback.prototype.decrementResourcesLeftToLoad_ =
    function(callback) {
  this.resourcesLeftToLoad_ -= 1;
  if (this.resourcesLeftToLoad_ == 0) {
    console.log('Finished loading all resources.');
    this.resourcesDoneLoading_ = true;
    callback();
  }
};


/**
 * Draws the next frame.
 * @private
 */
wtf.replay.graphics.Playback.prototype.drawFrame_ = function() {
  if (this.currentEvent_.done()) {
    console.log('done playing');
    // TODO(chizeng): Fire a done playing event.
    return;
  } else {
    var ev = this.events_.beginEventRange(
        this.currentEvent_.getId(), this.events_.getCount() - 1);
    var finalEventID = this.currentEvent_.getId();
    for (; !ev.done() && ev.getName() != 'wtf.timing#frameEnd'; ev.next()) {
      ++finalEventID;
    }
    this.animationRequest_ = requestAnimationFrame(goog.bind(function() {
      this.quicklyRealizeEvents_(finalEventID);
      this.prepareFrame_();
    }, this));
  }
};


/**
 * Fetches all the resources needed for playback.
 * @param {!Function} callback The callback to run after fetching resources is
 * done.
 * @private
 */
wtf.replay.graphics.Playback.prototype.fetchResources_ = function(callback) {
  // First, find out what resources must be loaded.
  var eventsWithResourcesToLoad = [];
  for (var ev = this.events_.begin(); !ev.done(); ev.next()) {
    switch (ev.getName()) {
      case 'WebGLRenderingContext#texImage2D':
      case 'WebGLRenderingContext#texSubImage2D':
        var dataType = ev.getArguments().get('dataType');
        if (dataType != 'pixels' && dataType != 'null') {
          eventsWithResourcesToLoad.push(ev.getId());
        }
    }
  }
  // Now, actually load the resources.
  this.resourcesLeftToLoad_ = eventsWithResourcesToLoad.length;
  if (this.resourcesLeftToLoad_) {
    for (var i = 0; i < eventsWithResourcesToLoad.length; ++i) {
      var ev = this.events_.getEvent(eventsWithResourcesToLoad[i]);
      var args = ev.getArguments();
      var dataType = args.get('dataType');
      var url = (dataType.indexOf('image/') == 0) ?
          this.createBlobURL_(dataType, args.get('pixels')) : dataType;
      this.loadImage_(eventsWithResourcesToLoad[i], url, callback);
    }
  } else {
    // If no resources to load, just call the callback function.
    callback();
  }
};


/**
 * Loads a single image from a URL.
 * @param {number} eventID the ID of the event.
 * @param {string} url The URL of the resource to load.
 * @param {!Function} callback Called when all resources have loaded.
 * @private
 */
wtf.replay.graphics.Playback.prototype.loadImage_ =
    function(eventID, url, callback) {
  var img = new Image();
  var playback = this;
  img.onload = function() {
    playback.decrementResourcesLeftToLoad_(callback);
  };
  img.onerror = function() {
    console.warn('Error while trying to load image with url ' + url);
    playback.decrementResourcesLeftToLoad_(callback);
  };
  img.src = url;
  this.resources_[eventID] = img;
};


/**
 * Extracts the name of a method from the current event.
 * @return {string} The name of the method associated with the current event.
 * @private
 */
wtf.replay.graphics.Playback.prototype.methodName_ = function() {
  return this.currentEvent_.getName().split('#')[1];
};


/**
 * Begins playing starting at the current event. Must be called after all
 * resources have loaded.
 */
wtf.replay.graphics.Playback.prototype.play = function() {
  // Do not play if resources are loading.
  if (this.resourcesDoneLoading_) {
    console.log('begin play');
    // TODO(chizeng): Emit a play event with more details.
    this.emitEvent('BEGIN_PLAY');
    this.prepareFrame_();
  }
};


/**
 * Prepares for the next frame.
 * @private
 */
wtf.replay.graphics.Playback.prototype.prepareFrame_ = function() {
  if (this.currentEvent_.done()) {
    console.log('done playing');
    // TODO(chizeng): Fire a done playing event.
    return;
  } else {
    var ev = this.events_.beginEventRange(
        this.currentEvent_.getId(), this.events_.getCount() - 1);
    while (ev.getName() != 'wtf.timing#frameStart') {
      ev.next();
      // If we're done while preparing for a frame, no more frames to draw.
      if (ev.done()) {
        return;
      }
    }
    this.prepareFrameTimeout_ = setTimeout(goog.bind(function() {
      this.quicklyRealizeEvents_(ev.getId());
      this.drawFrame_();
    }, this), 0);
  }
};


/**
 * Quickly realizes events until the current event has the input ID. Does
 * nothing if the input ID is not greater than the ID of the current event.
 * Updates the current frame as events are realized. After this function, the
 * event to realize next is the one with the input ID.
 * @param {number} eventID The ID of the current event after this function is
 * called. Must be greater than the ID of the current event.
 * @private
 */
wtf.replay.graphics.Playback.prototype.quicklyRealizeEvents_ =
    function(eventID) {
  while (this.currentEvent_.getId() < eventID) {
    this.realizeEvent_();
  }
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
  var objs = this.objs_;

  // parse functions and arguments.
  switch (this.currentEvent_.getName()) {
    case 'WebGLRenderingContext#attachShader':
      this.currentContext_.attachShader(
          objs[args.get('program')], objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#activeTexture':
      this.currentContext_.activeTexture(args.get('texture'));
      break;
    case 'WebGLRenderingContext#bindAttribLocation':
      this.currentContext_.bindAttribLocation(
          objs[args.get('program')], args.get('index'), args.get('name'));
      // TODO(chizeng): Figure out if we want to build a mapping.
      // addAttribToProgram(
      //     args.get('program'), args.get('index'), args.get('index'));
      break;
    case 'WebGLRenderingContext#bindBuffer':
      this.currentContext_.bindBuffer(
          args.get('target'), objs[args.get('buffer')]);
      break;
    case 'WebGLRenderingContext#bindFramebuffer':
      this.currentContext_.bindFramebuffer(
          args.get('target'), objs[args.get('framebuffer')]);
      break;
    case 'WebGLRenderingContext#bindRenderbuffer':
      this.currentContext_.bindRenderbuffer(
          args.get('target'), objs[args.get('renderbuffer')]);
      break;
    case 'WebGLRenderingContext#bindTexture':
      this.currentContext_.bindTexture(
          args.get('target'), objs[args.get('texture')]);
      break;
    case 'WebGLRenderingContext#blendColor':
      this.currentContext_.blendColor(
          args.get('red'), args.get('green'), args.get('blue'),
          args.get('alpha'));
      break;
    case 'WebGLRenderingContext#blendEquation':
      this.currentContext_.blendEquation(args.get('mode'));
      break;
    case 'WebGLRenderingContext#blendEquationSeparate':
      this.currentContext_.blendEquationSeparate(
          args.get('modeRGB'), args.get('modeAlpha'));
      break;
    case 'WebGLRenderingContext#blendFunc':
      this.currentContext_.blendFunc(args.get('sfactor'), args.get('dfactor'));
      break;
    case 'WebGLRenderingContext#blendFuncSeparate':
      this.currentContext_.blendFuncSeparate(
          args.get('srcRGB'), args.get('dstRGB'), args.get('srcAlpha'),
          args.get('dstAlpha'));
      break;
    case 'WebGLRenderingContext#bufferData':
      var data = args.get('data');
      if (data.length < args.get('size')) {
        data = args.get('size'); // sometimes data is empty. odd.
      }
      this.currentContext_.bufferData(
          args.get('target'), data, args.get('usage'));
      break;
    case 'WebGLRenderingContext#bufferSubData':
      this.currentContext_.bufferSubData(
          args.get('target'), args.get('offset'), args.get('data'));
      break;
    case 'WebGLRenderingContext#checkFramebufferStatus':
      this.currentContext_.checkFramebufferStatus(args.get('target'));
      break;
    case 'WebGLRenderingContext#clear':
      this.currentContext_.clear(args.get('mask'));
      break;
    case 'WebGLRenderingContext#clearColor':
      this.currentContext_.clearColor(
          args.get('red'), args.get('green'), args.get('blue'),
          args.get('alpha'));
      break;
    case 'WebGLRenderingContext#clearDepth':
      this.currentContext_.clearDepth(args.get('depth'));
      break;
    case 'WebGLRenderingContext#clearStencil':
      this.currentContext_.clearStencil(args.get('s'));
      break;
    case 'WebGLRenderingContext#colorMask':
      this.currentContext_.colorMask(
          args.get('red'), args.get('green'), args.get('blue'),
          args.get('alpha'));
      break;
    case 'WebGLRenderingContext#compileShader':
      this.currentContext_.compileShader(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#compressedTexImage2D':
      this.currentContext_.compressedTexImage2D(
          args.get('target'), args.get('level'), args.get('internalformat'),
          args.get('width'), args.get('height'), args.get('border'),
          args.get('data'));
      break;
    case 'WebGLRenderingContext#compressedTexSubImage2D':
      this.currentContext_.compressedTexSubImage2D(
          args.get('target'), args.get('level'), args.get('xoffset'),
          args.get('yoffset'), args.get('width'), args.get('height'),
          args.get('format'), args.get('data'));
      break;
    case 'WebGLRenderingContext#copyTexImage2D':
      this.currentContext_.copyTexImage2D(
          args.get('target'), args.get('level'), args.get('internalformat'),
          args.get('x'), args.get('y'), args.get('width'),
          args.get('height'), args.get('border'));
      break;
    case 'WebGLRenderingContext#copyTexSubImage2D':
      this.currentContext_.copyTexSubImage2D(
          args.get('target'), args.get('level'), args.get('xoffset'),
          args.get('yoffset'), args.get('x'), args.get('y'),
          args.get('width'), args.get('height'));
      break;
    // And now, we have a slew of fxns that create resources.
    case 'WebGLRenderingContext#createBuffer':
    case 'WebGLRenderingContext#createFramebuffer':
    case 'WebGLRenderingContext#createRenderbuffer':
    case 'WebGLRenderingContext#createTexture':
      var nm = this.methodName_();
      objs[args.get('value')] = this.currentContext_[nm]();
      this.rememberContext_(objs[args.get('value')], this.currentContext_);
      break;
    case 'WebGLRenderingContext#createProgram':
      objs[args.get('value')] = this.currentContext_.createProgram();
      objs[args.get('value')]['__num_attribs__'] =
          this.currentContext_.getProgramParameter(
              objs[args.get('value')], goog.webgl.ACTIVE_ATTRIBUTES);
      this.rememberContext_(objs[args.get('value')], this.currentContext_);
      break;
    case 'WebGLRenderingContext#createShader':
      objs[args.get('value')] =
          this.currentContext_.createShader(args.get('type'));
      this.rememberContext_(objs[args.get('value')], this.currentContext_);
      break;
    case 'WebGLRenderingContext#cullFace':
      this.currentContext_.cullFace(args.get('mode'));
      break;
    // And now, we have a slew of fxns that delete resources.
    case 'WebGLRenderingContext#deleteBuffer':
    case 'WebGLRenderingContext#deleteFramebuffer':
    case 'WebGLRenderingContext#deleteProgram':
    case 'WebGLRenderingContext#deleteRenderbuffer':
    case 'WebGLRenderingContext#deleteShader':
    case 'WebGLRenderingContext#deleteTexture':
      var nm = this.methodName_();
      this.currentContext_[nm](objs[args.get('value')]);
      break;
    case 'WebGLRenderingContext#depthFunc':
      this.currentContext_.depthFunc(args.get('func'));
      break;
    case 'WebGLRenderingContext#depthMask':
      this.currentContext_.depthMask(args.get('flag'));
      break;
    case 'WebGLRenderingContext#depthRange':
      this.currentContext_.depthRange(args.get('zNear'), args.get('zFar'));
      break;
    case 'WebGLRenderingContext#detachShader':
      this.currentContext_.detachShader(
          args.get('program'), args.get('shader'));
      break;
    case 'WebGLRenderingContext#disable':
      this.currentContext_.disable(args.get('cap'));
      break;
    case 'WebGLRenderingContext#disableVertexAttribArray':
      this.currentContext_.disableVertexAttribArray(args.get('index'));
      break;
    case 'WebGLRenderingContext#drawArrays':
      this.currentContext_.drawArrays(
          args.get('mode'), args.get('first'), args.get('count'));
      break;
    case 'WebGLRenderingContext#drawElements':
      this.currentContext_.drawElements(
          args.get('mode'), args.get('count'), args.get('type'),
          args.get('offset'));
      break;
    case 'WebGLRenderingContext#enable':
      this.currentContext_.enable(args.get('cap'));
      break;
    case 'WebGLRenderingContext#enableVertexAttribArray':
      this.currentContext_.enableVertexAttribArray(args.get('index'));
      break;
    case 'WebGLRenderingContext#finish':
      this.currentContext_.finish();
      break;
    case 'WebGLRenderingContext#flush':
      this.currentContext_.flush();
      break;
    case 'WebGLRenderingContext#framebufferRenderbuffer':
      this.currentContext_.framebufferRenderbuffer(args.get('target'),
          args.get('attachment'), args.get('renderbuffertarget'),
          objs[args.get('renderbuffer')]);
      break;
    case 'WebGLRenderingContext#framebufferTexture2D':
      this.currentContext_.framebufferTexture2D(args.get('target'),
          args.get('attachment'), args.get('textarget'),
          objs[args.get('texture')], args.get('level'));
      break;
    case 'WebGLRenderingContext#frontFace':
      this.currentContext_.frontFace(args.get('mode'));
      break;
    case 'WebGLRenderingContext#generateMipmap':
      this.currentContext_.generateMipmap(args.get('target'));
      break;
    case 'WebGLRenderingContext#getActiveAttrib':
      // TODO(chi): modify this to make it work with varying locations.
      this.currentContext_.getActiveAttrib(
          objs[args.get('program')], args.get('index'));
      break;
    case 'WebGLRenderingContext#getActiveUniform':
      // maybe we must modify this to obtain the new active uniform.
      this.currentContext_.getActiveUniform(
          objs[args.get('program')], args.get('index'));
      break;
    case 'WebGLRenderingContext#getAttachedShaders':
      this.currentContext_.getAttachedShaders(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#getAttribLocation':
      // TODO(chi): create a mapping to actual attrib locations.
      this.currentContext_.getAttribLocation(
          objs[args.get('program')], args.get('name'));
      this.currentContext_.bindAttribLocation(
          objs[args.get('program')], args.get('value'), args.get('name'));
      break;
    case 'WebGLRenderingContext#getBufferParameter':
      this.currentContext_.getBufferParameter(
          args.get('target'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getError':
      this.currentContext_.getError();
      break;
    case 'WebGLRenderingContext#getFramebufferAttachmentParameter':
      this.currentContext_.getFramebufferAttachmentParameter(
          args.get('target'), args.get('attachment'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getExtension':
      // TODO(chi): possibly store the extension?
      if (!this.currentContext_.getExtension(args.get('name'))) {
        console.warn('Your GPU does not support extension ' +
            args.get('name'));
      }
      break;
    case 'WebGLRenderingContext#getParameter':
      this.currentContext_.getParameter(args.get('pname'));
      break;
    case 'WebGLRenderingContext#getFramebufferAttachmentParameter':
      this.currentContext_.getFramebufferAttachmentParameter(
          args.get('target'), args.get('attachment'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getProgramParameter':
      this.currentContext_.getProgramParameter(
          objs[args.get('program')], args.get('pname'));
      break;
    case 'WebGLRenderingContext#getProgramInfoLog':
      this.currentContext_.getProgramInfoLog(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#getRenderbufferParameter':
      this.currentContext_.getRenderbufferParameter(
          args.get('target'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getShaderParameter':
      this.currentContext_.getShaderParameter(
          objs[args.get('shader')], args.get('pname'));
      break;
    case 'WebGLRenderingContext#getShaderPrecisionFormat':
      this.currentContext_.getShaderPrecisionFormat(
          args.get('shadertype'), args.get('precisiontype'));
      break;
    case 'WebGLRenderingContext#getShaderInfoLog':
      this.currentContext_.getShaderInfoLog(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#getShaderSource':
      this.currentContext_.getShaderSource(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#getTexParameter':
      this.currentContext_.getTexParameter(
          args.get('target'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getUniform':
      this.currentContext_.getUniform(
          objs[args.get('program')], objs[args.get('location')]);
      break;
    case 'WebGLRenderingContext#getUniformLocation':
      // maybe this must change because we need a mapping.
      objs[args.get('value')] = this.currentContext_.getUniformLocation(
          objs[args.get('program')], args.get('name'));
      if (objs[args.get('value')]) {
        this.rememberContext_(objs[args.get('value')], this.currentContext_);
      }
      break;
    case 'WebGLRenderingContext#getVertexAttrib':
      // TODO(chi): maybe this must have a mapping.
      this.currentContext_.getVertexAttrib(
          args.get('index'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#getVertexAttribOffset':
      this.currentContext_.getVertexAttribOffset(
          args.get('index'), args.get('pname'));
      break;
    case 'WebGLRenderingContext#hint':
      this.currentContext_.hint(args.get('target'), args.get('mode'));
      break;
    case 'WebGLRenderingContext#isBuffer':
      this.currentContext_.isBuffer(objs[args.get('buffer')]);
      break;
    case 'WebGLRenderingContext#isEnabled':
      this.currentContext_.isEnabled(args.get('cap'));
      break;
    case 'WebGLRenderingContext#isFramebuffer':
      this.currentContext_.isFramebuffer(objs[args.get('framebuffer')]);
      break;
    case 'WebGLRenderingContext#isProgram':
      this.currentContext_.isProgram(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#isRenderbuffer':
      this.currentContext_.isRenderbuffer(objs[args.get('renderbuffer')]);
      break;
    case 'WebGLRenderingContext#isShader':
      this.currentContext_.isShader(objs[args.get('shader')]);
      break;
    case 'WebGLRenderingContext#isTexture':
      this.currentContext_.isTexture(objs[args.get('texture')]);
      break;
    case 'WebGLRenderingContext#lineWidth':
      this.currentContext_.lineWidth(args.get('width'));
      break;
    case 'WebGLRenderingContext#linkProgram':
      // Do all the attribute bindings, then link.
      var attribMap = args.get('attribs');
      for (var attribName in attribMap) {
        if (attribMap.hasOwnProperty(attribName)) {
          this.currentContext_.bindAttribLocation(
              objs[args.get('program')], attribMap[attribName], attribName);
        }
      }
      this.currentContext_.linkProgram(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#pixelStorei':
      this.currentContext_.pixelStorei(args.get('pname'), args.get('param'));
      break;
    case 'WebGLRenderingContext#polygonOffset':
      this.currentContext_.polygonOffset(
          args.get('factor'), args.get('units'));
      break;
    case 'WebGLRenderingContext#readPixels':
      this.currentContext_.readPixels(args.get('x'), args.get('y'),
          args.get('width'), args.get('height'), args.get('format'),
          args.get('type'), args.get('pixels'));
      break;
    case 'WebGLRenderingContext#renderbufferStorage':
      this.currentContext_.renderbufferStorage(args.get('target'),
          args.get('internalformat'), args.get('width'), args.get('height'));
      break;
    case 'WebGLRenderingContext#sampleCoverage':
      this.currentContext_.sampleCoverage(
          args.get('value'), args.get('invert'));
      break;
    case 'WebGLRenderingContext#scissor':
      this.currentContext_.scissor(args.get('x'), args.get('y'),
          args.get('width'), args.get('height'));
      break;
    case 'WebGLRenderingContext#shaderSource':
      this.currentContext_.shaderSource(
          objs[args.get('shader')], args.get('source'));
      break;
    case 'WebGLRenderingContext#stencilFunc':
      this.currentContext_.stencilFunc(
          args.get('func'), args.get('ref'), args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilFuncSeparate':
      this.currentContext_.stencilFuncSeparate(
          args.get('face'), args.get('func'), args.get('ref'),
          args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilMask':
      this.currentContext_.stencilMask(args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilMaskSeparate':
      this.currentContext_.stencilMaskSeparate(
          args.get('face'), args.get('mask'));
      break;
    case 'WebGLRenderingContext#stencilOp':
      this.currentContext_.stencilOp(
          args.get('fail'), args.get('zfail'), args.get('zpass'));
      break;
    case 'WebGLRenderingContext#stencilOpSeparate':
      this.currentContext_.stencilOpSeparate(
          args.get('face'), args.get('fail'), args.get('zfail'),
          args.get('zpass'));
      break;
    case 'WebGLRenderingContext#texImage2D':
      // TODO(chi): double check to ensure we covered all cases.
      // texImage2D is overloaded.
      var dataType = args.get('dataType');
      if (dataType == 'pixels') {
        this.currentContext_.texImage2D(
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
        this.currentContext_.texImage2D(
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
        this.currentContext_.texImage2D(
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
        this.currentContext_.texSubImage2D(
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
        this.currentContext_.texSubImage2D(
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
        this.currentContext_.texSubImage2D(
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
    case 'WebGLRenderingContext#texParameteri':
      var nm = this.methodName_();
      this.currentContext_[nm](
          args.get('target'), args.get('pname'), args.get('param'));
      break;
    case 'WebGLRenderingContext#uniform1f':
      this.currentContext_.uniform1f(
          objs[args.get('location')], args.get('x'));
      break;
    case 'WebGLRenderingContext#uniform1fv':
      this.currentContext_.uniform1fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform1i':
      this.currentContext_.uniform1i(
          objs[args.get('location')], args.get('x'));
      break;
    case 'WebGLRenderingContext#uniform1iv':
      this.currentContext_.uniform1iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform2f':
      this.currentContext_.uniform2f(
          objs[args.get('location')], args.get('x'), args.get('y'));
      break;
    case 'WebGLRenderingContext#uniform2fv':
      this.currentContext_.uniform2fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform2i':
      this.currentContext_.uniform2i(
          objs[args.get('location')], args.get('x'), args.get('y'));
      break;
    case 'WebGLRenderingContext#uniform2iv':
      this.currentContext_.uniform2iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform3f':
      this.currentContext_.uniform3f(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'));
      break;
    case 'WebGLRenderingContext#uniform3fv':
      this.currentContext_.uniform3fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform3i':
      this.currentContext_.uniform3i(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'));
      break;
    case 'WebGLRenderingContext#uniform3iv':
      this.currentContext_.uniform3iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform4f':
      this.currentContext_.uniform4f(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'), args.get('w'));
      break;
    case 'WebGLRenderingContext#uniform4fv':
      this.currentContext_.uniform4fv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniform4i':
      this.currentContext_.uniform4i(
          objs[args.get('location')], args.get('x'), args.get('y'),
          args.get('z'), args.get('w'));
      break;
    case 'WebGLRenderingContext#uniform4iv':
      this.currentContext_.uniform4iv(
          objs[args.get('location')], args.get('v'));
      break;
    case 'WebGLRenderingContext#uniformMatrix2fv':
    case 'WebGLRenderingContext#uniformMatrix3fv':
    case 'WebGLRenderingContext#uniformMatrix4fv':
      var nm = this.methodName_();
      this.currentContext_[nm](
          objs[args.get('location')], args.get('transpose'), args.get('value'));
      break;
    case 'WebGLRenderingContext#useProgram':
      this.currentContext_.useProgram(objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#validateProgram':
      var nm = this.methodName_();
      this.currentContext_[nm](objs[args.get('program')]);
      break;
    case 'WebGLRenderingContext#vertexAttrib1fv':
    case 'WebGLRenderingContext#vertexAttrib2fv':
    case 'WebGLRenderingContext#vertexAttrib3fv':
    case 'WebGLRenderingContext#vertexAttrib4fv':
      var nm = this.methodName_();
      this.currentContext_[nm](
          args.get('indx'), args.get('values'));
      break;
    case 'WebGLRenderingContext#vertexAttrib1f':
      this.currentContext_.vertexAttrib1f(
          args.get('indx'), args.get('x'));
      break;
    case 'WebGLRenderingContext#vertexAttrib2f':
      this.currentContext_.vertexAttrib2f(
          args.get('indx'), args.get('x'), args.get('y'));
      break;
    case 'WebGLRenderingContext#vertexAttrib3f':
      this.currentContext_.vertexAttrib3f(
          args.get('indx'), args.get('x'), args.get('y'), args.get('z'));
      break;
    case 'WebGLRenderingContext#vertexAttrib4f':
      this.currentContext_.vertexAttrib4f(
          args.get('indx'), args.get('x'), args.get('y'), args.get('z'),
          args.get('w'));
      break;
    case 'WebGLRenderingContext#vertexAttribPointer':
      this.currentContext_.vertexAttribPointer(args.get('indx'),
          args.get('size'), args.get('type'), args.get('normalized'),
          args.get('stride'), args.get('offset'));
      break;
    case 'WebGLRenderingContext#viewport':
      this.currentContext_.viewport(args.get('x'), args.get('y'),
          args.get('width'), args.get('height'));
      break;
    case 'wtf.timing#frameEnd':
      this.currentFrame_ += 1;
      break;
    case 'wtf.webgl#createContext':
      var attributes = args.get('attributes');
      // Assume that the context is webgl for now.
      this.currentContext_ =
          contextPool.getContext('webgl', attributes) ||
          contextPool.getContext('experimental-webgl', attributes);
      this.contexts_[args.get('handle')] = this.currentContext_;
      // TODO(chizeng): Fire an event indicating a new context was made.
      break;
    case 'wtf.webgl#setContext':
      var contextHandle = args.get('handle');
      var height = args.get('height');
      var width = args.get('width');
      this.currentContext_ = this.contexts_[contextHandle];
      this.currentContext_.canvas.height = height;
      this.currentContext_.canvas.width = width;
      this.currentContext_.viewport(0, 0, width, height);
      // TODO(chizeng): Fire an event indicating a new context was set.
      break;
  }
  this.currentEvent_.next();
};


/**
 * Stores the context of a canvas-related object as a property of that object.
 * @param {!Object} obj The object to remember the context of.
 * @param {!WebGLRenderingContext} ctx The context of the object.
 * @private
 */
wtf.replay.graphics.Playback.prototype.rememberContext_ = function(obj, ctx) {
  obj[wtf.replay.graphics.Playback.GL_CONTEXT_PROPERTY_NAME] = ctx;
};


/**
 * Seeks to the beginning event of a certain frame. After this function, the
 * current frame will have number |frameID|, and the current event will be the
 * beginning event of that frame. That event will not yet have been realized.
 * @param {number} frameID ID of the frame to seek.
 */
wtf.replay.graphics.Playback.prototype.seekFrame = function(frameID) {
  // If backwards seek in progress, record new frame target, seek it later.
  this.targetFrame_ = frameID;
  if (!this.backwardsSeek_) {
    this.clearRequests_();
    // If forward seek, go forward.
    if (frameID > this.currentFrame_) {
      while (frameID > this.currentFrame_) {
        this.realizeEvent_();
      }
    } else if (frameID < this.currentFrame_) {
      // TODO(chizeng): Do a backwards seek.
    }
  }
};
