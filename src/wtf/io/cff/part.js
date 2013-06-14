/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Part abstract base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.Part');



/**
 * Part abstract base type.
 * Chunks are made up of several parts, the types of which are defined by the
 * chunk types.
 *
 * @param {wtf.io.cff.PartType} partType Part type.
 * @constructor
 */
wtf.io.cff.Part = function(partType) {
  /**
   * Part type.
   * @type {wtf.io.cff.PartType}
   * @private
   */
  this.partType_ = partType;
};


/**
 * Gets the part type ID.
 * @return {wtf.io.cff.PartType} Part type.
 */
wtf.io.cff.Part.prototype.getType = function() {
  return this.partType_;
};


/**
 * Initializes the part from the given blob data.
 * Throws errors on invalid data.
 * @param {!Uint8Array} data Blob data. May be a subregion of a larger buffer.
 * @return {goog.async.Deferred|undefined} A deferred that is called back when
 *     the data has been parsed. This is optional.
 */
wtf.io.cff.Part.prototype.initFromBlobData = goog.abstractMethod;


/**
 * Gets the part as a blob data type (string/Blob/typed array).
 * The result will not be modified and may be a reference to live data.
 * @return {!wtf.io.BlobData} Blob data.
 */
wtf.io.cff.Part.prototype.toBlobData = goog.abstractMethod;


/**
 * Initializes the part from the given JSON object.
 * Throws errors on invalid JSON.
 * @param {!Object} value JSON value.
 */
wtf.io.cff.Part.prototype.initFromJsonObject = goog.abstractMethod;


/**
 * Converts the part into a JSON object.
 * @return {!Object} JSON object.
 */
wtf.io.cff.Part.prototype.toJsonObject = goog.abstractMethod;
