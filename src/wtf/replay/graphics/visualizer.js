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

goog.provide('wtf.replay.graphics.Visualizer');

goog.require('goog.events');
goog.require('wtf.events.EventEmitter');



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
   * The playback's EventList. Used to construct the mutators array.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = playback.getEventList();

  /**
   * Whether this Visualizer is active.
   * @type {boolean}
   * @protected
   */
  this.active = false;

  /**
   * Mapping from event ids to lists of Mutators.
   * @type {!Array.<!Array.<wtf.replay.graphics.Visualizer.Mutator>>}
   * @private
   */
  this.mutators_ = [];

  this.setupMutators();
};
goog.inherits(wtf.replay.graphics.Visualizer, wtf.events.EventEmitter);


/**
 * Events related to this Visualizer.
 * @enum {string}
 */
wtf.replay.graphics.Visualizer.EventType = {
  /**
   * Some state that affects continuous playback has been changed.
   * This change should be reflected in {@see #getStateHash}.
   */
  STATE_CHANGED: goog.events.getUniqueId('state_changed')
};


/**
 * Starts running this visualization without a specific target.
 */
wtf.replay.graphics.Visualizer.prototype.startContinuous = function() {
  this.active = true;
};


/**
 * Stops running this visualization.
 */
wtf.replay.graphics.Visualizer.prototype.stop = function() {
  this.active = false;
};


/**
 * Resets any state that can affect playback.
 */
wtf.replay.graphics.Visualizer.prototype.reset = goog.nullFunction;


/**
 * Runs this visualization on a substep of the current step.
 * @param {number=} opt_subStepIndex Target substep, or the current by default.
 */
wtf.replay.graphics.Visualizer.prototype.applyToSubStep = goog.nullFunction;


/**
 * Adds a mutator for the given event name.
 * @param {string} name Event name.
 * @param {wtf.replay.graphics.Visualizer.Mutator} mutator The mutator.
 * @protected
 */
wtf.replay.graphics.Visualizer.prototype.registerMutator = function(name,
    mutator) {
  var eventTypeId = this.eventList_.getEventTypeId(name);

  if (eventTypeId >= 0) {
    var mutatorsForEvent = this.mutators_[eventTypeId] || [];
    mutatorsForEvent.push(mutator);
    this.mutators_[eventTypeId] = mutatorsForEvent;
  }
};


/**
 * Adds mutators using registerMutator.
 * @protected
 */
wtf.replay.graphics.Visualizer.prototype.setupMutators = goog.nullFunction;


/**
 * Returns a hash of the current playback-affecting states.
 * @return {string} Hash of the current playback-affecting states.
 */
wtf.replay.graphics.Visualizer.prototype.getStateHash = function() {
  return '';
};


/**
 * Returns a nicely formatted version of the current playback-affecting state.
 * @return {string} Formatted version of the current playback-affecting state.
 */
wtf.replay.graphics.Visualizer.prototype.getStateName = function() {
  return '';
};


/**
 * Handles operations that should occur before the provided event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 */
wtf.replay.graphics.Visualizer.prototype.handlePreEvent = function(it, gl) {
  if (!this.active) {
    return;
  }

  this.anyPreEvent(it, gl);

  var mutatorsForEvent = this.mutators_[it.getTypeId()];
  if (mutatorsForEvent) {
    for (var i = 0; i < mutatorsForEvent.length; ++i) {
      if (mutatorsForEvent[i].pre) {
        mutatorsForEvent[i].pre.call(null, this, gl, it.getArguments());
      }
    }
  }
};


/**
 * Handles operations that should occur before any event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 * @protected
 */
wtf.replay.graphics.Visualizer.prototype.anyPreEvent = goog.nullFunction;


/**
 * Handles operations that could occur in place of an event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 * @return {boolean} Whether the event should be skipped in playback.
 */
wtf.replay.graphics.Visualizer.prototype.handleReplaceEvent = function(it, gl) {
  if (!this.active) {
    return false;
  }

  var skip = false;
  skip = skip || this.anyReplaceEvent(it, gl);

  var mutatorsForEvent = this.mutators_[it.getTypeId()];
  if (mutatorsForEvent) {
    for (var i = 0; i < mutatorsForEvent.length; ++i) {
      if (mutatorsForEvent[i].replace) {
        skip = skip ||
            mutatorsForEvent[i].replace.call(null, this, gl, it.getArguments());
      }
    }
  }

  return skip;
};


/**
 * Handles operations that could occur in place of any event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 * @return {boolean} Whether the event should be skipped in playback.
 * @protected
 */
wtf.replay.graphics.Visualizer.prototype.anyReplaceEvent = function(it, gl) {
  return false;
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

  this.anyPostEvent(it, gl);

  var mutatorsForEvent = this.mutators_[it.getTypeId()];
  if (mutatorsForEvent) {
    for (var i = 0; i < mutatorsForEvent.length; ++i) {
      if (mutatorsForEvent[i].post) {
        mutatorsForEvent[i].post.call(null, this, gl, it.getArguments());
      }
    }
  }
};


/**
 * Handles operations that should occur after any event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 * @protected
 */
wtf.replay.graphics.Visualizer.prototype.anyPostEvent = goog.nullFunction;


/**
 * @typedef {function(
 *     !wtf.replay.graphics.Visualizer, WebGLRenderingContext,
 *     wtf.db.ArgumentData)}
 */
wtf.replay.graphics.Visualizer.MutatorHandler;


/**
 * @typedef {{
 *   pre: (wtf.replay.graphics.Visualizer.MutatorHandler|undefined),
 *   replace: (wtf.replay.graphics.Visualizer.MutatorHandler|undefined),
 *   post: (wtf.replay.graphics.Visualizer.MutatorHandler|undefined)}}
 */
wtf.replay.graphics.Visualizer.Mutator;
