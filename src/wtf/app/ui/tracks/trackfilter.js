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

goog.provide('wtf.app.ui.tracks.TrackFilter');

goog.require('goog.string');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Track filter mode.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.app.ui.tracks.TrackFilter = function() {
  goog.base(this);

  /**
   * Current evaluator function.
   * This may be null, which indicates that all events should pass.
   * @type {Function?}
   * @private
   */
  this.evaluator_ = null;
};
goog.inherits(wtf.app.ui.tracks.TrackFilter, wtf.events.EventEmitter);


/**
 * An evaluator function that always returns true.
 * @return {boolean} True.
 * @private
 */
wtf.app.ui.tracks.TrackFilter.passEvaluator_ = function() { return true; };


/**
 * Gets the evaluator function used to filter events.
 * @return {Function?} Evaluator function, or null if all should pass.
 */
wtf.app.ui.tracks.TrackFilter.prototype.getEvaluator = function() {
  return this.evaluator_;
};


/**
 * Sets the evaluator function used to filter events.
 * @param {Function?} fn Evaluator function.
 */
wtf.app.ui.tracks.TrackFilter.prototype.setEvaluator = function(fn) {
  if (this.evaluator_ == fn) {
    return;
  }
  this.evaluator_ = fn;
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


/**
 * Clears the current filter.
 */
wtf.app.ui.tracks.TrackFilter.prototype.clear = function() {
  if (!this.evaluator_) {
    return;
  }
  this.evaluator_ = null;
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


/**
 * Updates the filter from a string query.
 * @param {string} value String query.
 * @return {boolean} True if the value was set, otherwise false indicating that
 *     the expression could not be parsed.
 */
wtf.app.ui.tracks.TrackFilter.prototype.setFromString = function(value) {
  value = goog.string.trim(value);
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
  this.setEvaluator(fn);
  return true;
};


/**
 * A regex that matches regular expressions.
 * @type {!RegExp}
 * @private
 */
wtf.app.ui.tracks.TrackFilter.regexMatch_ = /^\/(.+)\/([gim]*)$/;


/**
 * Parses an expression string.
 * @param {string} value Expression string.
 * @return {Object} Expression object or null if it could not be parsed.
 * @private
 */
wtf.app.ui.tracks.TrackFilter.prototype.parseExpression_ = function(value) {
  // TODO(benvanik): real expression parsing
  // ATM only name substring search and regex mode is supported.

  var regex = null;
  var regexMatch = wtf.app.ui.tracks.TrackFilter.regexMatch_;
  if (regexMatch.test(value)) {
    // Looks like a regex.
    // TODO(benvanik): de-dupe options/validate to prevent exceptions.
    var parts = regexMatch.exec(value);
    regex = new RegExp(parts[1], parts[2]);
  } else {
    // Generate from value.
    var escapedValue = goog.string.regExpEscape(value);
    regex = new RegExp('.*' + escapedValue + '.*', '');
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
wtf.app.ui.tracks.TrackFilter.prototype.generateEvaluatorFn_ =
    function(expr) {
  return function(e) {
    return expr.name.test(e.eventType.name);
  };
};
