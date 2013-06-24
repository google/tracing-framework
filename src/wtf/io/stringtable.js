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

goog.require('wtf.io.Blob');



/**
 * Simple read-only or write-only string table.
 * Strings are stored by ordinal in the order they are added.
 * @constructor
 */
wtf.io.StringTable = function() {
  // TODO(benvanik): add de-duplication, if possible to do efficiently. Perhaps
  //     only for large strings where the cost is worth it?

  /**
   * All currently added string values.
   * If the table is in write mode this also contains null terminators.
   * @type {!Array.<string>}
   * @private
   */
  this.values_ = [];

  /**
   * Whether the values table has null terminators between strings.
   * @type {boolean}
   * @private
   */
  this.hasNullTerminators_ = true;
};


/**
 * Resets all string table data.
 */
wtf.io.StringTable.prototype.reset = function() {
  if (this.values_.length) {
    this.values_ = [];
  }
};


/**
 * Clones the string table contents.
 * @return {!wtf.io.StringTable} New string table.
 */
wtf.io.StringTable.prototype.clone = function() {
  var other = new wtf.io.StringTable();
  other.values_ = this.values_.slice();
  other.hasNullTerminators_ = this.hasNullTerminators_;
  return other;
};


/**
 * Adds a string to the table.
 * @param {string} value String value.
 * @return {number} Ordinal value.
 */
wtf.io.StringTable.prototype.addString = function(value) {
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
  if (ordinal == 0xFFFFFFFF) {
    return null;
  } else if (ordinal == 0xFFFFFFFE) {
    return '';
  }
  if (this.hasNullTerminators_) {
    ordinal *= 2;
  }
  return this.values_[ordinal] || null;
};


/**
 * Deserializes the string table from the given JSON object.
 * @param {!(Array|Object)} value JSON object.
 */
wtf.io.StringTable.prototype.initFromJsonObject = function(value) {
  this.values_ = value ? (/** @type {!Array.<string>} */ (value)) : [];
  this.hasNullTerminators_ = false;
};


/**
 * Serializes the string table to a JSON object.
 * @return {!(Array|Object)} String table object.
 */
wtf.io.StringTable.prototype.toJsonObject = function() {
  // Unfortuantely have to do this to add the \0 delimiters.
  // Since JSON isn't the optimized format, this is ok.
  if (this.hasNullTerminators_) {
    var values = new Array(this.values_.length / 2);
    for (var n = 0; n < values.length; n++) {
      values[n] = this.values_[n * 2];
    }
    return values;
  } else {
    return this.values_;
  }
};


/**
 * Deserializes the string table from the given string that resulted from
 * {@see #serialize}.
 * @param {string} value String value.
 */
wtf.io.StringTable.prototype.deserialize = function(value) {
  this.values_ = value.split('\0');
  this.hasNullTerminators_ = false;
};


/**
 * Serializes the string table to a blob.
 * The resulting blob does not have a frame header.
 * @return {!wtf.io.Blob} Blob containing the string data.
 */
wtf.io.StringTable.prototype.serialize = function() {
  var values = this.values_;
  if (!this.hasNullTerminators_) {
    // Slow path to add null terminators in.
    values = new Array(this.values_.length * 2);
    for (var n = 0; n < this.values_.length; n += 2) {
      values[n] = this.values_[n];
      values[n + 1] = '\0';
    }
  }
  var blob = wtf.io.Blob.create(values);
  return blob;
};


goog.exportProperty(
    wtf.io.StringTable.prototype, 'addString',
    wtf.io.StringTable.prototype.addString);
goog.exportProperty(
    wtf.io.StringTable.prototype, 'getString',
    wtf.io.StringTable.prototype.getString);
