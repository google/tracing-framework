/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Base timer handle type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


goog.provide('wtf.timing.Handle');

goog.require('goog.asserts');



/**
 * Base timing handle/tracking object.
 * @param {Function} func Callback function.
 * @constructor
 */
wtf.timing.Handle = function(func) {
  /**
   * @type {?Function}
   * @private
   */
  this.func_ = func;
};


/**
 * Issues the interval callback function.
 * @param {...*} var_args Arguments.
 */
wtf.timing.Handle.prototype.callback = function(var_args) {
  // Always check callback function - a previous callback this same tick could
  // have cleared this instance
  if (this.func_) {
    // Catch any exceptions so that other registered callbacks still run
    try {
      this.func_.apply(goog.global, arguments);
    } catch (e) {
      goog.asserts.fail('Unhandled exception in callback: ' + e);
    }
  }
};


/**
 * Clears the interval so that it will no longer be called.
 */
wtf.timing.Handle.prototype.clear = function() {
  this.func_ = null;
};
