/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Rich options store.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.util.Options');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.object');
goog.require('wtf.events.EventEmitter');



/**
 * Options object that supports serialization and events.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.util.Options = function() {
  goog.base(this);

  /**
   * Key-value store for options values.
   * @type {!Object.<wtf.util.Options.Value>}
   * @private
   */
  this.obj_ = {};

  /**
   * Current nesting depth of {@see #beginChanging} blocks.
   * @type {number}
   * @private
   */
  this.changingDepth_ = 0;

  /**
   * A map of keys that have been changed since the last time the nesting
   * depth hit 0. Used to emit the key change list in the event.
   * @type {!Object.<boolean>}
   * @private
   */
  this.changedKeys_ = {};
};
goog.inherits(wtf.util.Options, wtf.events.EventEmitter);


/**
 * Options event types.
 * @enum {string}
 */
wtf.util.Options.EventType = {
  /**
   * Fired when a batch of changes have completed against the options object.
   * Contains a list of the keys that were changed as its only argument.
   */
  CHANGED: goog.events.getUniqueId('changed')
};


/**
 * @typedef {boolean|number|string}
 */
wtf.util.Options.Value;


/**
 * Loads options from the given JSON string.
 * The loaded options are merged in with existing options.
 * @param {string} json JSON string.
 * @return {boolean} True if the JSON could be parsed and merged.
 */
wtf.util.Options.prototype.load = function(json) {
  var obj;
  try {
    // TODO(benvanik): properly switch between goog.json and JSON when needed.
    obj = goog.global.JSON.parse(json);
  } catch (e) {
    return false;
  }
  if (goog.isObject(obj)) {
    this.mixin(obj);
  }
  return true;
};


/**
 * Saves all options to a JSON string.
 * @return {string} JSON string.
 */
wtf.util.Options.prototype.save = function() {
  return goog.global.JSON.stringify(this.obj_);
};


/**
 * Clears all options.
 */
wtf.util.Options.prototype.clear = function() {
  this.beginChanging();
  for (var key in this.obj_) {
    this.changedKeys_[key] = true;
  }
  this.obj_ = {};
  this.endChanging();
};


/**
 * Gets a clone of the options map.
 * @return {!Object} Options map clone.
 */
wtf.util.Options.prototype.getValues = function() {
  return /** @type {!Object} */ (goog.object.unsafeClone(this.obj_));
};


/**
 * Begins an options batch change.
 * This will defer all events until a corresponding {@see #endChanging} call.
 */
wtf.util.Options.prototype.beginChanging = function() {
  this.changingDepth_++;
};


/**
 * Ends an options batch change.
 * If any options were changed a {@code CHANGED} event will be fired with a list
 * of the keys that were changed.
 */
wtf.util.Options.prototype.endChanging = function() {
  this.changingDepth_--;
  if (!this.changingDepth_) {
    var keyList = [];
    for (var key in this.changedKeys_) {
      keyList.push(key);
    }
    this.changedKeys_ = {};
    if (keyList.length) {
      this.emitEvent(wtf.util.Options.EventType.CHANGED, keyList);
    }
  }
};


/**
 * Mixin the given map of key-value option pairs.
 * If values are already present they will be overwritten.
 * @param {!Object} obj Key-value option map.
 */
wtf.util.Options.prototype.mixin = function(obj) {
  this.beginChanging();
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (this.obj_[key] !== obj[key]) {
        this.obj_[key] = obj[key];
        this.changedKeys_[key] = true;
      }
    }
  }
  this.endChanging();
};


/**
 * Sets the value of the option with the given key.
 * @param {string} key Option key.
 * @param {wtf.util.Options.Value|undefined} value New value or undefined to
 *     remove.
 * @private
 */
wtf.util.Options.prototype.setValue_ = function(key, value) {
  if (this.obj_[key] !== value) {
    this.beginChanging();
    if (value !== undefined) {
      this.obj_[key] = value;
    } else {
      delete this.obj_[key];
    }
    this.changedKeys_[key] = true;
    this.endChanging();
  }
};


/**
 * Gets the boolean option with the given key.
 * @param {string} key Option key.
 * @param {boolean} defaultValue Default value.
 * @return {boolean} The value.
 */
wtf.util.Options.prototype.getBoolean = function(key, defaultValue) {
  var value = this.obj_[key];
  if (value === undefined) {
    value = defaultValue;
  } else {
    goog.asserts.assert(goog.isBoolean(value));
  }
  return value;
};


/**
 * Gets the boolean option with the given key.
 * @param {string} key Option key.
 * @param {boolean=} opt_defaultValue Default value, if any.
 * @return {boolean|undefined} The value, if defined.
 */
wtf.util.Options.prototype.getOptionalBoolean = function(
    key, opt_defaultValue) {
  var value = this.obj_[key];
  if (value === undefined) {
    value = opt_defaultValue;
  } else {
    goog.asserts.assert(goog.isBoolean(value));
  }
  return value;
};


/**
 * Sets the value of the boolean option with the given key.
 * @param {string} key Option key.
 * @param {boolean|undefined} value New value or undefined to remove.
 */
wtf.util.Options.prototype.setBoolean = function(key, value) {
  this.setValue_(key, value);
};


/**
 * Gets the number option with the given key.
 * @param {string} key Option key.
 * @param {number} defaultValue Default value.
 * @return {number} The value.
 */
wtf.util.Options.prototype.getNumber = function(key, defaultValue) {
  var value = this.obj_[key];
  if (value === undefined) {
    value = defaultValue;
  } else {
    goog.asserts.assert(goog.isNumber(value));
  }
  return value;
};


/**
 * Gets the number option with the given key.
 * @param {string} key Option key.
 * @param {number=} opt_defaultValue Default value, if any.
 * @return {number|undefined} The value, if defined.
 */
wtf.util.Options.prototype.getOptionalNumber = function(key, opt_defaultValue) {
  var value = this.obj_[key];
  if (value === undefined) {
    value = opt_defaultValue;
  } else {
    goog.asserts.assert(goog.isNumber(value));
  }
  return value;
};


/**
 * Sets the value of the number option with the given key.
 * @param {string} key Option key.
 * @param {number|undefined} value New value or undefined to remove.
 */
wtf.util.Options.prototype.setNumber = function(key, value) {
  this.setValue_(key, value);
};


/**
 * Gets the string option with the given key.
 * @param {string} key Option key.
 * @param {string} defaultValue Default value.
 * @return {string} The value.
 */
wtf.util.Options.prototype.getString = function(key, defaultValue) {
  var value = this.obj_[key];
  if (value === undefined) {
    value = defaultValue;
  } else {
    goog.asserts.assert(goog.isString(value));
  }
  return value;
};


/**
 * Gets the string option with the given key.
 * @param {string} key Option key.
 * @param {string=} opt_defaultValue Default value, if any.
 * @return {string|undefined} The value, if defined.
 */
wtf.util.Options.prototype.getOptionalString = function(key, opt_defaultValue) {
  var value = this.obj_[key];
  if (value === undefined) {
    value = opt_defaultValue;
  } else {
    goog.asserts.assert(goog.isString(value));
  }
  return value;
};


/**
 * Sets the value of the string option with the given key.
 * @param {string} key Option key.
 * @param {string|undefined} value New value or undefined to remove.
 */
wtf.util.Options.prototype.setString = function(key, value) {
  this.setValue_(key, value);
};
