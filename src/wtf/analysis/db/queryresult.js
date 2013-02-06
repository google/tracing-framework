/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview query result object.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.CompiledQueryExpression');
goog.provide('wtf.analysis.db.QueryResult');
goog.provide('wtf.analysis.db.QueryResultType');

goog.require('goog.Disposable');
goog.require('wgxpath.XPathExpression');


/**
 * @typedef {(wgxpath.XPathExpression|RegExp|string)}
 */
wtf.analysis.db.CompiledQueryExpression;


/**
 * @typedef {(string|number|boolean|!Array.<!wgxpath.Node>|wgxpath.Node|null)}
 */
wtf.analysis.db.QueryResultType;



/**
 * Query result object.
 * This wraps a result from the XPath query system in an API that is easier
 * to use.
 *
 * @param {string} expr Expression string.
 * @param {!wtf.analysis.db.CompiledQueryExpression} compiledExpr Expression
 *     after it has been parsed/prepared, used for debugging output.
 * @param {number} duration Duration of the query, in ms.
 * @param {?wtf.analysis.db.QueryResultType} value Result value.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.db.QueryResult = function(expr, compiledExpr, duration,
    value) {
  goog.base(this);

  /**
   * Original expression string.
   * @type {string}
   * @private
   */
  this.expr_ = expr;

  /**
   * XPath expression.
   * @type {!wtf.analysis.db.CompiledQueryExpression}
   * @private
   */
  this.compiledExpr_ = compiledExpr;

  /**
   * Duration, in ms.
   * @type {number}
   */
  this.duration_ = duration;

  /**
   * Resulting value.
   * @type {?wtf.analysis.db.QueryResultType}
   * @private
   */
  this.value_ = value;
};
goog.inherits(wtf.analysis.db.QueryResult, goog.Disposable);


/**
 * Gets the original expression used to create the query.
 * @return {string} Expression string.
 */
wtf.analysis.db.QueryResult.prototype.getExpression = function() {
  return this.expr_;
};


/**
 * Gets the parsed expression object.
 * @return {!wtf.analysis.db.CompiledQueryExpression} Expression object.
 */
wtf.analysis.db.QueryResult.prototype.getCompiledExpression = function() {
  return this.compiledExpr_;
};


/**
 * Gets the duration of the query execution step, in milliseconds.
 * @return {number} Duration, in ms.
 */
wtf.analysis.db.QueryResult.prototype.getDuration = function() {
  return this.duration_;
};


/**
 * Gets the query result.
 * @return {?wtf.analysis.db.QueryResultType} Result value.
 */
wtf.analysis.db.QueryResult.prototype.getValue = function() {
  return this.value_;
};


goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getExpression',
    wtf.analysis.db.QueryResult.prototype.getExpression);
goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getCompiledExpression',
    wtf.analysis.db.QueryResult.prototype.getCompiledExpression);
goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getDuration',
    wtf.analysis.db.QueryResult.prototype.getDuration);
goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getValue',
    wtf.analysis.db.QueryResult.prototype.getValue);
