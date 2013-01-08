/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview View and selection state.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.doc.View');

goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * View and selection state.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.doc.View = function() {
  goog.base(this);

  // TODO(benvanik): collaborator info

  /**
   * Time the view starts at.
   * @type {number}
   * @private
   */
  this.timeStart_ = 0;

  /**
   * Time the view ends at.
   * @type {number}
   * @private
   */
  this.timeEnd_ = 0;
};
goog.inherits(wtf.doc.View, wtf.events.EventEmitter);


/**
 * Gets the time the view starts at.
 * @return {number} Wall time.
 */
wtf.doc.View.prototype.getVisibleTimeStart = function() {
  return this.timeStart_;
};


/**
 * Gets the time the view ends at.
 * @return {number} Time.
 */
wtf.doc.View.prototype.getVisibleTimeEnd = function() {
  return this.timeEnd_;
};


/**
 * Sets the visible time range.
 * @param {number} timeStart Start time.
 * @param {number} timeEnd End time.
 * @param {boolean=} opt_immediate Immediately set the range - don't animate.
 */
wtf.doc.View.prototype.setVisibleRange = function(timeStart, timeEnd,
    opt_immediate) {
  if (this.timeStart_ == timeStart && this.timeEnd_ == timeEnd) {
    return;
  }
  this.timeStart_ = timeStart;
  this.timeEnd_ = timeEnd;

  this.invalidate(opt_immediate);
};


/**
 * Notifies the view that events in its range have been modified.
 * @param {boolean=} opt_immediate Immediately set the range - don't animate.
 */
wtf.doc.View.prototype.invalidate = function(opt_immediate) {
  this.emitEvent(wtf.events.EventType.INVALIDATED, opt_immediate || false);
};
