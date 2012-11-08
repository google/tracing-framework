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

goog.provide('wtf.trace.Builtin');

goog.require('wtf.data.Variable');
goog.require('wtf.trace.events');


/**
 * Built-in event provider info.
 * @type {!Object.<!wtf.trace.EventType>}
 */
wtf.trace.Builtin = {
  /**
   * Defines a new event type.
   * This can occur multiple times in a stream and duplicates should be ignored.
   */
  defineEvent: wtf.trace.events.createInstance('wtf.event.define', [
    new wtf.data.Variable.Uint16('wireId'),
    new wtf.data.Variable.Uint16('eventClass'),
    new wtf.data.Variable.AsciiString('name'),
    new wtf.data.Variable.AsciiString('args')
  ]),

  /**
   * Marks a discontinuity in the trace.
   * These may occur whenever the tracing session detects that some events are
   * missing from the stream, such as when buffers were full and events were
   * skipped.
   */
  discontinuity: wtf.trace.events.createInstance('wtf.discontinuity'),

  /**
   * Creates an execution zone.
   */
  createZone: wtf.trace.events.createInstance('wtf.zone.create', [
    new wtf.data.Variable.Uint16('zoneId'),
    new wtf.data.Variable.AsciiString('name'),
    new wtf.data.Variable.AsciiString('type'),
    new wtf.data.Variable.AsciiString('location')
  ]),

  /**
   * Deletes an execution zone.
   */
  deleteZone: wtf.trace.events.createInstance('wtf.zone.delete', [
    new wtf.data.Variable.Uint16('zoneId')
  ]),

  /**
   * Sets an execution zone.
   */
  setZone: wtf.trace.events.createInstance('wtf.zone.set', [
    new wtf.data.Variable.Uint16('zoneId')
  ]),

  /**
   * Enters an execution scope.
   */
  enterScope: wtf.trace.events.createScope('wtf.scope.enter', [
    new wtf.data.Variable.AsciiString('msg')
  ]),

  /**
   * Leaves an execution scope.
   */
  leaveScope: wtf.trace.events.createInstance('wtf.scope.leave'),

  /**
   * Branches execution flow.
   */
  branchFlow: wtf.trace.events.createInstance('wtf.flow.branch', [
    new wtf.data.Variable.FlowID('id'),
    new wtf.data.Variable.FlowID('parentId'),
    new wtf.data.Variable.AsciiString('msg')
  ]),

  /**
   * Continues execution flow.
   */
  extendFlow: wtf.trace.events.createInstance('wtf.flow.extend', [
    new wtf.data.Variable.FlowID('id'),
    new wtf.data.Variable.AsciiString('msg')
  ]),

  /**
   * Terminates execution flow.
   */
  terminateFlow: wtf.trace.events.createInstance('wtf.flow.terminate', [
    new wtf.data.Variable.FlowID('id'),
    new wtf.data.Variable.AsciiString('msg')
  ]),

  /**
   * Marks a generic event.
   */
  mark: wtf.trace.events.createInstance('wtf.mark', [
    new wtf.data.Variable.AsciiString('msg')
  ])
};
