/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview ContextPool. A pool of <canvas> contexts for use.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ContextPool');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.webgl');



/**
 * A pool of <canvas> contexts based on types and attributes.
 * Contains a collection of contexts with certain types and attributes for use.
 * Creates new contexts when the need arises.
 *
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.replay.graphics.ContextPool = function(opt_dom) {
  goog.base(this);

  /**
   * Mapping from hashes to lists of contexts.
   * @type {!Object.<!Array.<!WebGLRenderingContext>>}
   * @private
   */
  this.contexts_ = {};

  /**
   * DOM Helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = opt_dom || goog.dom.getDomHelper();
};
goog.inherits(wtf.replay.graphics.ContextPool, goog.Disposable);


/**
 * Name of the property stored on a context for the hash.
 * @type {string}
 * @const
 * @private
 */
wtf.replay.graphics.ContextPool.HASH_PROPERTY_NAME_ = '__context_pool_hash__';


/**
 * Generates a hash string for a context.
 * @param {string} contextType The type of context.
 * @param {WebGLContextAttributes=} opt_attributes Context attributes.
 * @param {number=} opt_width The width of the context's canvas.
 * @param {number=} opt_height The height of the context's canvas.
 * @return {string} A hash string for the context.
 * @private
 */
wtf.replay.graphics.ContextPool.prototype.getContextHash_ =
    function(contextType, opt_attributes, opt_width, opt_height) {
  var hashString =
      contextType + goog.global.JSON.stringify(opt_attributes || {});
  if (opt_width && opt_height) {
    hashString += opt_width + 'x' + opt_height;
  }

  return hashString;
};


/**
 * Releases a context into the pool. The context must have been originally
 * gotten from this pool.
 * @param {!WebGLRenderingContext} context A context to release.
 */
wtf.replay.graphics.ContextPool.prototype.releaseContext = function(context) {
  var contextHash =
      context[wtf.replay.graphics.ContextPool.HASH_PROPERTY_NAME_];
  var contextList = this.contexts_[contextHash];
  if (contextList) {
    contextList.push(context);
  } else {
    this.contexts_[contextHash] = [context];
  }
};


/**
 * Creates a new context or gets an existing one from the pool. Returns null
 * if the context type is not supported.
 * @param {string} contextType The type of context.
 * @param {WebGLContextAttributes=} opt_attributes Context attributes.
 * @param {number=} opt_width The width of the context's canvas. If set,
 *     {@see opt_height} must also be set.
 * @param {number=} opt_height The height of the context's canvas. If set,
 *     {@see opt_width} must also be set.
 * @return {WebGLRenderingContext} A context. Or null if the context type is
 * not supported (ie 'experimental-webgl' may be supported, but not 'webgl').
 */
wtf.replay.graphics.ContextPool.prototype.getContext =
    function(contextType, opt_attributes, opt_width, opt_height) {
  // Ensure that either both width and height are set or neither are set.
  goog.asserts.assert(opt_width && opt_height || !opt_width && !opt_height);

  var contextHash = this.getContextHash_(
      contextType, opt_attributes, opt_width, opt_height);
  var contextList = this.contexts_[contextHash];

  var retrievedContext;
  if (contextList && contextList.length) {
    // Since context with desired type and attributes exists, return it.
    // Use shift() instead of pop() - First in, First Out ensures that contexts
    // are returned in the same order that they were released.
    retrievedContext = contextList.shift();
    this.resetWebGLContext_(retrievedContext);
  } else {
    // Create a new context.
    var newCanvas = this.dom_.createElement(goog.dom.TagName.CANVAS);
    retrievedContext = newCanvas.getContext(contextType, opt_attributes);

    // If context type is unsupported, return null.
    if (!retrievedContext) {
      return null;
    }

    // Assign a hash to the context.
    retrievedContext[wtf.replay.graphics.ContextPool.HASH_PROPERTY_NAME_] =
        contextHash;
  }

  // Set the canvas's size if it is specified.
  if (opt_width && opt_height) {
    retrievedContext.canvas.width = opt_width;
    retrievedContext.canvas.height = opt_height;
  }

  return retrievedContext;
};


/**
 * Resets a context to its initial state.
 * @param {!WebGLRenderingContext} ctx A context.
 * @private
 */
wtf.replay.graphics.ContextPool.prototype.resetWebGLContext_ =
    function(ctx) {
  var numAttribs = /** @type {number} */ (
      ctx.getParameter(goog.webgl.MAX_VERTEX_ATTRIBS));
  var tmp = ctx.createBuffer();
  ctx.bindBuffer(goog.webgl.ARRAY_BUFFER, tmp);
  for (var ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, goog.webgl.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
  }

  ctx.deleteBuffer(tmp);
  var numTextureUnits = /** @type {number} */ (
      ctx.getParameter(goog.webgl.MAX_TEXTURE_IMAGE_UNITS));
  for (var ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(goog.webgl.TEXTURE0 + ii);
    ctx.bindTexture(goog.webgl.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(goog.webgl.TEXTURE_2D, null);
  }
  ctx.activeTexture(goog.webgl.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(goog.webgl.ARRAY_BUFFER, null);
  ctx.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(goog.webgl.RENDERBUFFER, null);
  ctx.disable(goog.webgl.BLEND);
  ctx.disable(goog.webgl.CULL_FACE);
  ctx.disable(goog.webgl.DEPTH_TEST);
  ctx.disable(goog.webgl.DITHER);
  ctx.disable(goog.webgl.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(goog.webgl.FUNC_ADD);
  ctx.blendFunc(goog.webgl.ONE, goog.webgl.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(0);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(goog.webgl.BACK);
  ctx.depthFunc(goog.webgl.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(goog.webgl.CCW);
  ctx.hint(goog.webgl.GENERATE_MIPMAP_HINT, goog.webgl.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(goog.webgl.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(goog.webgl.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(goog.webgl.UNPACK_FLIP_Y_WEBGL, 0);
  ctx.pixelStorei(goog.webgl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
  ctx.pixelStorei(goog.webgl.UNPACK_COLORSPACE_CONVERSION_WEBGL,
      goog.webgl.BROWSER_DEFAULT_WEBGL);
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(goog.webgl.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(goog.webgl.KEEP, goog.webgl.KEEP, goog.webgl.KEEP);
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clear(goog.webgl.COLOR_BUFFER_BIT |
      goog.webgl.DEPTH_BUFFER_BIT | goog.webgl.STENCIL_BUFFER_BIT);
};
