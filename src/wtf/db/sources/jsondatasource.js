/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview JSON WTF trace event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.sources.JsonDataSource');

goog.require('goog.asserts');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.data.Variable');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.data.formats.JsonTrace');
goog.require('wtf.db.ArgumentData');
goog.require('wtf.db.DataSource');
goog.require('wtf.db.EventType');



/**
 * Single-source trace stream implenting the WTF JSON format.
 * For more information on the format see {@code docs/wtf-json.md}.
 *
 * @param {!wtf.db.Database} db Target database.
 * @param {string|!Array|!Object} sourceData Source JSON data. Either a string
 *     to parse or an object. If an object, it is not cloned, so do not modify.
 * @constructor
 * @extends {wtf.db.DataSource}
 */
wtf.db.sources.JsonDataSource = function(db, sourceData) {
  goog.base(this, db);

  /**
   * All seen zones, indexed by zone ID.
   * Note that this source does not own the zones, but instead the listener
   * does. This allows de-duping across sources.
   * @type {!Object.<number, !wtf.db.Zone>}
   * @private
   */
  this.zoneTable_ = {};

  /**
   * The currently set zone, if any.
   * @type {wtf.db.Zone}
   * @private
   */
  this.currentZone_ = db.getDefaultZone();

  try {
    // If the input is a string it needs to be parsed (and maybe fixed up).
    if (goog.isString(sourceData)) {
      sourceData = this.parseJson_(sourceData);
    }
    if (goog.isObject(sourceData) && !goog.isArray(sourceData)) {
      sourceData = /** @type {!Array} */ (sourceData['events']);
    }
  } catch (e) {
    db.sourceError(
        this,
        'Error parsing data',
        'The file could not be parsed as JSON. Perhaps it\'s corrupted?\n' + e);
    return;
  }
  if (!goog.isArray(sourceData)) {
    db.sourceError(
        this,
        'Error parsing data',
        'The data was expected to be an array.');
    return;
  }

  /**
   * The source data to process.
   * This is consumed and cleared on start().
   * @type {Array}
   * @private
   */
  this.pendingSourceData_ = sourceData;
};
goog.inherits(wtf.db.sources.JsonDataSource, wtf.db.DataSource);


/**
 * @override
 */
wtf.db.sources.JsonDataSource.prototype.start = function() {
  var sourceData = this.pendingSourceData_;
  this.pendingSourceData_ = null;
  goog.asserts.assert(sourceData);
  this.parseEvents_(sourceData);
};


/**
 * Lookup table for all defined {@see wtf.db.EventType}s by event name.
 * This is used by the JSON source to add events on-demand when they are
 * used without being defined.
 *
 * It's best not to always add these events, or not to use them if the
 * source defines their own, as it allows for forwards compatibility.
 *
 * This matches {@see wtf.trace.BuiltinEvents} (sort of).
 * This list does not need to be exhaustive - it's only here to enable trace
 * sources that want to omit defining built in events to function.
 *
 * @type {!Object.<!wtf.db.EventType>}
 * @private
 */
wtf.db.sources.JsonDataSource.BuiltinEvents_ = {
  'wtf.event#define': wtf.db.EventType.createInstance(
      'wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
          'ascii name, ascii args)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.trace.#discontinuity': wtf.db.EventType.createInstance(
      'wtf.trace.#discontinuity()',
      wtf.data.EventFlag.BUILTIN),

  'wtf.zone#create': wtf.db.EventType.createInstance(
      'wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.zone#delete': wtf.db.EventType.createInstance(
      'wtf.zone#delete(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.zone#set': wtf.db.EventType.createInstance(
      'wtf.zone#set(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.scope#enter': wtf.db.EventType.createScope(
      'wtf.scope#enter(ascii name)',
      wtf.data.EventFlag.BUILTIN),
  'wtf.scope#enterTracing': wtf.db.EventType.createScope(
      'wtf.scope#enterTracing()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL |
      wtf.data.EventFlag.SYSTEM_TIME),
  'wtf.scope#leave': wtf.db.EventType.createInstance(
      'wtf.scope#leave()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.flow#branch': wtf.db.EventType.createInstance(
      'wtf.flow#branch(flowId id, flowId parentId, ascii name, any value)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.flow#extend': wtf.db.EventType.createInstance(
      'wtf.flow#extend(flowId id, ascii name, any value)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.flow#terminate': wtf.db.EventType.createInstance(
      'wtf.flow#terminate(flowId id, any value)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  'wtf.trace#mark': wtf.db.EventType.createInstance(
      'wtf.trace#mark(ascii name, any value)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),
  'wtf.trace#timeStamp': wtf.db.EventType.createInstance(
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
wtf.db.sources.JsonDataSource.prototype.parseJson_ = function(source) {
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
wtf.db.sources.JsonDataSource.prototype.parseEvents_ = function(source) {
  var db = this.getDatabase();
  var eventTypeTable = db.getEventTypeTable();

  // Always define wtf.scope.#leave
  var builtinEvents = wtf.db.sources.JsonDataSource.BuiltinEvents_;
  eventTypeTable.defineType(builtinEvents['wtf.scope#leave']);

  /**
   * Map of event types by event ID.
   * @type {!Array.<wtf.db.EventType>}
   */
  var eventTable = [];

  // Define builtin events.
  eventTable[-1] = db.getEventType('wtf.scope#leave');

  var hasBegunBatch = false;
  for (var n = 0; n < source.length; n++) {
    var entry = source[n];
    if (entry['event']) {
      // Default header, if none was previously defined.
      if (!hasBegunBatch) {
        this.parseHeader_(null);
        db.beginInsertingEvents(this);
        hasBegunBatch = true;
      }

      // Read out event, lookup, and dispatch.
      var eventRef = entry['event'];
      var time = entry['time'];
      var argList = entry['args'] || null;
      var eventType = eventTable[eventRef] || db.getEventType(eventRef);
      if (!eventType) {
        // Try to look up a builtin.
        eventType = builtinEvents[eventRef];
        if (eventType) {
          eventTypeTable.defineType(eventType);
        } else {
          db.sourceError(
              this,
              'Undefined event type',
              'The file tried to reference an event it didn\'t define. ' +
              'Perhaps it\'s corrupted?');
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
            db.beginInsertingEvents(this);
            hasBegunBatch = true;
          }
          break;
        case 'wtf.event#define':
          var eventType = eventTypeTable.defineType(
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
    db.endInsertingEvents();
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
wtf.db.sources.JsonDataSource.prototype.parseHeader_ = function(entry) {
  var db = this.getDatabase();

  entry = entry || {};

  // Check supported version.
  var formatVersion = entry['format_version'] || 1;
  if (formatVersion != wtf.data.formats.JsonTrace.VERSION) {
    // TODO(benvanik): error on version mismatch
    db.sourceError(
        this,
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

  var timeDelay = db.computeTimeDelay(timebase);
  this.initialize(contextInfo, flags, 0, metadata, timebase, timeDelay);

  return true;
};


/**
 * Parses an {@see wtf.db.EventType} from an entry.
 * @param {!Object} entry JSON entry.
 * @return {!wtf.db.EventType} Event type.
 * @private
 */
wtf.db.sources.JsonDataSource.prototype.parseEventType_ = function(
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
  return new wtf.db.EventType(
      parsedSignature.name,
      eventClass,
      flags,
      parsedSignature.args);
};


/**
 * Dispatches an event.
 * The event is assumed to have passed any filtering.
 * @param {!wtf.db.EventType} eventType Event type.
 * @param {number} time Source-relative time.
 * @param {Array} argList Custom event data.
 * @private
 */
wtf.db.sources.JsonDataSource.prototype.dispatchEvent_ = function(
    eventType, time, argList) {
  time += this.getTimeDelay();

  // Infer state.
  var db = this.getDatabase();
  var zone = this.currentZone_;

  // Setup arguments, if present.
  var args = null;
  if (argList && argList.length && argList.length == eventType.args.length) {
    args = new wtf.db.ArgumentData();
    for (var n = 0; n < argList.length; n++) {
      var argInfo = eventType.args[n];
      args.set(argInfo.name, argList[n]);
    }
  }

  // Handle built-in events.
  var insertEvent = true;
  if (eventType.flags & wtf.data.EventFlag.BUILTIN &&
      eventType.eventClass != wtf.data.EventClass.SCOPE) {
    switch (eventType.name) {
      case 'wtf.zone#create':
        // Create the zone.
        var newZone = db.createOrGetZone(
            /** @type {string} */ (args.get('name')),
            /** @type {string} */ (args.get('type')),
            /** @type {string} */ (args.get('location')));
        this.zoneTable_[/** @type {number} */ (args.get('zoneId'))] = newZone;
        //it.setValue(args.get('zoneId'));
        break;
      case 'wtf.zone#delete':
        //it.setValue(args.get('zoneId'));
        break;
      case 'wtf.zone#set':
        this.currentZone_ =
            this.zoneTable_[/** @type {number} */ (args.get('zoneId'))] || null;
        insertEvent = false;
        break;

        // TODO(benvanik): flow events
    }
  }

  if (insertEvent) {
    var eventList = zone.getEventList();
    eventList.insert(eventType, (time * 1000) | 0, args);
  }
};
