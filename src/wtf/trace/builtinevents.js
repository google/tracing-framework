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
      'wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ' +
          'ascii name, ascii args)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Marks a discontinuity in the trace.
   * These may occur whenever the tracing session detects that some events are
   * missing from the stream, such as when buffers were full and events were
   * skipped.
   */
  discontinuity: wtf.trace.events.createInstance(
      'wtf.trace#discontinuity()',
      wtf.data.EventFlag.BUILTIN),

  /**
   * Creates an execution zone.
   */
  createZone: wtf.trace.events.createInstance(
      'wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Deletes an execution zone.
   */
  deleteZone: wtf.trace.events.createInstance(
      'wtf.zone#delete(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Sets an execution zone.
   */
  setZone: wtf.trace.events.createInstance(
      'wtf.zone#set(uint16 zoneId)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Enters an execution scope.
   */
  enterScope: wtf.trace.events.createScope(
      'wtf.scope#enter(ascii msg)',
      wtf.data.EventFlag.BUILTIN),

  /**
   * Enters a tracing framework overhead tracking scope.
   * This is used by the tracing framework to indicate a region of time
   * that is being consumed by the framework for internal work.
   */
  enterTracingScope: wtf.trace.events.createScope(
      'wtf.scope#enterTracing()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL |
      wtf.data.EventFlag.SYSTEM_TIME),

  /**
   * Leaves an execution scope.
   */
  leaveScope: wtf.trace.events.createInstance(
      'wtf.scope#leave()',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Appends data to the current scope.
   */
  appendScopeData: wtf.trace.events.createInstance(
      'wtf.scope#appendData(ascii name, utf8 json)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL |
      wtf.data.EventFlag.APPEND_SCOPE_DATA),

  /**
   * Branches execution flow.
   */
  branchFlow: wtf.trace.events.createInstance(
      'wtf.flow#branch(flowId id, flowId parentId, ascii msg)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Continues execution flow.
   */
  extendFlow: wtf.trace.events.createInstance(
      'wtf.flow#extend(flowId id, ascii msg)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Terminates execution flow.
   */
  terminateFlow: wtf.trace.events.createInstance(
      'wtf.flow#terminate(flowId id, ascii msg)',
      wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL),

  /**
   * Marks a generic event.
   */
  mark: wtf.trace.events.createInstance(
      'wtf.trace#mark(ascii name)',
      wtf.data.EventFlag.BUILTIN),

  /**
   * A simple timestamp event.
   */
  timeStamp: wtf.trace.events.createInstance(
      'wtf.trace#timeStamp(ascii name)')
};
