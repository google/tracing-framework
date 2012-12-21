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
goog.require('wtf.trace.Scope');



/**
 * Flow tracking utility.
 * A stateful object that is used to help tracking async flows through time.
 *
 * @param {number=} opt_flowId Flow ID. If omitted, a new flow ID will be
 *     generated.
 * @constructor
 */
wtf.trace.Flow = function(opt_flowId) {
  /**
   * Whether the flow has been terminated.
   * Once terminated, no new extend/terminate events will be written.
   * @type {boolean}
   * @private
   */
  this.terminated_ = false;

  // TODO(benvanik): globally unique flow ID? uuid?
  /**
   * Session-unique flow ID.
   * Used to track the flow in the stream.
   * @type {number}
   * @private
   */
  this.flowId_ = !opt_flowId ? wtf.trace.Flow.generateId_() : opt_flowId;
};


/**
 * Invalid flow ID (all zeros).
 * Used to indicate no parent flow/etc.
 * @type {number}
 * @const
 */
wtf.trace.Flow.INVALID_ID = 0;


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
 * Gets the ID of the flow.
 * This can be sent to servers/other threads/etc to track across processes.
 * @return {number} Flow ID.
 */
wtf.trace.Flow.prototype.getId = function() {
  return this.flowId_;
};


/**
 * Branches a flow.
 * This will initialize a flow object and append a branch event.
 * Prefer using the {@see wtf.trace#branchFlow} utility method over this.
 *
 * @param {string} name Flow name.
 * @param {*=} opt_value Optional data value.
 * @param {wtf.trace.Flow=} opt_parentFlow Parent flow, if any.
 * @param {number=} opt_time Time for the branch; omit to use the current time.
 * @return {!wtf.trace.Flow} An initialized flow object.
 */
wtf.trace.Flow.branch = function(name, opt_value, opt_parentFlow, opt_time) {
  // Infer parent flow, if needed.
  var parentFlowId = wtf.trace.Flow.INVALID_ID;
  var parentFlow = opt_parentFlow || wtf.trace.Scope.getCurrentFlow();
  if (parentFlow && !parentFlow.terminated_) {
    parentFlowId = parentFlow.flowId_;
  }

  // Create flow.
  var flow = new wtf.trace.Flow();

  // Append event.
  // TODO(benvanik): use opt_value
  wtf.trace.BuiltinEvents.branchFlow(
      flow.flowId_, parentFlowId, name, opt_time);

  return flow;
};


/**
 * Extends the flow.
 * @param {wtf.trace.Flow} flow Flow to extend.
 * @param {string} name Flow stage name.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the event, or 0 to use the current time.
 */
wtf.trace.Flow.extend = function(flow, name, opt_value, opt_time) {
  if (!flow || flow.terminated_) {
    return;
  }

  // Set the current scope flow.
  wtf.trace.Scope.setCurrentFlow(flow);

  // Append event.
  // TODO(benvanik): use opt_value
  wtf.trace.BuiltinEvents.extendFlow(flow.flowId_, name, opt_time);
};


/**
 * Teriminates the flow.
 * @param {wtf.trace.Flow} flow Flow to extend.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the event, or 0 to use the current time.
 */
wtf.trace.Flow.terminate = function(flow, opt_value, opt_time) {
  if (!flow || flow.terminated_) {
    return;
  }
  flow.terminated_ = true;

  // Append event.
  // TODO(benvanik): use opt_value
  wtf.trace.BuiltinEvents.terminateFlow(flow.flowId_, opt_time);
};


/**
 * Clears the current scope flow.
 */
wtf.trace.Flow.clear = function() {
  wtf.trace.Scope.setCurrentFlow(null);
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
  var flow = new wtf.trace.Flow(flowId);
  return flow;
};


goog.exportProperty(
    wtf.trace.Flow.prototype,
    'getId',
    wtf.trace.Flow.prototype.getId);
