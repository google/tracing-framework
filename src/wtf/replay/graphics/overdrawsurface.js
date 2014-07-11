/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview OverdrawSurface. OffscreenSurface used for overdraw.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.OverdrawSurface');

goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('wtf.replay.graphics.OffscreenSurface');



/**
 * OffscreenSurface used for overdraw.
 *
 * @param {!WebGLRenderingContext} gl The context to work with.
 * @param {number} width The width of the rendered area.
 * @param {number} height The height of the rendered area.
 * @param {{stencil: (boolean|undefined), depth: (boolean|undefined),
 *     thresholdColors: (Array.<string>|undefined)}=} opt_args
 *   Additional setup arguments.
 *   Stencil and depth are used to force stencil/depth buffer support.
 *   Override threshold colors are formatted like: 'vec4(0.0, 0.0, 0.0, 1.0)'.
 * @constructor
 * @extends {wtf.replay.graphics.OffscreenSurface}
 */
wtf.replay.graphics.OverdrawSurface = function(gl, width, height, opt_args) {
  goog.base(this, gl, width, height, opt_args);

  /**
   * A shader program that draws a texture using threshold colors for overdraw.
   * @type {WebGLProgram}
   * @private
   */
  this.drawOverdrawProgram_ = null;

  /**
   * A shader program that draws a quad using the threshold color.
   * @type {WebGLProgram}
   * @private
   */
  this.drawQuadProgram_ = null;

  /**
   * Array of color strings (GLSL vec4s), sorted from darkest to brightest.
   * @type {!Array.<string>}
   * @private
   */
  this.thresholdColors_ = opt_args && /** @type {Array.<string>} */ (
      opt_args['thresholdColors']) || this.getDefaultColors_();

  /**
   * Amount to draw into the visualizerSurface with each draw call.
   * @type {number}
   * @private
   */
  this.thresholdValuePerCall_ = 1.0 / 255.0;
};
goog.inherits(wtf.replay.graphics.OverdrawSurface,
    wtf.replay.graphics.OffscreenSurface);


/**
 * Clears WebGL objects.
 * @protected
 * @override
 */
wtf.replay.graphics.OverdrawSurface.prototype.clearWebGLObjects = function() {
  goog.base(this, 'clearWebGLObjects');

  var gl = this.context;

  gl.deleteProgram(this.drawOverdrawProgram_);
  gl.deleteProgram(this.drawQuadProgram_);
};


/**
 * Returns the default threshold colors.
 * @return {!Array.<string>} Array of color strings.
 * @private
 */
wtf.replay.graphics.OverdrawSurface.prototype.getDefaultColors_ = function() {
  return [
    'vec4(0.00, 0.00, 0.00, 0.0)', /* Transparent */
    'vec4(0.08, 0.36, 0.05, 1.0)', /* Dark Green */
    'vec4(0.30, 0.60, 0.25, 1.0)', /* Green */
    'vec4(0.46, 0.78, 0.39, 1.0)', /* Light Green */
    'vec4(0.83, 0.83, 0.33, 1.0)', /* Yellow */
    'vec4(0.93, 0.57, 0.16, 1.0)', /* Orange */
    'vec4(0.95, 0.22, 0.22, 1.0)', /* Red */
    'vec4(0.60, 0.12, 0.12, 1.0)', /* Dark Red */
    'vec4(0.15, 0.15, 0.15, 1.0)', /* Black */
    'vec4(0.35, 0.35, 0.35, 1.0)', /* Grey */
    'vec4(0.55, 0.55, 0.55, 1.0)', /* Light Grey */
    'vec4(0.85, 0.85, 0.85, 1.0)'  /* White */
  ];
};


/**
 * Returns the color to be used with draw calls for thresholding.
 * @return {string} Color string formatted as a GLSL vec4.
 */
wtf.replay.graphics.OverdrawSurface.prototype.getThresholdDrawColor =
    function() {
  return 'vec4(1.0, 1.0, 1.0, ' + this.thresholdValuePerCall_ + ')';
};


/**
 * Creates framebuffer, texture, drawTextureProgram, and buffers.
 * @return {boolean} Whether initialization succeeded.
 * @protected
 */
wtf.replay.graphics.OverdrawSurface.prototype.initialize = function() {
  if (!goog.base(this, 'initialize')) {
    return false;
  }

  var gl = this.context;

  this.webGLState.backup();

  // Create color thresholded overdraw shader.
  var program = gl.createProgram();

  var thresholdVertexSource = 'attribute vec2 aVertexPosition;' +
      'attribute vec2 aTextureCoord;' +
      'varying vec2 vTextureCoord;' +
      'void main(void) {' +
      '  vTextureCoord = aTextureCoord;' +
      '  gl_Position = vec4(aVertexPosition, 0.0, 1.0);' +
      '}';
  var thresholdFragmentSource = 'precision mediump float;' +
      'varying vec2 vTextureCoord;' +
      'uniform sampler2D uSampler;' +
      'void main(void) {' +
      '  vec4 sampleColor = texture2D(uSampler, vTextureCoord);' +
      '  vec4 outputColor = vec4(1.0, 0.0, 1.0, 1.0); /* default */';
  for (var i = 0; i < this.thresholdColors_.length; i++) {
    // Cutoff halfway between to avoid floating point issues.
    var threshold = this.thresholdValuePerCall_ * (i - 0.5);
    thresholdFragmentSource += '' +
        'if (sampleColor.x >= ' + threshold + ' ) {' +
        '  outputColor = ' + this.thresholdColors_[i] + ';' +
        '}';
  }
  thresholdFragmentSource += '' +
      '  gl_FragColor = vec4(outputColor);' +
      '}';

  var thresholdVertexShader = gl.createShader(goog.webgl.VERTEX_SHADER);
  gl.shaderSource(thresholdVertexShader, thresholdVertexSource);
  gl.compileShader(thresholdVertexShader);

  var thresholdFragmentShader = gl.createShader(goog.webgl.FRAGMENT_SHADER);
  gl.shaderSource(thresholdFragmentShader, thresholdFragmentSource);
  gl.compileShader(thresholdFragmentShader);
  gl.attachShader(program, thresholdVertexShader);
  gl.attachShader(program, thresholdFragmentShader);
  gl.linkProgram(program);
  goog.asserts.assert(gl.getProgramParameter(program, goog.webgl.LINK_STATUS),
      'OverdrawSurface threshold program did not link.');
  this.drawOverdrawProgram_ = program;

  gl.detachShader(program, thresholdVertexShader);
  gl.detachShader(program, thresholdFragmentShader);
  gl.deleteShader(thresholdVertexShader);
  gl.deleteShader(thresholdFragmentShader);

  // Create quad drawing program that uses threshold color.
  var quadProgram = gl.createProgram();

  var quadVertexSource = 'attribute vec2 aVertexPosition;' +
      'void main(void) {' +
      '  gl_Position = vec4(aVertexPosition, 0.0, 1.0);' +
      '}';
  var quadFragmentSource = 'precision mediump float;' +
      'void main(void) {' +
      '  gl_FragColor = ' + this.getThresholdDrawColor() + ';' +
      '}';

  var quadVertexShader = gl.createShader(goog.webgl.VERTEX_SHADER);
  gl.shaderSource(quadVertexShader, quadVertexSource);
  gl.compileShader(quadVertexShader);

  var quadFragmentShader = gl.createShader(goog.webgl.FRAGMENT_SHADER);
  gl.shaderSource(quadFragmentShader, quadFragmentSource);
  gl.compileShader(quadFragmentShader);
  gl.attachShader(quadProgram, quadVertexShader);
  gl.attachShader(quadProgram, quadFragmentShader);
  gl.linkProgram(quadProgram);
  goog.asserts.assert(gl.getProgramParameter(quadProgram,
      goog.webgl.LINK_STATUS), 'OverdrawSurface quad program did not link.');
  this.drawQuadProgram_ = quadProgram;

  gl.detachShader(quadProgram, quadVertexShader);
  gl.detachShader(quadProgram, quadFragmentShader);
  gl.deleteShader(quadVertexShader);
  gl.deleteShader(quadFragmentShader);

  this.webGLState.restore();

  return true;
};


/**
 * Draws the render texture using threshold colors for overdraw.
 * @param {boolean=} opt_blend If true, use alpha blending. Otherwise no blend.
 */
wtf.replay.graphics.OffscreenSurface.prototype.drawOverdraw = function(
    opt_blend) {
  this.ensureInitialized();
  this.drawTextureInternal(this.texture_, this.drawOverdrawProgram_, opt_blend);
};


/**
 * Draws a quad over the screen using the threshold color.
 * Can be used to draw what clear affects.
 * Does not update blending, depth, scissor, stencil, or related WebGL states.
 */
wtf.replay.graphics.OffscreenSurface.prototype.drawQuad = function() {
  var gl = this.context;

  this.webGLState.backup();

  gl.useProgram(this.drawQuadProgram_);

  // Disable all attributes.
  var maxVertexAttribs = /** @type {number} */ (gl.getParameter(
      goog.webgl.MAX_VERTEX_ATTRIBS));
  for (var i = 0; i < maxVertexAttribs; i++) {
    gl.disableVertexAttribArray(i);
  }

  // Update vertex attrib settings.
  var vertexAttribLocation = gl.getAttribLocation(this.drawQuadProgram_,
      'aVertexPosition');
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.squareVertexPositionBuffer_);
  gl.enableVertexAttribArray(vertexAttribLocation);
  gl.vertexAttribPointer(vertexAttribLocation, 2, goog.webgl.FLOAT, false,
      0, 0);

  // Disable instancing for attributes, if the extension exists.
  var ext = gl.getExtension('ANGLE_instanced_arrays');
  if (ext) {
    ext['vertexAttribDivisorANGLE'](vertexAttribLocation, 0);
  }

  // Draw to the current framebuffer.
  gl.drawArrays(goog.webgl.TRIANGLES, 0, 6);

  this.webGLState.restore();
};


/**
 * Calculates stats on the number of pixels drawn and overdrawn.
 * @return {?{numPixels: number, numAffected: number, numOverdraw: number}}
 *   Overdraw stats. Returns null if not initialized.
 *   'numPixels': The total number of pixels in the rendered area.
 *   'numAffected': The number of pixels affected.
 *   'numOverdraw': The number of pixels drawn, using the threshold draw color.
 */
wtf.replay.graphics.OverdrawSurface.prototype.calculateOverdraw = function() {
  if (!this.initialized) {
    return null;
  }

  var gl = this.context;

  var numPixels = this.width * this.height;
  var numOverdraw = 0;
  var numAffected = 0;

  var pixelContents = new Uint8Array(4 * numPixels);
  gl.readPixels(0, 0, this.width, this.height, goog.webgl.RGBA,
      goog.webgl.UNSIGNED_BYTE, pixelContents);

  var pixelValue;
  for (var i = 0; i < numPixels; i++) {
    // readPixels returns colors in the range [0,255]
    pixelValue = pixelContents[4 * i] / 255.0;
    numAffected += pixelValue > 0 ? 1 : 0;
    numOverdraw += pixelValue / this.thresholdValuePerCall_;
  }

  var overdrawStats = {};
  overdrawStats.numPixels = numPixels;
  overdrawStats.numAffected = numAffected;
  overdrawStats.numOverdraw = numOverdraw;

  return overdrawStats;
};
