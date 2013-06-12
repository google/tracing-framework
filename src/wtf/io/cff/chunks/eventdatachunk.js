/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event data chunk.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.chunks.EventDataChunk');

goog.require('goog.asserts');
goog.require('wtf.io.Buffer');
goog.require('wtf.io.StringTable');
goog.require('wtf.io.cff.Chunk');
goog.require('wtf.io.cff.ChunkType');
goog.require('wtf.io.cff.PartType');
goog.require('wtf.io.cff.parts.BinaryEventBufferPart');
goog.require('wtf.io.cff.parts.BinaryResourcePart');
goog.require('wtf.io.cff.parts.JsonEventBufferPart');
goog.require('wtf.io.cff.parts.StringResourcePart');
goog.require('wtf.io.cff.parts.StringTablePart');



/**
 * A chunk containing event data and associated bits such as string tables and
 * embedded resources.
 * @param {number=} opt_chunkId File-unique chunk ID.
 * @constructor
 * @extends {wtf.io.cff.Chunk}
 */
wtf.io.cff.chunks.EventDataChunk = function(opt_chunkId) {
  goog.base(this, opt_chunkId, wtf.io.cff.ChunkType.EVENT_DATA);

  /**
   * Event data buffer part.
   * @type {wtf.io.cff.parts.BinaryEventBufferPart|
   *     wtf.io.cff.parts.JsonEventBufferPart}
   * @private
   */
  this.eventBufferPart_ = null;

  /**
   * String table part.
   * @type {wtf.io.cff.parts.StringTablePart}
   * @private
   */
  this.stringTablePart_ = null;

  /**
   * Embedded resource parts.
   * @type {!Array.<!wtf.io.cff.parts.ResourcePart>}
   * @private
   */
  this.resourceParts_ = [];
};
goog.inherits(wtf.io.cff.chunks.EventDataChunk, wtf.io.cff.Chunk);


/**
 * @override
 */
wtf.io.cff.chunks.EventDataChunk.prototype.load = function(parts) {
  goog.asserts.assert(!this.eventBufferPart_);

  // Add all parts.
  for (var n = 0; n < parts.length; n++) {
    var part = parts[n];
    this.addPart(part);
    switch (part.getType()) {
      case wtf.io.cff.PartType.STRING_TABLE:
        this.stringTablePart_ =
            /** @type {!wtf.io.cff.parts.StringTablePart} */ (part);
        break;
      case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
        this.eventBufferPart_ =
            /** @type {!wtf.io.cff.parts.JsonEventBufferPart} */ (part);
        break;
      case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
        this.eventBufferPart_ =
            /** @type {!wtf.io.cff.parts.BinaryEventBufferPart} */ (part);
        break;
      case wtf.io.cff.PartType.STRING_RESOURCE:
        this.resourceParts_.push(
            /** @type {!wtf.io.cff.parts.StringResourcePart} */ (part));
        break;
      case wtf.io.cff.PartType.BINARY_RESOURCE:
        this.resourceParts_.push(
            /** @type {!wtf.io.cff.parts.BinaryResourcePart} */ (part));
        break;
      default:
        goog.asserts.fail('Unknown part type: ' + part.getType());
        throw new Error('Unknown part type ' + part.getType() + ' in chunk.');
    }
  }

  goog.asserts.assert(this.eventBufferPart_);
  if (!this.eventBufferPart_) {
    throw new Error('No event buffer data found in event data chunk.');
  }

  // Wire up string table, if needed.
  if (this.stringTablePart_ &&
      this.eventBufferPart_ instanceof wtf.io.cff.parts.BinaryEventBufferPart) {
    var buffer = this.eventBufferPart_.getValue();
    buffer.stringTable = this.stringTablePart_.getValue();
  }
};


/**
 * Initializes an event data chunk to empty.
 * If the chunk is currently initialized it will be reused (if options match).
 * @param {number} bufferSize Buffer size, in bytes.
 * @param {boolean=} opt_useStringTable Whether to enable the string table.
 */
wtf.io.cff.chunks.EventDataChunk.prototype.init = function(
    bufferSize, opt_useStringTable) {
  var needsStringTable =
      goog.isDef(opt_useStringTable) ? opt_useStringTable : true;
  var needsBuffer = true;
  if (this.eventBufferPart_) {
    goog.asserts.assert(
        this.eventBufferPart_ instanceof
            wtf.io.cff.parts.BinaryEventBufferPart);

    // Buffer exists - verify size.
    var buffer = this.eventBufferPart_.getValue();
    if (buffer.capacity == bufferSize) {
      // Bytes can be reused. May need to add/remove string table.
      if (opt_useStringTable && !buffer.stringTable) {
        needsStringTable = false;
      }

      // Reset the buffer (and its string table).
      buffer.reset();
      needsBuffer = false;
    }
  }

  if (needsBuffer) {
    var buffer = new wtf.io.Buffer(bufferSize);
    this.eventBufferPart_ = new wtf.io.cff.parts.BinaryEventBufferPart(buffer);
  }

  if (needsStringTable) {
    this.stringTablePart_ = new wtf.io.cff.parts.StringTablePart(
        new wtf.io.StringTable());
    this.eventBufferPart_.getValue().stringTable =
        this.stringTablePart_.getValue();
  }

  this.removeAllParts();
  var buffer = this.eventBufferPart_.getValue();
  if (this.stringTablePart_) {
    this.addPart(this.stringTablePart_);
  }
  this.addPart(this.eventBufferPart_);
};


/**
 * Gets the event data buffer part.
 * The buffer must have been initialized prior to calling this function,
 * The part returned may be on of the event data buffer part types and callers
 * should check and handle the value.
 * @return {!wtf.io.cff.Part} Event data buffer part.
 */
wtf.io.cff.chunks.EventDataChunk.prototype.getEventData = function() {
  goog.asserts.assert(this.eventBufferPart_);
  return this.eventBufferPart_;
};


/**
 * Gets the event data buffer, assuming it's a binary buffer.
 * This is a convience method and callers must ensure it's only made when the
 * part is in binary format.
 * @return {!wtf.io.Buffer} Buffer.
 */
wtf.io.cff.chunks.EventDataChunk.prototype.getBinaryBuffer = function() {
  goog.asserts.assert(this.eventBufferPart_);
  goog.asserts.assert(
      this.eventBufferPart_ instanceof wtf.io.cff.parts.BinaryEventBufferPart);
  var buffer = this.eventBufferPart_.getValue();
  goog.asserts.assert(buffer);
  return buffer;
};


/**
 * Adds an embedded resource to the chunk.
 * When referencing the resource use the returned ID.
 * Do not modify the resource data until after the chunk has been written.
 * @param {!wtf.io.BlobData} data Resource data.
 * @return {number} Chunk-unique resource ID.
 */
wtf.io.cff.chunks.EventDataChunk.prototype.addResource = function(data) {
  var part;
  if (typeof data == 'string') {
    part = new wtf.io.cff.parts.StringResourcePart(data);
  } else {
    part = new wtf.io.cff.parts.BinaryResourcePart(data);
  }
  this.addPart(part);
  this.resourceParts_.push(part);
  return this.resourceParts_.length;
};


/**
 * Gets an embedded resource by its ID.
 * @param {number} id ID as returned by {@see #addResource}.
 * @return {wtf.io.BlobData} Resource, if found.
 */
wtf.io.cff.chunks.EventDataChunk.prototype.getResource = function(id) {
  var part = this.resourceParts_[id];
  return part ? part.getValue() : null;
};


/**
 * Resets all data stored in the chunk.
 */
wtf.io.cff.chunks.EventDataChunk.prototype.reset = function() {
  // Remove all unneeded parts.
  this.removeAllParts();
  this.resourceParts_ = [];

  // Add back valid parts.
  if (this.stringTablePart_) {
    this.addPart(this.stringTablePart_);
  }
  if (this.eventBufferPart_) {
    var part = this.eventBufferPart_;
    this.addPart(part);

    // Reset buffer data.
    // This also resets string table data, if present
    if (part instanceof wtf.io.cff.parts.BinaryEventBufferPart) {
      var buffer = part.getValue();
      buffer.reset();
    } else if (part instanceof wtf.io.cff.parts.JsonEventBufferPart) {
      part.setValue([]);
    }
  }
};
