/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Scope tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.Scope');

goog.require('wtf');
goog.require('wtf.trace.BuiltinEvents');



/**
 * Scope tracking utility.
 * A stateful object that is used to help tracking scopes.
 * Scope instances are pooled and should not be created manually.
 *
 * @constructor
 */
wtf.trace.Scope = function() {
  /**
   * The flow this scope is tracking, if any.
   * @type {wtf.trace.Flow}
   * @private
   */
  this.flow_ = null;

  /**
   * @type {number}
   * @private
   */
  this.stackDepth_ = 0;
};


/**
 * Pool of scopes.
 * This is managed by the enter/leave functions and is designed to be fast, not
 * pretty.
 * @type {!Object}
 * @private
 */
wtf.trace.Scope.pool_ = {
  /**
   * @type {!Array.<!wtf.trace.Scope>}
   */
  unusedScopes: [],

  /**
   * @type {number}
   */
  unusedIndex: 0,

  /**
   * Current stack depth.
   * This is an index into {@see #stack}.
   * @type {number}
   * @private
   */
  currentDepth: -1,

  /**
   * Scope stack.
   * This is used to track the currently open scopes and close unmatched
   * scopes. This array is grown as needed and the current index is
   * {@see #currentDepth}.
   * @type {!Array.<wtf.trace.Scope>}
   */
  stack: []
};


/**
 * Enters a typed scope.
 * This method should only be used by internally generated code. It assumes that
 * there is generated code around it that is properly recording events.
 *
 * @param {number} time Time for the enter.
 * @return {!wtf.trace.Scope} An initialized scope.
 */
wtf.trace.Scope.enterTyped = function(time) {
  // Pop a scope from the pool or allocate a new one.
  var pool = wtf.trace.Scope.pool_;
  var scope;
  if (pool.unusedIndex) {
    scope = pool.unusedScopes[--pool.unusedIndex];
  } else {
    scope = new wtf.trace.Scope();
  }

  // Track scope stack. This allows for scope unwinding in the case of
  // unbalanced scopes.
  scope.stackDepth_ = ++pool.currentDepth;
  pool.stack[scope.stackDepth_] = scope;

  return scope;
};


/**
 * Leaves a scope.
 * The scope will be exited.
 *
 * @param {wtf.trace.Scope} scope Scope to leave.
 * @param {T=} opt_result A value to return directly.
 * @param {number=} opt_time Time for the leave; omit to use the current time.
 * @return {T|undefined} The value passed as {@code opt_result}.
 * @template T
 */
wtf.trace.Scope.leave = function(scope, opt_result, opt_time) {
  if (!scope) {
    return opt_result;
  }

  // Time immediately after the scope - don't track our stuff.
  var time = opt_time || wtf.now();

  // Unwind stack, if needed.
  var pool = wtf.trace.Scope.pool_;
  while (pool.currentDepth > scope.stackDepth_) {
    // TODO(benvanik): mark as bad? emit discontinuity?
    var openScope = pool.stack[pool.currentDepth];
    wtf.trace.Scope.leave(openScope, undefined, time);
  }
  pool.currentDepth--;
  pool.stack[scope.stackDepth_] = null;

  // Append event.
  wtf.trace.BuiltinEvents.leaveScope(time);

  // Return the scope to the pool.
  // Note that we have no thresholding here and will grow forever.
  pool.unusedScopes[pool.unusedIndex++] = scope;

  // Clear anything for the enter.
  scope.flow_ = null;

  return opt_result;
};


/**
 * Gets the flow set on any ancestor scope, if any.
 * If there are no active scopes (in the root) this always returns null.
 * @return {wtf.trace.Flow} Flow.
 */
wtf.trace.Scope.getCurrentFlow = function() {
  var pool = wtf.trace.Scope.pool_;
  var depth = pool.currentDepth;
  while (depth > 0) {
    var scope = pool.stack[depth--];
    if (scope && scope.flow_) {
      return scope.flow_;
    }
  }
  return null;
};


/**
 * Sets the flow on the deepest current scope, if any.
 * If there are no active scopes (in the root) this is ignored.
 * @param {wtf.trace.Flow} value New flow value.
 */
wtf.trace.Scope.setCurrentFlow = function(value) {
  var pool = wtf.trace.Scope.pool_;
  var scope = pool.stack[pool.currentDepth];
  if (scope) {
    scope.flow_ = value;
  }
};
