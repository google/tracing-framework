/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview IVisualizer. Visualizer interface to augment/modify playback.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.IVisualizer');



/**
 * Visualizer that augments and/or modifies playback.
 * @interface
 */
wtf.replay.graphics.IVisualizer = function() {};


/**
 * Triggers or runs this visualization, manipulating playback as needed.
 * @param {Object.<string, !Object>=} opt_args Visualizer trigger arguments.
 */
wtf.replay.graphics.IVisualizer.prototype.trigger = goog.nullFunction;


/**
 * Restores to standard playback.
 */
wtf.replay.graphics.IVisualizer.prototype.restoreState = goog.nullFunction;


/**
 * Handles the provided event.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {WebGLRenderingContext} gl The context.
 * @param {function()} callFunction The function Playback was to call.
 *   Active Visualizers are responsible for calling this function.
 */
wtf.replay.graphics.IVisualizer.prototype.handleEvent = goog.nullFunction;
