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
    return contextList.pop();
  }
  var newCanvas = document.createElement('canvas');
  var newContext = newCanvas.getContext(contextType, attributes);
  newContext[wtf.replay.graphics.ContextPool.HASH_PROPERTY_NAME] =
      contextHash;
  return newContext;
};
