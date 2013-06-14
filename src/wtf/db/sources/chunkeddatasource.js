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

goog.provide('wtf.db.sources.ChunkedDataSource');

goog.require('goog.asserts');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.Variable');
goog.require('wtf.db.ArgumentData');
goog.require('wtf.db.DataSource');
goog.require('wtf.db.EventType');
goog.require('wtf.db.TimeRange');
goog.require('wtf.db.Unit');
goog.require('wtf.io.cff.ChunkType');
goog.require('wtf.io.cff.PartType');
goog.require('wtf.io.cff.StreamSource');
goog.require('wtf.io.cff.parts.BinaryEventBufferPart');
goog.require('wtf.io.cff.parts.JsonEventBufferPart');



/**
 * Data source that uses the Chunked File Format (CFF) stream source to accept
 * event data from the CFF type.
 *
 * @param {!wtf.db.Database} db Target database.
 * @param {!wtf.io.cff.StreamSource} streamSource Stream source.
 *     Ownership is transferred to the trace source and the stream will be
 *     disposed at the same time.
 * @constructor
 * @extends {wtf.db.DataSource}
 */
wtf.db.sources.ChunkedDataSource = function(db, streamSource) {
  goog.base(this, db);

  /**
   * Chunked file format stream source.
   * This instance owns the stream and will dispose it at the same time.
   * @type {!wtf.io.cff.StreamSource}
   * @private
   */
  this.streamSource_ = streamSource;
  this.registerDisposable(this.streamSource_);

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
  this.binaryDispatch_ = {};
  this.setupBinaryDispatchTable_();

  this.streamSource_.addListener(
      wtf.io.cff.StreamSource.EventType.CHUNK_RECEIVED,
      this.chunkReceived_, this);
  this.streamSource_.addListener(
      wtf.io.cff.StreamSource.EventType.ERROR,
      this.streamErrored_, this);
  this.streamSource_.addListener(
      wtf.io.cff.StreamSource.EventType.END,
      this.streamEnded_, this);
};
goog.inherits(wtf.db.sources.ChunkedDataSource, wtf.db.DataSource);


/**
 * @override
 */
wtf.db.sources.ChunkedDataSource.prototype.start = function() {
  var deferred = goog.base(this, 'start');

  // Lock the DB for insertion.
  var db = this.getDatabase();
  db.beginInsertingEvents(this);

  // Start streaming data in.
  this.streamSource_.resume();
  return deferred;
};


/**
 * Handles stream error events.
 * @param {!Error} e Error.
 * @private
 */
wtf.db.sources.ChunkedDataSource.prototype.streamErrored_ = function(e) {
  var db = this.getDatabase();
  this.error(
      'Error loading trace data',
      e.toString());
};


/**
 * Handles stream end events.
 * @private
 */
wtf.db.sources.ChunkedDataSource.prototype.streamEnded_ = function() {
  var db = this.getDatabase();
  db.endInsertingEvents();

  this.end();
};


/**
 * Handles stream chunk received events.
 * @param {!wtf.io.cff.Chunk} chunk Chunk.
 * @private
 */
wtf.db.sources.ChunkedDataSource.prototype.chunkReceived_ = function(chunk) {
  var db = this.getDatabase();
  switch (chunk.getType()) {
    case wtf.io.cff.ChunkType.FILE_HEADER:
      this.processFileHeaderChunk_(
          /** @type {!wtf.io.cff.chunks.FileHeaderChunk} */ (chunk));
      break;
    case wtf.io.cff.ChunkType.EVENT_DATA:
      var eventDataChunk =
          /** @type {!wtf.io.cff.chunks.EventDataChunk} */ (chunk);
      var part = eventDataChunk.getEventData();
      goog.asserts.assert(part);
      switch (part.getType()) {
        case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
          this.processJsonEventDataChunk_(eventDataChunk);
          break;
        case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
          this.processBinaryEventDataChunk_(eventDataChunk);
          break;
        default:
          this.error(
              'Unrecognized event data buffer',
              'An event data part not recognized and could not be parsed.');
          return;
      }
      break;
  }
};


/**
 * Processes incoming file header chunks.
 * @param {!wtf.io.cff.chunks.FileHeaderChunk} chunk Chunk.
 * @private
 */
wtf.db.sources.ChunkedDataSource.prototype.processFileHeaderChunk_ =
    function(chunk) {
  var fileHeaderPart = chunk.getFileHeader();

  // Compute time delay.
  var db = this.getDatabase();
  var timeDelay = db.computeTimeDelay(fileHeaderPart.getTimebase());

  // Initialize the trace source.
  // Only call when all other parsing has been successful.
  if (!this.initialize(
      fileHeaderPart.getContextInfo(),
      fileHeaderPart.getFlags(),
      0,
      wtf.db.Unit.TIME_MILLISECONDS,
      fileHeaderPart.getMetadata(),
      fileHeaderPart.getTimebase(),
      timeDelay)) {
    this.error(
        'Unable to initialize data source',
        'File corrupt or invalid.');
    return;
  }
};


/**
 * Processes incoming event data chunks in JSON format.
 * @param {!wtf.io.cff.chunks.EventDataChunk} chunk Chunk.
 * @private
 */
wtf.db.sources.ChunkedDataSource.prototype.processJsonEventDataChunk_ =
    function(chunk) {
  var db = this.getDatabase();

  // TODO(benvanik): get resources.

  // Grab the event data buffer.
  var part = chunk.getEventData();
  goog.asserts.assert(part instanceof wtf.io.cff.parts.JsonEventBufferPart);
  var buffer = part.getValue();
  goog.asserts.assert(buffer);

  for (var n = 0; n < buffer.length; n++) {
    var entry = buffer[n];
    // TODO(benvanik): reimplement JSON event parsing.
  }
};


/**
 * Sets up an event dispatch table for the builtin event types in binary
 * events.
 * @private
 */
wtf.db.sources.ChunkedDataSource.prototype.setupBinaryDispatchTable_ =
    function() {
  var db = this.getDatabase();
  var eventTypeTable = db.getEventTypeTable();

  // Add builtin events.
  eventTypeTable.defineType(wtf.db.EventType.createInstance(
      'wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
      'ascii name, ascii args)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL));
  this.eventWireTable_[1] = eventTypeTable.getByName('wtf.event#define');

  this.binaryDispatch_['wtf.event#define'] = function(eventType, args) {
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

  this.binaryDispatch_['wtf.zone#create'] = function(eventType, args) {
    var newZone = db.createOrGetZone(
        args.get('name'), args.get('type'), args.get('location'));
    this.zoneTable_[args.get('zoneId')] = newZone;
    return false;
  };
  this.binaryDispatch_['wtf.zone#delete'] = function(eventType, args) {
    //var deadZone = this.zoneTable_[args.get('zoneId')] || null;
    return false;
  };
  this.binaryDispatch_['wtf.zone#set'] = function(eventType, args) {
    this.currentZone_ = this.zoneTable_[args.get('zoneId')] || null;
    return false;
  };

  this.binaryDispatch_['wtf.timeRange#begin'] =
      this.binaryDispatch_['wtf.timeRange#end'] = function(eventType, args) {
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


/**
 * Processes incoming event data chunks in binary format.
 * @param {!wtf.io.cff.chunks.EventDataChunk} chunk Chunk.
 * @private
 */
wtf.db.sources.ChunkedDataSource.prototype.processBinaryEventDataChunk_ =
    function(chunk) {
  var db = this.getDatabase();

  // TODO(benvanik): get resources.

  // Grab the event data buffer.
  var part = chunk.getEventData();
  goog.asserts.assert(part instanceof wtf.io.cff.parts.BinaryEventBufferPart);
  var buffer = part.getValue();
  goog.asserts.assert(buffer);
  buffer.offset = 0;

  // Read all events from the buffer.
  var successful = true;
  var data = buffer.data;
  var eventWireTable = this.eventWireTable_;
  while (buffer.offset < buffer.capacity) {
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
      this.error(
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
      var dispatchFn = this.binaryDispatch_[eventType.name];
      if (dispatchFn) {
        insertEvent = dispatchFn.call(this, eventType, args);
      }
    }

    if (insertEvent) {
      var eventList = this.currentZone_.getEventList();
      eventList.insert(
          eventType,
          Math.max(0, time + this.getTimeDelay()),
          args);
    }
  }
};
