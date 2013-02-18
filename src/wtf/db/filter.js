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

goog.provide('wtf.db.Filter');
goog.provide('wtf.db.FilterFunction');
goog.provide('wtf.db.FilterResult');

goog.require('goog.string');
goog.require('wtf.data.EventFlag');


/**
 * @typedef {function(!wtf.db.EventType):boolean}
 */
wtf.db.FilterFunction;


/**
 * Filter result values.
 * @enum {number}
 */
wtf.db.FilterResult = {
  UPDATED: 0,
  FAILED: 1,
  NO_CHANGE: 2
};



/**
 * Event filter state manager.
 * An application wishing to filter things should create a filter and manipulate
 * it over the course of the run. An application can listen for events on the
 * filter to change UI/etc when the filter changes or may manually invalidate
 * themselves.
 *
 * Filters are used by getting an evaluator function via {@see #getEvaluator}
 * that event types are passed to. The evaluator will return true if the event
 * type is included in the filter and false otherwise. If there is no active
 * evaluator the return will be null and the caller should include all events.
 *
 * Evaluators can be set manually with {@see #setEvaluator} or can be
 * constructed from various sources, such as expression strings. See
 * {@see #setFromString} for more information.
 *
 * @param {string=} opt_value Initial string value. See {@see #setFromString}.
 * @constructor
 */
wtf.db.Filter = function(opt_value) {
  /**
   * String that the filter is based on.
   * @type {string}
   * @private
   */
  this.sourceString_ = '';

  /**
   * Current evaluator function.
   * This may be null, which indicates that all events should pass.
   * @type {wtf.db.FilterFunction?}
   * @private
   */
  this.evaluator_ = null;

  if (opt_value) {
    this.setFromString(opt_value);
  }
};


/**
 * Gets the evaluator function used to filter events.
 * @return {wtf.db.FilterFunction?} Evaluator function, or null if
 *     all should pass.
 */
wtf.db.Filter.prototype.getEvaluator = function() {
  return this.evaluator_;
};


/**
 * Clears the current filter.
 * @return {wtf.db.FilterResult} Result.
 */
wtf.db.Filter.prototype.clear = function() {
  if (!this.evaluator_) {
    return wtf.db.FilterResult.NO_CHANGE;
  }
  this.sourceString_ = '';
  this.evaluator_ = null;
  return wtf.db.FilterResult.UPDATED;
};


/**
 * Gets a string representing this filter.
 * @return {string} Filter string. May be the empty string.
 */
wtf.db.Filter.prototype.toString = function() {
  return this.sourceString_;
};


/**
 * Updates the filter from a string query.
 * @param {string} value String query.
 * @return {wtf.db.FilterResult} Result.
 */
wtf.db.Filter.prototype.setFromString = function(value) {
  value = goog.string.trim(value);
  if (this.sourceString_ == value) {
    return wtf.db.FilterResult.NO_CHANGE;
  }

  if (!value.length) {
    this.clear();
    return wtf.db.FilterResult.UPDATED;
  }

  var expr = null;
  try {
    expr = this.parseExpression_(value);
  } catch (e) {
  }
  if (!expr) {
    // Could not parse expression - keep current value.
    return wtf.db.FilterResult.FAILED;
  }

  var fn = this.generateEvaluatorFn_(expr);
  this.sourceString_ = value;
  this.evaluator_ = fn;
  return wtf.db.FilterResult.UPDATED;
};


/**
 * A regex that matches regular expressions.
 * @type {!RegExp}
 * @private
 */
wtf.db.Filter.regexMatch_ = /^\/(.+)\/([gim]*)$/;


/**
 * Parses an expression string.
 * @param {string} value Expression string.
 * @return {Object} Expression object or null if it could not be parsed.
 * @private
 */
wtf.db.Filter.prototype.parseExpression_ = function(value) {
  // TODO(benvanik): real expression parsing
  // ATM only name substring search and regex mode is supported.

  var regex = null;
  var regexMatch = wtf.db.Filter.regexMatch_;
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
wtf.db.Filter.prototype.generateEvaluatorFn_ = function(expr) {
  return function(type) {
    return expr.name.test(type.name);
  };
};


/**
 * Gets a presence-checking map of all event types that match the filter.
 * Simply test to see if an event type ID is in the resulting map to see if
 * it's a match.
 * @param {!wtf.db.EventTypeTable} eventTypeTable Type table.
 * @return {!Object.<number, boolean>} Type ID map.
 */
wtf.db.Filter.prototype.getMatchedEventTypes = function(eventTypeTable) {
  var result = {};

  var evaluator = this.getEvaluator();

  var typeList = eventTypeTable.getAll();
  for (var n = 0; n < typeList.length; n++) {
    var type = typeList[n];

    // Skip internal events.
    // TODO(benvanik): pass this as an option?
    if (type.flags & wtf.data.EventFlag.INTERNAL) {
      continue;
    }

    result[type.id] = evaluator ? evaluator(type) : true;
  }

  return result;
};


goog.exportSymbol(
    'wtf.db.Filter',
    wtf.db.Filter);
goog.exportProperty(
    wtf.db.Filter.prototype, 'clear',
    wtf.db.Filter.prototype.clear);
goog.exportProperty(
    wtf.db.Filter.prototype, 'toString',
    wtf.db.Filter.prototype.toString);
goog.exportProperty(
    wtf.db.Filter.prototype, 'setFromString',
    wtf.db.Filter.prototype.setFromString);
