/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Flow tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.Flow');

goog.require('wtf.trace.BuiltinEvents');



/**
 * Flow tracking utility.
 * A stateful object that is used to help tracking async flows through time.
 * Flow instances are pooled and should not be created manually.
 *
 * @constructor
 */
wtf.trace.Flow = function() {
  // TODO(benvanik): globally unique flow ID? uuid?
  /**
   * Session-unique flow ID.
   * Used to track the flow in the stream.
   * @type {number}
   * @private
   */
  this.flowId_ = wtf.trace.Flow.invalidFlowId_;
};


/**
 * Pool of flow.
 * This is managed by the branch/terminate functions and is designed to be
 * fast, not pretty.
 * @type {!Object}
 * @private
 */
wtf.trace.Flow.pool_ = {
  /**
   * @type {!Array.<!wtf.trace.Flow>}
   */
  unusedFlows: [],

  /**
   * @type {number}
   */
  unusedIndex: 0
};


/**
 * Invalid flow ID (all zeros).
 * Used to indicate no parent flow/etc.
 * @type {number}
 * @private
 */
wtf.trace.Flow.invalidFlowId_ = 0;


/**
 * Generates a new semi-unique flow ID.
 * @return {number} Flow ID.
 * @private
 */
wtf.trace.Flow.generateId_ = function() {
  var value = 0 | Math.random() * (1 << 31);

  // Ensure generated IDs are never all zeros.
  if (!value) {
    value = 1;
  }

  return value;
};


/**
 * Current global flow, if any.
 * The global flow is used to track the last used flow. When new flows are
 * branched without an explicit parent flow the global flow is used. This
 * enables flows to be setup at an application level and then used as a parent
 * deep within instrumented APIs without needing to add parameters to every
 * call.
 *
 * There is great potential for bad data here in the case of this not getting
 * reset. In order for it to work correctly all runtime callbacks must either
 * set a flow or clear it when completed to ensure no leakage.
 *
 * @type {wtf.trace.Flow}
 * @private
 */
wtf.trace.Flow.current_ = null;


/**
 * Clears the current global flow.
 * This should be called at the end of any runtime callback.
 */
wtf.trace.Flow.clearCurrent = function() {
  wtf.trace.Flow.current_ = null;
};


/**
 * Branches a flow.
 * This will initialize a flow object and append a branch event.
 * Prefer using the {@see wtf.trace#branchFlow} utility method over this.
 *
 * @param {string=} opt_msg Optional message string.
 * @param {wtf.trace.Flow=} opt_parentFlow Parent flow, if any.
 * @param {number=} opt_time Time for the branch; omit to use the current time.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.Flow.branch = function(opt_msg, opt_parentFlow, opt_time) {
  // Pop a flow from the pool or allocate a new one.
  var pool = wtf.trace.Flow.pool_;
  var flow;
  if (pool.unusedIndex) {
    flow = pool.unusedFlows[--pool.unusedIndex];
  } else {
    flow = new wtf.trace.Flow();
  }

  // Generate a new semi-unique flow ID.
  flow.flowId_ = wtf.trace.Flow.generateId_();

  // Infer parent flow global, if needed.
  var parentFlow = opt_parentFlow || wtf.trace.Flow.current_;
  var parentFlowId =
      parentFlow ? parentFlow.flowId_ : wtf.trace.Flow.invalidFlowId_;

  // Append event.
  wtf.trace.BuiltinEvents.branchFlow(
      flow.flowId_, parentFlowId, opt_msg, opt_time);

  return flow;
};


/**
 * Spans the flow across processes.
 * Flows must have been branched before this can be used.
 * Prefer using the {@see wtf.trace#spanFlow} utility method over this.
 *
 * @param {number} flowId Flow ID.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.Flow.span = function(flowId) {
  // Pop a flow from the pool or allocate a new one.
  var pool = wtf.trace.Flow.pool_;
  var flow;
  if (pool.unusedIndex) {
    flow = pool.unusedFlows[--pool.unusedIndex];
  } else {
    flow = new wtf.trace.Flow();
  }

  // Stash flow ID.
  flow.flowId_ = flowId;

  return flow;
};


/**
 * Gets the ID of the flow.
 * This can be sent to servers/other threads/etc to track across processes.
 * @return {number} Flow ID.
 */
wtf.trace.Flow.prototype.getId = function() {
  return this.flowId_;
};


/**
 * Extends the flow.
 * @param {string=} opt_msg Optional message string.
 * @param {number=} opt_time Time for the event, or 0 to use the current time.
 * @this {wtf.trace.Flow}
 */
wtf.trace.Flow.prototype.extend = function(opt_msg, opt_time) {
  // Reset current local flow.
  wtf.trace.Flow.current_ = this;

  // Append event.
  wtf.trace.BuiltinEvents.extendFlow(this.flowId_, opt_msg, opt_time);
};


/**
 * Teriminates the flow.
 * @param {string=} opt_msg Optional message string.
 * @param {number=} opt_time Time for the event, or 0 to use the current time.
 * @this {wtf.trace.Flow}
 */
wtf.trace.Flow.prototype.terminate = function(opt_msg, opt_time) {
  // Reset current local flow.
  wtf.trace.Flow.current_ = null;

  // Append event.
  wtf.trace.BuiltinEvents.terminateFlow(this.flowId_, opt_msg, opt_time);

  // Return the scope to the pool.
  // Note that we have no thresholding here and will grow forever.
  var pool = wtf.trace.Flow.pool_;
  pool.unusedFlows[pool.unusedIndex++] = this;
};


goog.exportProperty(
    wtf.trace.Flow.prototype,
    'getId',
    wtf.trace.Flow.prototype.getId);
goog.exportProperty(
    wtf.trace.Flow.prototype,
    'extend',
    wtf.trace.Flow.prototype.extend);
goog.exportProperty(
    wtf.trace.Flow.prototype,
    'terminate',
    wtf.trace.Flow.prototype.terminate);
