/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Base type for the stream source and target types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.StreamBase');

goog.require('goog.asserts');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.io.cff.ChunkType');
goog.require('wtf.io.cff.PartType');
goog.require('wtf.io.cff.chunks.EventDataChunk');
goog.require('wtf.io.cff.chunks.FileHeaderChunk');
goog.require('wtf.io.cff.parts.BinaryEventBufferPart');
goog.require('wtf.io.cff.parts.BinaryResourcePart');
goog.require('wtf.io.cff.parts.FileHeaderPart');
goog.require('wtf.io.cff.parts.JsonEventBufferPart');
goog.require('wtf.io.cff.parts.LegacyEventBufferPart');
goog.require('wtf.io.cff.parts.StringResourcePart');
goog.require('wtf.io.cff.parts.StringTablePart');



/**
 * Base type for the stream source and target types.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.io.cff.StreamBase = function() {
  goog.base(this);
};
goog.inherits(wtf.io.cff.StreamBase, wtf.events.EventEmitter);


/**
 * Creates a chunk of the given type.
 * @param {number} chunkId File-unique chunk ID.
 * @param {wtf.io.cff.ChunkType} chunkType Chunk type.
 * @return {wtf.io.cff.Chunk} New chunk instance of the given type. May be
 *     {@code null} if the chunk type was unrecognized.
 * @protected
 */
wtf.io.cff.StreamBase.prototype.createChunkType = function(chunkId, chunkType) {
  switch (chunkType) {
    case wtf.io.cff.ChunkType.FILE_HEADER:
      return new wtf.io.cff.chunks.FileHeaderChunk(chunkId);
    case wtf.io.cff.ChunkType.EVENT_DATA:
      return new wtf.io.cff.chunks.EventDataChunk(chunkId);
    default:
      goog.asserts.fail('Unhandled chunk type: ' + chunkType);
      return null;
  }
};


/**
 * Creates a part of the given type.
 * @param {wtf.io.cff.PartType} partType Part type.
 * @return {wtf.io.cff.Part} New part instance of the given type. May be
 *      {@code null} if the chunk type was unrecognized.
 * @protected
 */
wtf.io.cff.StreamBase.prototype.createPartType = function(partType) {
  switch (partType) {
    case wtf.io.cff.PartType.FILE_HEADER:
      return new wtf.io.cff.parts.FileHeaderPart();
    case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
      return new wtf.io.cff.parts.JsonEventBufferPart();
    case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
      return new wtf.io.cff.parts.LegacyEventBufferPart();
    case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
      return new wtf.io.cff.parts.BinaryEventBufferPart();
    case wtf.io.cff.PartType.STRING_TABLE:
      return new wtf.io.cff.parts.StringTablePart();
    case wtf.io.cff.PartType.BINARY_RESOURCE:
      return new wtf.io.cff.parts.BinaryResourcePart();
    case wtf.io.cff.PartType.STRING_RESOURCE:
      return new wtf.io.cff.parts.StringResourcePart();
    default:
      goog.asserts.fail('Unhandled part type: ' + partType);
      return null;
  }
};
