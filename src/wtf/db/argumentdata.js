/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Argument data storage.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.ArgumentData');



/**
 * Argument data storage.
 * @param {Object=} opt_store Key-value storage.
 * @constructor
 */
wtf.db.ArgumentData = function(opt_store) {
  /**
   * ID of the argument data in its parent event list.
   * For internal use only.
   * @type {number}
   */
  this.id = -1;

  /**
   * Key-value store.
   * @type {!Object}
   * @private
   */
  this.store_ = opt_store || {};
};


/**
 * Merges an argument data object into this instance.
 * @param {!wtf.db.ArgumentData} other Argument data to merge.
 */
wtf.db.ArgumentData.prototype.merge = function(other) {
  for (var key in other.store_) {
    this.store_[key] = other.store_[key];
  }
};


/**
 * Gets an argument value.
 * @param {number|string} key Key.
 * @return {*} Value.
 */
wtf.db.ArgumentData.prototype.get = function(key) {
  return this.store_[key];
};


/**
 * Sets an argument value.
 * @param {number|string} key Key.
 * @param {*} value Value.
 */
wtf.db.ArgumentData.prototype.set = function(key, value) {
  this.store_[key] = value;
};


/**
 * Converts the argument data to an object.
 * @return {!Object} Object.
 */
wtf.db.ArgumentData.prototype.toObject = function() {
  var obj = {};
  for (var key in this.store_) {
    obj[key] = this.store_[key];
  }
  return obj;
};


goog.exportProperty(
    wtf.db.ArgumentData.prototype, 'get',
    wtf.db.ArgumentData.prototype.get);
goog.exportProperty(
    wtf.db.ArgumentData.prototype, 'set',
    wtf.db.ArgumentData.prototype.set);
goog.exportProperty(
    wtf.db.ArgumentData.prototype, 'toObject',
    wtf.db.ArgumentData.prototype.toObject);
