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
goog.require('wgxpath.XPathExpression');


/**
 * @typedef {(wgxpath.XPathExpression|RegExp|string)}
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
 */
wtf.db.QueryResult.prototype.dumpCsv_ = function() {
  var csv = [];

  // // If the results are primitives use the simple output.
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
  // } else if (rows[0] instanceof wgxpath.Attr) {
  //   csv.push('Time,Parent,Key,Value');
  //   for (var n = 0; n < rows.length; n++) {
  //     var value = rows[n];
  //     var parentNode = value.getParentNode();
  //     var time;
  //     var parentName;
  //     if (parentNode instanceof wtf.analysis.Scope) {
  //       time = parentNode.getEnterTime();
  //     } else if (parentNode instanceof wtf.analysis.Event) {
  //       time = parentNode.getTime();
  //     } else {
  //       time = 0;
  //     }
  //     var attrkey = value.getNodeName();
  //     var attrvalue = value.getNodeValue();
  //     csv.push([time, parentNode.toString(), attrkey, attrvalue].join(','));
  //   }
  // } else {
  //   csv.push('Time,Value,"Total Time","Own Time",Depth,Arguments');
  //   for (var n = 0; n < rows.length; n++) {
  //     var value = rows[n];
  //     var line;
  //     if (typeof value == 'string') {
  //       line = [0, '"' + value.replace(/"/g, '""') + '"'];
  //     } else if (typeof value == 'boolean' || typeof value == 'number') {
  //       line = [0, value];
  //     } else if (value) {
  //       var parentNode = value.getParentNode();
  //       if (value instanceof wtf.analysis.Scope) {
  //         var args = value.getData();
  //         args = args ? '"' + goog.global.JSON.stringify(
  //             args).replace(/"/g, '""') + '"' : '';
  //         line = [
  //           value.getEnterTime(), value.toString(),
  //           value.getTotalDuration(), value.getOwnDuration(),
  //           value.getDepth(),
  //           args
  //         ];
  //       } else if (value instanceof wtf.analysis.Event) {
  //         var args = value.getData();
  //         args = args ? '"' + goog.global.JSON.stringify(
  //             args).replace(/"/g, '""') + '"' : '';
  //         line = [
  //           value.getTime(), value.toString(),
  //           0, 0,
  //           parentNode ? parentNode.getDepth() : 0,
  //           args
  //         ];
  //       } else if (value instanceof wgxpath.Attr) {
  //         var time;
  //         if (parentNode instanceof wtf.analysis.Scope) {
  //           time = parentNode.getEnterTime();
  //         } else if (parentNode instanceof wtf.analysis.Event) {
  //           time = parentNode.getTime();
  //         } else {
  //           time = 0;
  //         }
  //         var attrkey = value.getNodeName();
  //         var attrvalue = value.getNodeValue();
  //         line = [time, value.toString()];
  //       } else if (value) {
  //         line = [0, value.toString()];
  //       }
  //     }
  //     if (line) {
  //       csv.push(line.join(','));
  //     }
  //   }
  // }

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
