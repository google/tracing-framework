/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Browser setInterval-based timer handle.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.timing.BrowserInterval');

goog.require('wtf.timing.Handle');



/**
 * Browser interval handle/tracking object.
 * @param {function(number): void} func Pre-bound callback function.
 * @param {number} delay Number of milliseconds to wait between callbacks.
 * @constructor
 * @extends {wtf.timing.Handle}
 */
wtf.timing.BrowserInterval = function(func, delay) {
  goog.base(this, func);

  var setInterval = goog.global.setInterval['raw'] || goog.global.setInterval;
  var self = this;
  /**
   * @type {?number}
   * @private
   */
  this.intervalId_ = setInterval.call(goog.global, function() {
    self.callback();
  }, delay);
};
goog.inherits(wtf.timing.BrowserInterval, wtf.timing.Handle);


/**
 * @override
 */
wtf.timing.BrowserInterval.prototype.clear = function() {
  var clearInterval = goog.global.clearInterval['raw'] ||
      goog.global.clearInterval;
  clearInterval.call(goog.global, this.intervalId_);
  this.intervalId_ = null;
  goog.base(this, 'clear');
};
