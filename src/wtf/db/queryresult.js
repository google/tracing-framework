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

goog.provide('wtf.db.CompiledQueryExpression');
goog.provide('wtf.db.QueryDumpFormat');
goog.provide('wtf.db.QueryResult');
goog.provide('wtf.db.QueryResultType');

goog.require('goog.Disposable');
goog.require('goog.asserts');


/**
 * @typedef {(RegExp|string)}
 */
wtf.db.CompiledQueryExpression;


/**
 * @typedef {(string|number|boolean|wtf.db.EventIterator|null)}
 */
wtf.db.QueryResultType;


/**
 * Format to generate text results in.
 * @enum {number}
 */
wtf.db.QueryDumpFormat = {
  CSV: 0
};


goog.exportSymbol(
    'wtf.db.QueryDumpFormat',
    wtf.db.QueryDumpFormat);
goog.exportProperty(
    wtf.db.QueryDumpFormat, 'CSV',
    wtf.db.QueryDumpFormat.CSV);



/**
 * Query result object.
 * This wraps a result from the XPath query system in an API that is easier
 * to use.
 *
 * @param {string} expr Expression string.
 * @param {!wtf.db.CompiledQueryExpression} compiledExpr Expression
 *     after it has been parsed/prepared, used for debugging output.
 * @param {number} duration Duration of the query, in ms.
 * @param {?wtf.db.QueryResultType} value Result value.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.db.QueryResult = function(expr, compiledExpr, duration, value) {
  goog.base(this);

  /**
   * Original expression string.
   * @type {string}
   * @private
   */
  this.expr_ = expr;

  /**
   * XPath expression.
   * @type {!wtf.db.CompiledQueryExpression}
   * @private
   */
  this.compiledExpr_ = compiledExpr;

  /**
   * Duration, in ms.
   * @type {number}
   * @private
   */
  this.duration_ = duration;

  /**
   * Resulting value.
   * @type {?wtf.db.QueryResultType}
   * @private
   */
  this.value_ = value;
};
goog.inherits(wtf.db.QueryResult, goog.Disposable);


/**
 * Gets the original expression used to create the query.
 * @return {string} Expression string.
 */
wtf.db.QueryResult.prototype.getExpression = function() {
  return this.expr_;
};


/**
 * Gets the parsed expression object.
 * @return {!wtf.db.CompiledQueryExpression} Expression object.
 */
wtf.db.QueryResult.prototype.getCompiledExpression = function() {
  return this.compiledExpr_;
};


/**
 * Gets the duration of the query execution step, in milliseconds.
 * @return {number} Duration, in ms.
 */
wtf.db.QueryResult.prototype.getDuration = function() {
  return this.duration_;
};


/**
 * Gets the query result.
 * @return {?wtf.db.QueryResultType} Result value.
 */
wtf.db.QueryResult.prototype.getValue = function() {
  return this.value_;
};


/**
 * Dumps the results into a blob.
 * @param {wtf.db.QueryDumpFormat} format Target format.
 * @return {string?} Results.
 */
wtf.db.QueryResult.prototype.dump = function(format) {
  switch (format) {
    case wtf.db.QueryDumpFormat.CSV:
      return this.dumpCsv_();
    default:
      goog.asserts.fail('Unknown format');
      return null;
  }
};


/**
 * Dumps the results into a blob formatted by RFC 4180 (CSV).
 * @return {string?} Results.
 * @private
 */
wtf.db.QueryResult.prototype.dumpCsv_ = function() {
  var csv = [];

  // TODO(benvanik): add back in support for different result types. Currently
  //     we only have events, so it's much easier.
  // if (typeof rows[0] == 'boolean' ||
  //     typeof rows[0] == 'number' ||
  //     typeof rows[0] == 'string') {
  //   csv.push('Value');
  //   for (var n = 0; n < rows.length; n++) {
  //     var value = rows[n];
  //     if (typeof value == 'string') {
  //       value = '"' + value.replace(/"/g, '""') + '"';
  //     } else {
  //       value = String(value);
  //     }
  //     csv.push(value);
  //   }
  // }

  var it = /** @type {!wtf.db.EventIterator} */ (this.value_);
  csv.push('Time,Value,"Total Time","Own Time",Depth,Arguments');
  it.seek(0);
  for (; !it.done(); it.next()) {
    var line = [
      it.getTime(),
      it.getName(),
      it.isScope() ? it.getTotalDuration() : '',
      it.isScope() ? it.getOwnDuration() : '',
      it.getDepth(),
      it.getArgumentString(true)
    ];
    csv.push(line.join(','));
  }
  it.seek(0);

  return csv.join('\r\n');
};


goog.exportProperty(
    wtf.db.QueryResult.prototype, 'getExpression',
    wtf.db.QueryResult.prototype.getExpression);
goog.exportProperty(
    wtf.db.QueryResult.prototype, 'getCompiledExpression',
    wtf.db.QueryResult.prototype.getCompiledExpression);
goog.exportProperty(
    wtf.db.QueryResult.prototype, 'getDuration',
    wtf.db.QueryResult.prototype.getDuration);
goog.exportProperty(
    wtf.db.QueryResult.prototype, 'getValue',
    wtf.db.QueryResult.prototype.getValue);
goog.exportProperty(
    wtf.db.QueryResult.prototype, 'dump',
    wtf.db.QueryResult.prototype.dump);
