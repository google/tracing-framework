/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview The main file header chunk.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.chunks.FileHeaderChunk');

goog.require('goog.asserts');
goog.require('wtf.io.cff.Chunk');
goog.require('wtf.io.cff.ChunkType');
goog.require('wtf.io.cff.PartType');
goog.require('wtf.io.cff.parts.FileHeaderPart');



/**
 * A chunk containing trace header data.
 * There will only ever be one of these per file and it must be the first data
 * in the file (after the magic header).
 *
 * @param {number=} opt_chunkId File-unique chunk ID.
 * @constructor
 * @extends {wtf.io.cff.Chunk}
 */
wtf.io.cff.chunks.FileHeaderChunk = function(opt_chunkId) {
  goog.base(this, opt_chunkId, wtf.io.cff.ChunkType.FILE_HEADER);

  /**
   * File header part.
   * @type {wtf.io.cff.parts.FileHeaderPart}
   * @private
   */
  this.fileHeaderPart_ = null;
};
goog.inherits(wtf.io.cff.chunks.FileHeaderChunk, wtf.io.cff.Chunk);


/**
 * @override
 */
wtf.io.cff.chunks.FileHeaderChunk.prototype.load = function(parts) {
  goog.asserts.assert(!this.fileHeaderPart_);

  // Add all parts.
  for (var n = 0; n < parts.length; n++) {
    var part = parts[n];
    this.addPart(part);
    switch (part.getType()) {
      case wtf.io.cff.PartType.FILE_HEADER:
        this.fileHeaderPart_ =
            /** @type {!wtf.io.cff.parts.FileHeaderPart} */ (part);
        break;
      default:
        goog.asserts.fail('Unknown part type: ' + part.getType());
        throw new Error('Unknown part type ' + part.getType() + ' in chunk.');
    }
  }

  goog.asserts.assert(this.fileHeaderPart_);
  if (!this.fileHeaderPart_) {
    throw new Error('No file header part found in header chunk.');
  }
};


/**
 * Initializes a file header chunk with the given header data.
 * @param {wtf.data.ContextInfo=} opt_contextInfo Initial context info.
 * @param {Object=} opt_metadata Metadata.
 */
wtf.io.cff.chunks.FileHeaderChunk.prototype.init = function(
    opt_contextInfo, opt_metadata) {
  this.fileHeader_ = new wtf.io.cff.parts.FileHeaderPart(
      opt_contextInfo, opt_metadata);

  this.removeAllParts();
  this.addPart(this.fileHeader_);
};


/**
 * Gets the file header data.
 * The header must have been initialized before calling this method.
 * @return {!wtf.io.cff.parts.FileHeaderPart} File header data.
 */
wtf.io.cff.chunks.FileHeaderChunk.prototype.getFileHeader = function() {
  goog.asserts.assert(this.fileHeaderPart_);
  return this.fileHeaderPart_;
};
