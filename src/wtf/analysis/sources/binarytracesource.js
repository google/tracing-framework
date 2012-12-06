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
goog.require('wtf');
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

  // Always add 'defineEvent'.
  this.eventTable_[1] = traceListener.getEventType('wtf.event.define');

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
 * Wire format version.
 * @const
 * @type {number}
 */
wtf.analysis.sources.BinaryTraceSource.FORMAT_VERSION = 1;


/**
 * Reads a trace header from a buffer.
 * @param {!wtf.io.Buffer} buffer Source buffer.
 * @return {boolean} True if the read succeeded.
 * @private
 */
wtf.analysis.sources.BinaryTraceSource.prototype.readTraceHeader_ =
    function(buffer) {
  // Read magic number and verify it's a header.
  var magicNumber = buffer.readUint32();
  if (magicNumber != 0xDEADBEEF) {
    // Magic number mismatch.
    goog.asserts.fail('Magic number mismatch');
    return false;
  }

  // Read version information to ensure we support the format.
  // wtf.VERSION
  var wtfVersion = buffer.readUint32();
  if (wtfVersion != wtf.VERSION) {
    // Runtime version mismatch.
    goog.asserts.fail('Runtime version mismatch');
    return false;
  }
  // wtf.trace.Session.FORMAT_VERSION
  var formatVersion = buffer.readUint32();
  if (formatVersion != wtf.analysis.sources.BinaryTraceSource.FORMAT_VERSION) {
    // Format version mismatch.
    goog.asserts.fail('Format version mismatch');
    return false;
  }

  // Read context information.
  var contextInfo = wtf.data.ContextInfo.parse(buffer);
  if (!contextInfo) {
    // Bad context info or unknown context.
    goog.asserts.fail('Bad context information');
    return false;
  }

  // Read time information.
  var hasHighResolutionTimes = buffer.readUint8() ? true : false;
  var timebase = buffer.readUint32();
  timebase += buffer.readUint32() << 32;
  // TODO(benvanik): is this right?
  var timeDelay = wtf.timebase() - timebase;

  // Initialize the trace source.
  // Only call when all other parsing has been successful.
  this.initialize(contextInfo, hasHighResolutionTimes, timebase, timeDelay);

  return true;
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
  var timebase = this.getTimebase();
  var wallTime = timebase + time;

  // Infer state.
  var zone = this.currentZone_;

  // Always fire raw event.
  var listener = this.traceListener;
  listener.traceRawEvent(eventType, zone, timebase, time, args);

  // Handle built-in events.
  // TODO(benvanik): something much more efficient for builtins
  var e = null;
  var isCustom = false;
  switch (eventType.name) {
    case 'wtf.event.define':
      var newEventType = listener.defineEventType(
          wtf.analysis.EventType.parse(args));
      this.eventTable_[args['wireId']] = newEventType;
      break;

    case 'wtf.zone.create':
      var newZone = listener.createOrGetZone(
          args['name'], args['type'], args['location']);
      this.zoneTable_[args['zoneId']] = newZone;
      e = new wtf.analysis.ZoneEvent(
          eventType, zone, wallTime, args, newZone);
      break;
    case 'wtf.zone.delete':
      var deadZone = this.zoneTable_[args['zoneId']] || null;
      e = new wtf.analysis.ZoneEvent(
          eventType, zone, wallTime, args, deadZone);
      break;
    case 'wtf.zone.set':
      this.currentZone_ = this.zoneTable_[args['zoneId']] || null;
      break;

    case 'wtf.flow.branch':
      var parentFlowId = args['parentId'];
      var parentFlow = parentFlowId ? this.flowTable_[parentFlowId] : null;
      var flowId = args['id'];
      var flow = new wtf.analysis.Flow(flowId, parentFlowId, parentFlow);
      this.flowTable_[flowId] = flow;
      e = new wtf.analysis.FlowEvent(
          eventType, zone, wallTime, args, flow);
      flow.setBranchEvent(e);
      break;
    case 'wtf.flow.extend':
      var flowId = args['id'];
      var flow = this.flowTable_[flowId];
      if (!flow) {
        flow = new wtf.analysis.Flow(flowId, 0, null);
        this.flowTable_[flowId] = flow;
      }
      e = new wtf.analysis.FlowEvent(
          eventType, zone, wallTime, args, flow);
      flow.setExtendEvent(e);
      break;
    case 'wtf.flow.terminate':
      var flowId = args['id'];
      var flow = this.flowTable_[flowId];
      if (!flow) {
        flow = new wtf.analysis.Flow(flowId, 0, null);
        this.flowTable_[flowId] = flow;
      }
      e = new wtf.analysis.FlowEvent(
          eventType, zone, wallTime, args, flow);
      flow.setTerminateEvent(e);
      break;

    default:
      switch (eventType.eventClass) {
        case wtf.data.EventClass.SCOPE:
          var newScope = new wtf.analysis.Scope();
          e = new wtf.analysis.ScopeEvent(
              eventType, zone, wallTime, args, newScope);
          newScope.setEnterEvent(e);
          break;
        default:
        case wtf.data.EventClass.INSTANCE:
          e = new wtf.analysis.Event(eventType, zone, wallTime, args);
          break;
      }
      isCustom = true;
      break;
  }

  if (e) {
    listener.traceEvent(e, isCustom);
  }
};
