/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Compile-time event definition type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.EventType');

goog.require('wtf.analysis.EventTypeBuilder');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.Variable');



/**
 * Event type definition.
 * A static object used to define events at compile time. At runtime code can
 * be generated to efficiently read or write the events.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     event. It should be a valid Javascript literal (no spaces/etc).
 * @param {wtf.data.EventClass} eventClass Event class.
 * @param {number} flags A bitmask of {@see wtf.data.EventFlag}.
 * @param {!Array.<!wtf.data.Variable>} args Additional arguments encoded
 *     with the event.
 * @constructor
 */
wtf.analysis.EventType = function(name, eventClass, flags, args) {
  /**
   * A machine-friendly name used to uniquely identify the event. It should be a
   * valid Javascript literal (no spaces/etc).
   * @type {string}
   */
  this.name = name;

  /**
   * Event class (scope/instance/etc).
   * @type {wtf.data.EventClass}
   */
  this.eventClass = eventClass;

  /**
   * A bitmask of event flags ({@see wtf.data.EventFlag}) describing the
   * behavior of the event.
   * @type {number}
   */
  this.flags = flags;

  /**
   * Additional data encoded with the event.
   * @type {!Array.<!wtf.data.Variable>}
   */
  this.args = args;

  var builder = wtf.analysis.EventType.getBuilder_();

  /**
   * Parse function.
   * Parses only the additional data arguments, if any.
   * @type {wtf.analysis.EventType.ParseFunction?}
   */
  this.parse = args.length ? builder.generate(this) : null;
};


/**
 * Takes a buffer offset to the event data and returns the parsed values.
 * @typedef {function(!wtf.io.Buffer):!Object}
 */
wtf.analysis.EventType.ParseFunction;


/**
 * Gets a pretty-formatted name for the event.
 * @return {string} Pretty-formatted name.
 */
wtf.analysis.EventType.prototype.toString = function() {
  return this.name;
};


// TODO(benvanik): move to BinaryTraceSource
/**
 * Creates an event type from a serialized define event message.
 * @param {!Object} defineArgs Defined event arguments.
 * @return {!wtf.analysis.EventType} Event type.
 */
wtf.analysis.EventType.parse = function(defineArgs) {
  var argString = defineArgs['args'];
  var argMap = argString ?
      wtf.data.Variable.parseSignatureArguments(argString) : [];
  var argList = [];
  for (var n = 0; n < argMap.length; n++) {
    argList.push(argMap[n].variable);
  }

  return new wtf.analysis.EventType(
      defineArgs['name'],
      defineArgs['eventClass'],
      0,
      argList);
};


/**
 * Creates an instance event type from the given signature.
 * @param {string} signature Event signature.
 * @return {!wtf.analysis.EventType} Event type.
 */
wtf.analysis.EventType.createInstance = function(signature) {
  var parsedSignature = wtf.data.Variable.parseSignature(signature);
  return new wtf.analysis.EventType(
      parsedSignature.name,
      wtf.data.EventClass.INSTANCE,
      0,
      parsedSignature.args);
};


/**
 * Creates a scope event type from the given signature.
 * @param {string} signature Event signature.
 * @return {!wtf.analysis.EventType} Event type.
 */
wtf.analysis.EventType.createScope = function(signature) {
  var parsedSignature = wtf.data.Variable.parseSignature(signature);
  return new wtf.analysis.EventType(
      parsedSignature.name,
      wtf.data.EventClass.SCOPE,
      0,
      parsedSignature.args);
};


/**
 * Shared function builder singleton.
 * @type {wtf.analysis.EventTypeBuilder}
 * @private
 */
wtf.analysis.EventType.builder_ = null;


/**
 * Gets a shared event builder.
 * @return {!wtf.analysis.EventTypeBuilder} Builder.
 * @private
 */
wtf.analysis.EventType.getBuilder_ = function() {
  if (!wtf.analysis.EventType.builder_) {
    wtf.analysis.EventType.builder_ = new wtf.analysis.EventTypeBuilder();
  }
  return wtf.analysis.EventType.builder_;
};
