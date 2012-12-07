/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Track filter mode.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.EventFilter');

goog.require('goog.string');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Event filter state manager.
 * An application wishing to filter things should create a filter and manipulate
 * it over the course of the run. An application can listen for events on the
 * filter to change UI/etc when the filter changes or may manually invalidate
 * themselves.
 *
 * Filters are used by getting an evaluator function via {@see #getEvaluator}
 * that events are passed to. The evaluator will return true if the event is
 * included in the filter and false otherwise. If there is no active evaluator
 * the return will be null and the caller should include all events.
 *
 * Evaluators can be set manually with {@see #setEvaluator} or can be
 * constructed from various sources, such as expression strings. See
 * {@see #setFromString} for more information.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.analysis.EventFilter = function() {
  goog.base(this);

  /**
   * String that the filter is based on.
   * @type {string}
   * @private
   */
  this.sourceString_ = '';

  /**
   * The last successfully parsed expression object.
   * @type {Object}
   * @private
   */
  this.parsedExpression_ = null;

  /**
   * Current evaluator function.
   * This may be null, which indicates that all events should pass.
   * @type {Function?}
   * @private
   */
  this.evaluator_ = null;
};
goog.inherits(wtf.analysis.EventFilter, wtf.events.EventEmitter);


/**
 * An evaluator function that always returns true.
 * @return {boolean} True.
 * @private
 */
wtf.analysis.EventFilter.passEvaluator_ = function() { return true; };


/**
 * Gets the evaluator function used to filter events.
 * @return {Function?} Evaluator function, or null if all should pass.
 */
wtf.analysis.EventFilter.prototype.getEvaluator = function() {
  return this.evaluator_;
};


/**
 * Gets the start time of the filtered range.
 * This may be {@code Number.MIN_VALUE}.
 * @return {number} Start time value.
 */
wtf.analysis.EventFilter.prototype.getStartTime = function() {
  return this.parsedExpression_ ?
      this.parsedExpression_.startTime : Number.MIN_VALUE;
};


/**
 * Gets the end time of the filtered range.
 * This may be {@code Number.MAX_VALUE}.
 * @return {number} End time value.
 */
wtf.analysis.EventFilter.prototype.getEndTime = function() {
  return this.parsedExpression_ ?
      this.parsedExpression_.endTime : Number.MAX_VALUE;
};


/**
 * Clears the current filter.
 */
wtf.analysis.EventFilter.prototype.clear = function() {
  if (!this.evaluator_) {
    return;
  }
  this.sourceString_ = '';
  this.parsedExpression_ = null;
  this.evaluator_ = null;
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


/**
 * Gets a string representing this filter.
 * @return {string} Filter string. May be the empty string.
 */
wtf.analysis.EventFilter.prototype.toString = function() {
  return this.sourceString_;
};


/**
 * Updates the filter from a string query.
 * @param {string} value String query.
 * @return {boolean} True if the value was set, otherwise false indicating that
 *     the expression could not be parsed.
 */
wtf.analysis.EventFilter.prototype.setFromString = function(value) {
  value = goog.string.trim(value);
  if (this.sourceString_ == value) {
    return true;
  }

  if (!value.length) {
    this.clear();
    return true;
  }

  var expr = null;
  try {
    expr = this.parseExpression_(value);
  } catch (e) {
  }
  if (!expr) {
    // Could not parse expression - keep current value.
    return false;
  }

  var fn = this.generateEvaluatorFn_(expr);
  this.sourceString_ = value;
  this.parsedExpression_ = expr;
  this.evaluator_ = fn;
  this.emitEvent(wtf.events.EventType.INVALIDATED);
  return true;
};


/**
 * A regex that matches {@code <anything>[timeStart, timeEnd]}.
 * @type {!RegExp}
 * @private
 */
wtf.analysis.EventFilter.timeRangeMatch_ =
    /(.*)((\[([+-]*[0-9]+(\.[0-9]+)?),[ ]*([+-]*[0-9]+(\.[0-9]+)?)\])$)/;


/**
 * A regex that matches regular expressions.
 * @type {!RegExp}
 * @private
 */
wtf.analysis.EventFilter.regexMatch_ = /^\/(.+)\/([gim]*)$/;


/**
 * Parses an expression string.
 * @param {string} value Expression string.
 * @return {Object} Expression object or null if it could not be parsed.
 * @private
 */
wtf.analysis.EventFilter.prototype.parseExpression_ = function(value) {
  // TODO(benvanik): real expression parsing
  // ATM only name substring search and regex mode is supported.

  // If there's a [#,#] at the end, slice that off for time range filtering.
  var startTime = Number.MIN_VALUE;
  var endTime = Number.MAX_VALUE;
  var timeRangeMatch = wtf.analysis.EventFilter.timeRangeMatch_;
  if (timeRangeMatch.test(value)) {
    var parts = timeRangeMatch.exec(value);
    value = goog.string.trim(parts[1]);
    var timeRange = this.parseTimeRange_(parts[4], parts[6]);
    if (!timeRange) {
      return null;
    }
    startTime = timeRange[0];
    endTime = timeRange[1];
  }

  var regex = null;
  var regexMatch = wtf.analysis.EventFilter.regexMatch_;
  if (regexMatch.test(value)) {
    // Looks like a regex.
    // TODO(benvanik): de-dupe options/validate to prevent exceptions.
    var parts = regexMatch.exec(value);
    regex = new RegExp(parts[1], parts[2]);
  } else {
    // Generate from value.
    var escapedValue = goog.string.regExpEscape(value);
    regex = new RegExp('.*' + escapedValue + '.*', 'i');
  }
  return {
    name: regex,
    startTime: startTime,
    endTime: endTime
  };
};


/**
 * Parses a start/end time range string.
 * @param {string} startString Start time string.
 * @param {string} endString End time string.
 * @return {Array.<number>} An array containing [start, end] or null if an
 *     error occurred.
 * @private
 */
wtf.analysis.EventFilter.prototype.parseTimeRange_ = function(
    startString, endString) {
  // TODO(benvanik): support unit suffixes/etc.
  var startTime = parseFloat(startString);
  var endTime = parseFloat(endString);
  return [startTime, endTime];
};


/**
 * Generates an evaluator function from the given expression.
 * @param {!Object} expr Expression object.
 * @return {Function?} Evaluator function or null if invalid.
 * @private
 */
wtf.analysis.EventFilter.prototype.generateEvaluatorFn_ =
    function(expr) {
  if (expr.startTime == Number.MIN_VALUE &&
      expr.endTime == Number.MAX_VALUE) {
    return function(e) {
      return expr.name.test(e.eventType.name);
    };
  } else {
    return function(e) {
      if (e.time < expr.startTime || e.time > expr.endTime) {
        return false;
      }
      return expr.name.test(e.eventType.name);
    };
  }
};
