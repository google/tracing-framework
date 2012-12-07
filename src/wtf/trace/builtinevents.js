/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Built-in Javascript event definitions.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.BuiltinEvents');

goog.require('wtf.data.EventFlag');
goog.require('wtf.trace.events');


/**
 * Built-in event provider info.
 * @type {!Object.<!Function>}
 */
wtf.trace.BuiltinEvents = {
  /**
   * Defines a new event type.
   * This can occur multiple times in a stream and duplicates should be ignored.
   */
  defineEvent: wtf.trace.events.createInstance(
      'wtf.event.define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
          'ascii name, ascii args)'),

  /**
   * Marks a discontinuity in the trace.
   * These may occur whenever the tracing session detects that some events are
   * missing from the stream, such as when buffers were full and events were
   * skipped.
   */
  discontinuity: wtf.trace.events.createInstance(
      'wtf.discontinuity()'),

  /**
   * Creates an execution zone.
   */
  createZone: wtf.trace.events.createInstance(
      'wtf.zone.create(uint16 zoneId, ascii name, ascii type, ascii location)'),

  /**
   * Deletes an execution zone.
   */
  deleteZone: wtf.trace.events.createInstance(
      'wtf.zone.delete(uint16 zoneId)'),

  /**
   * Sets an execution zone.
   */
  setZone: wtf.trace.events.createInstance(
      'wtf.zone.set(uint16 zoneId)'),

  /**
   * Enters an execution scope.
   */
  enterScope: wtf.trace.events.createScope(
      'wtf.scope.enter(ascii msg)'),

  /**
   * Enters a tracing framework overhead tracking scope.
   * This is used by the tracing framework to indicate a region of time
   * that is being consumed by the framework for internal work.
   */
  enterTracingScope: wtf.trace.events.createScope(
      'wtf.scope.enterTracing()',
      wtf.data.EventFlag.SYSTEM_TIME),

  /**
   * Leaves an execution scope.
   */
  leaveScope: wtf.trace.events.createInstance(
      'wtf.scope.leave()'),

  /**
   * Branches execution flow.
   */
  branchFlow: wtf.trace.events.createInstance(
      'wtf.flow.branch(flowId id, flowId parentId, ascii msg)'),

  /**
   * Continues execution flow.
   */
  extendFlow: wtf.trace.events.createInstance(
      'wtf.flow.extend(flowId id, ascii msg)'),

  /**
   * Terminates execution flow.
   */
  terminateFlow: wtf.trace.events.createInstance(
      'wtf.flow.terminate(flowId id, ascii msg)'),

  /**
   * Marks a generic event.
   */
  mark: wtf.trace.events.createInstance(
      'wtf.mark(ascii msg)')
};
