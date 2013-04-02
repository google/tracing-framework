/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Binary instrumented call event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.sources.CallsDataSource');

goog.require('goog.asserts');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.data.formats.BinaryCalls');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.db.DataSource');
goog.require('wtf.db.EventType');
goog.require('wtf.db.PresentationHint');
goog.require('wtf.db.Unit');
goog.require('wtf.io');
goog.require('wtf.util');



/**
 * Single-source trace stream implenting the WTF call format.
 * This accepts streams formatted in a version of the WTF calls format.
 * For more information on the format see {@code docs/wtf-calls.md}.
 *
 * @param {!wtf.db.Database} db Target database.
 * @param {!wtf.io.ByteArray} data Input data.
 * @constructor
 * @extends {wtf.db.DataSource}
 */
wtf.db.sources.CallsDataSource = function(db, data) {
  goog.base(this, db);

  /**
   * Input data.
   * Cleared once parsed.
   * @type {!wtf.io.ByteArray}
   * @private
   */
  this.data_ = data;

  // TODO(benvanik): stash modules/function mappings/etc

  /**
   * The currently set zone, if any.
   * @type {!wtf.db.Zone}
   * @private
   */
  this.zone_ = db.getDefaultZone();
};
goog.inherits(wtf.db.sources.CallsDataSource, wtf.db.DataSource);


/**
 * @override
 */
wtf.db.sources.CallsDataSource.prototype.start = function() {
  var db = this.getDatabase();
  var eventTypeTable = db.getEventTypeTable();
  var inputBuffer = this.data_;

  // Ehh, only support typed arrays.
  goog.asserts.assert(wtf.io.HAS_TYPED_ARRAYS);
  goog.asserts.assert(inputBuffer instanceof Uint8Array);

  var i = 0;
  var headerLength = inputBuffer[i + 0] | (inputBuffer[i + 1] << 8) |
      (inputBuffer[i + 2] << 16) | (inputBuffer[i + 3] << 24);
  var headerJson = wtf.util.convertUint8ArrayToAsciiString(
      new Uint8Array(inputBuffer.buffer, 4, headerLength));
  i += 4 + headerLength;
  var header;
  try {
    header = goog.global.JSON.parse(headerJson);
  } catch (e) {
    db.sourceError(
        this,
        'File header invalid',
        'An error occurred trying to parse the file header.\n' + e);
    return;
  }

  // Read version information to ensure we support the format.
  if (header['version'] != wtf.data.formats.BinaryCalls.VERSION) {
    // Format version mismatch.
    db.sourceError(
        this,
        'File version not supported or too old',
        'Sorry, the parser for this file version is not available :(');
    return;
  }

  // Read context information.
  if (!header['context']) {
    // Bad context info or unknown context.
    db.sourceError(
        this,
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

  if (!this.initialize(
      contextInfo, flags, presentationHints, units, metadata,
      timebase, timeDelay)) {
    return false;
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
    var src = headerModule['src'];
    // TODO(benvanik): stash src/etc

    // Create all function types.
    var fns = headerModule['fns'];
    for (var n = 0; n < fns.length; n += 4) {
      var fnId = fns[n + 0];
      var fnName = fns[n + 1];
      var fnStart = fns[n + 2];
      var fnEnd = fns[n + 3];
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
  eventList.expandCapacity((inputBuffer.length - i) / bytesPerEntry);

  var t = 0;
  var callBuffer = new Int32Array(inputBuffer.buffer, i);
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
