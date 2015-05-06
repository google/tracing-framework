/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview OffscreenSurface. Stores an offscreen framebuffer and texture.
 * The internal texture is used as a render target for the framebuffer.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.OffscreenSurface');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('wtf.replay.graphics.WebGLState');



/**
 * Stores an offscreen framebuffer that renders into a texture.
 * Surfaces are created using dimensions width and height.
 * However, these can be resized after creation using the resize method.
 *
 * @param {!WebGLRenderingContext} gl The context to work with.
 * @param {number} width The width of the rendered area.
 * @param {number} height The height of the rendered area.
 * @param {{stencil: (boolean|undefined), depth: (boolean|undefined)}=} opt_args
 *   Additional setup arguments.
 *   Stencil and depth are used to force stencil/depth buffer support.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.replay.graphics.OffscreenSurface = function(gl, width, height, opt_args) {
  goog.base(this);

  /**
   * The WebGL context to associate with.
   * @type {!WebGLRenderingContext}
   * @protected
   */
  this.context = gl;

  /**
   * The width of the rendered area.
   * @type {number}
   * @protected
   */
  this.width = width;

  /**
   * The height of the rendered area.
   * @type {number}
   * @protected
   */
  this.height = height;

  /**
   * Context attributes. These cannot be changed after getting the context.
   * @type {Object.<string, boolean>}
   * @private
   */
  this.contextAttributes_ = gl.getContextAttributes();

  /**
   * Whether the surface should have a stencil buffer.
   * @type {boolean}
   * @private
   */
  this.stencil_ = (opt_args && opt_args['stencil']) ||
      this.contextAttributes_['stencil'];

  /**
   * Whether the surface should have a depth buffer.
   * @type {boolean}
   * @private
   */
  this.depth_ = opt_args && opt_args['depth'] ||
      this.contextAttributes_['depth'];

  /**
   * A backup/restore utility for this context.
   * @type {!wtf.replay.graphics.WebGLState}
   * @protected
   */
  this.webGLState = new wtf.replay.graphics.WebGLState(gl);

  /**
   * Prevents resizing if true - preserving surface contents.
   * @type {boolean}
   * @private
   */
  this.resizeDisabled_ = false;

  /**
   * The latest specified width of the rendered area. Used in enableResize.
   * @type {number}
   * @private
   */
  this.nextWidth_ = width;

  /**
   * The latest specified height of the rendered area. Used in enableResize.
   * @type {number}
   * @private
   */
  this.nextHeight_ = height;

  /**
   * The offscreen framebuffer.
   * @type {WebGLFramebuffer}
   * @private
   */
  this.framebuffer_ = null;

  /**
   * Internal texture. Used as a render target for this.framebuffer_.
   * Used by drawTexture and captureTexture.
   * @type {WebGLTexture}
   * @private
   */
  this.texture_ = null;

  /**
   * Renderbuffer used for depth/stencil information in the framebuffer.
   * If depth is enabled and stencil is not, this stores only depth data, etc.
   * @type {WebGLRenderbuffer}
   * @private
   */
  this.depthStencilBuffer_ = null;

  /**
   * Renderbuffer attachment format, varies with depth and stencil.
   * Options: goog.webgl.{DEPTH, STENCIL, DEPTH_STENCIL}_ATTACHMENT.
   * @type {?number}
   * @private
   */
  this.rbAttachmentFormat_ = null;

  /**
   * Renderbuffer storage format, varies with depth and stencil.
   * Options: goog.webgl.{DEPTH_STENCIL, DEPTH_COMPONENT16, STENCIL_INDEX8}.
   * @type {?number}
   * @private
   */
  this.rbStorageFormat_ = null;

  /**
   * A shader program that simply draws a texture.
   * @type {WebGLProgram}
   * @private
   */
  this.drawTextureProgram_ = null;

  /**
   * A buffer containing vertex positions arranged in a square.
   * @type {WebGLBuffer}
   * @private
   */
  this.squareVertexPositionBuffer_ = null;

  /**
   * A buffer containing texture coordinates arranged for a square.
   * @type {WebGLBuffer}
   * @private
   */
  this.squareTextureCoordBuffer_ = null;

  /**
   * Whether this object has been initialized.
   * @type {boolean|undefined}
   * @protected
   */
  this.initialized = undefined;
};
goog.inherits(wtf.replay.graphics.OffscreenSurface, goog.Disposable);


/**
 * @override
 */
wtf.replay.graphics.OffscreenSurface.prototype.disposeInternal = function() {
  this.clearWebGLObjects();

  goog.base(this, 'disposeInternal');
};


/**
 * Clears WebGL objects.
 * @protected
 */
wtf.replay.graphics.OffscreenSurface.prototype.clearWebGLObjects = function() {
  var gl = this.context;

  gl.deleteFramebuffer(this.framebuffer_);
  gl.deleteTexture(this.texture_);
  gl.deleteProgram(this.drawTextureProgram_);
  gl.deleteRenderbuffer(this.depthStencilBuffer_);
  gl.deleteBuffer(this.squareVertexPositionBuffer_);
  gl.deleteBuffer(this.squareTextureCoordBuffer_);
};


/**
 * Performs one time initialization if needed. Only attempts setup once.
 * @return {boolean} Whether initialization succeeded or was already completed.
 * @protected
 */
wtf.replay.graphics.OffscreenSurface.prototype.ensureInitialized = function() {
  if (!goog.isDef(this.initialized)) {
    this.initialized = this.initialize();
  }
  return this.initialized;
};


/**
 * Creates framebuffer, texture, drawTextureProgram, and buffers.
 * @return {boolean} Whether initialization succeeded.
 * @protected
 */
wtf.replay.graphics.OffscreenSurface.prototype.initialize = function() {
  var gl = this.context;

  this.webGLState.backup();

  // Create the offscreen framebuffer.
  this.framebuffer_ = gl.createFramebuffer();
  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);

  // Create the texture and set it as a render target for the framebuffer.
  this.texture_ = gl.createTexture();
  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER,
      goog.webgl.LINEAR);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER,
      goog.webgl.LINEAR);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S,
      goog.webgl.CLAMP_TO_EDGE);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T,
      goog.webgl.CLAMP_TO_EDGE);
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, this.width,
      this.height, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, null);
  gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
      goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, this.texture_, 0);

  // Set renderbuffer attachment and storage formats.
  if (this.depth_ && this.stencil_) {
    this.rbAttachmentFormat_ = goog.webgl.DEPTH_STENCIL_ATTACHMENT;
    this.rbStorageFormat_ = goog.webgl.DEPTH_STENCIL;
  } else if (this.depth_) {
    this.rbAttachmentFormat_ = goog.webgl.DEPTH_ATTACHMENT;
    this.rbStorageFormat_ = goog.webgl.DEPTH_COMPONENT16;
  } else if (this.stencil_) {
    this.rbAttachmentFormat_ = goog.webgl.STENCIL_ATTACHMENT;
    this.rbStorageFormat_ = goog.webgl.STENCIL_INDEX8;
  }
  // Create renderbuffer, supporting depth/stencil as requested.
  if (this.rbAttachmentFormat_) {
    this.depthStencilBuffer_ = gl.createRenderbuffer();
    this.updateRenderbuffer_();
    gl.framebufferRenderbuffer(goog.webgl.FRAMEBUFFER,
        this.rbAttachmentFormat_, goog.webgl.RENDERBUFFER,
        this.depthStencilBuffer_);
  }

  // Create a program to draw a texture.
  var program = gl.createProgram();
  var drawTextureVertexSource = 'attribute vec2 aVertexPosition;' +
      'attribute vec2 aTextureCoord;' +
      'varying vec2 vTextureCoord;' +
      'void main(void) {' +
      '  vTextureCoord = aTextureCoord;' +
      '  gl_Position = vec4(aVertexPosition, 0.0, 1.0);' +
      '}';
  var drawTextureFragmentSource = 'precision mediump float;' +
      'varying vec2 vTextureCoord;' +
      'uniform sampler2D uSampler;' +
      'void main(void) {' +
      '  gl_FragColor = texture2D(uSampler, vTextureCoord);' +
      '}';

  // Compile shader sources.
  var drawTextureVertexShader = gl.createShader(goog.webgl.VERTEX_SHADER);
  gl.shaderSource(drawTextureVertexShader, drawTextureVertexSource);
  gl.compileShader(drawTextureVertexShader);

  var drawTextureFragmentShader = gl.createShader(goog.webgl.FRAGMENT_SHADER);
  gl.shaderSource(drawTextureFragmentShader, drawTextureFragmentSource);
  gl.compileShader(drawTextureFragmentShader);

  // Attach shaders and link the drawTexture program.
  gl.attachShader(program, drawTextureVertexShader);
  gl.attachShader(program, drawTextureFragmentShader);
  gl.linkProgram(program);
  goog.asserts.assert(gl.getProgramParameter(program, goog.webgl.LINK_STATUS),
      'OffscreenSurface drawTexture program did not link.');

  this.drawTextureProgram_ = program;

  gl.detachShader(program, drawTextureVertexShader);
  gl.detachShader(program, drawTextureFragmentShader);
  gl.deleteShader(drawTextureVertexShader);
  gl.deleteShader(drawTextureFragmentShader);

  // Setup attributes aVertexPosition and aTextureCoord.
  this.squareVertexPositionBuffer_ = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.squareVertexPositionBuffer_);
  var vertices = [
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    1.0, 1.0];
  gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array(vertices),
      goog.webgl.STATIC_DRAW);

  this.squareTextureCoordBuffer_ = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.squareTextureCoordBuffer_);
  var textureCoords = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0];
  gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array(textureCoords),
      goog.webgl.STATIC_DRAW);

  this.webGLState.restore();

  return true;
};


/**
 * Updates renderbuffer using this.width and this.height.
 * @private
 */
wtf.replay.graphics.OffscreenSurface.prototype.updateRenderbuffer_ =
    function() {
  var gl = this.context;

  if (this.rbStorageFormat_) {
    gl.bindRenderbuffer(goog.webgl.RENDERBUFFER, this.depthStencilBuffer_);
    gl.renderbufferStorage(goog.webgl.RENDERBUFFER, this.rbStorageFormat_,
        this.width, this.height);
  }
};


/**
 * Prevents resizing until enableResize is called.
 */
wtf.replay.graphics.OffscreenSurface.prototype.disableResize = function() {
  this.resizeDisabled_ = true;
};


/**
 * Restores resizing.
 */
wtf.replay.graphics.OffscreenSurface.prototype.enableResize = function() {
  this.resizeDisabled_ = false;

  this.resize(this.nextWidth_, this.nextHeight_);
};


/**
 * Resizes the render texture and depthStencilBuffer.
 * @param {number} width The new width of the rendered area.
 * @param {number} height The new height of the rendered area.
 */
wtf.replay.graphics.OffscreenSurface.prototype.resize = function(
    width, height) {
  this.nextWidth_ = width;
  this.nextHeight_ = height;

  if (this.resizeDisabled_ ||
      (this.width === width && this.height === height)) {
    return;
  }

  this.width = width;
  this.height = height;

  if (!this.initialized) {
    return;
  }

  var gl = this.context;

  this.webGLState.backup();

  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, this.width,
      this.height, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, null);

  this.updateRenderbuffer_();

  this.webGLState.restore();
};


/**
 * Binds the internal framebuffer.
 */
wtf.replay.graphics.OffscreenSurface.prototype.bindFramebuffer = function() {
  this.ensureInitialized();

  var gl = this.context;

  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);
};


/**
 * Captures the pixel contents of the active framebuffer in the texture.
 */
wtf.replay.graphics.OffscreenSurface.prototype.captureTexture = function() {
  this.ensureInitialized();

  var gl = this.context;

  var originalTextureBinding = /** @type {!WebGLTexture} */ (
      gl.getParameter(goog.webgl.TEXTURE_BINDING_2D));

  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  var alpha = this.contextAttributes_['alpha'];
  var format = alpha ? goog.webgl.RGBA : goog.webgl.RGB;
  gl.copyTexImage2D(goog.webgl.TEXTURE_2D, 0, format, 0, 0,
      this.width, this.height, 0);

  gl.bindTexture(goog.webgl.TEXTURE_2D, originalTextureBinding);
};


/**
 * Clears framebuffer, texture, and depth/stencil buffer completely.
 * @param {Array.<number>=} opt_color Override color to clear with.
 */
wtf.replay.graphics.OffscreenSurface.prototype.clear = function(opt_color) {
  if (!this.initialized) {
    return;
  }

  var gl = this.context;

  this.webGLState.backup();

  this.bindFramebuffer();
  gl.disable(goog.webgl.SCISSOR_TEST);
  gl.colorMask(true, true, true, true);
  if (opt_color) {
    gl.clearColor(opt_color[0], opt_color[1], opt_color[2], opt_color[3]);
  }
  gl.stencilMask(0xff);
  gl.depthMask(true);

  gl.clear(goog.webgl.COLOR_BUFFER_BIT | goog.webgl.DEPTH_BUFFER_BIT |
      goog.webgl.STENCIL_BUFFER_BIT);

  this.webGLState.restore();
};


/**
 * Draws the render texture using an internal shader to the active framebuffer.
 * @param {boolean=} opt_blend If true, use alpha blending. Otherwise no blend.
 */
wtf.replay.graphics.OffscreenSurface.prototype.drawTexture = function(
    opt_blend) {
  this.ensureInitialized();
  this.drawTextureInternal(this.texture_, this.drawTextureProgram_, opt_blend);
};


/**
 * Draws a texture using the internal shader to the active framebuffer.
 * @param {WebGLTexture} texture The texture to draw.
 * @param {WebGLProgram} program The program to use.
 *   Expected to have attributes aVertexPosition and aTextureCoord (both vec2).
 *   Expected to have uniform uSampler (sampler2D).
 * @param {boolean=} opt_blend If true, use alpha blending. Otherwise no blend.
 * @protected
 */
wtf.replay.graphics.OffscreenSurface.prototype.drawTextureInternal = function(
    texture, program, opt_blend) {
  this.ensureInitialized();

  var gl = this.context;

  this.webGLState.backup();

  gl.useProgram(program);

  // Disable all attributes.
  var maxVertexAttribs = /** @type {number} */ (gl.getParameter(
      goog.webgl.MAX_VERTEX_ATTRIBS));
  for (var i = 0; i < maxVertexAttribs; i++) {
    gl.disableVertexAttribArray(i);
  }

  // Update vertex attrib settings.
  var vertexAttribLocation = gl.getAttribLocation(program, 'aVertexPosition');
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.squareVertexPositionBuffer_);
  gl.enableVertexAttribArray(vertexAttribLocation);
  gl.vertexAttribPointer(vertexAttribLocation, 2, goog.webgl.FLOAT, false,
      0, 0);

  // Update texture coord attrib settings.
  var textureCoordAttribLocation = gl.getAttribLocation(program,
      'aTextureCoord');
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.squareTextureCoordBuffer_);
  gl.enableVertexAttribArray(textureCoordAttribLocation);
  gl.vertexAttribPointer(textureCoordAttribLocation, 2, goog.webgl.FLOAT,
      false, 0, 0);

  // Disable instancing for attributes, if the extension exists.
  var ext = gl.getExtension('ANGLE_instanced_arrays');
  if (ext) {
    ext['vertexAttribDivisorANGLE'](vertexAttribLocation, 0);
    ext['vertexAttribDivisorANGLE'](textureCoordAttribLocation, 0);
  }

  var uniformLocation = gl.getUniformLocation(program, 'uSampler');
  gl.activeTexture(goog.webgl.TEXTURE0);
  gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
  gl.uniform1i(uniformLocation, 0);

  // Change states prior to drawing.
  gl.disable(goog.webgl.CULL_FACE);
  gl.frontFace(goog.webgl.CCW);
  gl.disable(goog.webgl.DEPTH_TEST);
  gl.disable(goog.webgl.DITHER);
  gl.disable(goog.webgl.SCISSOR_TEST);
  gl.disable(goog.webgl.STENCIL_TEST);
  gl.colorMask(true, true, true, true);
  gl.viewport(0, 0, this.width, this.height);

  if (opt_blend) {
    gl.enable(goog.webgl.BLEND);
    gl.blendFunc(goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA);
  } else {
    gl.disable(goog.webgl.BLEND);
  }

  // Draw the texture to the current framebuffer.
  gl.drawArrays(goog.webgl.TRIANGLES, 0, 6);

  this.webGLState.restore();
};
