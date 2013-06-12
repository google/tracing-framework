/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chunk type IDs.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.ChunkType');

goog.require('goog.asserts');


/**
 * Chunk type ID.
 * Must be kept in sync with {@see wtf.io.cff.IntegerChunkType_}.
 * @enum {string}
 */
wtf.io.cff.ChunkType = {
  /** {@see wtf.io.cff.chunks.FileHeaderChunk} */
  FILE_HEADER: 'file_header',
  /** {@see wtf.io.cff.chunks.EventDataChunk} */
  EVENT_DATA: 'event_data',

  UNKNOWN: 'unknown_type'
};


/**
 * Checks whether the given chunk type is valid/known.
 * @param {string|wtf.io.cff.ChunkType} value Chunk type value.
 * @return {boolean} True if the type is valid.
 */
wtf.io.cff.ChunkType.isValid = function(value) {
  switch (value) {
    case wtf.io.cff.ChunkType.FILE_HEADER:
    case wtf.io.cff.ChunkType.EVENT_DATA:
      return true;
  }
  return false;
};


/**
 * Chunk type ID values in numeric form.
 * Must be kept in sync with {@see wtf.io.cff.ChunkType}.
 * @enum {number}
 * @private
 */
wtf.io.cff.IntegerChunkType_ = {
  FILE_HEADER: 0x1,
  EVENT_DATA: 0x2,

  UNKNOWN: -1
};


/**
 * Converts a chunk type enum value to an integer value.
 * @param {wtf.io.cff.ChunkType} value Chunk type enum value.
 * @return {number} Integer value.
 */
wtf.io.cff.ChunkType.toInteger = function(value) {
  switch (value) {
    case wtf.io.cff.ChunkType.FILE_HEADER:
      return wtf.io.cff.IntegerChunkType_.FILE_HEADER;
    case wtf.io.cff.ChunkType.EVENT_DATA:
      return wtf.io.cff.IntegerChunkType_.EVENT_DATA;
    default:
      goog.asserts.fail('Unknown chunk type: ' + value);
      return wtf.io.cff.IntegerChunkType_.UNKNOWN;
  }
};


/**
 * Converts a chunk type integer to an enum value.
 * @param {number} value Chunk type integer value.
 * @return {wtf.io.cff.ChunkType} Enum value.
 */
wtf.io.cff.ChunkType.fromInteger = function(value) {
  switch (value) {
    case wtf.io.cff.IntegerChunkType_.FILE_HEADER:
      return wtf.io.cff.ChunkType.FILE_HEADER;
    case wtf.io.cff.IntegerChunkType_.EVENT_DATA:
      return wtf.io.cff.ChunkType.EVENT_DATA;
    default:
      goog.asserts.fail('Unknown chunk type: ' + value);
      return wtf.io.cff.ChunkType.UNKNOWN;
  }
};
