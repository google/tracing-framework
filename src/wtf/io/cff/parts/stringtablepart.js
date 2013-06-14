/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview String data chunk part.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.parts.StringTablePart');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('wtf.io.Blob');
goog.require('wtf.io.StringTable');
goog.require('wtf.io.cff.Part');
goog.require('wtf.io.cff.PartType');



/**
 * A part containing a string table.
 *
 * @param {wtf.io.StringTable=} opt_value Initial string table data.
 * @constructor
 * @extends {wtf.io.cff.Part}
 */
wtf.io.cff.parts.StringTablePart = function(opt_value) {
  goog.base(this, wtf.io.cff.PartType.STRING_TABLE);

  /**
   * String table.
   * @type {wtf.io.StringTable}
   * @private
   */
  this.value_ = opt_value || null;
};
goog.inherits(wtf.io.cff.parts.StringTablePart, wtf.io.cff.Part);


/**
 * Gets the string table data.
 * @return {wtf.io.StringTable} String table data, if any.
 */
wtf.io.cff.parts.StringTablePart.prototype.getValue = function() {
  return this.value_;
};


/**
 * Sets the string table data.
 * @param {wtf.io.StringTable} value String table data.
 */
wtf.io.cff.parts.StringTablePart.prototype.setValue = function(value) {
  this.value_ = value;
};


/**
 * @override
 */
wtf.io.cff.parts.StringTablePart.prototype.initFromBlobData = function(data) {
  var deferred = new goog.async.Deferred();

  var blob = wtf.io.Blob.create([data]);
  blob.readAsText(function(value) {
    this.value_ = new wtf.io.StringTable();
    if (value) {
      this.value_.deserialize(value);
    }
    deferred.callback(this);
  }, this);

  return deferred;
};


/**
 * @override
 */
wtf.io.cff.parts.StringTablePart.prototype.toBlobData = function() {
  return this.value_.serialize();
};


/**
 * @override
 */
wtf.io.cff.parts.StringTablePart.prototype.initFromJsonObject = function(
    value) {
  this.value_ = new wtf.io.StringTable();
  this.value_.initFromJsonObject(value['value']);
};


/**
 * @override
 */
wtf.io.cff.parts.StringTablePart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);
  return {
    'type': this.getType(),
    'value': this.value_.toJsonObject()
  };
};
