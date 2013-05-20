/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Custom write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.CustomCloseFunction');
goog.provide('wtf.io.CustomFlushFunction');
goog.provide('wtf.io.CustomWriteFunction');
goog.provide('wtf.io.CustomWriteStream');
goog.provide('wtf.io.CustomWriteStreamTarget');

goog.require('goog.asserts');
goog.require('wtf.io.WriteStream');


/**
 * Custom write function.
 * Receives a byte array and the valid length of the byte array. If the write is
 * synchronous then the function should return true. Otherwise, the function
 * must call the buffer return function when it completes.
 * @typedef {function(!wtf.io.ByteArray, number, !Object,
 *     function()):boolean}
 */
wtf.io.CustomWriteFunction;


/**
 * @typedef {function()}
 */
wtf.io.CustomFlushFunction;


/**
 * @typedef {function()}
 */
wtf.io.CustomCloseFunction;


/**
 * @typedef {{
 *   write: !wtf.io.CustomWriteFunction,
 *   flush: wtf.io.CustomFlushFunction,
 *   close: wtf.io.CustomCloseFunction
 * }}
 */
wtf.io.CustomWriteStreamTarget;



/**
 * Custom write stream.
 * Proxies calls to a user object. The given object must have three methods:
 * 'write', 'flush', and 'close'.
 *
 * @param {!wtf.io.CustomWriteStreamTarget} target Target object.
 * @constructor
 * @extends {wtf.io.WriteStream}
 */
wtf.io.CustomWriteStream = function(target) {
  goog.base(this);

  goog.asserts.assert(target['write']);

  /**
   * Target custom user object.
   * @type {!wtf.io.CustomWriteStreamTarget}
   * @private
   */
  this.target_ = target;
};
goog.inherits(wtf.io.CustomWriteStream, wtf.io.WriteStream);


/**
 * @override
 */
wtf.io.CustomWriteStream.prototype.disposeInternal = function() {
  if (this.target_['close']) {
    this.target_['close']();
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.io.CustomWriteStream.prototype.write = function(
    buffer, returnBufferCallback, opt_selfObj) {
  this.target_['write'](
      buffer.data, buffer.offset,
      function() {
        returnBufferCallback.call(opt_selfObj, buffer);
      });
};


/**
 * @override
 */
wtf.io.CustomWriteStream.prototype.flush = function() {
  if (this.target_['flush']) {
    this.target_['flush']();
  }
};
