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

goog.provide('wtf.analysis.db.QueryResult');
goog.provide('wtf.analysis.db.QueryResultType');

goog.require('goog.Disposable');
goog.require('wgxpath.XPathExpression');


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
 * @param {!wgxpath.XPathExpression} xpathExpr XPath expression.
 * @param {number} duration Duration of the query, in ms.
 * @param {!wgxpath.XPathResult} xpathResult XPath result.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.db.QueryResult = function(expr, xpathExpr, duration, xpathResult) {
  goog.base(this);

  /**
   * Original expression string.
   * @type {string}
   * @private
   */
  this.expr_ = expr;

  /**
   * XPath expression.
   * @type {!wgxpath.XPathExpression}
   * @private
   */
  this.xpathExpr_ = xpathExpr;

  /**
   * Duration, in ms.
   * @type {number}
   */
  this.duration_ = duration;

  /**
   * Resulting value.
   * @type {wtf.analysis.db.QueryResultType}
   * @private
   */
  this.value_ = xpathResult.value;
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
 * @return {!wgxpath.XPathExpression} Expression object.
 */
wtf.analysis.db.QueryResult.prototype.getXPathExpression = function() {
  return this.xpathExpr_;
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
 * @return {wtf.analysis.db.QueryResultType} Result value.
 */
wtf.analysis.db.QueryResult.prototype.getValue = function() {
  return this.value_;
};


goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getExpression',
    wtf.analysis.db.QueryResult.prototype.getExpression);
goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getXPathExpression',
    wtf.analysis.db.QueryResult.prototype.getXPathExpression);
goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getDuration',
    wtf.analysis.db.QueryResult.prototype.getDuration);
goog.exportProperty(
    wtf.analysis.db.QueryResult.prototype, 'getValue',
    wtf.analysis.db.QueryResult.prototype.getValue);
