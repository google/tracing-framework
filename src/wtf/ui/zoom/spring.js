/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Animation spring used in the zoom viewport.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.zoom.Spring');

goog.require('wtf');



/**
 * Derivative-based critically damped spring.
 * @param {number} value Default value.
 * @constructor
 */
wtf.ui.zoom.Spring = function(value) {
  /**
   * @type {number}
   */
  this.target = value;

  /**
   * @type {number}
   */
  this.current = value;

  /**
   * @type {number}
   * @private
   */
  this.velocity_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.lastTime_ = 0;

  /**
   * @type {boolean}
   * @private
   */
  this.dirty_ = true;
};


/**
 * Immediately sets the spring value.
 * @param {number} value New value.
 * @param {boolean=} opt_clean Mark as clean.
 */
wtf.ui.zoom.Spring.prototype.set = function(value, opt_clean) {
  if (this.target == value) {
    return;
  }
  this.target = value;
  this.current = value;
  this.velocity_ = 0;
  this.lastTime_ = wtf.now();
  if (!opt_clean) {
    this.dirty_ = true;
  } else {
    this.dirty_ = false;
  }
};


/**
 * Begins an animated spring.
 * @param {number} value New value.
 */
wtf.ui.zoom.Spring.prototype.animate = function(value) {
  this.target = value;
  if (!this.dirty_) {
    this.velocity_ = 0;
    this.lastTime_ = wtf.now();
  }
  this.dirty_ = true;
};


/**
 * Stops any animation and holds at the current value.
 */
wtf.ui.zoom.Spring.prototype.stop = function() {
  this.set(this.current);
};


/**
 * Spring duration.
 * The higher the value the longer the animation.
 * @const
 * @type {number}
 * @private
 */
wtf.ui.zoom.Spring.DURATION_ = 2;


/**
 * Difference under which two values are considered equal.
 * @const
 * @type {number}
 * @private
 */
wtf.ui.zoom.Spring.EQUAL_THRESHOLD_ = 0.00001;


/**
 * Updates the spring value based on the current time.
 * @param {number} time Current time.
 * @return {boolean} Whether the spring is changing.
 */
wtf.ui.zoom.Spring.prototype.update = function(time) {
  // This function tracks dirty state, timing information, and other state.
  // It's nasty, but ensures that things draw when they should and stop as soon
  // as they can.
  // The actual math in this function is a critically damped spring, meaning
  // that it doesn't bounce. I hobbled it together from various sources on the
  // web and the constants are empircally chosen.
  // For an example of the code, see: http://stackoverflow.com/a/5108560

  // Skip if not dirty.
  if (!this.dirty_) {
    return false;
  }

  // If we have reached the target, set done.
  if (this.current == this.target) {
    this.dirty_ = false;
    return true;
  }

  // Compute timestep.
  // Check for the case when no time elapses.
  var lastTime = this.lastTime_;
  this.lastTime_ = time;
  var dt = (time - lastTime) * wtf.ui.zoom.Spring.DURATION_;
  if (dt <= 0) {
    return true;
  }

  // Spring logic.
  // See: http://stackoverflow.com/a/5108560
  var Ki = 0.0020;
  var Kp = 0.5;
  this.velocity_ += Ki * (this.target - this.current) + Kp * -this.velocity_;

  // Clamp velocity to prevent bouncing.
  var dvalue = this.current - this.target;
  var dvelocity = this.velocity_ * dt;
  if (((dvelocity > 0) && (-dvalue > 0) && (-dvalue < dvelocity)) ||
      ((dvelocity < 0) && (-dvalue < 0) && (-dvalue > dvelocity))) {
    dvelocity = -dvalue;
    this.velocity_ = 0;
  }
  this.current += dvelocity;

  // Check for completion.
  // This is a fuzzy check to prevent the infinite approach towards the target.
  // TODO(benvanik): this is buggy and can sometimes produce bad results when
  //     the source/target are very small/very large numbers.
  var updateChange = Math.abs(this.target - this.current);
  var velocityChange = Math.abs(dvelocity);
  if (updateChange < wtf.ui.zoom.Spring.EQUAL_THRESHOLD_ &&
      velocityChange < wtf.ui.zoom.Spring.EQUAL_THRESHOLD_) {
    this.current = this.target;
    this.lastTime_ = -1;
    this.dirty_ = false;
  }

  return true;
};
