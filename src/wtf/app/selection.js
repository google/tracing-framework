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

goog.provide('wtf.app.Selection');

goog.require('wtf.db.EventStatistics');
goog.require('wtf.db.Filter');
goog.require('wtf.db.FilterResult');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Selection and filtering state.
 * @param {!wtf.db.Database} db Event database.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.app.Selection = function(db) {
  goog.base(this);

  /**
   * Wall-time the selection starts at.
   * This may be -{@code Number.MAX_VALUE}.
   * @type {number}
   * @private
   */
  this.timeStart_ = -Number.MAX_VALUE;

  /**
   * Time the selection ends at.
   * This may be {@code Number.MAX_VALUE}.
   * @type {number}
   * @private
   */
  this.timeEnd_ = Number.MAX_VALUE;

  /**
   * Filter expression.
   * @type {!wtf.db.Filter}
   * @private
   */
  this.filter_ = new wtf.db.Filter();

  /**
   * Cached event data table.
   * This is regenerated on demand as the selection changes.
   * @type {!wtf.db.EventStatistics}
   * @private
   */
  this.eventStatistics_ = new wtf.db.EventStatistics(db);
  this.registerDisposable(this.eventStatistics_);

  /**
   * The statistics table for the current selection filtered by the current
   * filter, if needed.
   * @type {wtf.db.EventStatistics.Table}
   * @private
   */
  this.filteredTable_ = null;

  db.addListener(
      wtf.events.EventType.INVALIDATED, this.invalidate_, this);
  this.invalidate_();
};
goog.inherits(wtf.app.Selection, wtf.events.EventEmitter);


/**
 * Whether the current selection is entirely empty (no time/filter specified).
 * @return {boolean} True if no time range or filter is active.
 */
wtf.app.Selection.prototype.isEmpty = function() {
  return !this.hasTimeRangeSpecified() && !this.hasFilterSpecified();
};


/**
 * Clears the entire selection.
 */
wtf.app.Selection.prototype.clear = function() {
  var changed = false;
  if (this.hasTimeRangeSpecified()) {
    this.clearTimeRange();
    changed = true;
  }
  if (this.hasFilterSpecified()) {
    this.clearFilterExpression();
    changed = true;
  }
  if (changed) {
    this.invalidate_();
  }
};


/**
 * Gets a value indicating whether a time range has been specified in the
 * selection.
 * @return {boolean} True if a time range is specified.
 */
wtf.app.Selection.prototype.hasTimeRangeSpecified = function() {
  return this.timeStart_ != -Number.MAX_VALUE &&
      this.timeEnd_ != Number.MAX_VALUE;
};


/**
 * Gets the start time of the selection.
 * If there is none specified the value will be -{@code Number.MAX_VALUE}.
 * @return {number} Selection start or {@code Number.MAX_VALUE}.
 */
wtf.app.Selection.prototype.getTimeStart = function() {
  return this.timeStart_;
};


/**
 * Gets the end time of the selection.
 * If there is none specified the value will be {@code Number.MAX_VALUE}.
 * @return {number} Selection end or {@code Number.MAX_VALUE}.
 */
wtf.app.Selection.prototype.getTimeEnd = function() {
  return this.timeEnd_;
};


/**
 * Sets the selection time range.
 * @param {number} timeStart Start time.
 * @param {number} timeEnd End time.
 */
wtf.app.Selection.prototype.setTimeRange = function(timeStart, timeEnd) {
  if (this.timeStart_ == timeStart && this.timeEnd_ == timeEnd) {
    return;
  }
  this.timeStart_ = timeStart;
  this.timeEnd_ = timeEnd;
  this.invalidate_();
};


/**
 * Clears the active selection time range.
 */
wtf.app.Selection.prototype.clearTimeRange = function() {
  this.setTimeRange(-Number.MAX_VALUE, Number.MAX_VALUE);
};


/**
 * Gets the underlying filter object.
 * @return {!wtf.db.Filter} Filter.
 */
wtf.app.Selection.prototype.getFilter = function() {
  return this.filter_;
};


/**
 * Gets a value indicating whether a filter expression is specified.
 * @return {boolean} True if a filter expression is specified.
 */
wtf.app.Selection.prototype.hasFilterSpecified = function() {
  return this.filter_.isActive();
};


/**
 * Sets the expression string used by the filter.
 * This may fail, in which case the filter is not changed and the function
 * returns false.
 * @param {string} value Expression.
 * @return {boolean} True if the filter parsed and was set.
 */
wtf.app.Selection.prototype.setFilterExpression = function(value) {
  var result = this.filter_.setFromString(value);
  switch (result) {
    case wtf.db.FilterResult.UPDATED:
      this.invalidate_();
      return true;
    case wtf.db.FilterResult.FAILED:
      return false;
    default:
    case wtf.db.FilterResult.NO_CHANGE:
      return true;
  }
};


/**
 * Clears the current filter expression.
 */
wtf.app.Selection.prototype.clearFilterExpression = function() {
  if (this.filter_.clear() == wtf.db.FilterResult.UPDATED) {
    this.invalidate_();
  }
};


/**
 * Computes an event data table for the full database.
 * This will return the same value on subsequent calls if the database has
 * not changed. Do not retain the returned value beyond the calling scope.
 * @return {!wtf.db.EventStatistics.Table} Event data table.
 */
wtf.app.Selection.prototype.getFullStatistics = function() {
  return this.eventStatistics_.getTable();
};


/**
 * Computes an event data table for the current selection.
 * This will return the same value on subsequent calls if the selection has
 * not changed. Do not retain the returned value beyond the calling scope.
 * @return {!wtf.db.EventStatistics.Table} Event data table.
 */
wtf.app.Selection.prototype.getSelectionStatistics = function() {
  if (!this.filteredTable_) {
    var table = this.eventStatistics_.getTable(this.timeStart_, this.timeEnd_);
    if (this.hasFilterSpecified()) {
      this.filteredTable_ = table.filter(this.filter_);
    } else {
      this.filteredTable_ = table;
    }
  }
  return this.filteredTable_;
};


/**
 * Emits an invalidation event.
 * @private
 */
wtf.app.Selection.prototype.invalidate_ = function() {
  this.filteredTable_ = null;
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
