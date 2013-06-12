/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chunk abstract base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.Chunk');

goog.require('goog.asserts');



/**
 * Chunk abstract base type.
 * Chunks are the primary division unit in the file format. They are serialized
 * and deserialized as a whole and are generally completely self contained.
 * Chunks contain one or more {@see wtf.io.cff.Part} instances that contain
 * the actual data needed by the chunk. The order, type, and count of the parts
 * is defined by the chunk type.
 *
 * @param {number|undefined} chunkId File-unique chunk ID.
 * @param {wtf.io.cff.ChunkType} chunkType Chunk type.
 * @constructor
 */
wtf.io.cff.Chunk = function(chunkId, chunkType) {
  /**
   * File-unique chunk ID.
   * @type {number}
   * @private
   */
  this.chunkId_ = goog.isDef(chunkId) ? chunkId : wtf.io.cff.Chunk.nextId_++;

  /**
   * Chunk type.
   * @type {wtf.io.cff.ChunkType}
   * @private
   */
  this.chunkType_ = chunkType;

  /**
   * Start time/value or {@see wtf.io.cff.Chunk.INVALID_TIME}.
   * Only used if {@code endTime_} is also valid.
   * @type {number}
   * @private
   */
  this.startTime_ = wtf.io.cff.Chunk.INVALID_TIME;

  /**
   * End time/value or {@see wtf.io.cff.Chunk.INVALID_TIME}.
   * Only used if {@code startTime_} is also valid.
   * @type {number}
   * @private
   */
  this.endTime_ = wtf.io.cff.Chunk.INVALID_TIME;

  /**
   * Child parts, in their required order.
   * @type {!Array.<wtf.io.cff.Part>}
   * @private
   */
  this.parts_ = [];
};


/**
 * Invalid time value used for ignoring start/end time.
 * @type {number}
 * @const
 */
wtf.io.cff.Chunk.INVALID_TIME = 0xFFFFFFFF;


/**
 * Unique chunk ID.
 * Should only be used at recording time - otherwise chunks should have their
 * IDs set by the loader.
 * @type {number}
 * @private
 */
wtf.io.cff.Chunk.nextId_ = 1;


/**
 * Gets the file-unique chunk ID.
 * @return {number} Chunk ID.
 */
wtf.io.cff.Chunk.prototype.getId = function() {
  return this.chunkId_;
};


/**
 * Gets the chunk type.
 * @return {wtf.io.cff.ChunkType} Chunk type.
 */
wtf.io.cff.Chunk.prototype.getType = function() {
  return this.chunkType_;
};


/**
 * Gets the start time/value of the data in the chunk.
 * If this is {@see wtf.io.cff.Chunk.INVALID_TIME} then no time/value is
 * defined.
 * @return {number} Start time/value.
 */
wtf.io.cff.Chunk.prototype.getStartTime = function() {
  return this.startTime_;
};


/**
 * Gets the end time/value of the data in the chunk.
 * If this is {@see wtf.io.cff.Chunk.INVALID_TIME} then no time/value is
 * defined.
 * @return {number} End time/value.
 */
wtf.io.cff.Chunk.prototype.getEndTime = function() {
  return this.endTime_;
};


/**
 * Sets the time/value range the data in this chunk covers.
 * This is used to enable slicing/seeking when loading. The value type is
 * arbitrary and could be call counts/etc.
 * @param {number} startTime Start time/value.
 * @param {number} endTime End time/value.
 */
wtf.io.cff.Chunk.prototype.setTimeRange = function(startTime, endTime) {
  goog.asserts.assert(startTime <= endTime);
  this.startTime_ = startTime;
  this.endTime_ = endTime;
};


/**
 * Gets a list of the parts in the chunk.
 * Do not modify directly and instead use the mutator methods.
 * @return {!Array.<wtf.io.cff.Part>} Part list.
 */
wtf.io.cff.Chunk.prototype.getParts = function() {
  return this.parts_;
};


/**
 * Adds a part to the chunk.
 * @param {!wtf.io.cff.Part} part Part to add.
 */
wtf.io.cff.Chunk.prototype.addPart = function(part) {
  this.parts_.push(part);
};


/**
 * Removes all parts from the chunk.
 */
wtf.io.cff.Chunk.prototype.removeAllParts = function() {
  this.parts_.length = 0;
};


/**
 * Loads a chunk from the given parts.
 * May throw exceptions if the chunk is not valid.
 * @param {!Array.<!wtf.io.cff.Part>} parts Chunk parts.
 */
wtf.io.cff.Chunk.prototype.load = goog.abstractMethod;
