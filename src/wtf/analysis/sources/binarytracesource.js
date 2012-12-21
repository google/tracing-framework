/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Binary WTF trace event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.sources.BinaryTraceSource');

goog.require('goog.asserts');
goog.require('goog.math.Long');
goog.require('wtf.analysis.Event');
goog.require('wtf.analysis.EventType');
goog.require('wtf.analysis.Flow');
goog.require('wtf.analysis.FlowEvent');
goog.require('wtf.analysis.Scope');
goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.analysis.TraceSource');
goog.require('wtf.analysis.ZoneEvent');
goog.require('wtf.data.ContextInfo');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.formats.BinaryTrace');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.io.EventType');



/**
 * Single-source trace stream implenting the WTF binary format.
 * This accepts streams formatted in a version of the WTF binary format.
 * For more information on the format see {@code docs/wtf-trace.md}.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener.
 * @param {!wtf.io.ReadStream} readStream Read stream. Ownership is transferred
 *     to the trace source and the stream will be disposed at the same time.
 * @constructor
 * @extends {wtf.analysis.TraceSource}
 */
wtf.analysis.sources.BinaryTraceSource = function(traceListener, readStream) {
  goog.base(this, traceListener);

  /**
   * Read stream.
   * The source owns the stream and will dispose it at the same time.
   * @type {!wtf.io.ReadStream}
   * @private
   */
  this.readStream_ = readStream;
  this.registerDisposable(this.readStream_);

  /**
   * Whether the trace header has been read.
   * Events cannot be processed until it is.
   * @type {boolean}
   * @private
   */
  this.hasReadTraceHeader_ = false;

  /**
   * Optimized lookup table for {@see wtf.analysis.EventType}s.
   * Keys are event wire ID.
   * @type {!Array.<wtf.analysis.EventType|undefined>}
   * @private
   */
  this.eventTable_ = [];

  /**
   * All seen zones, indexed by zone ID.
   * Note that this source does not own the zones, but instead the listener
   * does. This allows de-duping across sources.
   * @type {!Object.<number, !wtf.analysis.Zone>}
   * @private
   */
  this.zoneTable_ = {};

  /**
   * The currently set zone, if any.
   * @type {wtf.analysis.Zone}
   * @private
   */
  this.currentZone_ = null;

  // TODO(benvanik): find a nice design that doesn't require growing forever
  /**
   * All currently active flows indexed by flow ID.
   * Flows are added to this as they are acted upon on the wire, and are
   * currently never removed (to enable better tracking of parent flows).
   * @type {!Object.<number, !wtf.analysis.Flow>}
   * @private
   */
  this.flowTable_ = {};

  /**
   * A fast dispatch table for BUILTIN events, keyed on event name.
   * Each function handles an event of the given type.
   * @type {!Object.<function(!wtf.analysis.TraceListener,
   *     !wtf.analysis.EventType, wtf.analysis.Zone, number, Object
   *     ):(wtf.analysis.Event|undefined)>}
   * @private
   */
  this.builtinDispatch_ = {};
  this.setupDispatchTable_();

  // Start listening for read stream events.
  this.readStream_.addListener(
      wtf.io.EventType.READ, this.processBuffer_, this);
  this.readStream_.listen();
};
goog.inherits(wtf.analysis.sources.BinaryTraceSource, wtf.analysis.TraceSource);


/**
 * Processes an incoming buffer.
 * @param {!wtf.io.Buffer} buffer Buffer.
 * @param {number} length Length of data in the buffer.
 * @return {boolean} True if the processing was successful.
 * @private
 */
wtf.analysis.sources.BinaryTraceSource.prototype.processBuffer_ =
    function(buffer, length) {
  // Read trace header, if required.
  // We assume it is always at the head of the first buffer received.
  var contextInfo;
  if (!this.hasReadTraceHeader_) {
    if (!this.readTraceHeader_(buffer)) {
      return false;
    }
    contextInfo = this.getContextInfo();
    goog.asserts.assert(contextInfo);
    this.traceListener.sourceAdded(this.getTimebase(), contextInfo);
    this.hasReadTraceHeader_ = true;
  }

  contextInfo = this.getContextInfo();
  goog.asserts.assert(contextInfo);
  this.traceListener.beginEventBatch(contextInfo);

  // Read all events from the buffer.
  var successful = true;
  var data = buffer.data;
  while (buffer.offset < length) {
    // Read common event header.
    var offset = buffer.offset;
    var eventWireId = (data[offset++] << 8) | data[offset++];
    var time =
        (((data[offset++] << 24) >>> 0) |
        (data[offset++] << 16) |
        (data[offset++] << 8) |
        data[offset++]) >>> 0;
    time /= 1000;
    buffer.offset = offset;

    // Lookup event.
    var eventType = this.eventTable_[eventWireId];
    if (!eventType) {
      successful = false;
      this.traceListener.sourceError(
          'Undefined event type',
          'The file tried to reference an event it didn\'t define. Perhaps ' +
          'it\'s corrupted?');
      break;
    }

    // If the event has custom data, read that too.
    var argData = eventType.parse ? eventType.parse(buffer) : {};

    // Dispatch event.
    this.dispatchEvent_(eventType, time, argData);
  }

  this.traceListener.endEventBatch();

  return successful;
};


/**
 * Reads a trace header from a buffer.
 * @param {!wtf.io.Buffer} buffer Source buffer.
 * @return {boolean} True if the read succeeded.
 * @private
 */
wtf.analysis.sources.BinaryTraceSource.prototype.readTraceHeader_ =
    function(buffer) {
  var listener = this.traceListener;

  // Read magic number and verify it's a header.
  var magicNumber = buffer.readUint32();
  if (magicNumber != 0xDEADBEEF) {
    // Magic number mismatch.
    listener.sourceError(
        'File type not supported or corrupt',
        'The header of the file doesn\'t match the expected value.');
    return false;
  }

  // Read version information to ensure we support the format.
  // wtf.version.getValue()
  // We don't actually need these to match.
  var wtfVersion = buffer.readUint32();
  var formatVersion = buffer.readUint32();
  if (formatVersion != wtf.data.formats.BinaryTrace.VERSION) {
    // Format version mismatch.
    this.traceListener.sourceError(
        'File version not supported or too old',
        'Sorry, the parser for this file version is not available :(');
    return false;
  }

  // Read context information.
  var contextInfo = wtf.data.ContextInfo.parse(buffer);
  if (!contextInfo) {
    // Bad context info or unknown context.
    this.traceListener.sourceError(
        'Invalid context information');
    return false;
  }

  // Read flags information.
  var flags = buffer.readUint32();
  var hasHighResolutionTimes =
      !!(flags & wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES);
  var longTimebase = goog.math.Long.fromBits(
      buffer.readUint32(), buffer.readUint32());
  var timebase = longTimebase.toNumber();
  var timeDelay = listener.computeTimeDelay(timebase);

  // Read metadata blob.
  var metadataString = buffer.readUtf8String();
  var metadata = metadataString ? goog.global.JSON.parse(metadataString) : {};
  if (!goog.isObject(metadata)) {
    metadata = {};
  }

  // Initialize the trace source.
  // Only call when all other parsing has been successful.
  this.initialize(contextInfo, flags, metadata, timebase, timeDelay);

  // Add builtin events for this version.
  switch (formatVersion) {
    case 3:
    default:
      listener.defineEventType(wtf.analysis.EventType.createInstance(
          'wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
          'ascii name, ascii args)',
          wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL));
      break;
  }
  this.eventTable_[1] = listener.getEventType('wtf.event#define');

  return true;
};


/**
 * Sets up an event dispatch table for the builtin event types.
 * @private
 */
wtf.analysis.sources.BinaryTraceSource.prototype.setupDispatchTable_ =
    function() {
  this.builtinDispatch_['wtf.event#define'] = function(
      listener, eventType, zone, time, args) {
    var newEventType = listener.defineEventType(
        wtf.analysis.EventType.parse(args));
    this.eventTable_[args['wireId']] = newEventType;
  };

  this.builtinDispatch_['wtf.zone#create'] = function(
      listener, eventType, zone, time, args) {
    var newZone = listener.createOrGetZone(
        args['name'], args['type'], args['location']);
    this.zoneTable_[args['zoneId']] = newZone;
    return new wtf.analysis.ZoneEvent(
        eventType, zone, time, args, newZone);
  };
  this.builtinDispatch_['wtf.zone#delete'] = function(
      listener, eventType, zone, time, args) {
    var deadZone = this.zoneTable_[args['zoneId']] || null;
    return new wtf.analysis.ZoneEvent(
        eventType, zone, time, args, deadZone);
  };
  this.builtinDispatch_['wtf.zone#set'] = function(
      listener, eventType, zone, time, args) {
    this.currentZone_ = this.zoneTable_[args['zoneId']] || null;
  };

  this.builtinDispatch_['wtf.flow#branch'] = function(
      listener, eventType, zone, time, args) {
    var parentFlowId = args['parentId'];
    var parentFlow = parentFlowId ? this.flowTable_[parentFlowId] : null;
    var flowId = args['id'];
    var flow = new wtf.analysis.Flow(flowId, parentFlow);
    this.flowTable_[flowId] = flow;
    var e = new wtf.analysis.FlowEvent(
        eventType, zone, time, args, flow);
    flow.setBranchEvent(e);
    return e;
  };
  this.builtinDispatch_['wtf.flow#extend'] = function(
      listener, eventType, zone, time, args) {
    var flowId = args['id'];
    var flow = this.flowTable_[flowId];
    if (!flow) {
      // Ignore flows where there branch is missing.
      return null;
    }
    var e = new wtf.analysis.FlowEvent(
        eventType, zone, time, args, flow);
    flow.addExtendEvent(e);
    return e;
  };
  this.builtinDispatch_['wtf.flow#terminate'] = function(
      listener, eventType, zone, time, args) {
    var flowId = args['id'];
    var flow = this.flowTable_[flowId];
    if (!flow) {
      // Ignore flows where there branch is missing.
      return null;
    }
    var e = new wtf.analysis.FlowEvent(
        eventType, zone, time, args, flow);
    flow.setTerminateEvent(e);
    return e;
  };

  this.builtinDispatch_['wtf.scope#enter'] = function(
      listener, eventType, zone, time, args) {
    // Create event types on demand.
    var newScope = new wtf.analysis.Scope();
    var jitType = listener.getEventType(args['name']);
    if (!jitType) {
      jitType = listener.defineEventType(new wtf.analysis.EventType(
          args['name'], wtf.data.EventClass.SCOPE, 0, []));
    }
    var e = new wtf.analysis.ScopeEvent(jitType, zone, time, [], newScope);
    newScope.setEnterEvent(e);
    return e;
  };

  this.builtinDispatch_['wtf.trace#timeStamp'] = function(
      listener, eventType, zone, time, args) {
    // Create event types on demand.
    var jitType = listener.getEventType(args['name']);
    if (!jitType) {
      jitType = listener.defineEventType(new wtf.analysis.EventType(
          args['name'], wtf.data.EventClass.INSTANCE, 0, [
            wtf.data.Variable.create('value', 'any')
          ]));
    }
    return new wtf.analysis.Event(jitType, zone, time, {
      'value': args['value']
    });
  };
};


/**
 * Dispatches an event.
 * The event is assumed to have passed any filtering.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @param {number} time Source-relative time.
 * @param {!Object} args Custom event data.
 * @private
 */
wtf.analysis.sources.BinaryTraceSource.prototype.dispatchEvent_ = function(
    eventType, time, args) {
  time += this.getTimeDelay();

  // Infer state.
  var zone = this.currentZone_;

  // Always fire raw event.
  var listener = this.traceListener;
  listener.traceRawEvent(eventType, zone, this.getTimebase(), time, args);

  // Handle built-in events.
  // TODO(benvanik): share more of this in TraceSource
  // TODO(benvanik): something much more efficient for builtins
  var e = null;
  if (eventType.flags & wtf.data.EventFlag.BUILTIN) {
    var dispatchFn = this.builtinDispatch_[eventType.name];
    if (dispatchFn) {
      e = dispatchFn.call(this, listener, eventType, zone, time, args);
    } else {
      e = new wtf.analysis.Event(eventType, zone, time, args);
    }
  } else {
    switch (eventType.eventClass) {
      case wtf.data.EventClass.SCOPE:
        var newScope = new wtf.analysis.Scope();
        e = new wtf.analysis.ScopeEvent(
            eventType, zone, time, args, newScope);
        newScope.setEnterEvent(e);
        break;
      default:
      case wtf.data.EventClass.INSTANCE:
        e = new wtf.analysis.Event(eventType, zone, time, args);
        break;
    }
  }

  if (e) {
    listener.traceEvent(e);
  }
};
