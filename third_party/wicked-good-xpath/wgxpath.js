/*  JavaScript-XPath 0.1.11
 *  (c) 2007 Cybozu Labs, Inc.
 *
 *  JavaScript-XPath is freely distributable under the terms of an MIT-style
 *  license. For details, see the JavaScript-XPath web site:
 *  http://coderepos.org/share/wiki/JavaScript-XPath
 *
/*--------------------------------------------------------------------------*/

// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * Wicked Good XPath
 *
 * @fileoverview A cross-browser XPath library forked from the
 * JavaScript-XPath project by Cybozu Labs.
 *
 */

goog.provide('wgxpath');
goog.provide('wgxpath.XPathExpression');
goog.provide('wgxpath.XPathResult');
goog.provide('wgxpath.XPathResultType');

goog.require('wgxpath.Context');
goog.require('wgxpath.Lexer');
goog.require('wgxpath.NodeSet');
goog.require('wgxpath.Parser');


/**
 * Enum for XPathResult types.
 *
 * @enum {number}
 */
wgxpath.XPathResultType = {
  ANY_TYPE: 0,
  NUMBER_TYPE: 1,
  STRING_TYPE: 2,
  BOOLEAN_TYPE: 3,
  UNORDERED_NODE_ITERATOR_TYPE: 4,
  ORDERED_NODE_ITERATOR_TYPE: 5,
  UNORDERED_NODE_SNAPSHOT_TYPE: 6,
  ORDERED_NODE_SNAPSHOT_TYPE: 7,
  ANY_UNORDERED_NODE_TYPE: 8,
  FIRST_ORDERED_NODE_TYPE: 9
};



/**
 * The exported XPathExpression type.
 *
 * @constructor
 * @param {string} expr The expression string.
 */
wgxpath.XPathExpression = function(expr) {
  if (!expr.length) {
    throw Error('Empty XPath expression.');
  }

  var lexer = wgxpath.Lexer.tokenize(expr);

  if (lexer.empty()) {
    throw Error('Invalid XPath expression.');
  }

  /**
   * Parser.
   * @type {!wgxpath.Expr}
   * @private
   */
  this.gexpr_ = new wgxpath.Parser(lexer).parseExpr();
  if (!lexer.empty()) {
    throw Error('Bad token: ' + lexer.next());
  }
};


/**
 * Evaluates the expression on the given node.
 * @param {!wgxpath.Node} node Target node.
 * @param {wgxpath.XPathResultType} type The result type.
 * @return {!wgxpath.XPathResult} Result.
 */
wgxpath.XPathExpression.prototype.evaluate = function(node, type) {
  var value = this.gexpr_.evaluate(new wgxpath.Context(node));
  return new wgxpath.XPathResult(value, type);
};


/**
 * @override
 */
wgxpath.XPathExpression.prototype.toString = function() {
  return this.gexpr_.toString();
};



/**
 * The exported XPathResult type.
 *
 * @constructor
 * @param {(!wgxpath.NodeSet|number|string|boolean)} value The result value.
 * @param {wgxpath.XPathResultType} type The result type.
 */
wgxpath.XPathResult = function(value, type) {
  if (type == wgxpath.XPathResultType.ANY_TYPE) {
    if (value instanceof wgxpath.NodeSet) {
      type = wgxpath.XPathResultType.UNORDERED_NODE_ITERATOR_TYPE;
    } else if (typeof value == 'string') {
      type = wgxpath.XPathResultType.STRING_TYPE;
    } else if (typeof value == 'number') {
      type = wgxpath.XPathResultType.NUMBER_TYPE;
    } else if (typeof value == 'boolean') {
      type = wgxpath.XPathResultType.BOOLEAN_TYPE;
    } else {
      throw Error('Unexpected evaluation result.');
    }
  }
  if (type != wgxpath.XPathResultType.STRING_TYPE &&
      type != wgxpath.XPathResultType.NUMBER_TYPE &&
      type != wgxpath.XPathResultType.BOOLEAN_TYPE &&
      !(value instanceof wgxpath.NodeSet)) {
    throw Error('value could not be converted to the specified type');
  }

  /**
   * Result type.
   * @type {wgxpath.XPathResultType}
   */
  this.resultType = type;

  /**
   * @type {(string|number|boolean|!Array.<!wgxpath.Node>|wgxpath.Node|null)}
   */
  this.value = null;

  switch (type) {
    case wgxpath.XPathResultType.STRING_TYPE:
      this.value = (value instanceof wgxpath.NodeSet) ?
          value.string() : '' + value;
      break;
    case wgxpath.XPathResultType.NUMBER_TYPE:
      this.value = (value instanceof wgxpath.NodeSet) ?
          value.number() : +value;
      break;
    case wgxpath.XPathResultType.BOOLEAN_TYPE:
      this.value = (value instanceof wgxpath.NodeSet) ?
          value.getLength() > 0 : !!value;
      break;
    case wgxpath.XPathResultType.UNORDERED_NODE_ITERATOR_TYPE:
    case wgxpath.XPathResultType.ORDERED_NODE_ITERATOR_TYPE:
    case wgxpath.XPathResultType.UNORDERED_NODE_SNAPSHOT_TYPE:
    case wgxpath.XPathResultType.ORDERED_NODE_SNAPSHOT_TYPE:
      var iter = value.iterator();
      this.value = [];
      for (var node = iter.next(); node; node = iter.next()) {
        this.value.push(node);
      }
      break;
    case wgxpath.XPathResultType.ANY_UNORDERED_NODE_TYPE:
    case wgxpath.XPathResultType.FIRST_ORDERED_NODE_TYPE:
      this.value = value.getFirst();
      break;
    default:
      throw Error('Unknown XPathResult type.');
  }
};



/**
 * Evaluates the given expression and returns a result.
 * @param {string} expr The expression string.
 * @param {!wgxpath.Node} context Context node.
 * @param {wgxpath.XPathResultType} type The result type.
 * @return {!wgxpath.XPathResult} Result.
 */
wgxpath.evaluate = function(expr, context, type) {
  return new wgxpath.XPathExpression(expr).evaluate(context, type);
};
