/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tracing utility namespace.
 * Contains helper methods and standard definitions for common code
 * actions.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace');

goog.require('goog.asserts');
goog.require('goog.string');
goog.require('wtf');
goog.require('wtf.io.CustomWriteStream');
goog.require('wtf.io.LocalFileWriteStream');
goog.require('wtf.io.MemoryWriteStream');
goog.require('wtf.io.NullWriteStream');
goog.require('wtf.io.StreamingHttpWriteStream');
goog.require('wtf.io.WriteStream');
goog.require('wtf.trace.BuiltinEvents');
goog.require('wtf.trace.Flow');
goog.require('wtf.trace.NullSession');
goog.require('wtf.trace.Scope');
goog.require('wtf.trace.SnapshottingSession');
goog.require('wtf.trace.StreamingSession');
goog.require('wtf.trace.TraceManager');
goog.require('wtf.util.Options');


/**
 * Trace manager setup by {@see wtf.trace#prepare}.
 * @type {wtf.trace.TraceManager}
 * @private
 */
wtf.trace.traceManager_ = null;


/**
 * Gets the current trace manager.
 * If one does not exist it will be created.
 * @return {!wtf.trace.TraceManager} Trace manager.
 */
wtf.trace.getTraceManager = function() {
  if (wtf.trace.traceManager_) {
    return wtf.trace.traceManager_;
  }

  // Setup.
  var traceManager = new wtf.trace.TraceManager();
  wtf.trace.traceManager_ = traceManager;

  // Add providers.
  // TODO(benvanik): query providers somehow

  // Overwrite goog.base when in uncompiled mode with our version.
  if (!COMPILED) {
    goog.base = wtf.trace.base;
  }

  return traceManager;
};


/**
 * Main entry point for the tracing API.
 * This must be called as soon as possible and preferably before any application
 * code is executed (or even included on the page).
 *
 * This method does not setup a tracing session, but prepares the environment
 * for one. It should only ever be called once.
 *
 * @return {*} Ignored.
 */
wtf.trace.prepare = wtf.ENABLE_TRACING ? function() {
  return wtf.trace.getTraceManager();
} : goog.nullFunction;


/**
 * Shuts down the tracing system.
 */
wtf.trace.shutdown = wtf.ENABLE_TRACING ? function() {
  goog.asserts.assert(wtf.trace.traceManager_);
  if (!wtf.trace.traceManager_) {
    return;
  }

  // Stop session (if any is in progress).
  wtf.trace.stop();

  // Cleanup shared state.
  goog.dispose(wtf.trace.traceManager_);
  wtf.trace.traceManager_ = null;
} : goog.nullFunction;


/**
 * Adds a session event listener.
 * These are retained by the trace manager for the life of the runtime.
 * @param {!wtf.trace.ISessionListener} listener Event listener.
 */
wtf.trace.addSessionListener = wtf.ENABLE_TRACING ? function(listener) {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.addListener(listener);
} : goog.nullFunction;


/**
 * Gets an initialized options object.
 * @param {Object=} opt_options Raw options overrides.
 * @return {!wtf.util.Options} Options object.
 * @private
 */
wtf.trace.getOptions_ = function(opt_options) {
  var options = new wtf.util.Options();
  options.mixin(opt_options);
  options.mixin(goog.global['wtf_trace_options']);
  return options;
};


/**
 * Creates a write stream based on the given options.
 * @param {!wtf.util.Options} options Options.
 * @param {wtf.io.WriteStream|*=} opt_targetValue Target value. May be anything,
 *     pretty much. If a stream is given that will be used directly. This
 *     overrides any options specified.
 * @return {!wtf.io.WriteStream} Write stream.
 * @private
 */
wtf.trace.createStream_ = function(options, opt_targetValue) {
  var targetValue =
      opt_targetValue || options.getOptionalString('wtf.trace.target');
  if (targetValue instanceof wtf.io.WriteStream) {
    return targetValue;
  } else if (goog.isObject(targetValue) && targetValue['write']) {
    // Custom write stream - targetValue is an object with some write methods.
    return new wtf.io.CustomWriteStream(targetValue);
  } else if (goog.isString(targetValue)) {
    var targetUrl = targetValue;
    if (targetUrl == 'null') {
      // Null target; write nothing.
      return new wtf.io.NullWriteStream();
    } else if (goog.string.startsWith(targetUrl, 'ws://')) {
      // WebSocket target.
      // TODO(benvanik): setup websocket target
      return new wtf.io.NullWriteStream();
    } else if (goog.string.startsWith(targetUrl, 'http://') ||
        goog.string.startsWith(targetUrl, 'https://')) {
      // HTTP target.
      // TODO(benvanik): pick between streaming/buffered?
      return new wtf.io.StreamingHttpWriteStream(targetUrl);
    } else if (goog.string.startsWith(targetUrl, 'file://')) {
      // File target.
      return new wtf.io.LocalFileWriteStream(targetUrl.replace('file://', ''));
    }
  } else if (goog.isArray(targetValue)) {
    // Memory target.
    // This variant will stash the resulting buffers into the given array.
    return new wtf.io.MemoryWriteStream(/** @type {!Array} */ (targetValue));
  }

  // Local in-memory stream target, for popups.
  return new wtf.io.MemoryWriteStream([]);
};


/**
 * Starts a new tracing session.
 * The session mode is determined by the options provided, defaulting to
 * snapshotting. See {@code wtf.trace.mode} and {@code wtf.trace.target} for
 * more information.
 * @param {Object=} opt_options Options overrides.
 */
wtf.trace.start = wtf.ENABLE_TRACING ? function(opt_options) {
  var traceManager = wtf.trace.getTraceManager();

  // Get combined options.
  var options = wtf.trace.getOptions_(opt_options);

  // Stop any existing sessions.
  traceManager.stopSession();

  // Create the session.
  var session = null;
  switch (options.getOptionalString('wtf.trace.mode')) {
    case 'null':
      session = new wtf.trace.NullSession(traceManager, options);
      break;
    default:
    case 'snapshotting':
      session = new wtf.trace.SnapshottingSession(traceManager, options);
      break;
    case 'streaming':
      var stream = wtf.trace.createStream_(options);
      session = new wtf.trace.StreamingSession(traceManager, stream, options);
      break;
  }

  // Begin session.
  traceManager.startSession(session);
} : goog.nullFunction;


/**
 * Takes a snapshot of the current state.
 * A session must be actively recording. This call is ignored if the session
 * does not support snapshotting.
 * @param {wtf.io.WriteStream|*=} opt_targetValue Stream target value.
 */
wtf.trace.snapshot = wtf.ENABLE_TRACING ? function(opt_targetValue) {
  var traceManager = wtf.trace.getTraceManager();
  var session = traceManager.getCurrentSession();
  if (session instanceof wtf.trace.SnapshottingSession) {
    if (goog.isFunction(opt_targetValue)) {
      session.snapshot(opt_targetValue);
    } else {
      session.snapshot(function() {
        return wtf.trace.createStream_(session.getOptions(), opt_targetValue);
      });
    }
  }
} : goog.nullFunction;


/**
 * Stops the current session and disposes it.
 */
wtf.trace.stop = function() {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.stopSession();
};

// TODO(benvanik): add an onunload to flush the session


/**
 * Creates a new execution zone.
 * Execution zones are used to group regions of code in the trace stream.
 * For example, one zone may be 'Page' to indicate all page JS and another
 * 'Worker' to show events from a web worker.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @return {wtf.trace.Zone} Zone used for future calls.
 */
wtf.trace.createZone = wtf.ENABLE_TRACING ? function(name, type, location) {
  var traceManager = wtf.trace.getTraceManager();
  return traceManager.createZone(name, type, location);
} : function(name, type, location) {
  return null;
};


/**
 * Deletes an execution zone.
 * The zone ID may be reused.
 * @param {wtf.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtf.trace.deleteZone = wtf.ENABLE_TRACING ? function(zone) {
  if (zone) {
    var traceManager = wtf.trace.getTraceManager();
    traceManager.deleteZone(zone);
  }
} : goog.nullFunction;


/**
 * Pushes a zone.
 * @param {wtf.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtf.trace.pushZone = wtf.ENABLE_TRACING ? function(zone) {
  if (zone) {
    var traceManager = wtf.trace.getTraceManager();
    traceManager.pushZone(zone);
  }
} : goog.nullFunction;


/**
 * Pops the active zone.
 */
wtf.trace.popZone = wtf.ENABLE_TRACING ? function() {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.popZone();
} : goog.nullFunction;


/**
 * Enters a scope.
 * @param {string=} opt_msg Optional message string.
 * @param {wtf.trace.Flow=} opt_flow A flow to terminate on scope leave, if any.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 * @return {!wtf.trace.Scope} An initialized scope object.
 */
wtf.trace.enterScope = wtf.ENABLE_TRACING ?
    wtf.trace.Scope.enter : function(opt_msg, opt_flow, opt_time) {
      return wtf.trace.Scope.dummy;
    };


/**
 * Branches the flow.
 * If no parent flow is given then the current global flow is used.
 * @param {string=} opt_msg Optional message string.
 * @param {wtf.trace.Flow=} opt_parentFlow Parent flow, if any.
 * @param {number=} opt_time Time for the branch; omit to use the current time.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.branchFlow = wtf.ENABLE_TRACING ?
    wtf.trace.Flow.branch : function(opt_msg, opt_parentFlow, opt_time) {
      return wtf.trace.Flow.dummy;
    };


/**
 * Clears the current global flow.
 * This should be called at the end of any runtime callback.
 */
wtf.trace.clearFlow = wtf.ENABLE_TRACING ?
    wtf.trace.Flow.clearCurrent : goog.nullFunction;


/**
 * Spans the flow across processes.
 * Flows must have been branched before this can be used.
 * @param {!wtf.io.ByteArray} flowId Flow ID.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.spanFlow = wtf.ENABLE_TRACING ?
    wtf.trace.Flow.span : function(flowId) {
      return wtf.trace.Flow.dummy;
    };


/**
 * Marks the stream with a generic instance event.
 * This can be used for logging information or indicating status.
 * It's best to use custom events that make filtering easier, if possible.
 * @param {string=} opt_msg Optional message string.
 * @param {number=} opt_time Time for the branch; omit to use the current time.
 */
wtf.trace.mark = wtf.ENABLE_TRACING ? function(opt_msg, opt_time) {
  var time = opt_time || wtf.now();
  wtf.trace.BuiltinEvents.mark(time, opt_msg);
} : goog.nullFunction;


/**
 * Marks an event listener as being ignored, meaning that it will not show up
 * in traces.
 * @param {!T} listener Event listener.
 * @return {!T} The parameter, for chaining.
 * @template T
 */
wtf.trace.ignoreListener = function(listener) {
  listener['__wtf_ignore__'] = true;
  return listener;
};
