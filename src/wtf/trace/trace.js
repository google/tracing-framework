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
goog.require('wtf');
goog.require('wtf.data.EventFlag');
goog.require('wtf.io');
goog.require('wtf.io.WriteTransport');
goog.require('wtf.io.cff.BinaryStreamTarget');
goog.require('wtf.io.cff.JsonStreamTarget');
goog.require('wtf.io.transports.BlobWriteTransport');
goog.require('wtf.io.transports.FileWriteTransport');
goog.require('wtf.io.transports.MemoryWriteTransport');
goog.require('wtf.io.transports.NullWriteTransport');
goog.require('wtf.io.transports.XhrWriteTransport');
goog.require('wtf.trace.BuiltinEvents');
goog.require('wtf.trace.Flow');
goog.require('wtf.trace.Scope');
goog.require('wtf.trace.TraceManager');
goog.require('wtf.trace.events');
goog.require('wtf.trace.eventtarget');
goog.require('wtf.trace.sessions.NullSession');
goog.require('wtf.trace.sessions.SnapshottingSession');
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
 * @param {string=} opt_targetValue {@code wtf.trace.target} value.
 * @return {string} Filename, minus the file:// prefix.
 */
wtf.trace.getTraceFilename = function(opt_targetValue) {
  var targetValue = opt_targetValue || '';

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

    // Get full filename with date/etc.
    var filename = wtf.io.getTimedFilename(
        filenamePrefix, contextInfo.getFilename());
    return filename.replace('file://', '');
  }
};


/**
 * Creates a transport based on the given options.
 * @param {!wtf.util.Options} options Options.
 * @param {boolean} streaming Whether to create for streaming.
 * @param {wtf.io.WriteTransport|*=} opt_targetValue Target value.
 *     May be anything, pretty much. If a transport is given that will be used
 *     directly. This overrides any options specified.
 * @return {!wtf.io.WriteTransport} Transport.
 * @private
 */
wtf.trace.createTransport_ = function(options, streaming, opt_targetValue) {
  var targetValue =
      opt_targetValue || options.getOptionalString('wtf.trace.target');

  if (!targetValue ||
      (goog.isString(targetValue) && !targetValue.length)) {
    // Nothing specified - default to memory.
    var transport = new wtf.io.transports.MemoryWriteTransport();
    transport.needsLibraryDispose = true;
    return transport;
  } else if (targetValue instanceof wtf.io.WriteTransport) {
    // Transport passed in - use directly.
    var transport = /** @type {!wtf.io.WriteTransport} */ (targetValue);
    transport.needsLibraryDispose = false;
    return transport;
  } else if (goog.isObject(targetValue) && targetValue['write']) {
    // Custom transport - targetValue is an object with some write methods.
    //return new wtf.io.CustomWriteStream(targetValue);
    throw 'Custom transport not yet supported.';
  } else if (goog.isArray(targetValue)) {
    // Memory target.
    // This variant will stash the resulting buffers into the given array.
    var transport = new wtf.io.transports.MemoryWriteTransport();
    transport.needsLibraryDispose = true;
    transport.setTargetArray(/** @type {!Array} */ (targetValue));
    return transport;
  }

  // If some random object give up.
  if (!goog.isString(targetValue)) {
    throw 'Invalid transport specified.';
  }

  var targetUrl = /** @type {string} */ (targetValue);
  if (targetUrl == 'null') {
    // Null target; write nothing.
    return new wtf.io.transports.NullWriteTransport();
  } else if (goog.string.startsWith(targetUrl, 'ws://')) {
    // WebSocket target.
    // TODO(benvanik): setup websocket target
    throw 'WebSocket transport not yet supported.';
  } else if (
      goog.string.startsWith(targetUrl, 'http://') ||
      goog.string.startsWith(targetUrl, 'https://') ||
      goog.string.startsWith(targetUrl, '//') ||
      goog.string.startsWith(targetUrl, 'http-rel:')) {
    // HTTP target.
    // We use the fake protocol http-rel to specify a relative url. In
    // that case we just strip it off and take the rest as the url.
    if (goog.string.startsWith(targetUrl, 'http-rel:')) {
      targetUrl = targetUrl.substring('http-rel:'.length);
    }
    if (streaming) {
      throw 'Streaming XHR transport not yet supported.';
      // return new wtf.io.transports.StreamingXhrWriteTransport(targetUrl);
    } else {
      var transport = new wtf.io.transports.XhrWriteTransport(
          targetUrl, undefined, wtf.trace.getTraceFilename());
      transport.needsLibraryDispose = true;
      return transport;
    }
  } else if (goog.string.startsWith(targetUrl, 'file://')) {
    // File target.
    var targetFilename = wtf.trace.getTraceFilename(targetUrl);
    var transport;
    if (wtf.NODE) {
      transport = new wtf.io.transports.FileWriteTransport(targetFilename);
    } else {
      transport = new wtf.io.transports.BlobWriteTransport(targetFilename);
    }
    transport.needsLibraryDispose = true;
    return transport;
  }

  throw 'Invalid transport specified.';
};


/**
 * Creates a write stream based on the given options.
 * @param {!wtf.util.Options} options Options.
 * @param {!wtf.io.WriteTransport} transport Write transport.
 * @return {!wtf.io.cff.StreamTarget} Stream target.
 * @private
 */
wtf.trace.createStreamTarget_ = function(options, transport) {
  // Switch based on format.
  // Note that some formats may not be ideal for certain transports.

  if (wtf.PROD_BUILD) {
    // JSON only in build mode.
    return new wtf.io.cff.JsonStreamTarget(
        transport, wtf.io.cff.JsonStreamTarget.Mode.COMPLETE);
  } else if (wtf.MIN_BUILD) {
    // Binary only in min mode.
    return new wtf.io.cff.BinaryStreamTarget(transport);
  } else {
    // TODO(benvanik): force format based on transport type?
    var formatValue = options.getString('wtf.trace.format', 'binary');
    switch (formatValue) {
      default:
      case 'binary':
        return new wtf.io.cff.BinaryStreamTarget(transport);
      case 'json':
        return new wtf.io.cff.JsonStreamTarget(
            transport, wtf.io.cff.JsonStreamTarget.Mode.COMPLETE);
      case 'partial_json':
        return new wtf.io.cff.JsonStreamTarget(
            transport, wtf.io.cff.JsonStreamTarget.Mode.PARTIAL);
    }
  }
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
      session = new wtf.trace.sessions.NullSession(
          traceManager, options);
      break;
    default:
    case 'snapshot':
    case 'snapshotting':
      session = new wtf.trace.sessions.SnapshottingSession(
          traceManager, options);
      break;
    case 'stream':
    case 'streaming':
      // var transport = wtf.trace.createTransport_(options, true);
      // var streamTarget = wtf.trace.createStreamTarget_(options, transport);
      // session = new wtf.trace.sessions.StreamingSession(
      //     traceManager, streamTarget, options);
      throw new Error('Streaming not yet implemented');
      break;
  }
  goog.asserts.assert(session);

  // Begin session.
  traceManager.startSession(session);
};


/**
 * Takes a snapshot of the current state.
 * A session must be actively recording. This call is ignored if the session
 * does not support snapshotting.
 * @param {wtf.io.WriteTransport|*=} opt_targetValue Stream target value.
 */
wtf.trace.snapshot = function(opt_targetValue) {
  var traceManager = wtf.trace.getTraceManager();
  var session = traceManager.getCurrentSession();
  if (!session ||
      !(session instanceof wtf.trace.sessions.SnapshottingSession)) {
    return;
  }

  if (goog.isFunction(opt_targetValue)) {
    // User function for creating the stream. This isn't really supported
    // anymore.
    throw (
        'Snapshots with custom allocator functions are no longer ' +
        'supported. Pass in a wtf.io.Transport instead.');
  }

  // Create transport (or reuse what was passed in).
  var options = session.getOptions();
  var transport = wtf.trace.createTransport_(options, false, opt_targetValue);
  goog.asserts.assert(transport);

  // Create CFF stream target.
  var streamTarget = wtf.trace.createStreamTarget_(options, transport);
  goog.asserts.assert(streamTarget);

  // Write the snapshot data into the target.
  session.snapshot(streamTarget);

  // Finish CFF.
  goog.dispose(streamTarget);

  // Only dispose the transport if we created it.
  if (transport.needsLibraryDispose) {
    goog.dispose(transport);
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
 * @param {function(this:T, Array.<!wtf.io.Blob>)} callback Function called
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
  traceManager.reset();
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
 *
 * Repeated calls with the same name and value type will be optimized at
 * runtime. To ensure predictable performance it's better to use a custom
 * instance event with the {@see wtf.data.EventFlag#APPEND_SCOPE_DATA} flag set.
 *
 * But, in general, you should avoid using this if you can. Appending data
 * involves additional overhead at runtime and in the file compared to just
 * passing the arguments to the function.
 *
 * No, really, this JSON stringifies whatever is passed to it and will skew
 * your results. Don't use it.
 *
 * Example:
 * <code>
 * my.Type.prototype.someMethod = function() {
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
 * @param {*} value Value. Will be JSON stringified. If this is a number it
 *      will be converted to an int32.
 * @param {number=} opt_time Time for the event; omit to use the current time.
 */
wtf.trace.appendScopeData = function(name, value, opt_time) {
  var typeName = 'any';
  if (typeof value == 'boolean') {
    typeName = 'bool';
  } else if (typeof value == 'number') {
    // Force to a int32, for now. If this becomes a problem we can change it.
    value |= 0;
    typeName = 'int32';
  } else if (typeof value == 'string') {
    typeName = 'utf8';
  }

  // Lookup a cache entry for the name/type pair.
  var key = name + '_' + typeName;
  var cacheEntry = wtf.trace.appendScopeDataCache_[key];
  if (!cacheEntry) {
    cacheEntry = wtf.trace.appendScopeDataCache_[key] = {
      count: 0,
      emit: null
    };
  }

  // Generate the function, if needed.
  if (++cacheEntry.count == wtf.trace.APPEND_OPTIMIZATION_THRESHOLD_) {
    goog.asserts.assert(!cacheEntry.emit);
    cacheEntry.emit = wtf.trace.events.createInstance(
        'wtf.scope#appendData_' + key + '(' + typeName + ' ' + name + ')',
        wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA);
  }

  if (cacheEntry.emit) {
    // Fast path through the emitted function.
    cacheEntry.emit(value, opt_time);
  } else {
    // Slow path through the generic append scope data method.
    wtf.trace.BuiltinEvents.appendScopeData(name, value, opt_time);
  }
};


/**
 * Required number of appendScopeData calls on a name/type pair before a
 * custom event is generated for it.
 * @type {number}
 * @const
 * @private
 */
wtf.trace.APPEND_OPTIMIZATION_THRESHOLD_ = 100;


/**
 * A cache of {@see wtf.trace.appendScopeData} event methods.
 * This is managed by the appendScopeData method. It stashes objects that track
 * the uses of append methods by name/type and once they hit a certain threshold
 * creates the optimized recording functions.
 * @type {!Object.<{count: number, emit: Function}>}
 * @private
 */
wtf.trace.appendScopeDataCache_ = {};


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
 * @typedef {Object|number}
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
 * to only those events that span frames or JavaScript ticks.
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
 * @param {number=} opt_time Time for the stamp; omit to use the current time.
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
