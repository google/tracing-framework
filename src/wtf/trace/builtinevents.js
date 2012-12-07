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

goog.provide('wtf.trace.BuiltinAppendDataEvents');
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
          'ascii name, ascii args)',
      wtf.data.EventFlag.INTERNAL),

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
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.SYSTEM_TIME),

  /**
   * Leaves an execution scope.
   */
  leaveScope: wtf.trace.events.createInstance(
      'wtf.scope.leave()',
      wtf.data.EventFlag.INTERNAL),

  /**
   * Branches execution flow.
   */
  branchFlow: wtf.trace.events.createInstance(
      'wtf.flow.branch(flowId id, flowId parentId, ascii msg)',
      wtf.data.EventFlag.INTERNAL),

  /**
   * Continues execution flow.
   */
  extendFlow: wtf.trace.events.createInstance(
      'wtf.flow.extend(flowId id, ascii msg)',
      wtf.data.EventFlag.INTERNAL),

  /**
   * Terminates execution flow.
   */
  terminateFlow: wtf.trace.events.createInstance(
      'wtf.flow.terminate(flowId id, ascii msg)',
      wtf.data.EventFlag.INTERNAL),

  /**
   * Marks a generic event.
   */
  mark: wtf.trace.events.createInstance(
      'wtf.mark(ascii msg)')
};


/**
 * Built-in utility functions for adding data to scopes.
 * @type {!Object.<!Function>}
 */
wtf.trace.BuiltinAppendDataEvents = {
  addInt8: wtf.trace.events.createInstance(
      'wtf.scope.appendDataInt8(ascii name, int8 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addInt16: wtf.trace.events.createInstance(
      'wtf.scope.appendDataInt16(ascii name, int16 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addInt32: wtf.trace.events.createInstance(
      'wtf.scope.appendDataInt32(ascii name, int32 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addUint8: wtf.trace.events.createInstance(
      'wtf.scope.appendDataUint8(ascii name, uint8 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addUint16: wtf.trace.events.createInstance(
      'wtf.scope.appendDataUint16(ascii name, uint16 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addUint32: wtf.trace.events.createInstance(
      'wtf.scope.appendDataUint32(ascii name, uint32 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addFloat32: wtf.trace.events.createInstance(
      'wtf.scope.appendDataFloat32(ascii name, float32 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addAscii: wtf.trace.events.createInstance(
      'wtf.scope.appendDataAscii(ascii name, ascii value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA),
  addUtf8: wtf.trace.events.createInstance(
      'wtf.scope.appendDataUtf8(ascii name, utf8 value)',
      wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA)
};
