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
   * Scopes can be given flows. When a scope is left the flow will be
   * terminated.
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
 * @param {wtf.trace.Flow} flow Optional flow to terminate on scope leave.
 * @param {number} time Time for the enter.
 * @return {!wtf.trace.Scope} An initialized scope.
 */
wtf.trace.Scope.enterTyped = function(flow, time) {
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

  // Extend flow, if present.
  scope.flow_ = flow;
  if (flow) {
    flow.extend(undefined, time);
  }

  return scope;
};


/**
 * Leaves a scope.
 * The scope will be exited. If a flow was attached to the scope it will
 * be terminated.
 *
 * @param {*=} opt_result A value to return directly.
 * @param {number=} opt_time Time for the leave; omit to use the current time.
 * @return {?} The value passed as {@code opt_result}.
 * @this {wtf.trace.Scope}
 */
wtf.trace.Scope.prototype.leave = function(opt_result, opt_time) {
  // Time immediately after the scope - don't track our stuff.
  var time = opt_time || wtf.now();

  // Unwind stack, if needed.
  var pool = wtf.trace.Scope.pool_;
  while (pool.currentDepth > this.stackDepth_) {
    // TODO(benvanik): mark as bad? emit discontinuity?
    var openScope = pool.stack[pool.currentDepth];
    openScope.leave(undefined, time);
  }
  pool.currentDepth--;
  pool.stack[this.stackDepth_] = null;

  // Terminate a flow, if one is attached.
  if (this.flow_) {
    this.flow_.terminate(undefined, time);
    this.flow_ = null;
  }

  // Append event.
  wtf.trace.BuiltinEvents.leaveScope(time);

  // Return the scope to the pool.
  // Note that we have no thresholding here and will grow forever.
  pool.unusedScopes[pool.unusedIndex++] = this;

  return opt_result;
};


// Always export names used in generated code.
goog.exportProperty(
    wtf.trace.Scope.prototype,
    'leave',
    wtf.trace.Scope.prototype.leave);
