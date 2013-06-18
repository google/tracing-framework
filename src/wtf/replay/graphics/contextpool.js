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
goog.require('goog.json');



/**
 * A pool of <canvas> contexts based on types and attributes.
 * Contains a collection of contexts with certain types and attributes for
 * use. Creates new contexts when the need arises.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.replay.graphics.ContextPool = function() {
  goog.base(this);

  /**
   * Mapping from hashes to lists of contexts.
   * @type {!Object.<!Array.<!WebGLRenderingContext>>}
   * @private
   */
  this.contexts_ = {};
};
goog.inherits(wtf.replay.graphics.ContextPool, goog.Disposable);


/**
 * Name of the property stored on a context for the hash.
 * @type {string}
 * @const
 * @private
 */
wtf.replay.graphics.ContextPool.HASH_PROPERTY_NAME = '__context_pool_hash__';


/**
 * Generates a hash string for a context.
 * @param {string} contextType The type of context.
 * @param {WebGLContextAttributes=} opt_attributes Context attributes.
 * @return {string} A hash string for the context.
 * @private
 */
wtf.replay.graphics.ContextPool.prototype.getContextHash_ =
    function(contextType, opt_attributes) {
  return contextType + goog.json.serialize(opt_attributes || {});
};


/**
 * Releases a context into the pool.
 * @param {!WebGLRenderingContext} context A context to release.
 */
wtf.replay.graphics.ContextPool.prototype.releaseContext = function(context) {
  var contextHash =
      context[wtf.replay.graphics.ContextPool.HASH_PROPERTY_NAME];
  var contextList = this.contexts_[contextHash];
  if (contextList) {
    contextList.push(context);
  } else {
    contextList[contextHash] = [context];
  }
};


/**
 * Creates a new context or gets an existing one from the pool.
 * @param {string} contextType The type of context.
 * @param {WebGLContextAttributes=} opt_attributes Context attributes.
 * @return {!WebGLRenderingContext} A context.
 */
wtf.replay.graphics.ContextPool.prototype.getContext =
    function(contextType, opt_attributes) {
  var attributes = opt_attributes || {};
  var contextHash = this.getContextHash_(contextType, attributes);
  var contextList = this.contexts_[contextHash];

  // If context with desired type and attributes exists, return it.
  if (contextList && contextList.length) {
    var retrievedContext = contextList.pop();
    this.resetWebGLContext_(retrievedContext);
    return retrievedContext;
  }
  var newCanvas = document.createElement('canvas');
  var newContext = newCanvas.getContext(contextType, attributes);
  newContext[wtf.replay.graphics.ContextPool.HASH_PROPERTY_NAME] =
      contextHash;
  return newContext;
};


/**
 * Resets a context.
 * @param {!WebGLRenderingContext} ctx A context.
 */
wtf.replay.graphics.ContextPool.prototype.resetWebGLContext_ =
    function(ctx) {
  var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
  var tmp = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
  for (var ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
  }
  
  ctx.deleteBuffer(tmp);
  var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
  for (var ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(ctx.TEXTURE0 + ii);
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
  }
  ctx.activeTexture(ctx.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
  ctx.disable(ctx.BLEND);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.DITHER);
  ctx.disable(ctx.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(0);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(ctx.BACK);
  ctx.depthFunc(ctx.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(ctx.CCW);
  ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
  ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // TODO: Delete this IF.
  if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
    ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
  }
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

  // TODO: This should NOT be needed but Firefox fails with 'hint'
  while(ctx.getError());
};
