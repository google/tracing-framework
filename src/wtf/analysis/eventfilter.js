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
 */
wtf.analysis.EventFilter = function() {
  /**
   * String that the filter is based on.
   * @type {string}
   * @private
   */
  this.sourceString_ = '';

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
 * Filter result values.
 * @enum {number}
 */
wtf.analysis.EventFilter.Result = {
  UPDATED: 0,
  FAILED: 1,
  NO_CHANGE: 2
};


/**
 * Gets the evaluator function used to filter events.
 * @return {Function?} Evaluator function, or null if all should pass.
 */
wtf.analysis.EventFilter.prototype.getEvaluator = function() {
  return this.evaluator_;
};


/**
 * Clears the current filter.
 * @return {wtf.analysis.EventFilter.Result} Result.
 */
wtf.analysis.EventFilter.prototype.clear = function() {
  if (!this.evaluator_) {
    return wtf.analysis.EventFilter.Result.NO_CHANGE;
  }
  this.sourceString_ = '';
  this.evaluator_ = null;
  return wtf.analysis.EventFilter.Result.UPDATED;
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
 * @return {wtf.analysis.EventFilter.Result} Result.
 */
wtf.analysis.EventFilter.prototype.setFromString = function(value) {
  value = goog.string.trim(value);
  if (this.sourceString_ == value) {
    return wtf.analysis.EventFilter.Result.NO_CHANGE;
  }

  if (!value.length) {
    this.clear();
    return wtf.analysis.EventFilter.Result.UPDATED;
  }

  var expr = null;
  try {
    expr = this.parseExpression_(value);
  } catch (e) {
  }
  if (!expr) {
    // Could not parse expression - keep current value.
    return wtf.analysis.EventFilter.Result.FAILED;
  }

  var fn = this.generateEvaluatorFn_(expr);
  this.sourceString_ = value;
  this.evaluator_ = fn;
  return wtf.analysis.EventFilter.Result.UPDATED;
};


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
    name: regex
  };
};


/**
 * Generates an evaluator function from the given expression.
 * @param {!Object} expr Expression object.
 * @return {Function?} Evaluator function or null if invalid.
 * @private
 */
wtf.analysis.EventFilter.prototype.generateEvaluatorFn_ =
    function(expr) {
  return function(e) {
    return expr.name.test(e.eventType.name);
  };
};
