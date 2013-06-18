/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview CanvasPool. Contains canvases and contexts for use.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.CanvasPool');

goog.require('goog.Disposable');
goog.require('goog.json');



/**
 * CanvasPool.
 * Contains contexts for use.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.replay.graphics.CanvasPool = function() {
  /**
   * Mapping from hashes to lists of contexts.
   * @type {!Object}
   * @private
   */
  this.contexts_ = {};

  /**
   * Name of the property stored on a context for the hash.
   * @type {string}
   * @private
   */
  this.contextHashPropertyName_ = '__canvas_pool_hash__';
};
goog.inherits(wtf.replay.graphics.CanvasPool, goog.Disposable);


/**
 * @override
 */
wtf.replay.graphics.CanvasPool.prototype.disposeInternal = function() {
  this.contexts_ = null;
  goog.base(this, 'disposeInternal');
};


/**
 * Generates a hash string for a context.
 * @param {wtf.replay.graphics.ContextType} contextType The type of context.
 * @param {=WebGLContextAttributes} attributes Context attributes. Optional.
 * @return {string} A hash string for the context.
 * @private
 */
wtf.replay.graphics.CanvasPool.prototype.getContextHash_(contextType, attributes) {
  attributes = attributes || undefined;
  return contextType + goog.json.serialize(attributes);
}


/**
 * Releases a context from the pool. Releases nothing if the pool never had
 *     such a context in the first place.
 * @param {RenderingContext} context A context to release.
 * @return {bool} True if and only if a context was released.
 */
wtf.replay.graphics.CanvasPool.prototype.releaseContext(context) {
  var contextHash = context[this.contextHashPropertyName_];
  if (this.contexts_.hasOwnProperty(contextHash)) {
    var contextList = this.contexts_[contextHash];
    // If the relevant stack of contexts is non-empty, free a context.
    if (contextList && contextList.length) {
      contextList.pop();
      return true;
    }
  }
  // No context was released.
  return false;
}


/**
 * Creates a new context.
 * @param {string} contextType The type of context.
 * @param {=WebGLContextAttributes} attributes Context attributes. Optional.
 * @return {!RenderingContext} A rendering context.
 */
wtf.replay.graphics.CanvasPool.prototype.getContext(contextType, attributes) {
  attributes = attributes || undefined;
  var contextHash = this.getContextHash_(contextType, attributes);
  var newCanvas = document.createElement('canvas');
  var newContext = newCanvas.getContext(contextType, attributes);
  newContext[this.contextHashPropertyName_] = contextHash;
  // If previous lists exists, append new context to it.
  if (this.contexts_.hasOwnProperty(contextHash)) {
    this.contexts_[contextHash].push(newContext);
  } else {
    this.contexts_[contextHash] = [newContext];
  }
  return newContext;
}
