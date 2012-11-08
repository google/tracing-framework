/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Profile scope.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.doc.ProfileScope');

goog.require('goog.events');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.SimpleEventfulMap');



/**
 * Profile scope.
 * Contains profile properties under a certain scoped namespace.
 * @param {string} name Scope name.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.doc.ProfileScope = function(name) {
  goog.base(this);

  /**
   * Scope name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * The list of all properties in the scope.
   * @type {!wtf.events.EventfulMap}
   * @private
   */
  this.map_ = new wtf.events.SimpleEventfulMap();
  this.registerDisposable(this.map_);
};
goog.inherits(wtf.doc.ProfileScope, wtf.events.EventEmitter);


/**
 * Event types related to the object.
 * @enum {string}
 */
wtf.doc.ProfileScope.EventType = {
  /**
   * Properties added; receives a list of [key, newValue, oldValue].
   */
  PROPERTIES_SET: goog.events.getUniqueId('set')
};


/**
 * Gets the name of the profile scope.
 * @return {string} Scope name.
 */
wtf.doc.ProfileScope.prototype.getName = function() {
  return this.name_;
};


/**
 * Whether the map contains a value for the given key.
 * @param {string} key Item key.
 * @return {boolean} True if the map contains a value for the key.
 */
wtf.doc.ProfileScope.prototype.containsKey = function(key) {
  return this.map_.containsKey(key);
};


/**
 * Gets the value with the given key.
 * @param {string} key Item key.
 * @return {wtf.events.MapValueType|undefined} Value with the given key, if
 *     found.
 */
wtf.doc.ProfileScope.prototype.get = function(key) {
  return this.map_.get(key);
};


/**
 * Sets the value at the given key.
 * @param {string} key Item key.
 * @param {wtf.events.MapValueType} value New value.
 */
wtf.doc.ProfileScope.prototype.set = function(key, value) {
  this.map_.set(key, value);
};


/**
 * Removes the value with the given key.
 * @param {string} key Key to remove.
 */
wtf.doc.ProfileScope.prototype.remove = function(key) {
  this.map_.remove(key);
};


/**
 * Clears all values in the map.
 */
wtf.doc.ProfileScope.prototype.clear = function() {
  this.map_.clear();
};
