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
wtf.trace.events.create_ = function(signature, eventClass, flags) {
  // A registry must exist to create the event.
  var registry = wtf.trace.EventRegistry.getShared();

  var parsedSignature = wtf.data.Variable.parseSignature(signature);
  var name = parsedSignature.name;
  var args = parsedSignature.args;

  // Check if it exists.
  var existingEventType = registry.getEventType(name);
  if (existingEventType) {
    // TODO(benvanik): assert the same event type (not a redefinition).
    goog.global.console.log(
        'Attempting to redefine ' + name + ', using first definition');
    return existingEventType;
  }

  // Create.
  var eventType = new wtf.trace.EventType(
      name, eventClass, flags, args);

  // Register.
  registry.registerEventType(eventType);

  return eventType;
};


/**
 * Creates and registers a new event type, returning a function that can be used
 * to trace the event in the WTF event stream.
 * Created events should be cached and reused - do *not* redefine events.
 *
 * Events are defined by a signature that can be a simple string such as
 * {@code 'myEvent'} or a reference string like {@code 'namespace.Type#method'}
 * and can optionally include typed parameters like
 * {@code 'myEvent(uint32 a, ascii b)'}.
 *
 * For more information on this API, see:
 * https://github.com/google/tracing-framework/blob/master/docs/api.md
 *
 * When tracing is disabled {@code goog.nullFunction} will be returned for
 * all events.
 *
 * Example:
 * <code>
 * // Create the event once, statically.
 * my.Type.fooEvent_ = wtf.trace.events.createInstance(
 *     'my.Type#foo(uint32 a, ascii b)');
 * my.Type.prototype.someMethod = function() {
 *   // Trace the event each function call with custom args.
 *   my.Type.fooEvent_(123, 'hello');
 * };
 * </code>
 *
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtf.data.EventFlag} values.
 * @return {!Function} New event type.
 */
wtf.trace.events.createInstance = function(signature, opt_flags) {
  var eventType = wtf.trace.events.create_(
      signature, wtf.data.EventClass.INSTANCE, opt_flags || 0);
  return eventType.append;
};


/**
 * Creates and registers a new event type, returning a function that can be used
 * to trace the event in the WTF event stream.
 * Created events should be cached and reused - do *not* redefine events.
 *
 * Events are defined by a signature that can be a simple string such as
 * {@code 'myEvent'} or a reference string like {@code 'namespace.Type#method'}
 * and can optionally include typed parameters like
 * {@code 'myEvent(uint32 a, ascii b)'}.
 *
 * For more information on this API, see:
 * https://github.com/google/tracing-framework/blob/master/docs/api.md
 *
 * When tracing is disabled {@code goog.nullFunction} will be returned for
 * all events.
 *
 * Example:
 * <code>
 * // Create the event once, statically.
 * my.Type.someMethodEvent_ = wtf.trace.events.createScope(
 *     'my.Type#foo(uint32 a, ascii b)');
 * my.Type.prototype.someMethod = function() {
 *   // Enter and leave each function call with custom args.
 *   var scope = my.Type.someMethodEvent_(123, 'hello');
 *   var result = 5; // ...
 *   return wtf.trace.leaveScope(scope, result);
 * };
 * </code>
 *
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtf.data.EventFlag} values.
 * @return {!Function} New event type.
 */
wtf.trace.events.createScope = function(signature, opt_flags) {
  var eventType = wtf.trace.events.create_(
      signature, wtf.data.EventClass.SCOPE, opt_flags || 0);
  return eventType.append;
};
