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
goog.provide('wtf.trace.TimeRange');

goog.require('goog.asserts');
goog.require('goog.string');
goog.require('wtf.io');
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
goog.require('wtf.trace.Scope');
goog.require('wtf.trace.SnapshottingSession');
goog.require('wtf.trace.StreamingSession');
goog.require('wtf.trace.TraceManager');
goog.require('wtf.trace.eventtarget');
goog.require('wtf.trace.util');


/**
 * A version number indicating the API version of the tracing methods.
 * This can be used by wrapper libraries to conditionally enable/disable
 * methods based on whether the version matches.
 * @type {number}
 * @const
 */
wtf.trace.API_VERSION = 2;


/**
 * Gets the current trace manager.
 * @return {!wtf.trace.TraceManager} Trace manager.
 */
wtf.trace.getTraceManager = function() {
  var traceManager = wtf.trace.TraceManager.getSharedInstance();
  goog.asserts.assert(traceManager);
  if (!traceManager) {
    throw 'wtf.trace.prepare not called';
  }
  return traceManager;
};


/**
 * Shuts down the tracing system.
 */
wtf.trace.shutdown = function() {
  var traceManager = wtf.trace.TraceManager.getSharedInstance();
  if (!traceManager) {
    return;
  }

  // Stop session (if any is in progress).
  wtf.trace.stop();

  // Cleanup shared state.
  goog.dispose(traceManager);
  wtf.trace.TraceManager.setSharedInstance(null);
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
 * Gets a filename to use for a trace file.
 * @param {string} targetValue {@code wtf.trace.target} value.
 * @return {string} Filename, minus the file:// prefix.
 * @private
 */
wtf.trace.getTraceFilename_ = function(targetValue) {
  // If the input looks like a full filename ('file://foo.bar') then use that.
  // Otherwise treat it as a prefix.
  if (goog.string.startsWith(targetValue, 'file://') &&
      targetValue.indexOf('.') != -1) {
    return targetValue.replace('file://', '');
  } else {
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

    // prefix-YYYY-MM-DDTHH-MM-SS
    var dt = new Date();
    var filenameSuffix = '-' +
        dt.getFullYear() +
        goog.string.padNumber(dt.getMonth() + 1, 2) +
        goog.string.padNumber(dt.getDate(), 2) + 'T' +
        goog.string.padNumber(dt.getHours(), 2) +
        goog.string.padNumber(dt.getMinutes(), 2) +
        goog.string.padNumber(dt.getSeconds(), 2);

    var filename =
        filenamePrefix + contextInfo.getFilename() + filenameSuffix +
        wtf.io.FILE_EXTENSION;
    return filename.replace('file://', '');
  }
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
 *
 * {@see wtf.trace#prepare} must have been called prior to calling this
 * function.
 *
 * @param {Object=} opt_options Options overrides.
 */
wtf.trace.start = function(opt_options) {
  // Note that prepare must have been called before.
  var traceManager = wtf.trace.getTraceManager();

  // Get combined options.
  var options = traceManager.getOptions(opt_options);

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
  if (!session || !(session instanceof wtf.trace.SnapshottingSession)) {
    return;
  }

  if (goog.isFunction(opt_targetValue)) {
    session.snapshot(opt_targetValue);
  } else {
    session.snapshot(function() {
      return wtf.trace.createStream_(session.getOptions(), opt_targetValue);
    });
  }
};


/**
 * Asynchronously snapshots all contexts.
 * This will take a snapshot of the current context as well as any dependent
 * ones such as servers or worker threads. The results are sent to the callback
 * when they have all been returned.
 * If the call is going to be ignored (no active session) or fails the callback
 * will fire on the next javascript tick with a null value.
 *
 * @param {function(this:T, Array.<!wtf.io.ByteArray>)} callback Function called
 *     when all buffers are available. The value will be null if an error
 *     occurred.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.trace.snapshotAll = function(callback, opt_scope) {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.requestSnapshots(callback, opt_scope);
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
 * Enters a scope by name.
 * This must be matched with a {@see #leaveScope} that takes the return value.
 *
 * It is strongly recommended that a custom enter scope event should be used
 * instead of this, as the overhead required to write the scope name is
 * non-trivial. Only use this when the name changes many times at runtime or
 * you're hacking something together. See {@see wtf.trace.events.createScope}.
 *
 * Example:
 * <code>
 * function myFunction() {
 *   var scope = wtf.trace.enterScope('myFunction');
 *   var result = ...;
 *   return wtf.trace.leaveScope(scope, result);
 * }
 * </code>
 *
 * @param {string} name Scope name.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 * @return {!wtf.trace.Scope} An initialized scope object.
 */
wtf.trace.enterScope = wtf.trace.BuiltinEvents.enterScope;


/**
 * Enters a tracing implementation overhead scope.
 * This should only be used by the tracing framework and extension to indicate
 * time used by non-user tasks.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 * @return {!wtf.trace.Scope} An initialized scope object.
 */
wtf.trace.enterTracingScope = wtf.trace.BuiltinEvents.enterTracingScope;


/**
 * Leaves a scope.
 * @param {wtf.trace.Scope} scope Scope to leave. This is the result of a
 *     previous call to {@see #enterScope} or a custom enter scope function.
 * @param {T=} opt_result Optional result to chain.
 * @param {number=} opt_time Time for the leave; omit to use the current time.
 * @return {T|undefined} The value of the {@code opt_result} parameter.
 * @template T
 */
wtf.trace.leaveScope = wtf.trace.Scope.leave;


/**
 * Appends a named argument of any type to the current scope.
 * The data added is keyed by name, and existing data with the same name will
 * be overwritten.
 * This is slow and should only be used for very infrequent appends.
 * Prefer instead to use a custom instance event with the
 * {@see wtf.data.EventFlag#APPEND_SCOPE_DATA} flag set.
 *
 * No, really, this JSON stringifies whatever is passed to it and will skew
 * your results. Don't use it.
 *
 * Example:
 * <code>
 * my.Type.protoype.someMethod = function() {
 *   // This method is traced automatically by traceMethods, but more data
 *   // is needed:
 *   wtf.trace.appendScopeData('bar', 123);
 *   wtf.trace.appendScopeData('foo', {
 *     'complex': ['data']
 *   });
 * };
 * wtf.trace.instrumentType(...my.Type...);
 * </code>
 *
 * @param {string} name Argument name. Must be ASCII.
 * @param {*} value Value. Will be JSON stringified.
 * @param {number=} opt_time Time for the event; omit to use the current time.
 */
wtf.trace.appendScopeData = wtf.trace.BuiltinEvents.appendScopeData;


/**
 * Branches the flow.
 * If no parent flow is given then the current scope flow is used.
 * @param {string} name Flow name.
 * @param {*=} opt_value Optional data value.
 * @param {wtf.trace.Flow=} opt_parentFlow Parent flow, if any.
 * @param {number=} opt_time Time for the branch; omit to use the current time.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.branchFlow = wtf.trace.Flow.branch;


/**
 * Extends the flow into the current scope.
 * @param {wtf.trace.Flow} flow Flow to extend.
 * @param {string} name Flow stage name.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the extend; omit to use the current time.
 */
wtf.trace.extendFlow = wtf.trace.Flow.extend;


/**
 * Terminates a flow.
 * @param {wtf.trace.Flow} flow Flow to extend.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the terminate; omit to use the current
 *     time.
 */
wtf.trace.terminateFlow = wtf.trace.Flow.terminate;


/**
 * Appends a named argument of any type to the given flow.
 * This is slow and should only be used for very infrequent appends.
 * Prefer instead to use a custom instance event with the
 * {@see wtf.data.EventFlag#APPEND_FLOW_DATA} flag set.
 *
 * @param {wtf.trace.Flow} flow Flow to append.
 * @param {string} name Argument name. Must be ASCII.
 * @param {*} value Value. Will be JSON stringified.
 * @param {number=} opt_time Time for the event; omit to use the current time.
 */
wtf.trace.appendFlowData = wtf.trace.BuiltinEvents.appendFlowData;


/**
 * Clears the current scope flow.
 */
wtf.trace.clearFlow = wtf.trace.Flow.clear;


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
 * Each mark is then turned into a navigation point in a table of contents.
 * This should only be used for modal application state changes, such as
 * initial load, entry into a modal dialog or mode, etc. There is only ever one
 * marked range active at a time and if you are calling this more frequently
 * than 1s you should use something else.
 *
 * For high-frequency time stamps instead use {@see #timeStamp} and for async
 * timers use {@see #beginTimeRange}.
 *
 * @param {string} name Marker name.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the mark; omit to use the current time.
 */
wtf.trace.mark = wtf.trace.BuiltinEvents.mark;


/**
 * Adds a timestamped event to the stream.
 * This is synonymous to {@code console.timeStamp}, and can be used to place
 * simple arg-less instance events in the timeline.
 * Prefer using custom events for faster, more flexible events. This needs to
 * write a string name and will be an order of magnitude or more slower. See
 * {@see wtf.trace.events.createInstance} for the proper way.
 *
 * @param {string} name Time stamp name.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the stamp; omit to use the current time.
 */
wtf.trace.timeStamp = wtf.trace.BuiltinEvents.timeStamp;


/**
 * @typedef {Object}
 */
wtf.trace.TimeRange;


/**
 * Next time range ID.
 * @type {number}
 * @private
 */
wtf.trace.nextTimeRange_ = 0;


/**
 * Begins an async time range.
 * This tracks time outside of normal scope flow control, and should be limited
 * to only those events that span frames or Javascript ticks.
 * If you're trying to track call flow instead use {@see #traceMethods}.
 *
 * A limited number of active timers will be displayed in the UI. Do not abuse
 * this feature by adding timers for everything (like network requests). Prefer
 * to use flows to track complex async operations.
 *
 * Example:
 * <code>
 * my.Type.startJob = function(actionName) {
 *   var job = {...};
 *   job.tracingRange = wtf.trace.beginTimeRange('my.Type:job', actionName);
 * };
 * my.Type.endJob = function(job) {
 *   wtf.trace.endTimeRange(job.tracingRange);
 * };
 * </code>
 *
 * @param {string} name Time range name.
 * @param {*=} opt_value Optional data value.
 * @return {wtf.trace.TimeRange} Time range handle.
 */
wtf.trace.beginTimeRange = function(name, opt_value, opt_time) {
  var timeRange = wtf.trace.nextTimeRange_++;
  wtf.trace.BuiltinEvents.beginTimeRange(timeRange, name, opt_value, opt_time);
  return /** @type {wtf.trace.TimeRange} */ (timeRange);
};


/**
 * Ends an async time range previously started with {@see #beginTimeRange}.
 * @param {wtf.trace.TimeRange} timeRange Time range handle.
 * @param {number=} opt_time Time for the stamp; omit to use the current time.
 */
wtf.trace.endTimeRange = wtf.trace.BuiltinEvents.endTimeRange;


/**
 * Marks an event listener as being ignored, meaning that it will not show up
 * in traces.
 * This should only be used by debugging code as it will cause weird
 * gaps in timing data. Alternatively one could use {@see #enterTracingScope}
 * so that the time is properly shown as inside tracing code.
 *
 * Example:
 * <code>
 * myElement.onclick = WTF.trace.ignoreListener(function(e) {
 *   // This callback will not be auto-traced.
 * });
 * </code>
 *
 * @param {!T} listener Event listener.
 * @return {!T} The parameter, for chaining.
 * @template T
 */
wtf.trace.ignoreListener = wtf.trace.util.ignoreListener;


/**
 * Marks an entire tree of DOM elements as being ignored, meaning that no
 * events from them will show up in traces.
 * @param {!Element} el Root DOM element.
 */
wtf.trace.ignoreDomTree = wtf.trace.util.ignoreDomTree;


/**
 * Initializes on* event properties on the given DOM element and optionally
 * for all children.
 * This must be called to ensure the properties work correctly. It can be
 * called repeatedly on the same elements (but you should avoid that). Try
 * calling it after any new DOM tree is added recursively on the root of the
 * tree.
 *
 * If this method is not called not all browsers will report events registered
 * via their on* properties. Events registered with addEventListener will always
 * be traced.
 *
 * @param {!Element} target Target DOM element.
 * @param {boolean=} opt_recursive Also initialize for all children.
 */
wtf.trace.initializeDomEventProperties =
    wtf.trace.eventtarget.initializeDomEventProperties;
