/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Eventful map.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events.EventfulMap');
goog.provide('wtf.events.MapEventType');
goog.provide('wtf.events.MapValueType');
goog.provide('wtf.events.SimpleEventfulMap');

goog.require('goog.events');
goog.require('goog.object');
goog.require('wtf.events.EventEmitter');


/**
 * @typedef {!Object|number|boolean|string}
 */
wtf.events.MapValueType;


/**
 * Events relating to the map.
 * @enum {string}
 */
wtf.events.MapEventType = {
  /**
   * A map of values that have been set as (key, newValue, oldValue).
   */
  VALUES_SET: goog.events.getUniqueId('set')
};



/**
 * Abstract map type that emits events when it changes.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.events.EventfulMap = function() {
  goog.base(this);
};
goog.inherits(wtf.events.EventfulMap, wtf.events.EventEmitter);


/**
 * Gets the total number of entries in the map.
 * @return {number} The number of entries in the map.
 */
wtf.events.EventfulMap.prototype.getCount = goog.abstractMethod;


/**
 * Whether the map has any values in it.
 * @return {boolean} True if the map is emtpy.
 */
wtf.events.EventfulMap.prototype.isEmpty = goog.abstractMethod;


/**
 * Gets a list of all keys in the map.
 * @return {!Array.<string>} All keys in the map.
 */
wtf.events.EventfulMap.prototype.getKeys = goog.abstractMethod;


/**
 * Whether the map contains a value for the given key.
 * @param {string} key Item key.
 * @return {boolean} True if the map contains a value for the key.
 */
wtf.events.EventfulMap.prototype.containsKey = goog.abstractMethod;


/**
 * Gets the value with the given key.
 * @param {string} key Item key.
 * @return {wtf.events.MapValueType|undefined} Value with the given key, if
 *     found.
 */
wtf.events.EventfulMap.prototype.get = goog.abstractMethod;


/**
 * Sets the value at the given key.
 * @param {string} key Item key.
 * @param {wtf.events.MapValueType} value New value.
 */
wtf.events.EventfulMap.prototype.set = goog.abstractMethod;


/**
 * Removes the value with the given key.
 * @param {string} key Key to remove.
 */
wtf.events.EventfulMap.prototype.remove = goog.abstractMethod;


/**
 * Clears all values in the map.
 */
wtf.events.EventfulMap.prototype.clear = goog.abstractMethod;


/**
 * Iterates over all key-value pairs in the map.
 * @param {function(string, wtf.events.MapValueType):(boolean|undefined)}
 *     callback Function to receive the value. Return false to abort iteration.
 * @param {Object=} opt_scope Scope to call the callback in.
 */
wtf.events.EventfulMap.prototype.forEach = goog.abstractMethod;


/**
 * Iterates over all keys in the map.
 * @param {function(string):(boolean|undefined)}
 *     callback Function to receive the value. Return false to abort iteration.
 * @param {Object=} opt_scope Scope to call the callback in.
 */
wtf.events.EventfulMap.prototype.forEachKey = goog.abstractMethod;



/**
 * An object-backed map type that emits events when it changes.
 * @constructor
 * @extends {wtf.events.EventfulMap}
 */
wtf.events.SimpleEventfulMap = function() {
  goog.base(this);

  /**
   * Inner map.
   * @type {!Object.<wtf.events.MapValueType>}
   * @private
   */
  this.map_ = [];
};
goog.inherits(wtf.events.SimpleEventfulMap, wtf.events.EventfulMap);


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.getCount = function() {
  return goog.object.getCount(this.map_);
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.map_);
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.getKeys = function() {
  return goog.object.getKeys(this.map_);
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.containsKey = function(key) {
  return key in this.map_;
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.get = function(key) {
  return this.map_[key];
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.set = function(key, value) {
  var oldValue = this.map_[key];
  if (oldValue == value) {
    return;
  }
  this.map_[key] = value;
  this.emitEvent(
      wtf.events.MapEventType.VALUES_SET,
      [
        [key, value, oldValue]
      ]);
  goog.dispose(oldValue);
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.remove = function(key) {
  var oldValue = this.map_[key];
  delete this.map_[key];
  this.emitEvent(
      wtf.events.MapEventType.VALUES_SET,
      [
        [key, undefined, oldValue]
      ]);
  goog.dispose(oldValue);
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.clear = function() {
  var oldMap = this.map_;
  this.map_ = {};
  var changes = [];
  for (var key in oldMap) {
    changes.push([key, undefined, oldMap[key]]);
  }
  this.emitEvent(
      wtf.events.MapEventType.VALUES_SET,
      changes);
  for (var key in oldMap) {
    goog.dispose(oldMap[key]);
  }
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.forEach = function(callback, opt_scope) {
  for (var key in this.map_) {
    if (callback.call(opt_scope, key, this.map_[key]) === false) {
      return;
    }
  }
};


/**
 * @override
 */
wtf.events.SimpleEventfulMap.prototype.forEachKey = function(
    callback, opt_scope) {
  for (var key in this.map_) {
    if (callback.call(opt_scope, key) === false) {
      return;
    }
  }
};
