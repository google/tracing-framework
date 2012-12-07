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
goog.require('wtf.data.Variable');
goog.require('wtf.trace.EventRegistry');
goog.require('wtf.trace.EventType');


/**
 * Creates and registers a new event type.
 * @param {string} signature Event signature.
 * @param {wtf.data.EventClass} eventClass Event class.
 * @param {number} flags A bitmask of {@see wtf.data.EventFlag} values.
 * @return {wtf.trace.EventType} New event type.
 * @private
 */
wtf.trace.events.create_ = wtf.ENABLE_TRACING ?
    function(signature, eventClass, flags) {
      // A registry must exist to create the event.
      var registry = wtf.trace.EventRegistry.getShared();

      var parsedSignature = wtf.data.Variable.parseSignature(signature);
      var name = parsedSignature.name;
      var args = parsedSignature.args;

      // Create.
      var eventType = new wtf.trace.EventType(
          name, eventClass, flags, args);

      // Register.
      registry.registerEventType(eventType);

      return eventType;
    } : goog.nullFunction;


/**
 * Creates and registers a new event type.
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtf.data.EventFlag} values.
 * @return {Function} New event type.
 */
wtf.trace.events.createInstance = function(signature, opt_flags) {
  var eventType = wtf.trace.events.create_(
      signature, wtf.data.EventClass.INSTANCE, opt_flags || 0);
  return eventType.append;
};


/**
 * Creates and registers a new event type.
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtf.data.EventFlag} values.
 * @return {Function} New event type.
 */
wtf.trace.events.createScope = function(signature, opt_flags) {
  var eventType = wtf.trace.events.create_(
      signature, wtf.data.EventClass.SCOPE, opt_flags || 0);
  return eventType.append;
};
