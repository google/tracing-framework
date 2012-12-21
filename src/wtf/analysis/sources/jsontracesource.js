/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview JSON WTF trace event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.sources.JsonTraceSource');

goog.require('goog.asserts');
goog.require('wtf.analysis.Event');
goog.require('wtf.analysis.EventType');
goog.require('wtf.analysis.Scope');
goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.analysis.TraceSource');
goog.require('wtf.analysis.ZoneEvent');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.data.Variable');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.data.formats.JsonTrace');



// TODO(benvanik): validation/errors/etc - need an interface in trace listener
//     for source errors
/**
 * Single-source trace stream implenting the WTF JSON format.
 * For more information on the format see {@code docs/wtf-json.md}.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener.
 * @param {string|!Array|!Object} sourceData Source JSON data. Either a string
 *     to parse or an object. If an object, it is not cloned, so do not modify.
 * @constructor
 * @extends {wtf.analysis.TraceSource}
 */
wtf.analysis.sources.JsonTraceSource = function(traceListener, sourceData) {
  goog.base(this, traceListener);

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
  this.currentZone_ = traceListener.getDefaultZone();

  // If the input is a string it needs to be parsed (and maybe fixed up).
  if (goog.isString(sourceData)) {
    sourceData = this.parseJson_(sourceData);
  }
  if (goog.isObject(sourceData) && !goog.isArray(sourceData)) {
    sourceData = /** @type {!Array} */ (sourceData['events']);
  }

  if (goog.isArray(sourceData)) {
    this.parseEvents_(sourceData);
  }
};
goog.inherits(wtf.analysis.sources.JsonTraceSource, wtf.analysis.TraceSource);


/**
 * Lookup table for all defined {@see wtf.analysis.EventType}s by event name.
 * This is used by the JSON source to add events on-demand when they are
 * used without being defined.
 * *
 * It's best not to always add these events, or not to use them if the
 * source defines their own, as it allows for forwards compatibility.
 *
 * This matches {@see wtf.trace.BuiltinEvents} (sort of).
 * This list does not need to be exhaustive - it's only here to enable trace
 * sources that want to omit defining built in events to function.
 *
 * @type {!Object.<!wtf.analysis.EventType>}
 * @private
 */
wtf.analysis.sources.JsonTraceSource.BuiltinEvents_ = {
  'wtf.event#define': wtf.analysis.EventType.createInstance(
      'wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
          'ascii name, ascii args)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.trace.#discontinuity': wtf.analysis.EventType.createInstance(
      'wtf.trace.#discontinuity()',
      wtf.data.EventFlag.BUILTIN),

  'wtf.zone#create': wtf.analysis.EventType.createInstance(
      'wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.zone#delete': wtf.analysis.EventType.createInstance(
      'wtf.zone#delete(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.zone#set': wtf.analysis.EventType.createInstance(
      'wtf.zone#set(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.scope#enter': wtf.analysis.EventType.createScope(
      'wtf.scope#enter(ascii name)',
      wtf.data.EventFlag.BUILTIN),
  'wtf.scope#enterTracing': wtf.analysis.EventType.createScope(
      'wtf.scope#enterTracing()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL |
      wtf.data.EventFlag.SYSTEM_TIME),
  'wtf.scope#leave': wtf.analysis.EventType.createInstance(
      'wtf.scope#leave()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.flow#branch': wtf.analysis.EventType.createInstance(
      'wtf.flow#branch(flowId id, flowId parentId, ascii name, any value)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.flow#extend': wtf.analysis.EventType.createInstance(
      'wtf.flow#extend(flowId id, ascii name, any value)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.flow#terminate': wtf.analysis.EventType.createInstance(
      'wtf.flow#terminate(flowId id, any value)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.trace#mark': wtf.analysis.EventType.createInstance(
      'wtf.trace#mark(ascii name, any value)',
      wtf.data.EventFlag.BUILTIN),
  'wtf.trace#timeStamp': wtf.analysis.EventType.createInstance(
      'wtf.trace#timeStamp(ascii name, any value)',
      wtf.data.EventFlag.BUILTIN)
};


// TODO(benvanik): error handling/reporting
/**
 * Parses a JSON string, performing fixup if needed.
 * @param {string} source Source string.
 * @return {!Array|!Object} JSON object.
 * @private
 */
wtf.analysis.sources.JsonTraceSource.prototype.parseJson_ = function(source) {
  if (!source.length) {
    return [];
  }
  if (source[0] == '{') {
    return /** @type {!Object} */ (goog.global.JSON.parse(source));
  }

  // If the file ends with a , or a }, add the extra ]
  var index = source.length - 1;
  while (index && source[index] == '\n') {
    // Eat trailing newlines.
    index--;
  }
  if (source[index] == ',') {
    // Remove the trailing , and add a ]
    source = source.substr(0, index - 1) + ']';
  } else if (source[index] != ']') {
    // Add a trailing ].
    source += ']';
  }

  // Parse the JSON.
  return /** @type {!Array} */ (goog.global.JSON.parse(source));
};


/**
 * Parses all the events in the stream and emits them.
 * @param {!Array} source JSON list.
 * @return {boolean} True if the source was parsed successfully.
 * @private
 */
wtf.analysis.sources.JsonTraceSource.prototype.parseEvents_ = function(source) {
  var listener = this.traceListener;

  // Always define wtf.scope.#leave
  var builtinEvents = wtf.analysis.sources.JsonTraceSource.BuiltinEvents_;
  listener.defineEventType(builtinEvents['wtf.scope#leave']);

  /**
   * Map of event types by event ID.
   * @type {!Array.<wtf.analysis.EventType>}
   */
  var eventTable = [];

  // Define builtin events.
  eventTable[-1] = listener.getEventType('wtf.scope#leave');

  var hasBegunBatch = false;
  for (var n = 0; n < source.length; n++) {
    var entry = source[n];
    if (entry['event']) {
      // Default header, if none was previously defined.
      if (!hasBegunBatch) {
        this.parseHeader_(null);
        listener.beginEventBatch(this.getContextInfo());
        hasBegunBatch = true;
      }

      // Read out event, lookup, and dispatch.
      var eventRef = entry['event'];
      var time = entry['time'];
      var argList = entry['args'] || null;
      var eventType = eventTable[eventRef] || listener.getEventType(eventRef);
      if (!eventType) {
        // Try to look up a builtin.
        eventType = builtinEvents[eventRef];
        if (eventType) {
          listener.defineEventType(eventType);
        } else {
          listener.sourceError(
              'Undefined event type',
              'The file tried to reference an event it didn\'t define. Perhaps ' +
              'it\'s corrupted?');
          return false;
        }
      }
      this.dispatchEvent_(eventType, time, argList);
    } else {
      switch (entry['type']) {
        case 'wtf.json#header':
          if (!hasBegunBatch) {
            if (!this.parseHeader_(entry)) {
              return false;
            }
            listener.beginEventBatch(this.getContextInfo());
            hasBegunBatch = true;
          }
          break;
        case 'wtf.event#define':
          var eventType = listener.defineEventType(
              this.parseEventType_(entry));
          var eventId = entry['event_id'];
          if (goog.isDef(eventId)) {
            eventTable[eventId] = eventType;
          }
          break;
      }
    }
  }

  if (hasBegunBatch) {
    listener.endEventBatch();
  }

  return true;
};


/**
 * Parses a {@code wtf.json#header} entry and sets up the trace source.
 * If no entry is provided default options will be used.
 * @param {Object} entry Header entry, if any.
 * @return {boolean} True if the header parsed successfully.
 * @private
 */
wtf.analysis.sources.JsonTraceSource.prototype.parseHeader_ = function(entry) {
  var listener = this.traceListener;

  entry = entry || {};

  // Check supported version.
  var formatVersion = entry['format_version'] || 1;
  if (formatVersion != wtf.data.formats.JsonTrace.VERSION) {
    // TODO(benvanik): error on version mismatch
    listener.sourceError(
        'File version not supported or too old',
        'Sorry, the parser for this file version is not available :(');
    return false;
  }

  var hasHighResolutionTimes = goog.isDef(entry['high_resolution_times']) ?
      entry['high_resolution_times'] : true;
  var flags = 0;
  if (hasHighResolutionTimes) {
    flags |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES;
  }
  var timebase = entry['timebase'] || 0;
  var metadata = entry['metadata'] || {};

  // TODO(benvanik): embed context info.
  // TODO(benvanik): a better default context info.
  var contextInfo = new wtf.data.ScriptContextInfo();

  var timeDelay = listener.computeTimeDelay(timebase);
  this.initialize(contextInfo, flags, metadata, timebase, timeDelay);
  listener.sourceAdded(this.getTimebase(), contextInfo);

  return true;
};


/**
 * Parses an {@see wtf.analysis.EventType} from an entry.
 * @param {!Object} entry JSON entry.
 * @return {!wtf.analysis.EventType} Event type.
 * @private
 */
wtf.analysis.sources.JsonTraceSource.prototype.parseEventType_ = function(
    entry) {
  var signature = /** @type {string|undefined} */ (
      entry['signature']);
  goog.asserts.assert(signature);
  var flags = /** @type {number|undefined} */ (
      entry['flags']) || 0;

  var eventClass = wtf.data.EventClass.SCOPE;
  switch (entry['class']) {
    default:
    case 'scope':
      eventClass = wtf.data.EventClass.SCOPE;
      break;
    case 'instance':
      eventClass = wtf.data.EventClass.INSTANCE;
      break;
  }

  var parsedSignature = wtf.data.Variable.parseSignature(signature);
  return new wtf.analysis.EventType(
      parsedSignature.name,
      eventClass,
      flags,
      parsedSignature.args);
};


/**
 * Dispatches an event.
 * The event is assumed to have passed any filtering.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @param {number} time Source-relative time.
 * @param {Array} argList Custom event data.
 * @private
 */
wtf.analysis.sources.JsonTraceSource.prototype.dispatchEvent_ = function(
    eventType, time, argList) {
  time += this.getTimeDelay();

  // Build args data structure.
  var args = {};
  if (argList && argList.length && argList.length == eventType.args.length) {
    for (var n = 0; n < argList.length; n++) {
      var argInfo = eventType.args[n];
      args[argInfo.name] = argList[n];
    }
  }

  // Infer state.
  var zone = this.currentZone_;

  // Always fire raw event.
  var listener = this.traceListener;
  listener.traceRawEvent(eventType, zone, this.getTimebase(), time, args);

  // Handle built-in events.
  // TODO(benvanik): share more of this in TraceSource
  // TODO(benvanik): something much more efficient for builtins
  var e = null;
  if (eventType.flags & wtf.data.EventFlag.BUILTIN &&
      eventType.eventClass != wtf.data.EventClass.SCOPE) {
    switch (eventType.name) {
      case 'wtf.zone#create':
        var newZone = listener.createOrGetZone(
            args['name'], args['type'], args['location']);
        this.zoneTable_[args['zoneId']] = newZone;
        e = new wtf.analysis.ZoneEvent(
            eventType, zone, time, args, newZone);
        break;
      case 'wtf.zone#delete':
        var deadZone = this.zoneTable_[args['zoneId']] || null;
        e = new wtf.analysis.ZoneEvent(
            eventType, zone, time, args, deadZone);
        break;
      case 'wtf.zone#set':
        this.currentZone_ = this.zoneTable_[args['zoneId']] || null;
        break;

      // TODO(benvanik): flow events

      default:
        e = new wtf.analysis.Event(eventType, zone, time, args);
        break;
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
