/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event data buffer chunk part.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.parts.JsonEventBufferPart');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('wtf.io.Blob');
goog.require('wtf.io.cff.Part');
goog.require('wtf.io.cff.PartType');



/**
 * A part containing event data.
 * The event data is stored in JSON format and follows the JSON parsing rules.
 * See the {@code wtf-json.md} docs for more information.
 *
 * @param {Array=} opt_value Initial event buffer data.
 * @constructor
 * @extends {wtf.io.cff.Part}
 */
wtf.io.cff.parts.JsonEventBufferPart = function(opt_value) {
  goog.base(this, wtf.io.cff.PartType.JSON_EVENT_BUFFER);

  /**
   * Event buffer.
   * @type {Array}
   * @private
   */
  this.value_ = opt_value || null;
};
goog.inherits(wtf.io.cff.parts.JsonEventBufferPart, wtf.io.cff.Part);


/**
 * Gets the event buffer data.
 * @return {Array} Event buffer, if any.
 */
wtf.io.cff.parts.JsonEventBufferPart.prototype.getValue = function() {
  return this.value_;
};


/**
 * Sets the event buffer data.
 * @param {Array} value Event buffer data.
 */
wtf.io.cff.parts.JsonEventBufferPart.prototype.setValue = function(value) {
  this.value_ = value;
};


/**
 * @override
 */
wtf.io.cff.parts.JsonEventBufferPart.prototype.initFromBlobData =
    function(data) {
  var deferred = new goog.async.Deferred();

  var blob = wtf.io.Blob.create([data]);
  blob.readAsText(function(value) {
    value = value ? goog.global.JSON.parse(value) : null;
    if (!value || goog.isArray(value)) {
      this.value_ = /** @type {Array} */ (value);
      deferred.callback(this);
    } else {
      deferred.errback(new Error('Unable to parse event buffer JSON.'));
    }
  }, this);

  return deferred;
};


/**
 * @override
 */
wtf.io.cff.parts.JsonEventBufferPart.prototype.toBlobData = function() {
  var value = goog.global.JSON.stringify(this.value_);
  var blob = wtf.io.Blob.create([value]);
  return blob;
};


/**
 * @override
 */
wtf.io.cff.parts.JsonEventBufferPart.prototype.initFromJsonObject = function(
    value) {
  this.value_ = value['events'] || null;
};


/**
 * @override
 */
wtf.io.cff.parts.JsonEventBufferPart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);
  return {
    'type': this.getType(),
    'events': this.value_
  };
};
