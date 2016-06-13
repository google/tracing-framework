/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Cross-environment blob wrapper.
 * This has an implementation of both a browser-native Blob wrapper and a
 * node.js Blob type built on top of Buffers.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.Blob');

goog.require('goog.asserts');
goog.require('goog.userAgent.product');
goog.require('wtf');



/**
 * Blob interface.
 * Do not use this constructor directly, but instead create blobs using
 * {@see wtf.io#createBlob}.
 * @interface
 */
wtf.io.Blob = function() {};


/**
 * Gets the size of the blob, in bytes.
 * @return {number} Size, in bytes.
 */
wtf.io.Blob.prototype.getSize = goog.nullFunction;


/**
 * Gets the content type of the blob.
 * @return {string} Content type, or the empty string.
 */
wtf.io.Blob.prototype.getType = goog.nullFunction;


/**
 * Slices a blob and returns a new blob that is a copy of that data.
 * @param {number=} opt_start Start offset, inclusive, or the start of the blob.
 * @param {number=} opt_end End offset, exclusive, or the end of the blob.
 * @param {string=} opt_contentType Content type of the returned blob.
 * @return {!wtf.io.Blob} New blob.
 */
wtf.io.Blob.prototype.slice = goog.nullFunction;


/**
 * Closes the blob object.
 * The blob cannot be used after calling this method.
 */
wtf.io.Blob.prototype.close = goog.nullFunction;


/**
 * Reads the entire blob contents as an ArrayBuffer.
 * @param {!function(this:T, ArrayBuffer)} callback Callback that receives the
 *     array buffer value. If the conversion fails a null value is passed.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.io.Blob.prototype.readAsArrayBuffer = goog.nullFunction;


/**
 * Reads the entire blob contents as a text string.
 * @param {!function(this:T, string?)} callback Callback that receives the
 *     string value. If the conversion fails a null value is passed.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.io.Blob.prototype.readAsText = goog.nullFunction;


/**
 * Returns the native object wrapped by this blob.
 * @return {Object} Blob object.
 */
wtf.io.Blob.prototype.toNative = goog.nullFunction;


/**
 * Creates a blob from the given blob parts.
 * @param {!Array.<ArrayBuffer|ArrayBufferView|wtf.io.Blob|Blob|string>} parts
 *     Blob parts that will be concatenated into the new blob.
 * @param {{type: string}=} opt_options Options.
 * @return {!wtf.io.Blob} New blob.
 */
wtf.io.Blob.create = function(parts, opt_options) {
  if (wtf.NODE) {
    var result = new wtf.io.NodeBlob_();
    result.init(parts, opt_options);
    return result;
  } else {
    var result = new wtf.io.BrowserBlob_();
    result.init(parts, opt_options);
    return result;
  }
};


/**
 * Determines whether the given value is a blob.
 * @param {*} value Value to test.
 * @return {boolean} True if the value is a blob.
 */
wtf.io.Blob.isBlob = function(value) {
  if (wtf.NODE) {
    return value instanceof wtf.io.NodeBlob_;
  } else {
    return value instanceof wtf.io.BrowserBlob_;
  }
};


/**
 * Wraps a native blob object without copying the data.
 * @param {!(Blob|Buffer)} value Source value.
 * @return {!wtf.io.Blob} A blob object.
 */
wtf.io.Blob.fromNative = function(value) {
  if (wtf.NODE) {
    return new wtf.io.NodeBlob_(/** @type {!Buffer} */ (value));
  } else {
    return new wtf.io.BrowserBlob_(/** @type {!Blob} */ (value));
  }
};


/**
 * Converts a blob to a platform native binary blob object.
 * This does not copy the data.
 * @param {!wtf.io.Blob} blob Blob value.
 * @return {!(Blob|Buffer)} Blob.
 */
wtf.io.Blob.toNative = function(blob) {
  if (wtf.NODE) {
    return blob.buffer_;
  } else {
    return blob.blob_;
  }
};


/**
 * Converts a list of blob parts into a list that contains native blobs.
 * This does not copy the data.
 * @param {!Array.<ArrayBufferView|Blob|wtf.io.Blob|string>} parts Parts.
 * @return {!Array.<ArrayBufferView|Blob|string>} Blob parts.
 */
wtf.io.Blob.toNativeParts = function(parts) {
  var result = new Array(parts.length);
  for (var n = 0; n < parts.length; n++) {
    var part = parts[n];
    if (wtf.io.Blob.isBlob(part)) {
      part = wtf.io.Blob.toNative(/** @type {!wtf.io.Blob} */ (part));
    } else {
      if (goog.userAgent.product.SAFARI &&
          part && part.buffer instanceof ArrayBuffer) {
        // Safari can't handle ArrayBufferView in Blob ctors, so we need to copy
        // our view (which is likely not the whole size of the buffer) to ensure
        // we write exactly what was requested.
        var source = new Uint8Array(
            part.buffer, part.byteOffset, part.byteLength);
        part = new Uint8Array(part.byteLength);
        for (var m = 0; m < part.byteLength; m++) {
          part[m] = source[m];
        }
        part = part.buffer;
      }

      // Some arbitrary combo of types can cause Chrome to sad tab. Converting
      // buffers to blobs may prevent this.
      // TODO(chihuahua): Remove this patch once this is resolved:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=619217
      part = new Blob([part]);
    }
    result[n] = part;
  }
  return result;
};



/**
 * A blob implementation for web browsers.
 * Use the {@see #init} method to initialize a new blob instance.
 * @param {Blob=} opt_existingBlob An existing browser blob to wrap.
 * @constructor
 * @implements {wtf.io.Blob}
 * @private
 */
wtf.io.BrowserBlob_ = function(opt_existingBlob) {
  /**
   * Underlying browser blob.
   * @type {Blob}
   * @private
   */
  this.blob_ = opt_existingBlob || null;
};


/**
 * Initializes a new blob.
 * @param {!Array.<ArrayBuffer|ArrayBufferView|wtf.io.Blob|Blob|string>} parts
 *     Blob parts that will be concatenated into the new blob.
 * @param {{type: string}=} opt_options Options.
 */
wtf.io.BrowserBlob_.prototype.init = function(parts, opt_options) {
  goog.asserts.assert(!this.blob_);
  parts = wtf.io.Blob.toNativeParts(parts);
  this.blob_ = new Blob(parts, opt_options || {});
};


/**
 * @override
 */
wtf.io.BrowserBlob_.prototype.getSize = function() {
  return this.blob_.size;
};


/**
 * @override
 */
wtf.io.BrowserBlob_.prototype.getType = function() {
  return this.blob_.type;
};


/**
 * @override
 */
wtf.io.BrowserBlob_.prototype.slice = function(
    opt_start, opt_end, opt_contentType) {
  var result;
  if (this.blob_['slice']) {
    result = this.blob_['slice'](opt_start, opt_end, opt_contentType);
  } else if (this.blob_['webkitSlice']) {
    result = this.blob_['webkitSlice'](opt_start, opt_end, opt_contentType);
  } else {
    throw new Error('No Blob slice method available on this browser.');
  }
  return new wtf.io.BrowserBlob_(result);
};


/**
 * @override
 */
wtf.io.BrowserBlob_.prototype.close = function() {
  // Not all browsers support the close() method, yet.
  if (this.blob_['close']) {
    this.blob_['close']();
  }
};


/**
 * @override
 */
wtf.io.BrowserBlob_.prototype.readAsArrayBuffer = function(
    callback, opt_scope) {
  goog.asserts.assert(this.blob_);
  if (!this.blob_.size) {
    callback.call(opt_scope, (new Uint8Array(0)).buffer);
    return;
  }

  var fileReader = new FileReader();
  fileReader.onload = function() {
    callback.call(opt_scope, /** @type {ArrayBuffer} */ (fileReader.result));
  };
  fileReader.readAsArrayBuffer(this.blob_);
};


/**
 * @override
 */
wtf.io.BrowserBlob_.prototype.readAsText = function(callback, opt_scope) {
  goog.asserts.assert(this.blob_);
  if (!this.blob_.size) {
    callback.call(opt_scope, '');
    return;
  }

  var fileReader = new FileReader();
  fileReader.onload = function() {
    callback.call(opt_scope, /** @type {?string} */ (fileReader.result));
  };
  fileReader.readAsText(this.blob_);
};


/**
 * @override
 */
wtf.io.BrowserBlob_.prototype.toNative = function() {
  return this.blob_;
};


goog.exportProperty(
    wtf.io.BrowserBlob_.prototype, 'toNative',
    wtf.io.BrowserBlob_.prototype.toNative);



/**
 * A blob implementation for node.js based on buffers.
 * Use the {@see #init} method to initialize a new blob instance.
 * @param {Buffer=} opt_buffer Existing buffer to wrap.
 * @constructor
 * @implements {wtf.io.Blob}
 * @private
 */
wtf.io.NodeBlob_ = function(opt_buffer) {
  /**
   * Underlying node.js binary buffer.
   * @type {Buffer}
   * @private
   */
  this.buffer_ = null;

  /**
   * Content type, or the empty string.
   * @type {string}
   * @private
   */
  this.contentType_ = '';
};


/**
 * Initializes a new blob.
 * @param {!Array.<ArrayBuffer|ArrayBufferView|wtf.io.Blob|Blob|string>} parts
 *     Blob parts that will be concatenated into the new blob.
 * @param {{type: string}=} opt_options Options.
 */
wtf.io.NodeBlob_.prototype.init = function(parts, opt_options) {
  goog.asserts.assert(!this.buffer_);

  if (!parts.length) {
    this.buffer_ = new Buffer(0);
  } else {
    // Compute size.
    var totalSize = 0;
    for (var n = 0; n < parts.length; n++) {
      var part = parts[n];
      if (part instanceof ArrayBuffer) {
        // Typed array.
        totalSize += part.byteLength;
      } else if (part.buffer && part.buffer instanceof ArrayBuffer) {
        // Uint8Array/etc.
        totalSize += part.byteLength;
      } else if (part instanceof wtf.io.NodeBlob_) {
        // Another blob.
        totalSize += part.getSize();
      } else if (typeof part == 'string') {
        // String.
        totalSize += Buffer.byteLength(part);
      } else {
        goog.asserts.fail('Unknown part type in Blob constructor.');
      }
    }

    // Create and add all parts.
    this.buffer_ = new Buffer(totalSize);
    var o = 0;
    for (var n = 0; n < parts.length; n++) {
      var part = parts[n];
      if (part instanceof ArrayBuffer) {
        // Typed array.
        // Need to wrap so we can get the bytes.
        var byteArray = new Uint8Array(part);
        for (var m = 0; m < byteArray.length; m++) {
          this.buffer_[o + m] = byteArray[m];
        }
        o += part.byteLength;
      } else if (part.buffer && part.buffer instanceof ArrayBuffer) {
        // Uint8Array/etc.
        for (var m = 0; m < part.length; m++) {
          this.buffer_[o + m] = part[m];
        }
        o += part.byteLength;
      } else if (part instanceof wtf.io.NodeBlob_) {
        // Another blob.
        part.buffer_.copy(this.buffer_, o);
        o += part.getSize();
      } else if (typeof part == 'string') {
        // String.
        o += this.buffer_.write(part, o);
      } else {
        goog.asserts.fail('Unknown part type in Blob constructor.');
      }
    }
  }

  this.contentType_ = (opt_options ? opt_options['type'] : '') || '';
};


/**
 * @override
 */
wtf.io.NodeBlob_.prototype.getSize = function() {
  return this.buffer_.length;
};


/**
 * @override
 */
wtf.io.NodeBlob_.prototype.getType = function() {
  return this.contentType_;
};


/**
 * @override
 */
wtf.io.NodeBlob_.prototype.slice = function(
    opt_start, opt_end, opt_contentType) {
  var size = this.buffer_.length;
  var relativeStart = goog.isDef(opt_start) ? opt_start : 0;
  if (relativeStart < 0) {
    relativeStart = Math.max(size + relativeStart, 0);
  } else {
    relativeStart = Math.min(relativeStart, size);
  }
  var relativeEnd = goog.isDef(opt_end) ? opt_end : size;
  if (relativeEnd < 0) {
    relativeEnd = Math.max(size + relativeEnd, 0);
  } else {
    relativeEnd = Math.min(relativeEnd, size);
  }
  var span = Math.max(relativeEnd - relativeStart, 0);

  var result = new wtf.io.NodeBlob_();
  result.buffer_ = new Buffer(span);
  this.buffer_.copy(result.buffer_, 0, relativeStart, relativeEnd);
  result.contentType_ = opt_contentType || '';
  return result;
};


/**
 * @override
 */
wtf.io.NodeBlob_.prototype.close = function() {
  // No-op.
};


/**
 * @override
 */
wtf.io.NodeBlob_.prototype.readAsArrayBuffer = function(
    callback, opt_scope) {
  var result = new Uint8Array(this.buffer_.length);
  for (var n = 0; n < this.buffer_.length; n++) {
    result[n] = this.buffer_[n];
  }

  // TODO(benvanik): make this async?
  callback.call(opt_scope, result.buffer);
};


/**
 * @override
 */
wtf.io.NodeBlob_.prototype.readAsText = function(callback, opt_scope) {
  var result = this.buffer_.toString();
  // TODO(benvanik): make this async?
  callback.call(opt_scope, result);
};


/**
 * @override
 */
wtf.io.NodeBlob_.prototype.toNative = function() {
  return this.buffer_;
};


goog.exportProperty(
    wtf.io.NodeBlob_.prototype, 'toNative',
    wtf.io.NodeBlob_.prototype.toNative);
