/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Binary calls WTF trace event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.sources.CallsDataSource');

goog.require('wtf');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.data.formats.BinaryCalls');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.db.DataSource');
goog.require('wtf.db.EventType');
goog.require('wtf.db.PresentationHint');
goog.require('wtf.db.Unit');
goog.require('wtf.io.Blob');
goog.require('wtf.io.DataFormat');
goog.require('wtf.io.ReadTransport');
goog.require('wtf.util');



/**
 * Data source that consumes data from the instrumentation wtf-call format.
 *
 * @param {!wtf.db.Database} db Target database.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Data source info.
 * @param {!wtf.io.ReadTransport} transport Streaming read transport.
 *     Ownership is transferred to the trace source and the stream will be
 *     disposed at the same time.
 * @constructor
 * @extends {wtf.db.DataSource}
 */
wtf.db.sources.CallsDataSource = function(db, sourceInfo, transport) {
  goog.base(this, db, sourceInfo);

  /**
   * Read transport.
   * This instance owns the stream and will dispose it at the same time.
   * @type {!wtf.io.ReadTransport}
   * @private
   */
  this.transport_ = transport;
  this.registerDisposable(this.transport_);

  // TODO(benvanik): stash modules/function mappings/etc

  /**
   * The currently set zone, if any.
   * @type {!wtf.db.Zone}
   * @private
   */
  this.zone_ = db.getDefaultZone();

  /**
   * All received blob parts.
   * They'll be stitched up at the end.
   * @type {!Array.<!wtf.io.Blob>}
   * @private
   */
  this.blobParts_ = [];

  // We gather all the blobs and process at the end, because this format can't
  // handle incremental loading.
  this.transport_.setPreferredFormat(wtf.io.DataFormat.BLOB);

  this.transport_.addListener(
      wtf.io.ReadTransport.EventType.RECEIVE_DATA,
      this.dataReceived_, this);
  this.transport_.addListener(
      wtf.io.ReadTransport.EventType.ERROR,
      this.transportErrored_, this);
  this.transport_.addListener(
      wtf.io.ReadTransport.EventType.END,
      this.transportEnded_, this);
};
goog.inherits(wtf.db.sources.CallsDataSource, wtf.db.DataSource);


/**
 * @override
 */
wtf.db.sources.CallsDataSource.prototype.start = function() {
  var deferred = goog.base(this, 'start');

  // Start streaming data in.
  this.transport_.resume();
  return deferred;
};


/**
 * Handles stream data received events.
 * @param {!wtf.io.BlobData} data Blob data.
 * @private
 */
wtf.db.sources.CallsDataSource.prototype.dataReceived_ = function(data) {
  this.blobParts_.push(data);
};


/**
 * Handles stream error events.
 * @param {!Error} e Error.
 * @private
 */
wtf.db.sources.CallsDataSource.prototype.transportErrored_ = function(e) {
  this.error(
      'Error loading trace data',
      e.toString());
};


/**
 * Handles stream end events.
 * @private
 */
wtf.db.sources.CallsDataSource.prototype.transportEnded_ = function() {
  // Stitch together all the input parts.
  var blob = wtf.io.Blob.create(this.blobParts_);

  // Grab an ArrayBuffer that we can work with.
  blob.readAsArrayBuffer(this.process_, this);
};


/**
 * Processes a single large array buffer.
 * @param {ArrayBuffer} buffer Input array buffer.
 * @private
 */
wtf.db.sources.CallsDataSource.prototype.process_ = function(buffer) {
  if (!buffer) {
    // Failed!
    this.error(
        'Error reading data',
        'Array buffer could not be allocated.');
    return;
  }

  // Process everything.
  this.processData_(new Uint8Array(buffer));

  // Done!
  this.end();
};


/**
 * Parses the source JSON string into an object.
 * NOTE: this function is exported so that jscompiler won't stupidly inline it
 * and put the try/catch in the same function as the core loop. Yuck.
 * @param {string} json JSON string.
 * @return {Object} Header object, if parsed.
 * @private
 */
wtf.db.sources.CallsDataSource.prototype.parseHeaderJson_ = function(json) {
  try {
    return /** @type {Object} */ (goog.global.JSON.parse(json));
  } catch (e) {
    this.error(
        'File header invalid',
        'An error occurred trying to parse the file header.\n' + e);
    return null;
  }
};


wtf.preventInlining(wtf.db.sources.CallsDataSource.prototype.parseHeaderJson_);


/**
 * Processes the full buffer.
 * @param {!Uint8Array} buffer Data buffer.
 * @private
 */
wtf.db.sources.CallsDataSource.prototype.processData_ = function(buffer) {
  var db = this.getDatabase();
  var eventTypeTable = db.getEventTypeTable();

  var i = 0;
  var headerLength = buffer[i + 0] | (buffer[i + 1] << 8) |
      (buffer[i + 2] << 16) | (buffer[i + 3] << 24);
  var headerJson = wtf.util.convertUint8ArrayToAsciiString(
      new Uint8Array(buffer.buffer, 4, headerLength));
  i += 4 + headerLength;
  var header = this.parseHeaderJson_(headerJson);
  if (!header) {
    return;
  }

  // Read version information to ensure we support the format.
  if (header['version'] != wtf.data.formats.BinaryCalls.VERSION) {
    // Format version mismatch.
    this.error(
        'File version not supported or too old',
        'Sorry, the parser for this file version is not available :(');
    return;
  }

  // Read context information.
  if (!header['context']) {
    // Bad context info or unknown context.
    this.error(
        'Invalid context information');
    return;
  }
  var contextInfo = new wtf.data.ScriptContextInfo();
  contextInfo.parse(header['context']);

  // Read flags information.
  var flags = wtf.data.formats.FileFlags.TIMES_AS_COUNT;
  var timebase = 0;
  var timeDelay = db.computeTimeDelay(timebase);

  // Read metadata blob.
  var metadata = header['metadata'];
  if (!goog.isObject(metadata)) {
    metadata = {};
  }
  var attributes = metadata['attributes'] || [];

  // Infer units from attributes.
  var units = wtf.db.Unit.COUNT;
  if (attributes.length) {
    var unitsStr = attributes[0]['units'];
    units = wtf.db.Unit.parse(unitsStr);
  }

  // Assume we are always special. In the future the file can specify this.
  var presentationHints = 0;
  presentationHints |= wtf.db.PresentationHint.NO_RENDER_DATA;
  presentationHints |= wtf.db.PresentationHint.BARE;

  // Initialize the trace source.
  // Only call when all other parsing has been successful.
  if (!this.initialize(
      contextInfo,
      flags,
      presentationHints,
      units,
      metadata,
      timebase,
      timeDelay)) {
    this.error(
        'Unable to initialize data source',
        'File corrupt or invalid.');
    return;
  }

  // Setup some builtin event types.
  var leaveEventType = eventTypeTable.defineType(
      wtf.db.EventType.createInstance('wtf.scope#leave()',
          wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL));

  // Parse all module data.
  var eventTypes = {};
  var headerModules = header['modules'];
  for (var moduleId in headerModules) {
    var headerModule = headerModules[moduleId];

    // TODO(benvanik): stash src/etc
    // var src = headerModule['src'];

    // Create all function types.
    var fns = headerModule['fns'];
    for (var n = 0; n < fns.length; n += 4) {
      var fnId = fns[n + 0];
      var fnName = fns[n + 1];
      // var fnStart = fns[n + 2];
      // var fnEnd = fns[n + 3];

      // TODO(rsturgell): Add any additional non-time attributes to the
      // eventtype (and write them in the loop below).
      eventTypes[fnId] = eventTypeTable.defineType(
          wtf.db.EventType.createScope(fnName));

      // TODO(benvanik): stash range/etc
    }
  }

  // Pad i until the next 4b.
  if (i % 4) {
    i += 4 - (i % 4);
  }

  var intsPerEntry = 1 + attributes.length;
  var bytesPerEntry = 4 * intsPerEntry;

  // Reallocate the event list to prevent resizes during addition.
  var eventList = this.zone_.getEventList();
  eventList.expandCapacity((buffer.length - i) / bytesPerEntry);

  var t = 0;
  var callBuffer = new Int32Array(buffer.buffer, i);
  var prevSample = -1;
  var implicitTime = attributes.length == 0;

  // Insert event data.
  db.beginInsertingEvents(this);
  for (var n = 0; n < callBuffer.length; n += intsPerEntry) {
    var id = callBuffer[n];
    if (!implicitTime) {
      var sample = callBuffer[n + 1];
      var delta = (prevSample >= 0) ? (sample - prevSample) : 0;
      if (delta > 0) t += delta;
      prevSample = sample;
    }
    if (id > 0) {
      eventList.insert(eventTypes[id], t);
      if (implicitTime) {
        t++;
      }
    } else {
      eventList.insert(leaveEventType, t);
    }
  }
  db.endInsertingEvents();
};
