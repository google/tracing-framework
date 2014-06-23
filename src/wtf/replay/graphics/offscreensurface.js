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
 * @param {!number} width The width of the rendered area.
 * @param {!number} height The height of the rendered area.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.replay.graphics.OffscreenSurface = function(gl, width, height) {
  goog.base(this);

  /**
   * The WebGL context to associate with.
   * @type {!WebGLRenderingContext}
   * @private
   */
  this.context_ = gl;

  /**
   * The width of the rendered area.
   * @type {number}
   * @private
   */
  this.width_ = width;

  /**
   * The height of the rendered area.
   * @type {number}
   * @private
   */
  this.height_ = height;

  /**
   * Context attributes. These cannot be changed after getting the context.
   * @type {Object.<string, boolean>}
   * @private
   */
  this.contextAttributes_ = gl.getContextAttributes();

  /**
   * A backup/restore utility for this context.
   * @type {!wtf.replay.graphics.WebGLState}
   * @private
   */
  this.webGLState_ = new wtf.replay.graphics.WebGLState(gl);

  /**
   * Prevents resizing if true - preserving surface contents.
   * @type {boolean}
   * @private
   */
  this.resizeDisabled_ = false;

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

  // Create the objects declared above.
  this.initialize_();
};
goog.inherits(wtf.replay.graphics.OffscreenSurface, goog.Disposable);


/**
 * @override
 */
wtf.replay.graphics.OffscreenSurface.prototype.disposeInternal = function() {
  var gl = this.context_;

  gl.deleteFramebuffer(this.framebuffer_);
  gl.deleteTexture(this.texture_);
  if (this.depthStencilBuffer_) {
    gl.deleteRenderbuffer(this.depthStencilBuffer_);
  }
  gl.deleteProgram(this.drawTextureProgram_);
  gl.deleteBuffer(this.squareVertexPositionBuffer_);
  gl.deleteBuffer(this.squareTextureCoordBuffer_);

  goog.base(this, 'disposeInternal');
};


/**
 * Creates framebuffer, texture, drawTextureProgram, and buffers.
 * @private
 */
wtf.replay.graphics.OffscreenSurface.prototype.initialize_ = function() {
  var gl = this.context_;

  this.webGLState_.backup();

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
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, this.width_,
      this.height_, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, null);
  gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
      goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, this.texture_, 0);

  // Set renderbuffer attachment and storage formats based on context attribs.
  if (this.contextAttributes_['depth'] && this.contextAttributes_['stencil']) {
    this.rbAttachmentFormat_ = goog.webgl.DEPTH_STENCIL_ATTACHMENT;
    this.rbStorageFormat_ = goog.webgl.DEPTH_STENCIL;
  } else if (this.contextAttributes_['depth']) {
    this.rbAttachmentFormat_ = goog.webgl.DEPTH_ATTACHMENT;
    this.rbStorageFormat_ = goog.webgl.DEPTH_COMPONENT16;
  } else if (this.contextAttributes_['stencil']) {
    this.rbAttachmentFormat_ = goog.webgl.STENCIL_ATTACHMENT;
    this.rbStorageFormat_ = goog.webgl.STENCIL_INDEX8;
  }
  // Create renderbuffer, supporting depth/stencil as enabled in the context.
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
      '  gl_FragColor = texture2D(uSampler,' +
      '      vec2(vTextureCoord.s, vTextureCoord.t));' +
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
  goog.asserts.assert(gl.getProgramParameter(program, goog.webgl.LINK_STATUS));
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

  this.webGLState_.restore();
};


/**
 * Updates renderbuffer using this.width_ and this.height_.
 * @private
 */
wtf.replay.graphics.OffscreenSurface.prototype.updateRenderbuffer_ =
    function() {
  var gl = this.context_;

  if (this.rbStorageFormat_) {
    gl.bindRenderbuffer(goog.webgl.RENDERBUFFER, this.depthStencilBuffer_);
    gl.renderbufferStorage(goog.webgl.RENDERBUFFER, this.rbStorageFormat_,
        this.width_, this.height_);
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
};


/**
 * Resizes the render texture and depthStencilBuffer.
 * @param {!number} width The new width of the rendered area.
 * @param {!number} height The new height of the rendered area.
 */
wtf.replay.graphics.OffscreenSurface.prototype.resize = function(
    width, height) {
  var gl = this.context_;

  if (this.resizeDisabled_ ||
      (this.width_ === width && this.height_ === height)) {
    return;
  }

  this.webGLState_.backup();

  this.width_ = width;
  this.height_ = height;

  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, this.width_,
      this.height_, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, null);

  this.updateRenderbuffer_();

  this.webGLState_.restore();
};


/**
 * Binds the internal framebuffer.
 */
wtf.replay.graphics.OffscreenSurface.prototype.bindFramebuffer = function() {
  var gl = this.context_;

  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);
};


/**
 * Captures the pixel contents of the active framebuffer in the texture.
 */
wtf.replay.graphics.OffscreenSurface.prototype.captureTexture = function() {
  var gl = this.context_;

  var originalTextureBinding = /** @type {!WebGLTexture} */ (
      gl.getParameter(goog.webgl.TEXTURE_BINDING_2D));

  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  var alpha = this.contextAttributes_['alpha'];
  var format = alpha ? goog.webgl.RGBA : goog.webgl.RGB;
  gl.copyTexImage2D(goog.webgl.TEXTURE_2D, 0, format, 0, 0,
      this.width_, this.height_, 0);

  gl.bindTexture(goog.webgl.TEXTURE_2D, originalTextureBinding);
};


/**
 * Clears framebuffer, texture, and depth/stencil buffer completely.
 */
wtf.replay.graphics.OffscreenSurface.prototype.clear = function() {
  var gl = this.context_;

  this.webGLState_.backup();

  this.bindFramebuffer();
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.disable(goog.webgl.SCISSOR_TEST);
  gl.clear(goog.webgl.COLOR_BUFFER_BIT | goog.webgl.DEPTH_BUFFER_BIT |
      goog.webgl.STENCIL_BUFFER_BIT);

  this.webGLState_.restore();
};


/**
 * Draws the render texture using an internal shader to the active framebuffer.
 * @param {boolean=} opt_blend If true, use alpha blending. Otherwise no blend.
 */
wtf.replay.graphics.OffscreenSurface.prototype.drawTexture = function(
    opt_blend) {
  var gl = this.context_;

  this.webGLState_.backup();

  gl.useProgram(this.drawTextureProgram_);

  // Disable all attributes.
  var maxVertexAttribs = /** @type {number} */ (gl.getParameter(
      goog.webgl.MAX_VERTEX_ATTRIBS));
  for (var i = 0; i < maxVertexAttribs; i++) {
    gl.disableVertexAttribArray(i);
  }

  // Update vertex attrib settings.
  var vertexAttribLocation = gl.getAttribLocation(this.drawTextureProgram_,
      'aVertexPosition');
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.squareVertexPositionBuffer_);
  gl.enableVertexAttribArray(vertexAttribLocation);
  gl.vertexAttribPointer(vertexAttribLocation, 2, goog.webgl.FLOAT, false,
      0, 0);

  // Update texture coord attrib settings.
  var textureCoordAttribLocation = gl.getAttribLocation(
      this.drawTextureProgram_, 'aTextureCoord');
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

  var uniformLocation = gl.getUniformLocation(this.drawTextureProgram_,
      'uSampler');
  gl.activeTexture(goog.webgl.TEXTURE0);
  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  gl.uniform1i(uniformLocation, 0);

  // Change states prior to drawing.
  gl.disable(goog.webgl.CULL_FACE);
  gl.frontFace(goog.webgl.CCW);
  gl.disable(goog.webgl.DEPTH_TEST);
  gl.disable(goog.webgl.DITHER);
  gl.disable(goog.webgl.SCISSOR_TEST);
  gl.disable(goog.webgl.STENCIL_TEST);
  gl.colorMask(true, true, true, true);

  if (opt_blend) {
    gl.enable(goog.webgl.BLEND);
    gl.blendFunc(goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA);
  } else {
    gl.disable(goog.webgl.BLEND);
  }

  // Draw the texture to the current framebuffer.
  gl.drawArrays(goog.webgl.TRIANGLES, 0, 6);

  this.webGLState_.restore();
};
