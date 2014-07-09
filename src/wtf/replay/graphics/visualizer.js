/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Visualizer. Abstract Visualizer class to augment playback.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.require('goog.object');
goog.require('wtf.events.EventEmitter');
goog.provide('wtf.replay.graphics.Visualizer');



/**
 * Visualizer that augments and/or modifies playback.
 * @param {!wtf.replay.graphics.Playback} playback The playback instance.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.replay.graphics.Visualizer = function(playback) {
  goog.base(this);

  /**
   * The playback instance. Manipulated when visualization is triggered.
   * @type {!wtf.replay.graphics.Playback}
   * @protected
   */
  this.playback = playback;

  /**
   * Whether this Visualizer is active.
   * @type {boolean}
   * @protected
   */
  this.active = false;

  /**
   * Mapping from event names to Mutators. Shallow clone to support overrides.
   * @type {!Object.<wtf.replay.graphics.Visualizer.Mutator>}
   * @protected
   */
  this.mutators = goog.object.clone(wtf.replay.graphics.Visualizer.MUTATORS_);
};
goog.inherits(wtf.replay.graphics.Visualizer, wtf.events.EventEmitter);


/**
 * Triggers or runs this visualization, manipulating playback as needed.
 * @param {Object.<string, !Object>=} opt_args Visualizer trigger arguments.
 */
wtf.replay.graphics.Visualizer.prototype.trigger = goog.nullFunction;


/**
 * Handles operations that should occur before the provided event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 */
wtf.replay.graphics.Visualizer.prototype.handlePreEvent = function(it, gl) {
  if (!this.active) {
    return;
  }

  var associatedFunction = this.mutators[it.getName()];
  if (associatedFunction && associatedFunction.pre) {
    associatedFunction.pre.call(null, this, gl, it.getArguments());
  }
};


/**
 * Handles operations that should occur after the provided event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 */
wtf.replay.graphics.Visualizer.prototype.handlePostEvent = function(it, gl) {
  if (!this.active) {
    return;
  }

  var associatedFunction = this.mutators[it.getName()];
  if (associatedFunction && associatedFunction.post) {
    associatedFunction.post.call(null, this, gl, it.getArguments());
  }
};


/**
 * @typedef {function(
 *     !wtf.replay.graphics.Visualizer, WebGLRenderingContext,
 *     wtf.db.ArgumentData)}
 */
wtf.replay.graphics.Visualizer.MutatorHandler;


/**
 * @typedef {{pre: (wtf.replay.graphics.Visualizer.MutatorHandler|undefined),
 *   post: (wtf.replay.graphics.Visualizer.MutatorHandler|undefined)}}
 */
wtf.replay.graphics.Visualizer.Mutator;


/**
 * A mapping from event names to pre/post event MutatorHandlers.
 * @type {!Object.<wtf.replay.graphics.Visualizer.Mutator>}
 * @private
 */
wtf.replay.graphics.Visualizer.MUTATORS_ = {};
