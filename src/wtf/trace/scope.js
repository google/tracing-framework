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
goog.require('wtf.trace.Builtin');



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
   * @type {wtf.trace.Flow|undefined}
   * @private
   */
  this.flow_ = undefined;

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
  unusedIndex: 0
};


/**
 * Dummy scope used when the tracing library is disabled.
 * @type {!wtf.trace.Scope}
 */
wtf.trace.Scope.dummy = new wtf.trace.Scope();


/**
 * Enters a scope.
 * This will initialize a scope object and append an enter scope event.
 * Prefer using the {@see wtf.trace#enterScope} utility method over this.
 *
 * @param {string=} opt_msg Optional message string.
 * @param {wtf.trace.Flow=} opt_flow A flow to terminate on scope leave, if any.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 * @return {!wtf.trace.Scope} An initialized scope.
 */
wtf.trace.Scope.enter = function(opt_msg, opt_flow, opt_time) {
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
  // TODO(benvanik): scope stack
  var stackDepth = 0;

  // Stash values.
  scope.flow_ = opt_flow;
  scope.stackDepth_ = stackDepth;

  // Append event.
  var time = opt_time || wtf.now();
  wtf.trace.Builtin.enterScope.append(time, opt_msg);

  // Extend flow, if present.
  if (opt_flow) {
    opt_flow.extend(undefined, time);
  }

  return scope;
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
  // TODO(benvanik): scope stack
  var stackDepth = 0;

  // Stash values.
  scope.flow_ = flow;
  scope.stackDepth_ = stackDepth;

  // Extend flow, if present.
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
 * @return {?} The value passed as {@code opt_result}.
 * @this {wtf.trace.Scope}
 */
wtf.trace.Scope.prototype.leave = wtf.ENABLE_TRACING ? function(opt_result) {
  // Time immediately after the scope - don't track our stuff.
  // TODO(benvanik): allow for specifying time.
  var time = wtf.now();

  // Terminate a flow, if one is attached.
  if (this.flow_) {
    this.flow_.terminate(undefined, time);
    this.flow_ = undefined;
  }

  // Append event.
  wtf.trace.Builtin.leaveScope.append(time);

  // Return the scope to the pool.
  // Note that we have no thresholding here and will grow forever.
  var pool = wtf.trace.Scope.pool_;
  pool.unusedScopes[pool.unusedIndex++] = this;

  return opt_result;
} : goog.identityFunction;
