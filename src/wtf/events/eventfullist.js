/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Eventful list.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events.EventfulList');
goog.provide('wtf.events.ListEventType');
goog.provide('wtf.events.ListValueType');
goog.provide('wtf.events.SimpleEventfulList');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('wtf.events.EventEmitter');


/**
 * @typedef {!Object|number|boolean|string}
 */
wtf.events.ListValueType;


/**
 * Events relating to the list.
 * @enum {string}
 */
wtf.events.ListEventType = {
  /**
   * A list of values that have been added as (index, newValue).
   */
  VALUES_ADDED: goog.events.getUniqueId('added'),

  /**
   * A list of values that have been set as (index, newValue, oldValue).
   */
  VALUES_SET: goog.events.getUniqueId('set'),

  /**
   * A list of values that have been removed as (index, oldValue).
   */
  VALUES_REMOVED: goog.events.getUniqueId('removed')
};



/**
 * Abstract list type that emits events when it changes.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.events.EventfulList = function() {
  goog.base(this);
};
goog.inherits(wtf.events.EventfulList, wtf.events.EventEmitter);


/**
 * Gets the length of the list.
 * @return {number} List length.
 */
wtf.events.EventfulList.prototype.getLength = goog.abstractMethod;


/**
 * Gets the value at the given index.
 * @param {number} index Item index.
 * @return {wtf.events.ListValueType} Value at the given index.
 */
wtf.events.EventfulList.prototype.get = goog.abstractMethod;


/**
 * Sets the value at the given index.
 * @param {number} index Item index.
 * @param {wtf.events.ListValueType} value New value.
 */
wtf.events.EventfulList.prototype.set = goog.abstractMethod;


/**
 * Gets the index of the given value.
 * This is a slow search.
 * @param {wtf.events.ListValueType} value Value to look for.
 * @return {number} Index of the given value or -1 if not found.
 */
wtf.events.EventfulList.prototype.indexOf = goog.abstractMethod;


/**
 * Gets the last index of the given value.
 * This is a slow search.
 * @param {wtf.events.ListValueType} value Value to look for.
 * @return {number} Index of the given value or -1 if not found.
 */
wtf.events.EventfulList.prototype.lastIndexOf = goog.abstractMethod;


/**
 * Adds a value to the end of the list.
 * @param {wtf.events.ListValueType} value Value to add.
 * @return {number} The new length of the array.
 */
wtf.events.EventfulList.prototype.push = goog.abstractMethod;


/**
 * Removes and returns the value at the end of the list.
 * This list must not be empty.
 * @return {wtf.events.ListValueType} The value at the end of the list.
 */
wtf.events.EventfulList.prototype.pop = goog.abstractMethod;


/**
 * Inserts the value at the given location.
 * @param {number} index Index to insert at.
 * @param {wtf.events.ListValueType} value Value to insert.
 */
wtf.events.EventfulList.prototype.insertAt = goog.abstractMethod;


/**
 * Inserts the value at the correct location as determined by the given sort
 * comparer. The value is not inserted if it already exists.
 * @param {T} value Value to insert.
 * @param {function(T, T):number} compareFn Comparison function.
 * @return {boolean} True if an element was inserted.
 * @template T
 */
wtf.events.EventfulList.prototype.binaryInsert = function(value, compareFn) {
  var index = this.binarySearch(value, compareFn);
  if (index < 0) {
    this.insertAt(-(index + 1), value);
    return true;
  }
  return false;
};


// TODO(benvanik): shift/unshift


/**
 * Removes the value at the given index.
 * @param {number} index Index to remove.
 */
wtf.events.EventfulList.prototype.removeAt = goog.abstractMethod;


/**
 * Removes the given value.
 * @param {wtf.events.ListValueType} value Value to remove.
 * @return {boolean} True if the value was found and removed.
 */
wtf.events.EventfulList.prototype.remove = goog.abstractMethod;


/**
 * Clears all values in the list.
 */
wtf.events.EventfulList.prototype.clear = goog.abstractMethod;


/**
 * Searches for the index of the given value.
 * @param {T} value The sought value.
 * @param {function(T, T):number} compareFn Comparison function.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property. Return value >= 0
 *     iff target is found.
 * @template T
 */
wtf.events.EventfulList.prototype.binarySearch = goog.abstractMethod;


/**
 * Iterates over all values in the list.
 * @param {function(this: T, wtf.events.ListValueType):(boolean|undefined)}
 *     callback Function to receive the value. Return false to abort iteration.
 * @param {T=} opt_scope Scope to call the callback in.
 * @template T
 */
wtf.events.EventfulList.prototype.forEach = goog.abstractMethod;



/**
 * An array-backed list type that emits events when it changes.
 * @constructor
 * @extends {wtf.events.EventfulList}
 */
wtf.events.SimpleEventfulList = function() {
  goog.base(this);

  /**
   * Inner list.
   * @type {!Array.<wtf.events.ListValueType>}
   * @private
   */
  this.list_ = [];
};
goog.inherits(wtf.events.SimpleEventfulList, wtf.events.EventfulList);


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.disposeInternal = function() {
  goog.disposeAll(this.list_);
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.getLength = function() {
  return this.list_.length;
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.get = function(index) {
  return this.list_[index];
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.set = function(index, value) {
  var oldValue = this.list_[index];
  this.list_[index] = value;
  this.emitEvent(
      wtf.events.ListEventType.VALUES_SET,
      [
        [index, value, oldValue]
      ]);
  goog.dispose(oldValue);
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.indexOf = function(value) {
  for (var n = 0; n < this.list_.length; n++) {
    if (this.list_[n] == value) {
      return n;
    }
  }
  return -1;
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.lastIndexOf = function(value) {
  for (var n = this.list_.length - 1; n >= 0; n--) {
    if (this.list_[n] == value) {
      return n;
    }
  }
  return -1;
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.push = function(value) {
  this.list_.push(value);
  this.emitEvent(
      wtf.events.ListEventType.VALUES_ADDED,
      [
        [this.list_.length - 1, value]
      ]);
  return this.list_.length;
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.pop = function() {
  goog.asserts.assert(this.list_.length);
  var value = this.list_[this.list_.length - 1];
  this.removeAt(this.list_.length - 1);
  return value;
};


// TODO(benvanik): shift/unshift


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.insertAt = function(index, value) {
  goog.array.insertAt(this.list_, value, index);
  this.emitEvent(
      wtf.events.ListEventType.VALUES_ADDED,
      [
        [index, value]
      ]);
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.removeAt = function(index) {
  var value = this.list_[index];
  this.list_.splice(index, 1);
  this.emitEvent(
      wtf.events.ListEventType.VALUES_REMOVED,
      [
        [index, value]
      ]);
  goog.dispose(value);
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.remove = function(value) {
  var index = this.indexOf(value);
  if (index >= 0) {
    this.removeAt(index);
  }
  return index >= 0;
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.clear = function() {
  var oldValues = this.list_;
  this.list_ = [];
  var changes = new Array(oldValues.length);
  for (var n = 0; n < oldValues.length; n++) {
    changes.push([n, oldValues[n]]);
  }
  this.emitEvent(
      wtf.events.ListEventType.VALUES_REMOVED,
      changes);
  goog.disposeAll(oldValues);
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.binarySearch = function(
    value, compareFn) {
  return goog.array.binarySearch(this.list_, value, compareFn);
};


/**
 * @override
 */
wtf.events.SimpleEventfulList.prototype.forEach = function(
    callback, opt_scope) {
  for (var n = 0; n < this.list_.length; n++) {
    if (callback.call(opt_scope, this.list_[n]) === false) {
      return;
    }
  }
};
