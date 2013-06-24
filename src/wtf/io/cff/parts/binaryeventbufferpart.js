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

goog.provide('wtf.io.cff.parts.BinaryEventBufferPart');

goog.require('goog.asserts');
goog.require('wtf.io');
goog.require('wtf.io.BufferView');
goog.require('wtf.io.cff.Part');
goog.require('wtf.io.cff.PartType');



/**
 * A part containing event data.
 *
 * @param {wtf.io.BufferView.Type=} opt_value Initial event buffer data.
 * @constructor
 * @extends {wtf.io.cff.Part}
 */
wtf.io.cff.parts.BinaryEventBufferPart = function(opt_value) {
  goog.base(this, wtf.io.cff.PartType.BINARY_EVENT_BUFFER);

  /**
   * Event buffer.
   * @type {wtf.io.BufferView.Type?}
   * @private
   */
  this.value_ = opt_value || null;
};
goog.inherits(wtf.io.cff.parts.BinaryEventBufferPart, wtf.io.cff.Part);


/**
 * Gets the event buffer data.
 * @return {wtf.io.BufferView.Type?} Event buffer, if any.
 */
wtf.io.cff.parts.BinaryEventBufferPart.prototype.getValue = function() {
  return this.value_;
};


/**
 * Sets the event buffer data.
 * @param {wtf.io.BufferView.Type?} value Event buffer data.
 */
wtf.io.cff.parts.BinaryEventBufferPart.prototype.setValue = function(value) {
  this.value_ = value;
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryEventBufferPart.prototype.initFromBlobData =
    function(data) {
  // NOTE: we are cloning so that we don't hang on to the full buffer forever.
  this.value_ = wtf.io.BufferView.createCopy(data);
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryEventBufferPart.prototype.toBlobData = function() {
  goog.asserts.assert(this.value_);
  return wtf.io.BufferView.getUsedBytes(this.value_, true);
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryEventBufferPart.prototype.initFromJsonObject = function(
    value) {
  switch (value['mode']) {
    case 'base64':
      var byteLength = value['byteLength'] || 0;
      var bytes = wtf.io.createByteArray(byteLength);
      wtf.io.stringToByteArray(value['value'], bytes);
      this.value_ = wtf.io.BufferView.createWithBuffer(bytes.buffer);
      break;
    default:
      throw 'JSON mode event data is not supported yet.';
  }
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryEventBufferPart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);

  // Grab only the interesting region.
  // TODO(benvanik): subregion base64 encoding to prevent this.
  var bytes = wtf.io.BufferView.getUsedBytes(this.value_, true);

  // Base64 encode.
  var base64bytes = wtf.io.byteArrayToString(bytes);

  return {
    'type': this.getType(),
    'mode': 'base64',
    'byteLength': bytes.length,
    'value': base64bytes
  };
};
