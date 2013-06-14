/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Embedded resource chunk part.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.parts.BinaryResourcePart');
goog.provide('wtf.io.cff.parts.ResourcePart');
goog.provide('wtf.io.cff.parts.StringResourcePart');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('wtf.io');
goog.require('wtf.io.Blob');
goog.require('wtf.io.cff.Part');
goog.require('wtf.io.cff.PartType');



/**
 * Abstract base type for parts containing an embedded data resource.
 *
 * @param {wtf.io.cff.PartType} partType Part type.
 * @constructor
 * @extends {wtf.io.cff.Part}
 */
wtf.io.cff.parts.ResourcePart = function(partType) {
  goog.base(this, partType);
};
goog.inherits(wtf.io.cff.parts.ResourcePart, wtf.io.cff.Part);



/**
 * String embedded data resource part.
 *
 * @param {string=} opt_value Initial value.
 * @constructor
 * @extends {wtf.io.cff.parts.ResourcePart}
 */
wtf.io.cff.parts.StringResourcePart = function(opt_value) {
  goog.base(this, wtf.io.cff.PartType.STRING_RESOURCE);

  /**
   * Resource value.
   * @type {?string}
   * @private
   */
  this.value_ = opt_value || null;
};
goog.inherits(wtf.io.cff.parts.StringResourcePart,
    wtf.io.cff.parts.ResourcePart);


/**
 * Gets the resource value.
 * @return {string} Resource value.
 */
wtf.io.cff.parts.StringResourcePart.prototype.getValue = function() {
  goog.asserts.assert(this.value_);
  return this.value_;
};


/**
 * Sets the resource value.
 * @param {string} value Resource value.
 */
wtf.io.cff.parts.StringResourcePart.prototype.setValue = function(value) {
  this.value_ = value;
};


/**
 * @override
 */
wtf.io.cff.parts.StringResourcePart.prototype.initFromBlobData = function(
    data) {
  var deferred = new goog.async.Deferred();

  var blob = wtf.io.Blob.create([data]);
  blob.readAsText(function(value) {
    this.value_ = value;
    deferred.callback(this);
  }, this);

  return deferred;
};


/**
 * @override
 */
wtf.io.cff.parts.StringResourcePart.prototype.toBlobData = function() {
  return this.value_ || '';
};


/**
 * @override
 */
wtf.io.cff.parts.StringResourcePart.prototype.initFromJsonObject = function(
    value) {
  this.value_ = value['value'];
};


/**
 * @override
 */
wtf.io.cff.parts.StringResourcePart.prototype.toJsonObject = function() {
  return {
    'type': this.getType(),
    'value': this.value_
  };
};



/**
 * Binary embedded data resource part.
 *
 * @param {(wtf.io.Blob|Blob|ArrayBufferView)=} opt_value Initial value.
 * @constructor
 * @extends {wtf.io.cff.parts.ResourcePart}
 */
wtf.io.cff.parts.BinaryResourcePart = function(opt_value) {
  goog.base(this, wtf.io.cff.PartType.BINARY_RESOURCE);

  /**
   * Resource value.
   * @type {wtf.io.Blob|Blob|ArrayBufferView}
   * @private
   */
  this.value_ = opt_value || null;
};
goog.inherits(wtf.io.cff.parts.BinaryResourcePart,
    wtf.io.cff.parts.ResourcePart);


/**
 * Gets the resource value.
 * @return {!(wtf.io.Blob|Blob|ArrayBufferView)} Resource value.
 */
wtf.io.cff.parts.BinaryResourcePart.prototype.getValue = function() {
  goog.asserts.assert(this.value_);
  return this.value_;
};


/**
 * Sets the resource value.
 * @param {!(wtf.io.Blob|Blob|ArrayBufferView)} value Resource value.
 */
wtf.io.cff.parts.BinaryResourcePart.prototype.setValue = function(value) {
  this.value_ = value;
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryResourcePart.prototype.initFromBlobData = function(
    data) {
  if (data instanceof Blob ||
      wtf.io.Blob.isBlob(data)) {
    this.value_ = data;
  } else {
    // NOTE: cloning so that we don't hang on to the full buffer forever.
    this.value_ = new Uint8Array(data.byteLength);
    this.value_.set(data);
  }
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryResourcePart.prototype.toBlobData = function() {
  goog.asserts.assert(this.value_);
  return this.value_;
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryResourcePart.prototype.initFromJsonObject = function(
    value) {
  switch (value['mode']) {
    case 'base64':
      var byteLength = value['byteLength'] || 0;
      var bytes = wtf.io.createByteArray(byteLength);
      wtf.io.stringToByteArray(value['value'], bytes);
      this.value_ = bytes;
      break;
    default:
      throw 'JSON mode event data is not supported yet.';
  }
};


/**
 * @override
 */
wtf.io.cff.parts.BinaryResourcePart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);

  if (this.value_ instanceof Blob) {
    throw 'JSON encoding of blobs not yet done.';
  } else {
    // Base64 encode.
    var arrayBufferValue = /** @type {!ArrayBufferView} */ (this.value_);
    if (!(arrayBufferValue instanceof Uint8Array)) {
      arrayBufferValue = new Uint8Array(arrayBufferValue.buffer);
    }
    var base64bytes = wtf.io.byteArrayToString(arrayBufferValue);
    return {
      'type': this.getType(),
      'mode': 'base64',
      'byteLength': arrayBufferValue.byteLength,
      'value': base64bytes
    };
  }
};
