/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Binary stream source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.BinaryStreamSource');

goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.math.Long');
goog.require('wtf.data.ContextInfo');
goog.require('wtf.data.formats.BinaryTrace');
goog.require('wtf.data.formats.ChunkedFileFormat');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.io');
goog.require('wtf.io.Buffer');
goog.require('wtf.io.DataFormat');
goog.require('wtf.io.cff.ChunkType');
goog.require('wtf.io.cff.PartType');
goog.require('wtf.io.cff.StreamSource');
goog.require('wtf.io.cff.chunks.EventDataChunk');
goog.require('wtf.io.cff.chunks.FileHeaderChunk');
goog.require('wtf.io.cff.parts.BinaryEventBufferPart');
goog.require('wtf.io.cff.parts.FileHeaderPart');
goog.require('wtf.version');



/**
 * Binary stream source.
 * Reads chunks from a transport in the format that
 * {@see wtf.io.cff.BinaryStreamTarget} generates.
 *
 * @param {!wtf.io.ReadTransport} transport Read transport.
 * @constructor
 * @extends {wtf.io.cff.StreamSource}
 */
wtf.io.cff.BinaryStreamSource = function(transport) {
  goog.base(this, transport);

  /**
   * Whether the magic file header has been read.
   * @type {boolean}
   * @private
   */
  this.hasReadHeader_ = false;

  /**
   * Set to true when parsing a legacy file.
   * @type {boolean}
   * @private
   */
  this.legacyFormat_ = false;

  /**
   * All data received when in legacy parsing mode.
   * This is used to reconstruct one large buffer to be processed.
   * @type {!Array.<!wtf.io.ByteArray>}
   * @private
   */
  this.legacyDatas_ = [];

  /**
   * Chunks that have waiting parts.
   * These chunks (and any chunks after them) must complete before they are
   * allowed to be emitted.
   * @type {!Array.<!wtf.io.cff.BinaryStreamSource.PendingChunk_>}
   * @private
   */
  this.pendingChunks_ = [];

  /**
   * Whether the transport has ended and the source is done.
   * We wait to emit the event until all async operations have completed.
   * @type {boolean}
   * @private
   */
  this.pendingEnd_ = false;

  // We want ArrayBuffers.
  transport.setPreferredFormat(wtf.io.DataFormat.ARRAY_BUFFER);
};
goog.inherits(wtf.io.cff.BinaryStreamSource, wtf.io.cff.StreamSource);


/**
 * A pending chunk in the list.
 * This may have a deferred set, in which case that deferred must callback
 * before the chunk can be loaded. Otherwise the chunk is already loaded and
 * just waiting in the queue.
 * @typedef {{
 *   chunk: !wtf.io.cff.Chunk,
 *   parts: !Array.<!wtf.io.cff.Part>,
 *   deferred: goog.async.Deferred
 * }}
 * @private
 */
wtf.io.cff.BinaryStreamSource.PendingChunk_;


/**
 * @override
 */
wtf.io.cff.BinaryStreamSource.prototype.dataReceived = function(data) {
  /** @type {!ArrayBuffer} */
  var arrayBuffer;
  if (data instanceof ArrayBuffer) {
    arrayBuffer = data;
  } else {
    goog.asserts.assert(data && data.buffer instanceof ArrayBuffer);
    arrayBuffer = /** @type {!ArrayBuffer} */ (data.buffer);
  }

  // We must start with the magic header bytes.
  var o = 0;
  if (!this.hasReadHeader_) {
    o = this.parseHeader_(arrayBuffer);
  }

  if (!this.legacyFormat_) {
    // Parse chunks in the modern format.
    while (o < arrayBuffer.byteLength) {
      o = this.parseChunk_(arrayBuffer, o);
    }
  } else {
    // Store data for processing when the stream has completed.
    this.legacyDatas_.push(new Uint8Array(arrayBuffer, o));
  }
};


/**
 * @override
 */
wtf.io.cff.BinaryStreamSource.prototype.ended = function() {
  // In legacy mode we are now ready to stitch together all data.
  if (this.legacyFormat_) {
    // All of data is expected to arrive at a time, as we have no framing.
    // Because of this we need to keep all the data we receive in a pending
    // list to process at the very end.
    var combinedData = wtf.io.combineByteArrays(this.legacyDatas_);
    this.legacyDatas_ = [];
    this.parseLegacyChunk_(combinedData);
  }

  // Complete any pending chunk dispatches.
  this.pendingEnd_ = true;
  this.pumpPendingChunks_();
};


/**
 * Parses header data from a blob.
 * Throws errors on failure.
 * @param {!ArrayBuffer} data Binary buffer.
 * @return {number} New data offset after the header.
 * @private
 */
wtf.io.cff.BinaryStreamSource.prototype.parseHeader_ = function(data) {
  var HEADER_LENGTH = 3 * 4;
  if (data.byteLength < HEADER_LENGTH) {
    throw new Error('Invalid file magic header/header too small.');
  }

  var header = new wtf.io.Buffer(
      data.byteLength, undefined, new Uint8Array(data));
  var magicValue = header.readUint32();
  if (magicValue != 0xDEADBEEF) {
    throw new Error('File magic bytes mismatch.');
  }

  var wtfVersion = header.readUint32();
  if (wtfVersion > wtf.version.getValue()) {
    // Data is from a newer version. Unsupported.
    throw new Error('Data is from a newer version of WTF. Unable to parse.');
  }

  // We support the old format and the new chunked file format.
  var fileVersion = header.readUint32();
  if (fileVersion == wtf.data.formats.BinaryTrace.VERSION) {
    // Legacy file format.
    this.legacyFormat_ = true;
  } else if (fileVersion != wtf.data.formats.ChunkedFileFormat.VERSION) {
    // Don't support any other versions right now.
    throw new Error('Data version ' + fileVersion + ' not supported.');
  }
  this.hasReadHeader_ = true;

  // If needed, parse the legacy header chunk.
  if (this.legacyFormat_) {
    return this.parseLegacyHeader_(data, HEADER_LENGTH);
  } else {
    return HEADER_LENGTH;
  }
};


/**
 * Parses legacy header data from a blob.
 * Throws eerors on failure.
 * @param {!ArrayBuffer} data Binary buffer.
 * @param {number} o Offset in the buffer.
 * @return {number} New data offset after the header.
 * @private
 */
wtf.io.cff.BinaryStreamSource.prototype.parseLegacyHeader_ = function(data, o) {
  // Switches us into a mode where we have to handle legacy features.
  this.legacyFormat_ = true;

  // Wrap in a buffer.
  var buffer = new wtf.io.Buffer(
      data.byteLength, undefined, new Uint8Array(data));
  buffer.offset = o;

  // Read context information.
  var contextInfo = wtf.data.ContextInfo.parse(buffer);
  if (!contextInfo) {
    // Bad context info or unknown context.
    throw new Error('Invalid context information.');
  }

  // Read flags information.
  var flags = buffer.readUint32();
  var hasHighResolutionTimes =
      !!(flags & wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES);
  var longTimebase = goog.math.Long.fromBits(
      buffer.readUint32(), buffer.readUint32());
  var timebase = longTimebase.toNumber();

  // Read metadata blob.
  var metadataString = buffer.readUtf8String();
  var metadata = metadataString ? goog.global.JSON.parse(metadataString) : {};
  if (!goog.isObject(metadata)) {
    metadata = {};
  }

  // Create the header part with our data.
  var part = new wtf.io.cff.parts.FileHeaderPart();
  part.setFlags(flags);
  part.setTimebase(timebase);
  part.setContextInfo(contextInfo);
  part.setMetadata(metadata);

  // Queue the chunk and process.
  var chunk = new wtf.io.cff.chunks.FileHeaderChunk(0);
  this.pendingChunks_.push({
    chunk: chunk,
    parts: [part],
    deferred: null
  });
  this.pumpPendingChunks_();

  return buffer.offset;
};


/**
 * Parses legacy chunk data from a blob.
 * Throws errors on failure.
 * @param {!wtf.io.ByteArray} data Binary buffer.
 * @private
 */
wtf.io.cff.BinaryStreamSource.prototype.parseLegacyChunk_ = function(data) {
  // Create the buffer containing all the data.
  var buffer = new wtf.io.Buffer(data.byteLength, undefined, data);
  var part = new wtf.io.cff.parts.BinaryEventBufferPart(buffer);

  // Queue the chunk and process.
  var chunk = new wtf.io.cff.chunks.EventDataChunk(1);
  this.pendingChunks_.push({
    chunk: chunk,
    parts: [part],
    deferred: null
  });
  this.pumpPendingChunks_();
};


/**
 * Parses chunk data from a blob.
 * Throws errors on failure.
 * @param {!ArrayBuffer} data Binary buffer.
 * @param {number} o Offset in the buffer.
 * @return {number} New data offset after the chunk.
 * @private
 */
wtf.io.cff.BinaryStreamSource.prototype.parseChunk_ = function(data, o) {
  if (data.byteLength - o < 6 * 4) {
    throw new Error('Chunk header too small.');
  }

  var header = new wtf.io.Buffer(
      data.byteLength, undefined, new Uint8Array(data));
  header.offset = o;
  var chunkId = header.readUint32();
  var chunkType = wtf.io.cff.ChunkType.fromInteger(header.readUint32());
  var chunkLength = header.readUint32();
  var startTime = header.readUint32();
  var endTime = header.readUint32();
  var partCount = header.readUint32();

  var headerByteLength = (6 + partCount * 3) * 4;
  if (chunkLength < 6 + partCount * 3) {
    throw new Error('Chunk header missing part lengths.');
  }

  // TODO(benvanik): support partial loads/etc.
  if ((data.byteLength - o) < chunkLength) {
    throw new Error('Data does not contain the entire chunk.');
  }

  // Skip unknown chunk types.
  if (chunkType == wtf.io.cff.ChunkType.UNKNOWN) {
    if (goog.global.console) {
      goog.global.console.log('WARNING: chunk type ' + chunkType + ' ignored.');
    }
    return o + chunkLength;
  }

  // Create chunk.
  var chunk = this.createChunkType(chunkId, chunkType);
  goog.asserts.assert(chunk);
  if (!chunk) {
    throw new Error('Chunk type unrecognized: ' + chunkType);
  }

  // Timing, if available.
  chunk.setTimeRange(startTime, endTime);

  // Create parts.
  var waiters = [];
  var recognizedParts = [];
  for (var n = 0; n < partCount; n++) {
    var partType = header.readUint32();
    var partOffset = header.readUint32();
    var partLength = header.readUint32();
    var partData = new Uint8Array(
        data, o + headerByteLength + partOffset, partLength);
    var part = this.parsePart_(partType, partData, waiters);
    if (part) {
      recognizedParts.push(part);
    }
  }

  // Handle async cases.
  // We always run through the pending chunks list just to make the code
  // cleaner.
  var deferred = null;
  if (waiters.length) {
    // We have some waiters, so setup the processing.
    // We need to ensure ordering so that other chunks don't get dispatched
    // before us.
    deferred = new goog.async.DeferredList(waiters);
    deferred.addCallback(this.pumpPendingChunks_, this);
  }

  this.pendingChunks_.push({
    chunk: chunk,
    parts: recognizedParts,
    deferred: deferred
  });

  this.pumpPendingChunks_();

  return o + chunkLength;
};


/**
 * Parses part data from a blob.
 * Throws errors on failure.
 * @param {number} partType Part type integer.
 * @param {!Uint8Array} data Part binary data.
 * @param {!Array.<!goog.async.Deferred>} waiters A list of deferreds to add any
 *     new waiters to that may be required by this part.
 * @return {wtf.io.cff.Part} Part data or null if unrecognized.
 * @private
 */
wtf.io.cff.BinaryStreamSource.prototype.parsePart_ = function(
    partType, data, waiters) {
  // Skip unknown chunk types.
  var partTypeEnum = wtf.io.cff.PartType.fromInteger(partType);
  if (!wtf.io.cff.PartType.isValid(partTypeEnum)) {
    if (goog.global.console) {
      goog.global.console.log('WARNING: part type ' + partType + ' ignored.');
    }
    return null;
  }

  // Create part.
  var part = this.createPartType(partTypeEnum);
  goog.asserts.assert(part);
  if (!part) {
    throw new Error('Part type unrecognized: ' + partTypeEnum);
  }

  // Load part.
  var deferred = part.initFromBlobData(data);
  if (deferred) {
    waiters.push(deferred);
  }

  return part;
};


/**
 * Pumps the pending chunk list, moving it ahead until the next blocker.
 * @private
 */
wtf.io.cff.BinaryStreamSource.prototype.pumpPendingChunks_ = function() {
  while (this.pendingChunks_.length) {
    var pendingChunk = this.pendingChunks_[0];
    if (!pendingChunk.deferred ||
        pendingChunk.deferred.hasFired()) {
      // Ready, load/emit!
      pendingChunk.chunk.load(pendingChunk.parts);
      this.emitChunkReceivedEvent(pendingChunk.chunk);
      this.pendingChunks_.shift();
    } else {
      // Still waiting, break out.
      break;
    }
  }

  if (!this.pendingChunks_.length && this.pendingEnd_) {
    // Done!
    this.emitEndEvent();
  }
};
