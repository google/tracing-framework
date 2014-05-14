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
goog.provide('wtf.db.FilterResult');

goog.require('goog.string');
goog.require('wtf.data.EventFlag');
goog.require('wtf.db.EventIterator');
goog.require('wtf.db.FilterParser');
goog.require('wtf.util.FunctionBuilder');


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
   * Parsed expression tree.
   * Used for debugging.
   * @type {Object}
   * @private
   */
  this.expressionTree_ = null;

  /**
   * The last error that ocurred during parsing, if any.
   * @type {Error}
   * @private
   */
  this.parseError_ = null;

  /**
   * A function that tests whether an event type passes the filter.
   * This is null if no event type query was specified.
   * @type {wtf.db.Filter.EventTypeFilterFunction?}
   * @private
   */
  this.eventTypeFilter_ = null;

  /**
   * A function that teests whether an event's arguments pass the filter.
   * This is null if no argument query was specified.
   * @type {wtf.db.Filter.ArgumentFilterFunction?}
   * @private
   */
  this.argumentFilter_ = null;

  if (opt_value) {
    this.setFromString(opt_value);
  }
};


/**
 * A function that filters on event types.
 * @typedef {function(!wtf.db.EventType):boolean}
 */
wtf.db.Filter.EventTypeFilterFunction;


/**
 * A function that filters an event based on its arguments.
 * @typedef {function(!wtf.db.EventIterator):boolean}
 */
wtf.db.Filter.ArgumentFilterFunction;


/**
 * Gets a function that tests if an event type passes the filter.
 * @return {wtf.db.Filter.EventTypeFilterFunction?} Filter function, or null if
 *     all should pass.
 */
wtf.db.Filter.prototype.getEventTypeFilter = function() {
  return this.eventTypeFilter_;
};


/**
 * Gets a function that tests if an event passes the filter.
 * @return {wtf.db.Filter.ArgumentFilterFunction?} Filter function, or null if
 *     all should pass.
 */
wtf.db.Filter.prototype.getArgumentFilter = function() {
  return this.argumentFilter_;
};


/**
 * Gets a value indicating whether the filter is 'active' and doing anything.
 * @return {boolean} True if the filter filters anything.
 */
wtf.db.Filter.prototype.isActive = function() {
  return !!(this.eventTypeFilter_ || this.argumentFilter_);
};


/**
 * Clears the current filter.
 * @return {wtf.db.FilterResult} Result.
 */
wtf.db.Filter.prototype.clear = function() {
  if (!this.eventTypeFilter_ && !this.argumentFilter_) {
    return wtf.db.FilterResult.NO_CHANGE;
  }
  this.sourceString_ = '';
  this.expressionTree_ = null;
  this.parseError_ = null;
  this.eventTypeFilter_ = null;
  this.argumentFilter_ = null;
  return wtf.db.FilterResult.UPDATED;
};


/**
 * Updates the filter from a string query.
 * @param {string} value String query.
 * @return {wtf.db.FilterResult} Result.
 */
wtf.db.Filter.prototype.setFromString = function(value) {
  this.parseError_ = null;

  // We need support for codegen.
  if (!wtf.util.FunctionBuilder.isSupported()) {
    this.parseError_ = new Error('Runtime function generation not supported.');
    return wtf.db.FilterResult.FAILED;
  }

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
    expr = wtf.db.FilterParser.parse(value, undefined);
  } catch (e) {
    this.parseError_ = e;
  }
  if (!expr) {
    // Could not parse expression - keep current value.
    return wtf.db.FilterResult.FAILED;
  }

  this.sourceString_ = value;
  this.expressionTree_ = expr;

  this.eventTypeFilter_ = this.generateEventTypeFilter_(expr);
  this.argumentFilter_ = this.generateArgumentFilter_(expr);

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
 * Gets the most recent parse error, or null if parsing was successful.
 * @return {Error} Error, if any.
 */
wtf.db.Filter.prototype.getError = function() {
  return this.parseError_;
};


/**
 * Gets a string that can be used to help debug the compiled filter.
 * @return {string} Debug string.
 */
wtf.db.Filter.prototype.getDebugString = function() {
  return goog.global.JSON.stringify(this.expressionTree_, null, 2);
};


/**
 * Generates an event type filter function from the given expression tree.
 * @param {!Object} expr Expression tree.
 * @return {wtf.db.Filter.EventTypeFilterFunction?} Filter function or null if
 *     no filter specified.
 * @private
 */
wtf.db.Filter.prototype.generateEventTypeFilter_ = function(expr) {
  if (!expr.type_query) {
    return null;
  }

  var regex;
  switch (expr.type_query.type) {
    case 'substring':
      var escapedValue = goog.string.regExpEscape(expr.type_query.value);
      regex = new RegExp('.*' + escapedValue + '.*', 'i');
      break;
    case 'regex':
      regex = new RegExp(expr.type_query.value, expr.type_query.flags);
      break;
    default:
      throw new Error('Invalid event type filter query.');
  }

  return function eventTypeFilter(eventType) {
    return regex.test(eventType.name);
  };
};


/**
 * Generates an argument filter function from the given expression tree.
 * @param {!Object} expr Expression tree.
 * @return {wtf.db.Filter.ArgumentFilterFunction?} Filter function or null if
 *     no filter specified.
 * @private
 */
wtf.db.Filter.prototype.generateArgumentFilter_ = function(expr) {
  if (!expr.arg_query) {
    return null;
  }

  var builder = new wtf.util.FunctionBuilder();
  builder.begin();
  builder.addArgument('it');

  // Generate a list of expressions that must be true to pass the filter.
  var expressions = [];
  var needsArguments = false;
  for (var n = 0; n < expr.arg_query.length; n++) {
    var binaryExpression = expr.arg_query[n];

    // If either side references an argument, ensure the argument exists.
    var argumentInfos = [
      getExpressionArgumentInfo(binaryExpression.lhs),
      getExpressionArgumentInfo(binaryExpression.rhs)
    ];
    for (var i = 0; i < argumentInfos.length; i++) {
      var argumentInfo = argumentInfos[i];
      if (!argumentInfo) {
        continue;
      }
      if (argumentInfo.name) {
        expressions.push('args["' + argumentInfo.name + '"] !== undefined');
        needsArguments = true;
      }
      if (argumentInfo.requiresScope) {
        expressions.push('it.isScope()');
      }
    }

    // We really want exact semantics.
    var op = binaryExpression.op;
    switch (op) {
      case '==':
        op = '===';
        break;
      case '!=':
        op = '!==';
        break;
    }

    // Grab LHS and RHS source strings.
    var lhs = stringifyExpressionValue(binaryExpression.lhs);
    var rhs = stringifyExpressionValue(binaryExpression.rhs);

    // The real expression.
    if (binaryExpression.rhs.type == 'regex') {
      var prefix = op == '!~' ? '!' : '';
      expressions.push('( ' + prefix + rhs + '.test(' + lhs + ') )');
    } else {
      expressions.push('(' + lhs + ' ' + op + ' ' + rhs + ')');
    }
  }

  // Only add arguments object if any expressions use it.
  if (needsArguments) {
    builder.append('var args = it.getArguments();');
    builder.append('if (!args) return false;');
  }

  if (expressions.length) {
    builder.append('return ' + expressions.join(' && ') + ';');
  } else {
    builder.append('return true;');
  }

  return builder.end('argumentFilter');

  function getExpressionArgumentInfo(exprValue) {
    if (exprValue.type != 'reference') {
      return null;
    }
    function findArgumentName(access) {
      if (goog.isString(access)) {
        if (access[0] == '@') {
          var requiresScope = false;
          switch (access.toLowerCase()) {
            case '@duration':
            case '@userduration':
            case '@ownduration':
            case '@flowid':
              requiresScope = true;
              break;
          }
          return {
            name: null,
            requiresScope: requiresScope
          };
        } else {
          return {
            name: access,
            requiresScope: false
          };
        }
      } else {
        return findArgumentName(access.base);
      }
    };
    return findArgumentName(exprValue.value);
  };
  function stringifyExpressionValue(exprValue) {
    switch (exprValue.type) {
      case 'number':
        return String(exprValue.value);
      case 'string':
        return '"' + exprValue.value + '"';
      case 'boolean':
        return String(exprValue.value);
      case 'null':
        return 'null';
      case 'array':
        return '[' + String(exprValue.value) + ']';
      case 'object':
        return goog.global.JSON.stringify(exprValue.value);
      case 'regex':
        var regExpr = '(new RegExp("' + String(exprValue.value) + '"';
        if (exprValue.value.flags) {
          regExpr += ', "' + String(exprValue.flags) + '"';
        }
        regExpr += '))';
        return regExpr;
      case 'reference':
        return stringifyReferenceAccess(exprValue.value);
      default:
        throw new Error('Unknown expression value type: ' + exprValue.type);
    }
  };
  function stringifyReferenceAccess(access) {
    if (goog.isString(access)) {
      if (access[0] == '@') {
        switch (access.toLowerCase()) {
          case '@time':
            return 'it.getTime()';
          case '@duration':
            return 'it.getTotalDuration()';
          case '@userduration':
            return 'it.getUserDuration()';
          case '@ownduration':
            return 'it.getOwnDuration()';
          case '@flowid':
            return 'it.getChildFlowId()';
          default:
            throw new Error('Unknown event attribute: ' + access);
        }
      } else {
        return 'args["' + access + '"]';
      }
    } else {
      var name = goog.isString(access.name) ?
          '"' + access.name + '"' : access.name;
      return stringifyReferenceAccess(access.base) + '[' + name + ']';
    }
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

  var evaluator = this.eventTypeFilter_;

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


/**
 * Filters an event list and returns an iterator with only those events
 * selected.
 * @param {!wtf.db.EventList} eventList Event list.
 * @return {!wtf.db.EventIterator} Filtered iterator.
 */
wtf.db.Filter.prototype.applyToEventList = function(eventList) {
  var matchedEventTypes = this.getMatchedEventTypes(eventList.eventTypeTable);
  var argumentFilter = this.argumentFilter_;

  // Build a list of all event IDs that match.
  var matches = [];
  var it = eventList.begin();
  for (; !it.done(); it.next()) {
    if (matchedEventTypes[it.getTypeId()]) {
      if (argumentFilter ? argumentFilter(it) : true) {
        matches.push(it.getId());
      }
    }
  }

  return new wtf.db.EventIterator(
      eventList, 0, matches.length - 1, 0, matches);
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
