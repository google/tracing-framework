/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview JSON stream source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.JsonStreamSource');

goog.require('goog.asserts');
goog.require('wtf.data.formats.ChunkedFileFormat');
goog.require('wtf.io.DataFormat');
goog.require('wtf.io.ReadTransport');
goog.require('wtf.io.cff.ChunkType');
goog.require('wtf.io.cff.PartType');
goog.require('wtf.io.cff.StreamSource');
goog.require('wtf.version');



/**
 * JSON stream source.
 * @param {!wtf.io.ReadTransport} transport Read transport.
 * @constructor
 * @extends {wtf.io.cff.StreamSource}
 */
wtf.io.cff.JsonStreamSource = function(transport) {
  goog.base(this, transport);

  /**
   * Whether a header has been read.
   * @type {boolean}
   * @private
   */
  this.hasReadHeader_ = false;

  // We want strings.
  transport.setPreferredFormat(wtf.io.DataFormat.STRING);

  // We end when the transport ends (no async work).
  transport.addListener(
      wtf.io.ReadTransport.EventType.END,
      this.emitEndEvent, this);
};
goog.inherits(wtf.io.cff.JsonStreamSource, wtf.io.cff.StreamSource);


/**
 * @override
 */
wtf.io.cff.JsonStreamSource.prototype.dataReceived = function(data) {
  goog.asserts.assert(typeof data == 'string');

  var parsedData;
  try {
    parsedData = goog.global.JSON.parse(data);
  } catch (parseError) {
    var e = new Error('Unable to parse JSON stream data: ' + parseError);
    e['innerException'] = parseError;
    throw e;
  }
  if (!parsedData || typeof parsedData != 'object') {
    throw new Error('Expected object at the root of the JSON object.');
  }
  parsedData = /** @type {!Object} */ (parsedData);

  // Check to see if this is a header block.
  if (parsedData['wtfVersion']) {
    if (this.hasReadHeader_) {
      // We've already seen a header and were expecting partial data.
      throw new Error('Received multiple headers when expecting partial data.');
    }

    // Parse header.
    this.parseHeader_(parsedData);
  }

  // Parse any chunks present in the object.
  var chunks = parsedData['chunks'];
  if (chunks && goog.isArray(chunks) && chunks.length) {
    for (var n = 0; n < chunks.length; n++) {
      var chunkData = chunks[n];
      if (!chunkData || typeof chunkData != 'object') {
        throw new Error('Expected chunk to be an object.');
      }
      this.parseChunk_(chunkData);
    }
  }
};


/**
 * Parses header data from a blob.
 * Throws errors on failure.
 * @param {!Object} parsedData Parsed data object.
 * @private
 */
wtf.io.cff.JsonStreamSource.prototype.parseHeader_ = function(parsedData) {
  var wtfVersion = parsedData['wtfVersion'];
  var formatVersion = parsedData['formatVersion'];

  if (wtfVersion > wtf.version.getValue()) {
    // Data is from a newer version. Unsupported.
    throw new Error('Data is from a newer version of WTF. Unable to parse.');
  }
  if (formatVersion != wtf.data.formats.ChunkedFileFormat.VERSION) {
    // Don't support any other versions right now.
    throw new Error('Data version ' + formatVersion + ' not supported.');
  }

  this.hasReadHeader_ = true;
};


/**
 * Parses chunk data from a blob.
 * Throws errors on failure.
 * @param {!Object} parsedData Parsed chunk object.
 * @private
 */
wtf.io.cff.JsonStreamSource.prototype.parseChunk_ = function(parsedData) {
  var chunkId = Number(parsedData['id']);
  var chunkType = parsedData['type'];
  var startTime = parsedData['startTime'];
  var endTime = parsedData['endTime'];
  var parts = parsedData['parts'];

  if (!goog.isDef(chunkId)) {
    throw new Error('Chunk missing required "id" field.');
  }
  if (!chunkType) {
    throw new Error('Chunk missing required "type" field.');
  }
  if (!parts) {
    throw new Error('Chunk missing required "parts" field.');
  }

  // Skip unknown chunk types.
  if (!wtf.io.cff.ChunkType.isValid(chunkType)) {
    if (goog.global.console) {
      goog.global.console.log('WARNING: chunk type ' + chunkType + ' ignored.');
    }
    return;
  }

  // Create chunk.
  var chunk = this.createChunkType(chunkId, chunkType);
  goog.asserts.assert(chunk);
  if (!chunk) {
    throw new Error('Chunk type unrecognized: ' + chunkType);
  }

  // Timing, if available.
  if (goog.isDef(startTime) && goog.isDef(endTime)) {
    chunk.setTimeRange(startTime, endTime);
  }

  // Create parts.
  var recognizedParts = [];
  for (var n = 0; n < parts.length; n++) {
    var partData = parts[n];
    if (!partData || typeof partData != 'object') {
      throw new Error('Expected part to be an object.');
    }
    var part = this.parsePart_(partData);
    if (part) {
      recognizedParts.push(part);
    }
  }

  // Load chunk.
  chunk.load(recognizedParts);

  // Emit.
  this.emitChunkReceivedEvent(chunk);
};


/**
 * Parses part data from a blob.
 * Throws errors on failure.
 * @param {!Object} parsedData Parsed part object.
 * @return {wtf.io.cff.Part} Part data or null if unrecognized.
 * @private
 */
wtf.io.cff.JsonStreamSource.prototype.parsePart_ = function(parsedData) {
  var partType = parsedData['type'];

  if (!partType) {
    throw new Error('Part missing required "type" field.');
  }

  // Skip unknown chunk types.
  if (!wtf.io.cff.PartType.isValid(partType)) {
    if (goog.global.console) {
      goog.global.console.log('WARNING: part type ' + partType + ' ignored.');
    }
    return null;
  }

  // Create part.
  var part = this.createPartType(partType);
  goog.asserts.assert(part);
  if (!part) {
    throw new Error('Part type unrecognized: ' + partType);
  }

  // Load part.
  part.initFromJsonObject(parsedData);

  return part;
};
