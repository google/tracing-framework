/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace event registration utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.events');

goog.require('wtf');
goog.require('wtf.data.EventClass');
goog.require('wtf.trace.EventRegistry');
goog.require('wtf.trace.EventType');


/**
 * Creates and registers a new event type.
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     event. It should be a valid Javascript literal (no spaces/etc).
 * @param {wtf.data.EventClass} eventClass Event class.
 * @param {number} flags A bitmask of {@see wtf.data.EventFlag} values.
 * @param {Array.<!wtf.data.Variable>=} opt_args Additional arguments encoded
 *     with the event.
 * @return {wtf.trace.EventType} New event type.
 * @private
 */
wtf.trace.events.create_ = wtf.ENABLE_TRACING ?
    function(name, eventClass, flags, opt_args) {
      // A registry must exist to create the event.
      var registry = wtf.trace.EventRegistry.getShared();

      // Create.
      var eventType = new wtf.trace.EventType(
          name, eventClass, 0, opt_args);

      // Register.
      registry.registerEventType(eventType);

      return eventType;
    } : goog.nullFunction;


/**
 * Creates and registers a new event type.
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     event. It should be a valid Javascript literal (no spaces/etc).
 * @param {Array.<!wtf.data.Variable>=} opt_args Additional arguments encoded
 *     with the event.
 * @return {wtf.trace.EventType} New event type.
 */
wtf.trace.events.createInstance = function(name, opt_args) {
  return wtf.trace.events.create_(
      name, wtf.data.EventClass.INSTANCE, 0, opt_args);
};


/**
 * Creates and registers a new event type.
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     event. It should be a valid Javascript literal (no spaces/etc).
 * @param {Array.<!wtf.data.Variable>=} opt_args Additional arguments encoded
 *     with the event.
 * @return {wtf.trace.EventType} New event type.
 */
wtf.trace.events.createScope = function(name, opt_args) {
  return wtf.trace.events.create_(
      name, wtf.data.EventClass.SCOPE, 0, opt_args);
};
