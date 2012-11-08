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

goog.require('goog.events');
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
   * Wall-time the view starts at.
   * @type {number}
   * @private
   */
  this.timeStart_ = 0;

  /**
   * Wall-time the view ends at.
   * @type {number}
   * @private
   */
  this.timeEnd_ = 0;

  /**
   * Whether there is an active selection.
   * @type {boolean}
   * @private
   */
  this.hasSelection_ = false;

  /**
   * Wall-time the selection starts at.
   * @type {number}
   * @private
   */
  this.selectionTimeStart_ = 0;

  /**
   * Wall-time the selection ends at.
   * @type {number}
   * @private
   */
  this.selectionTimeEnd_ = 0;
};
goog.inherits(wtf.doc.View, wtf.events.EventEmitter);


/**
 * Event types related to the object.
 * @enum {string}
 */
wtf.doc.View.EventType = {
  /**
   * Visible time range changed.
   */
  VISIBLE_RANGE_CHANGED: goog.events.getUniqueId('visible_range_changed'),

  /**
   * Selection time range changed.
   */
  SELECTION_RANGE_CHANGED: goog.events.getUniqueId('selection_range_changed')
};


/**
 * Gets the wall-time the view starts at.
 * @return {number} Wall time.
 */
wtf.doc.View.prototype.getVisibleTimeStart = function() {
  return this.timeStart_;
};


/**
 * Gets the wall-time the view ends at.
 * @return {number} Wall time.
 */
wtf.doc.View.prototype.getVisibleTimeEnd = function() {
  return this.timeEnd_;
};


/**
 * Sets the visible time range.
 * @param {number} timeStart Start time.
 * @param {number} timeEnd End time.
 */
wtf.doc.View.prototype.setVisibleRange = function(timeStart, timeEnd) {
  if (this.timeStart_ == timeStart && this.timeEnd_ == timeEnd) {
    return;
  }
  this.timeStart_ = timeStart;
  this.timeEnd_ = timeEnd;
  this.emitEvent(wtf.doc.View.EventType.VISIBLE_RANGE_CHANGED);
};


/**
 * Whether there is an active selection.
 * @return {boolean} True if there is a selection active.
 */
wtf.doc.View.prototype.hasSelection = function() {
  return this.hasSelection_;
};


/**
 * Gets the wall-time the selection starts at.
 * @return {number} Wall time.
 */
wtf.doc.View.prototype.getSelectionStart = function() {
  return this.selectionTimeStart_;
};


/**
 * Gets the wall-time the selection ends at.
 * @return {number} Wall time.
 */
wtf.doc.View.prototype.getSelectionEnd = function() {
  return this.selectionTimeEnd_;
};


/**
 * Sets the selection time range.
 * @param {number} timeStart Start time.
 * @param {number} timeEnd End time.
 */
wtf.doc.View.prototype.setSelectionRange = function(timeStart, timeEnd) {
  if (this.hasSelection_ &&
      this.selectionTimeStart_ == timeStart &&
      this.selectionTimeEnd_ == timeEnd) {
    return;
  }
  this.hasSelection_ = true;
  this.selectionTimeStart_ = timeStart;
  this.selectionTimeEnd_ = timeEnd;
  this.emitEvent(wtf.doc.View.EventType.SELECTION_RANGE_CHANGED);
};


/**
 * Clears the active selection.
 */
wtf.doc.View.prototype.clearSelection = function() {
  this.hasSelection_ = false;
};


/**
 * Notifies the view that events in its range have been modified.
 */
wtf.doc.View.prototype.invalidate = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
