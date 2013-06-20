/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Render timer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.timing.RenderTimer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('wtf');
goog.require('wtf.timing.RenderInterval');
goog.require('wtf.timing.util');



/**
 * Coalescing timer pump for render events.
 * Uses {@code requestAnimationFrame} or {@code setInterval} to provide
 * a periodic interval for rendering. Multiple intervals will be dispatched
 * on the same tick, with the same time, in the order they were added.
 *
 * @constructor
 */
wtf.timing.RenderTimer = function() {
  /**
   * All active intervals.
   * @type {!Array.<!wtf.timing.RenderInterval>}
   * @private
   */
  this.intervals_ = [];

  /**
   * Bound browser request animation frame, if available.
   * Note that the return will be undefined if the browser does not support
   * cancelRequestAnimationFrame.
   * @private
   * @type {?function(Function):(number|undefined)}
   */
  this.browserRequestAnimationFrame_ =
      wtf.timing.util.getRequestAnimationFrame();

  /**
   * Bound browser cancel request animation frame, if available.
   * Note that even if a browser has requestAnimationFrame they may not
   * implement cancelRequestAnimationFrame. No-op the function instead.
   * @type {?function(number):void}
   * @private
   */
  this.browserCancelAnimationFrame_ =
      wtf.timing.util.getCancelAnimationFrame() ||
      goog.nullFunction;

  /**
   * Browser requestAnimationFrame ID, if used.
   * @private
   * @type {?number}
   */
  this.browserRequestAnimationId_ = null;

  /**
   * Browser interval ID, if used.
   * @private
   * @type {?number}
   */
  this.browserIntervalId_ = null;

  /**
   * Bound {@see wtf.timing.RenderTimer#requestAnimationFrameTick_} function.
   * @type {function(number):void}
   * @private
   */
  this.boundRequestAnimationFrameTick_ =
      goog.bind(this.requestAnimationFrameTick_, this);

  /**
   * Bound {@see wtf.timing.RenderTimer#intervalTick_} function.
   * @type {function():void}
   * @private
   */
  this.boundIntervalTick_ = goog.bind(this.intervalTick_, this);
};


/**
 * Callback for requestAnimationFrame intervals.
 * @param {number} time Current time.
 * @private
 */
wtf.timing.RenderTimer.prototype.requestAnimationFrameTick_ = function(time) {
  // Copy the interval list to support callbacks that may call clear.
  var intervals = this.intervals_.slice();
  for (var n = 0; n < intervals.length; n++) {
    intervals[n].callback(time);
  }

  if (this.intervals_.length) {
    // If any intervals are still left, schedule again.
    this.browserRequestAnimationId_ = this.browserRequestAnimationFrame_(
        this.boundRequestAnimationFrameTick_) || 1;
  }
};


/**
 * Callback for browser intervals.
 * @private
 */
wtf.timing.RenderTimer.prototype.intervalTick_ = function() {
  // Grab time first to ensure constant timing in all callbacks.
  var time = wtf.now();

  // Copy the interval list to support callbacks that may call clear.
  var intervals = this.intervals_.slice();
  for (var n = 0; n < intervals.length; n++) {
    intervals[n].callback(time);
  }
};


/**
 * Starts a new interval.
 * @param {function(number):void} func Callback issued on every interval tick
 *     and supplied with the current time.
 * @return {!wtf.timing.RenderInterval} New interval handle.
 */
wtf.timing.RenderTimer.prototype.setInterval = function(func) {
  var interval = new wtf.timing.RenderInterval(func);
  this.intervals_.push(interval);

  if (this.intervals_.length == 1) {
    if (this.browserRequestAnimationFrame_) {
      goog.asserts.assert(this.browserRequestAnimationId_ === null);
      this.browserRequestAnimationId_ = this.browserRequestAnimationFrame_(
          this.boundRequestAnimationFrameTick_) || 1;
    } else {
      goog.asserts.assert(this.browserIntervalId_ === null);
      var setInterval = goog.global.setInterval['raw'] ||
          goog.global.setInterval;
      this.browserIntervalId_ = setInterval(this.boundIntervalTick_,
          1000 / wtf.timing.util.FRAMERATE);
    }
  }

  return interval;
};


/**
 * Clears an active interval.
 * @param {!wtf.timing.RenderInterval} interval Interval handle to clear.
 */
wtf.timing.RenderTimer.prototype.clearInterval = function(interval) {
  interval.clear();
  goog.array.remove(this.intervals_, interval);

  if (!this.intervals_.length) {
    if (this.browserRequestAnimationFrame_) {
      goog.asserts.assert(this.browserRequestAnimationId_ !== null);
      this.browserCancelAnimationFrame_(/** @type {number} */ (
          this.browserRequestAnimationId_));
      this.browserRequestAnimationId_ = null;
    } else {
      goog.asserts.assert(this.browserIntervalId_ !== null);
      var clearInterval = goog.global.clearInterval['raw'] ||
          goog.global.clearInterval;
      clearInterval.call(goog.global, this.browserIntervalId_);
      this.browserIntervalId_ = null;
    }
  }
};
