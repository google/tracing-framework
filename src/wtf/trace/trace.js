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
goog.require('goog.json');
goog.require('goog.string');
goog.require('wtf');
goog.require('wtf.io.BufferedHttpWriteStream');
goog.require('wtf.io.CustomWriteStream');
goog.require('wtf.io.LocalFileWriteStream');
goog.require('wtf.io.MemoryWriteStream');
goog.require('wtf.io.NullWriteStream');
goog.require('wtf.io.StreamingHttpWriteStream');
goog.require('wtf.io.WriteStream');
goog.require('wtf.trace.BuiltinEvents');
goog.require('wtf.trace.Flow');
goog.require('wtf.trace.NullSession');
goog.require('wtf.trace.SnapshottingSession');
goog.require('wtf.trace.StreamingSession');
goog.require('wtf.trace.TraceManager');
goog.require('wtf.trace.util');
goog.require('wtf.util.Options');


/**
 * Gets a version number indicating the API version of the tracing methods.
 * This can be used by wrapper libraries to conditionally enable/disable
 * methods based on whether the version matches.
 * @return {number} Version number.
 */
wtf.trace.getApiVersion = function() {
  return 1;
};


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
wtf.trace.prepare = function() {
  return wtf.trace.getTraceManager();
};


/**
 * Shuts down the tracing system.
 */
wtf.trace.shutdown = function() {
  goog.asserts.assert(wtf.trace.traceManager_);
  if (!wtf.trace.traceManager_) {
    return;
  }

  // Stop session (if any is in progress).
  wtf.trace.stop();

  // Cleanup shared state.
  goog.dispose(wtf.trace.traceManager_);
  wtf.trace.traceManager_ = null;
};


/**
 * Adds a session event listener.
 * These are retained by the trace manager for the life of the runtime.
 * @param {!wtf.trace.ISessionListener} listener Event listener.
 */
wtf.trace.addSessionListener = function(listener) {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.addListener(listener);
};


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
 * Gets a filename to use for a trace file.
 * @param {string} targetValue {@code wtf.trace.target} value.
 * @return {string} Filename, minus the file:// prefix.
 * @private
 */
wtf.trace.getTraceFilename_ = function(targetValue) {
  var traceManager = wtf.trace.getTraceManager();
  var contextInfo = traceManager.detectContextInfo();

  // Pick a filename prefix.
  var filenamePrefix = targetValue;
  if (filenamePrefix.length) {
    if (filenamePrefix != 'file://') {
      filenamePrefix += '-';
    }
  } else {
    filenamePrefix = 'file://';
  }

  var filename = filenamePrefix + contextInfo.getFilename();
  return filename.replace('file://', '');
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
        goog.string.startsWith(targetUrl, 'https://') ||
        goog.string.startsWith(targetUrl, '//') ||
        goog.string.startsWith(targetUrl, 'http-rel:')) {
      // HTTP target.
      // We use the fake protocol http-rel to specify a relative url. In
      // that case we just strip it off and take the rest as the url.
      if (goog.string.startsWith(targetUrl, 'http-rel:')) {
        targetUrl = targetUrl.substring('http-rel:'.length);
      }
      if (options.getOptionalString('wtf.trace.mode') == 'snapshotting') {
        return new wtf.io.BufferedHttpWriteStream(targetUrl);
      } else {
        return new wtf.io.StreamingHttpWriteStream(targetUrl);
      }
    } else if (goog.string.startsWith(targetUrl, 'file://')) {
      // File target.
      var targetFilename = wtf.trace.getTraceFilename_(targetUrl);
      return new wtf.io.LocalFileWriteStream(targetFilename);
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
wtf.trace.start = function(opt_options) {
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
};


/**
 * Takes a snapshot of the current state.
 * A session must be actively recording. This call is ignored if the session
 * does not support snapshotting.
 * @param {wtf.io.WriteStream|*=} opt_targetValue Stream target value.
 */
wtf.trace.snapshot = function(opt_targetValue) {
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
};


/**
 * Clears all data in the current session by resetting all buffers.
 * This is only valid in snapshotting sessions.
 */
wtf.trace.reset = function() {
  var traceManager = wtf.trace.getTraceManager();
  var session = traceManager.getCurrentSession();
  if (session instanceof wtf.trace.SnapshottingSession) {
    session.reset();
  }
};


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
 * @return {!wtf.trace.Zone} Zone used for future calls.
 */
wtf.trace.createZone = function(name, type, location) {
  var traceManager = wtf.trace.getTraceManager();
  return traceManager.createZone(name, type, location);
};


/**
 * Deletes an execution zone.
 * The zone ID may be reused.
 * @param {!wtf.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtf.trace.deleteZone = function(zone) {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.deleteZone(zone);
};


/**
 * Pushes a zone.
 * @param {!wtf.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtf.trace.pushZone = function(zone) {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.pushZone(zone);
};


/**
 * Pops the active zone.
 */
wtf.trace.popZone = function() {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.popZone();
};


/**
 * Enters a scope.
 * @param {string=} opt_msg Optional message string.
 * @param {wtf.trace.Flow=} opt_flow A flow to terminate on scope leave, if any.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 * @return {!wtf.trace.Scope} An initialized scope object.
 */
wtf.trace.enterScope = function(opt_msg, opt_flow, opt_time) {
  return wtf.trace.BuiltinEvents.enterScope(
      opt_time || wtf.now(), opt_flow, opt_msg);
};


/**
 * Enters a tracing implementation overhead scope.
 * This should only be used by the tracing framework and extension to indicate
 * time used by non-user tasks.
 * @param {number} time Time for the enter. Use {@code wtf.now()}.
 * @param {wtf.trace.Flow=} opt_flow A flow to terminate on scope leave, if any.
 * @return {!wtf.trace.Scope} An initialized scope object.
 */
wtf.trace.enterTracingScope = wtf.trace.BuiltinEvents.enterTracingScope;


/**
 * Appends a named argument of any type to the current scope.
 * This is slow and should only be used for very infrequent appends.
 * Prefer instead to use a custom instance event with the
 * {@see wtf.data.EventFlag#APPEND_SCOPE_DATA} flag set.
 *
 * @param {number} time Time for the enter. Use {@code wtf.now()}.
 * @param {string} name Argument name. Must be ASCII.
 * @param {*} value Value. Will be JSON stringified.
 */
wtf.trace.appendScopeData = function(time, name, value) {
  var json = goog.json.serialize(value);
  wtf.trace.BuiltinEvents.appendScopeData(time, name, json);
};


/**
 * Branches the flow.
 * If no parent flow is given then the current global flow is used.
 * @param {string=} opt_msg Optional message string.
 * @param {wtf.trace.Flow=} opt_parentFlow Parent flow, if any.
 * @param {number=} opt_time Time for the branch; omit to use the current time.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.branchFlow = wtf.trace.Flow.branch;


/**
 * Clears the current global flow.
 * This should be called at the end of any runtime callback.
 */
wtf.trace.clearFlow = wtf.trace.Flow.clearCurrent;


/**
 * Spans the flow across processes.
 * Flows must have been branched before this can be used.
 * @param {number} flowId Flow ID.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.spanFlow = wtf.trace.Flow.span;


/**
 * Marks the stream with a named bookmark.
 * This is used by the UI to construct a simple navigation structure.
 * It's best to use custom events that make filtering easier, if possible.
 * @param {string} name Marker name.
 * @param {number=} opt_time Time for the mark; omit to use the current time.
 */
wtf.trace.mark = function(name, opt_time) {
  var time = opt_time || wtf.now();
  wtf.trace.BuiltinEvents.mark(time, name);
};


/**
 * Adds a timestamped event to the stream.
 * This is synonymous to {@code console.timeStamp}, and can be used to place
 * simple arg-less instance events in the timeline.
 * Prefer using custom events for faster, more flexible events.
 * @param {string} name Marker name.
 * @param {number=} opt_time Time for the mark; omit to use the current time.
 */
wtf.trace.timeStamp = function(name, opt_time) {
  var time = opt_time || wtf.now();
  wtf.trace.BuiltinEvents.timeStamp(time, name);
};


/**
 * Marks an event listener as being ignored, meaning that it will not show up
 * in traces.
 * @param {!T} listener Event listener.
 * @return {!T} The parameter, for chaining.
 * @template T
 */
wtf.trace.ignoreListener = wtf.trace.util.ignoreListener;
