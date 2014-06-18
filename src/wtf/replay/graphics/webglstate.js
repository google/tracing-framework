/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WebGLState. Supports backup and restore for the WebGL state.
 * Does not handle buffer or texture contents.
 * Extensions support is limited to ANGLE_instanced_arrays.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.WebGLState');

goog.require('goog.asserts');
goog.require('goog.webgl');



/**
 * Backup and restore utility for the WebGL state.
 *
 * @param {!WebGLRenderingContext} gl The context to work with.
 * @constructor
 */
wtf.replay.graphics.WebGLState = function(gl) {
  /**
   * The WebGL context to backup and restore.
   * @type {!WebGLRenderingContext}
   * @private
   */
  this.context_ = gl;

  /**
   * Whether or not a backup has been stored. Cannot restore without a backup.
   * @type {boolean}
   * @private
   */
  this.backupStored_ = false;

  /**
   * All WebGL state parameter enums used.
   * @type {Array.<number>}
   * @private
   */
  this.stateParameters_ = [];

  /**
   * Backup of states from stateParameters_. Mapping from enum to value.
   * @type {Object.<number, ?>}
   * @private
   */
  this.savedState_ = {};

  /**
   * All WebGL state enums that are used with gl.enable and gl.disable.
   * @type {Array.<number>}
   * @private
   */
  this.toggleStates_ = [
    goog.webgl.BLEND,
    goog.webgl.CULL_FACE,
    goog.webgl.DEPTH_TEST,
    goog.webgl.DITHER,
    goog.webgl.POLYGON_OFFSET_FILL,
    goog.webgl.SCISSOR_TEST,
    goog.webgl.STENCIL_TEST];

  /**
   * Backup of texture binding 2Ds. Mapping from texture unit to texture.
   * @type {Array.<WebGLTexture>}
   * @private
   */
  this.savedTextureBinding2Ds_ = [];

  /**
   * Backup of texture binding cube maps. Mapping from texture unit to texture.
   * @type {Array.<WebGLTexture>}
   * @private
   */
  this.savedTextureBindingCubeMaps_ = [];

  /**
   * Backup of attributes.
   * @type {Array.<Object.<number, ?>>}
   * @private
   */
  this.savedAttributes_ = [];
};


/**
 * Sets up stateParameters_. Delay calling this until needed.
 * @private
 */
wtf.replay.graphics.WebGLState.prototype.setupStateParameters_ = function() {
  this.stateParameters_ = [
    goog.webgl.ACTIVE_TEXTURE,
    goog.webgl.ALIASED_LINE_WIDTH_RANGE,
    goog.webgl.ALIASED_POINT_SIZE_RANGE,
    goog.webgl.ALPHA_BITS,
    goog.webgl.ARRAY_BUFFER_BINDING,
    goog.webgl.BLEND,
    goog.webgl.BLEND_COLOR,
    goog.webgl.BLEND_DST_ALPHA,
    goog.webgl.BLEND_DST_RGB,
    goog.webgl.BLEND_EQUATION_ALPHA,
    goog.webgl.BLEND_EQUATION_RGB,
    goog.webgl.BLEND_SRC_ALPHA,
    goog.webgl.BLEND_SRC_RGB,
    goog.webgl.BLUE_BITS,
    goog.webgl.COLOR_CLEAR_VALUE,
    goog.webgl.COLOR_WRITEMASK,
    goog.webgl.CULL_FACE,
    goog.webgl.CULL_FACE_MODE,
    goog.webgl.CURRENT_PROGRAM,
    goog.webgl.DEPTH_BITS,
    goog.webgl.DEPTH_CLEAR_VALUE,
    goog.webgl.DEPTH_FUNC,
    goog.webgl.DEPTH_RANGE,
    goog.webgl.DEPTH_TEST,
    goog.webgl.DEPTH_WRITEMASK,
    goog.webgl.DITHER,
    goog.webgl.ELEMENT_ARRAY_BUFFER_BINDING,
    goog.webgl.FRAMEBUFFER_BINDING,
    goog.webgl.FRONT_FACE,
    goog.webgl.GENERATE_MIPMAP_HINT,
    goog.webgl.GREEN_BITS,
    goog.webgl.LINE_WIDTH,
    goog.webgl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
    goog.webgl.MAX_CUBE_MAP_TEXTURE_SIZE,
    goog.webgl.MAX_FRAGMENT_UNIFORM_VECTORS,
    goog.webgl.MAX_RENDERBUFFER_SIZE,
    goog.webgl.MAX_TEXTURE_IMAGE_UNITS,
    goog.webgl.MAX_TEXTURE_SIZE,
    goog.webgl.MAX_VARYING_VECTORS,
    goog.webgl.MAX_VERTEX_ATTRIBS,
    goog.webgl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
    goog.webgl.MAX_VERTEX_UNIFORM_VECTORS,
    goog.webgl.MAX_VIEWPORT_DIMS,
    goog.webgl.PACK_ALIGNMENT,
    goog.webgl.POLYGON_OFFSET_FACTOR,
    goog.webgl.POLYGON_OFFSET_FILL,
    goog.webgl.POLYGON_OFFSET_UNITS,
    goog.webgl.RED_BITS,
    goog.webgl.RENDERBUFFER_BINDING,
    goog.webgl.RENDERER,
    goog.webgl.SAMPLE_BUFFERS,
    goog.webgl.SAMPLE_COVERAGE_INVERT,
    goog.webgl.SAMPLE_COVERAGE_VALUE,
    goog.webgl.SAMPLES,
    goog.webgl.SCISSOR_BOX,
    goog.webgl.SCISSOR_TEST,
    goog.webgl.SHADING_LANGUAGE_VERSION,
    goog.webgl.STENCIL_BACK_FAIL,
    goog.webgl.STENCIL_BACK_FUNC,
    goog.webgl.STENCIL_BACK_PASS_DEPTH_FAIL,
    goog.webgl.STENCIL_BACK_PASS_DEPTH_PASS,
    goog.webgl.STENCIL_BACK_REF,
    goog.webgl.STENCIL_BACK_VALUE_MASK,
    goog.webgl.STENCIL_BACK_WRITEMASK,
    goog.webgl.STENCIL_BITS,
    goog.webgl.STENCIL_CLEAR_VALUE,
    goog.webgl.STENCIL_FAIL,
    goog.webgl.STENCIL_FUNC,
    goog.webgl.STENCIL_PASS_DEPTH_FAIL,
    goog.webgl.STENCIL_PASS_DEPTH_PASS,
    goog.webgl.STENCIL_REF,
    goog.webgl.STENCIL_TEST,
    goog.webgl.STENCIL_VALUE_MASK,
    goog.webgl.STENCIL_WRITEMASK,
    goog.webgl.SUBPIXEL_BITS,
    goog.webgl.UNPACK_ALIGNMENT,
    goog.webgl.UNPACK_COLORSPACE_CONVERSION_WEBGL,
    goog.webgl.UNPACK_FLIP_Y_WEBGL,
    goog.webgl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
    goog.webgl.VENDOR,
    goog.webgl.VERSION,
    goog.webgl.VIEWPORT];
};


/**
 * Backs up selected portions of the current WebGL state.
 */
wtf.replay.graphics.WebGLState.prototype.backup = function() {
  if (this.stateParameters_.length == 0) {
    this.setupStateParameters_();
  }

  var gl = this.context_;

  // Backup parameters with simple enum values.
  var numParameters = this.stateParameters_.length;
  for (var i = 0; i < numParameters; i++) {
    var parameter = this.stateParameters_[i];
    this.savedState_[parameter] = gl.getParameter(parameter);
  }

  // Backup texture bindings.
  // TODO(scotttodd): Support parameterized number of texture units to backup?
  var maxTextureUnits = /** @type {number} */ (gl.getParameter(
      gl.MAX_TEXTURE_IMAGE_UNITS));
  this.savedTextureBinding2Ds_ = [];
  this.savedTextureBindingCubeMaps_ = [];
  for (var i = 0; i < maxTextureUnits; i++) {
    gl.activeTexture(goog.webgl.TEXTURE0 + i);
    this.savedTextureBinding2Ds_.push(gl.getParameter(
        goog.webgl.TEXTURE_BINDING_2D));
    this.savedTextureBindingCubeMaps_.push(gl.getParameter(
        goog.webgl.TEXTURE_BINDING_CUBE_MAP));
  }
  gl.activeTexture(this.savedState_[goog.webgl.ACTIVE_TEXTURE]);

  // Backup attributes.
  // TODO(scotttodd): Support parameterized number of attributes to backup?
  this.savedAttributes_ = [];
  var attribPropertyEnums = [
    goog.webgl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
    goog.webgl.VERTEX_ATTRIB_ARRAY_ENABLED,
    goog.webgl.VERTEX_ATTRIB_ARRAY_SIZE,
    goog.webgl.VERTEX_ATTRIB_ARRAY_STRIDE,
    goog.webgl.VERTEX_ATTRIB_ARRAY_TYPE,
    goog.webgl.VERTEX_ATTRIB_ARRAY_NORMALIZED,
    goog.webgl.CURRENT_VERTEX_ATTRIB];
  var maxVertexAttribs = /** @type {number} */ (gl.getParameter(
      goog.webgl.MAX_VERTEX_ATTRIBS));
  // Backup instancing on attributes as well, if the extension exists.
  // http://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/
  var instancedArraysExt = gl.getExtension('ANGLE_instanced_arrays');
  for (var i = 0; i < maxVertexAttribs; i++) {
    var values = {};
    var numAttribPropertyEnums = attribPropertyEnums.length;
    for (var j = 0; j < numAttribPropertyEnums; j++) {
      values[attribPropertyEnums[j]] = gl.getVertexAttrib(i,
          attribPropertyEnums[j]);
    }
    values[0] = gl.getVertexAttribOffset(i,
        goog.webgl.VERTEX_ATTRIB_ARRAY_POINTER);
    if (instancedArraysExt) {
      values[1] = gl.getVertexAttrib(i,
          instancedArraysExt.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE);
    }
    this.savedAttributes_.push(values);
  }

  this.backupStored_ = true;
};


/**
 * Restores the portions of the WebGL state that were saved.
 */
wtf.replay.graphics.WebGLState.prototype.restore = function() {
  // Cannot restore without a backup.
  goog.asserts.assert(this.backupStored_);

  var gl = this.context_;

  // Restore toggleable states.
  var toggleStatesLength = this.toggleStates_.length;
  for (var i = 0; i < toggleStatesLength; i++) {
    var toggleState = this.toggleStates_[i];
    this.savedState_[toggleState] ?
        gl.enable(toggleState) : gl.disable(toggleState);
  }

  // Restore other parameter states, mostly in alphabetic order.
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER,
      this.savedState_[goog.webgl.ELEMENT_ARRAY_BUFFER_BINDING]);
  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER,
      this.savedState_[goog.webgl.FRAMEBUFFER_BINDING]);
  gl.bindRenderbuffer(goog.webgl.RENDERBUFFER,
      this.savedState_[goog.webgl.RENDERBUFFER_BINDING]);

  var blendColor = this.savedState_[goog.webgl.BLEND_COLOR];
  gl.blendColor(blendColor[0], blendColor[1], blendColor[2], blendColor[3]);
  gl.blendEquationSeparate(this.savedState_[goog.webgl.BLEND_EQUATION_RGB],
      this.savedState_[goog.webgl.BLEND_EQUATION_ALPHA]);
  gl.blendFuncSeparate(this.savedState_[goog.webgl.BLEND_SRC_RGB],
      this.savedState_[goog.webgl.BLEND_DST_RGB],
      this.savedState_[goog.webgl.BLEND_SRC_ALPHA],
      this.savedState_[goog.webgl.BLEND_DST_ALPHA]);

  var clearColor = this.savedState_[goog.webgl.COLOR_CLEAR_VALUE];
  gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
  gl.clearDepth(this.savedState_[goog.webgl.DEPTH_CLEAR_VALUE]);
  var colorMask = this.savedState_[goog.webgl.COLOR_WRITEMASK];
  gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);
  gl.clearDepth(this.savedState_[goog.webgl.DEPTH_CLEAR_VALUE]);
  gl.clearStencil(this.savedState_[goog.webgl.STENCIL_CLEAR_VALUE]);
  gl.cullFace(this.savedState_[goog.webgl.CULL_FACE_MODE]);
  gl.depthFunc(this.savedState_[goog.webgl.DEPTH_FUNC]);
  var depthRange = this.savedState_[goog.webgl.DEPTH_RANGE];
  gl.depthRange(depthRange[0], depthRange[1]);
  gl.depthMask(this.savedState_[goog.webgl.DEPTH_WRITEMASK]);

  gl.frontFace(this.savedState_[goog.webgl.FRONT_FACE]);
  gl.hint(goog.webgl.GENERATE_MIPMAP_HINT,
      this.savedState_[goog.webgl.GENERATE_MIPMAP_HINT]);
  gl.lineWidth(this.savedState_[goog.webgl.LINE_WIDTH]);

  gl.pixelStorei(goog.webgl.PACK_ALIGNMENT,
      this.savedState_[goog.webgl.PACK_ALIGNMENT]);
  gl.pixelStorei(goog.webgl.UNPACK_ALIGNMENT,
      this.savedState_[goog.webgl.UNPACK_ALIGNMENT]);
  gl.pixelStorei(goog.webgl.UNPACK_FLIP_Y_WEBGL,
      this.savedState_[goog.webgl.UNPACK_FLIP_Y_WEBGL]);
  // Maybe not supported in all browsers?
  // gl.pixelStorei(goog.webgl.UNPACK_COLORSPACE_CONVERSION_WEBGL,
  //     this.savedState_[goog.webgl.UNPACK_COLORSPACE_CONVERSION_WEBGL]);
  gl.pixelStorei(goog.webgl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
      this.savedState_[goog.webgl.UNPACK_PREMULTIPLY_ALPHA_WEBGL]);

  gl.sampleCoverage(this.savedState_[goog.webgl.SAMPLE_COVERAGE_VALUE],
      this.savedState_[goog.webgl.SAMPLE_COVERAGE_INVERT]);
  var scissorBox = this.savedState_[goog.webgl.SCISSOR_BOX];
  gl.scissor(scissorBox[0], scissorBox[1], scissorBox[2], scissorBox[3]);

  gl.stencilFuncSeparate(goog.webgl.FRONT,
      this.savedState_[goog.webgl.STENCIL_FUNC],
      this.savedState_[goog.webgl.STENCIL_REF],
      this.savedState_[goog.webgl.STENCIL_VALUE_MASK]);
  gl.stencilFuncSeparate(goog.webgl.BACK,
      this.savedState_[goog.webgl.STENCIL_BACK_FUNC],
      this.savedState_[goog.webgl.STENCIL_BACK_REF],
      this.savedState_[goog.webgl.STENCIL_BACK_VALUE_MASK]);
  gl.stencilOpSeparate(goog.webgl.FRONT,
      this.savedState_[goog.webgl.STENCIL_FAIL],
      this.savedState_[goog.webgl.STENCIL_PASS_DEPTH_FAIL],
      this.savedState_[goog.webgl.STENCIL_PASS_DEPTH_PASS]);
  gl.stencilOpSeparate(goog.webgl.BACK,
      this.savedState_[goog.webgl.STENCIL_BACK_FAIL],
      this.savedState_[goog.webgl.STENCIL_BACK_PASS_DEPTH_FAIL],
      this.savedState_[goog.webgl.STENCIL_BACK_PASS_DEPTH_PASS]);
  gl.stencilMaskSeparate(goog.webgl.FRONT,
      this.savedState_[goog.webgl.STENCIL_WRITEMASK]);
  gl.stencilMaskSeparate(goog.webgl.BACK,
      this.savedState_[goog.webgl.STENCIL_BACK_WRITEMASK]);

  gl.useProgram(this.savedState_[goog.webgl.CURRENT_PROGRAM]);

  var viewport = this.savedState_[goog.webgl.VIEWPORT];
  gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);

  // Restore texture bindings
  var maxTextureUnits = /** @type {number} */ (gl.getParameter(
      gl.MAX_TEXTURE_IMAGE_UNITS));
  for (var i = 0; i < maxTextureUnits; i++) {
    gl.activeTexture(goog.webgl.TEXTURE0 + i);
    gl.bindTexture(goog.webgl.TEXTURE_2D, this.savedTextureBinding2Ds_[i]);
    gl.bindTexture(goog.webgl.TEXTURE_CUBE_MAP,
        this.savedTextureBindingCubeMaps_[i]);
  }
  gl.activeTexture(this.savedState_[goog.webgl.ACTIVE_TEXTURE]);

  // Restore attributes.
  var numSavedAttributes = this.savedAttributes_.length;
  var instancedArraysExt = gl.getExtension('ANGLE_instanced_arrays');
  for (var i = 0; i < numSavedAttributes; i++) {
    var values = this.savedAttributes_[i];

    values[goog.webgl.VERTEX_ATTRIB_ARRAY_ENABLED] ?
        gl.enableVertexAttribArray(i) : gl.disableVertexAttribArray(i);

    if (values[goog.webgl.CURRENT_VERTEX_ATTRIB]) {
      gl.vertexAttrib4fv(i, values[goog.webgl.CURRENT_VERTEX_ATTRIB]);
    }
    var buffer = values[goog.webgl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING];
    if (buffer) {
      gl.bindBuffer(goog.webgl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(i,
          values[goog.webgl.VERTEX_ATTRIB_ARRAY_SIZE],
          values[goog.webgl.VERTEX_ATTRIB_ARRAY_TYPE],
          values[goog.webgl.VERTEX_ATTRIB_ARRAY_NORMALIZED],
          values[goog.webgl.VERTEX_ATTRIB_ARRAY_STRIDE],
          values[0]);
      if (instancedArraysExt) {
        instancedArraysExt['vertexAttribDivisorANGLE'](i, values[1]);
      }
    }
  }

  gl.bindBuffer(goog.webgl.ARRAY_BUFFER,
      this.savedState_[goog.webgl.ARRAY_BUFFER_BINDING]);
};
