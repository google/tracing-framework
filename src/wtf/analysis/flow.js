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

goog.provide('wtf.analysis.Flow');



/**
 * Flow tracking utility.
 * A stateful object that is used to help tracking async flows through time.
 * Flows are passed to listeners to enable better tracking.
 *
 * @param {number} flowId Flow ID.
 * @param {number} parentFlowId Parent flow ID.
 * @param {wtf.analysis.Flow} parentFlow Parent flow, if any. Note that this
 *     may not be valid even if a parent flow ID is given, if the flow happens
 *     to not be in the cache.
 * @constructor
 */
wtf.analysis.Flow = function(flowId, parentFlowId, parentFlow) {
  /**
   * Session-unique flow ID.
   * Used to track the flow in the stream.
   * @type {number}
   * @private
   */
  this.flowId_ = flowId;

  /**
   * Parent flow ID.
   * @type {number}
   * @private
   */
  this.parentFlowId_ = parentFlowId;

  /**
   * Parent flow, if any. Note that this may not be valid even if a parent
   * flow ID is given, if the flow happens to not be in the cache.
   * @type {wtf.analysis.Flow}
   * @private
   */
  this.parentFlow_ = parentFlow;

  /**
   * Branch event for the flow.
   * @type {wtf.analysis.FlowEvent}
   * @private
   */
  this.branchEvent_ = null;

  /**
   * Extend event for the flow.
   * @type {wtf.analysis.FlowEvent}
   * @private
   */
  this.extendEvent_ = null;

  /**
   * Terminate event for the flow.
   * @type {wtf.analysis.FlowEvent}
   * @private
   */
  this.terminateEvent_ = null;
};


/**
 * Gets the ID of the flow.
 * This can be sent to servers/other threads/etc to track across processes.
 * @return {number} Flow ID.
 */
wtf.analysis.Flow.prototype.getId = function() {
  return this.flowId_;
};


/**
 * Gets a value indicating whether the flow has a parent.
 * This may be true if even {@see #getParent} returns null, as the parent may
 * not have been seen in the stream.
 * @return {boolean} True if the flow has/had a parent.
 */
wtf.analysis.Flow.prototype.hasParent = function() {
  return !!this.parentFlowId_;
};


/**
 * Gets the parent flow of this flow instance.
 * This may be null even if {@see #hasParent} is true, as the flow may not have
 * been present in the stream.
 * @return {wtf.analysis.Flow} Parent flow, if any.
 */
wtf.analysis.Flow.prototype.getParent = function() {
  return this.parentFlow_;
};


/**
 * Gets the branch event for the flow.
 * @return {wtf.analysis.FlowEvent} Branch event, if any.
 */
wtf.analysis.Flow.prototype.getBranchEvent = function() {
  return this.branchEvent_;
};


/**
 * Sets the branch event for the flow.
 * @param {!wtf.analysis.FlowEvent} e Event.
 */
wtf.analysis.Flow.prototype.setBranchEvent = function(e) {
  this.branchEvent_ = e;
};


/**
 * Gets the extend event for the flow.
 * @return {wtf.analysis.FlowEvent} Extend event, if any.
 */
wtf.analysis.Flow.prototype.getExtendEvent = function() {
  return this.extendEvent_;
};


/**
 * Sets the extend event for the flow.
 * @param {!wtf.analysis.FlowEvent} e Event.
 */
wtf.analysis.Flow.prototype.setExtendEvent = function(e) {
  this.extendEvent_ = e;
};


/**
 * Gets the terminate event for the flow.
 * @return {wtf.analysis.FlowEvent} Terminate event, if any.
 */
wtf.analysis.Flow.prototype.getTerminateEvent = function() {
  return this.terminateEvent_;
};


/**
 * Sets the terminate event for the flow.
 * @param {!wtf.analysis.FlowEvent} e Event.
 */
wtf.analysis.Flow.prototype.setTerminateEvent = function(e) {
  this.terminateEvent_ = e;
};


goog.exportSymbol(
    'wtf.analysis.Flow',
    wtf.analysis.Flow);
goog.exportProperty(
    wtf.analysis.Flow.prototype, 'getId',
    wtf.analysis.Flow.prototype.getId);
goog.exportProperty(
    wtf.analysis.Flow.prototype, 'hasParent',
    wtf.analysis.Flow.prototype.hasParent);
goog.exportProperty(
    wtf.analysis.Flow.prototype, 'getParent',
    wtf.analysis.Flow.prototype.getParent);
goog.exportProperty(
    wtf.analysis.Flow.prototype, 'getBranchEvent',
    wtf.analysis.Flow.prototype.getBranchEvent);
goog.exportProperty(
    wtf.analysis.Flow.prototype, 'getExtendEvent',
    wtf.analysis.Flow.prototype.getExtendEvent);
goog.exportProperty(
    wtf.analysis.Flow.prototype, 'getTerminateEvent',
    wtf.analysis.Flow.prototype.getTerminateEvent);
