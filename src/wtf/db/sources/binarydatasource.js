/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Binary WTF trace event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.sources.BinaryDataSource');

goog.require('goog.math.Long');
goog.require('wtf.data.ContextInfo');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.Variable');
goog.require('wtf.data.formats.BinaryTrace');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.db.ArgumentData');
goog.require('wtf.db.DataSource');
goog.require('wtf.db.EventType');
goog.require('wtf.db.TimeRange');
goog.require('wtf.db.Unit');
goog.require('wtf.io.EventType');



/**
 * Single-source trace stream implenting the WTF binary format.
 * This accepts streams formatted in a version of the WTF binary format.
 * For more information on the format see {@code docs/wtf-trace.md}.
 *
 * @param {!wtf.db.Database} db Target database.
 * @param {!wtf.io.ReadStream} readStream Read stream. Ownership is transferred
 *     to the trace source and the stream will be disposed at the same time.
 * @constructor
 * @extends {wtf.db.DataSource}
 */
wtf.db.sources.BinaryDataSource = function(db, readStream) {
  goog.base(this, db);

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
   * Optimized lookup table for {@see wtf.db.EventType}s.
   * Keys are event wire ID.
   * @type {!Array.<wtf.db.EventType|undefined>}
   * @private
   */
  this.eventWireTable_ = [];

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

  /**
   * A map of wire time range IDs to client time range IDs.
   * This lets us translate IDs from multiple sources into a single namespace
   * and not let the rest of the stack know about it.
   * @type {!Object.<number, number>}
   * @private
   */
  this.timeRangeRenames_ = {};

  /**
   * A fast dispatch table for BUILTIN events, keyed on event name.
   * Each function handles an event of the given type.
   * @type {!Object.<function(!wtf.db.EventType, wtf.db.ArgumentData):boolean>}
   * @private
   */
  this.builtinDispatch_ = {};
  this.setupDispatchTable_();

  // Start listening for read stream events.
  this.readStream_.addListener(
      wtf.io.EventType.READ, this.processBuffer_, this);
};
goog.inherits(wtf.db.sources.BinaryDataSource, wtf.db.DataSource);


/**
 * @override
 */
wtf.db.sources.BinaryDataSource.prototype.start = function() {
  this.readStream_.listen();
};


/**
 * Processes an incoming buffer.
 * @param {!wtf.io.Buffer} buffer Buffer.
 * @param {number} length Length of data in the buffer.
 * @return {boolean} True if the processing was successful.
 * @private
 */
wtf.db.sources.BinaryDataSource.prototype.processBuffer_ =
    function(buffer, length) {
  var db = this.getDatabase();

  // Read trace header, if required.
  // We assume it is always at the head of the first buffer received.
  if (!this.hasReadTraceHeader_) {
    if (!this.readTraceHeader_(buffer)) {
      return false;
    }
    // TODO(benvanik): fire a 'source added' event on the database here?
    this.hasReadTraceHeader_ = true;
  }
  db.beginInsertingEvents(this);

  // Read all events from the buffer.
  var successful = true;
  var data = buffer.data;
  var eventWireTable = this.eventWireTable_;
  while (buffer.offset < length) {
    // Read common event header.
    var offset = buffer.offset;
    var eventWireId = (data[offset++] << 8) | data[offset++];
    var time =
        (((data[offset++] << 24) >>> 0) |
        (data[offset++] << 16) |
        (data[offset++] << 8) |
        data[offset++]) >>> 0;
    buffer.offset = offset;

    // Lookup event.
    var eventType = eventWireTable[eventWireId];
    if (!eventType) {
      successful = false;
      db.sourceError(
          this,
          'Undefined event type',
          'The file tried to reference an event it didn\'t define. Perhaps ' +
          'it\'s corrupted?');
      break;
    }

    // Parse argument data, if it exists.
    var args = null;
    if (eventType.parseBinaryArguments) {
      args = new wtf.db.ArgumentData(eventType.parseBinaryArguments(buffer));
    }

    // Handle built-in events.
    // TODO(benvanik): something much more efficient for builtins.
    // Should be simple: snoop event defines to setup a wire ID-based dispatch
    // table instead of an event name one. The array lookup should be much
    // better than the string variant.
    var insertEvent = true;
    if (eventType.flags & wtf.data.EventFlag.BUILTIN) {
      var dispatchFn = this.builtinDispatch_[eventType.name];
      if (dispatchFn) {
        insertEvent = dispatchFn.call(this, eventType, args);
      }
    }

    if (insertEvent) {
      var eventList = this.currentZone_.getEventList();
      eventList.insert(eventType, time + this.getTimeDelay(), args);
    }
  }

  db.endInsertingEvents();

  return successful;
};


/**
 * Reads a trace header from a buffer.
 * @param {!wtf.io.Buffer} buffer Source buffer.
 * @return {boolean} True if the read succeeded.
 * @private
 */
wtf.db.sources.BinaryDataSource.prototype.readTraceHeader_ =
    function(buffer) {
  var db = this.getDatabase();
  var eventTypeTable = db.getEventTypeTable();

  // Read magic number and verify it's a header.
  var magicNumber = buffer.readUint32();
  if (magicNumber != 0xDEADBEEF) {
    // Magic number mismatch.
    db.sourceError(
        this,
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
    db.sourceError(
        this,
        'File version not supported or too old',
        'Sorry, the parser for this file version is not available :(');
    return false;
  }

  // Read context information.
  var contextInfo = wtf.data.ContextInfo.parse(buffer);
  if (!contextInfo) {
    // Bad context info or unknown context.
    db.sourceError(
        this,
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
  var timeDelay = db.computeTimeDelay(timebase);

  // Read metadata blob.
  var metadataString = buffer.readUtf8String();
  var metadata = metadataString ? goog.global.JSON.parse(metadataString) : {};
  if (!goog.isObject(metadata)) {
    metadata = {};
  }

  // Initialize the trace source.
  // Only call when all other parsing has been successful.
  if (!this.initialize(
      contextInfo, flags, 0, wtf.db.Unit.TIME_MILLISECONDS, metadata,
      timebase, timeDelay)) {
    return false;
  }

  // Add builtin events for this version.
  switch (formatVersion) {
    case 3:
    default:
      eventTypeTable.defineType(wtf.db.EventType.createInstance(
          'wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
          'ascii name, ascii args)',
          wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL));
      break;
  }
  this.eventWireTable_[1] = eventTypeTable.getByName('wtf.event#define');

  return true;
};


/**
 * Sets up an event dispatch table for the builtin event types.
 * @private
 */
wtf.db.sources.BinaryDataSource.prototype.setupDispatchTable_ = function() {
  var db = this.getDatabase();
  var eventTypeTable = db.getEventTypeTable();

  this.builtinDispatch_['wtf.event#define'] = function(eventType, args) {
    var argString = args.get('args');
    var argMap = argString ?
        wtf.data.Variable.parseSignatureArguments(argString) : [];
    var argList = [];
    for (var n = 0; n < argMap.length; n++) {
      argList.push(argMap[n].variable);
    }
    var newEventType = eventTypeTable.defineType(new wtf.db.EventType(
        args.get('name'),
        args.get('eventClass'),
        args.get('flags'),
        argList));
    this.eventWireTable_[args.get('wireId')] = newEventType;
    return false;
  };

  this.builtinDispatch_['wtf.zone#create'] = function(eventType, args) {
    var newZone = db.createOrGetZone(
        args.get('name'), args.get('type'), args.get('location'));
    this.zoneTable_[args.get('zoneId')] = newZone;
    return false;
  };
  this.builtinDispatch_['wtf.zone#delete'] = function(eventType, args) {
    //var deadZone = this.zoneTable_[args.get('zoneId')] || null;
    return false;
  };
  this.builtinDispatch_['wtf.zone#set'] = function(eventType, args) {
    this.currentZone_ = this.zoneTable_[args.get('zoneId')] || null;
    return false;
  };

  this.builtinDispatch_['wtf.timeRange#begin'] =
      this.builtinDispatch_['wtf.timeRange#end'] = function(eventType, args) {
    var wireRangeId = args.get('id');
    var clientId = this.timeRangeRenames_[wireRangeId];
    if (clientId === undefined) {
      // Needs a new ID.
      clientId = wtf.db.TimeRange.allocateId();
      this.timeRangeRenames_[wireRangeId] = clientId;
    }
    args.set('id', clientId);
    return true;
  };

  // TODO(benvanik): rename flows like time ranges
};
