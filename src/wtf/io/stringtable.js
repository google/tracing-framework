/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview String table storage type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.StringTable');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');



/**
 * Simple read-only or write-only string table.
 * Strings are stored by ordinal in the order they are added.
 * The string table is switched into a mode upon creation that optimizes its
 * behavior for reading or writing.
 * @param {wtf.io.StringTable.Mode} mode Operation mode.
 * @constructor
 */
wtf.io.StringTable = function(mode) {
  // TODO(benvanik): add de-duplication, if possible to do efficiently. Perhaps
  //     only for large strings where the cost is worth it?

  /**
   * Operation mode. Cannot be changed.
   * @type {wtf.io.StringTable.Mode}
   * @private
   */
  this.mode_ = mode;

  /**
   * All currently added string values.
   * If the table is in write mode this also contains null terminators.
   * @type {!Array.<string>}
   * @private
   */
  this.values_ = [];
};


/**
 * String table mode.
 * @enum {number}
 */
wtf.io.StringTable.Mode = {
  READ_ONLY: 0,
  WRITE_ONLY: 1
};


/**
 * Resets all string table data.
 */
wtf.io.StringTable.prototype.reset = function() {
  this.values_ = [];
};


/**
 * Clones the string table contents.
 * @return {!wtf.io.StringTable} New string table.
 */
wtf.io.StringTable.prototype.clone = function() {
  var other = new wtf.io.StringTable(this.mode_);
  other.values_ = this.values_.slice();
  return other;
};


/**
 * Adds a string to the table.
 * @param {string} value String value.
 * @return {number} Ordinal value.
 */
wtf.io.StringTable.prototype.addString = function(value) {
  goog.asserts.assert(this.mode_ == wtf.io.StringTable.Mode.WRITE_ONLY);
  var ordinal = this.values_.length / 2;
  this.values_.push(value);
  this.values_.push('\0');
  return ordinal;
};


/**
 * Gets a string from the table.
 * @param {number} ordinal Ordinal.
 * @return {string?} String value, if present.
 */
wtf.io.StringTable.prototype.getString = function(ordinal) {
  goog.asserts.assert(this.mode_ == wtf.io.StringTable.Mode.READ_ONLY);
  return this.values_[ordinal] || null;
};


/**
 * Deserializes a string table from the given data blob.
 * The blob is espected to have the frame header omitted.
 * @param {!Blob} blob Blob, sliced to only be string data.
 * @return {!goog.async.Deferred} A deferred fulfilled when the table is
 *     deserialized.
 */
wtf.io.StringTable.prototype.deserialize = function(blob) {
  goog.asserts.assert(this.mode_ == wtf.io.StringTable.Mode.READ_ONLY);

  // NOTE: we avoid using goog.fs as it is very bad for performance.

  var deferred = new goog.async.Deferred();

  var self = this;
  var fileReader = new FileReader();
  fileReader.onload = function() {
    self.values_ = fileReader.result.split('\0');
    deferred.callback(this);
  };
  fileReader.readAsText(blob);

  return deferred;
};


/**
 * Serializes a string table to a blob.
 * The resulting blob does not have a frame header.
 * @return {!Blob} Blob containing the string data.
 */
wtf.io.StringTable.prototype.serialize = function() {
  goog.asserts.assert(this.mode_ == wtf.io.StringTable.Mode.WRITE_ONLY);

  var blob = new Blob(this.values_);
  return blob;
};
