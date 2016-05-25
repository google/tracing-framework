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

goog.provide('wtf.db.EventType');

goog.require('wtf.data.EventClass');
goog.require('wtf.data.Variable');
goog.require('wtf.db.EventTypeBuilder');



/**
 * Event type definition.
 * A static object used to define events at compile time. At runtime code can
 * be generated to efficiently read or write the events.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     event. It should be a valid JavaScript literal (no spaces/etc).
 * @param {wtf.data.EventClass} eventClass Event class.
 * @param {number} flags A bitmask of {@see wtf.data.EventFlag}.
 * @param {!Array.<!wtf.data.Variable>} args Additional arguments encoded
 *     with the event.
 * @constructor
 */
wtf.db.EventType = function(name, eventClass, flags, args) {
  /**
   * Event ID.
   * This is set by the {@see wtf.db.EventTypeTable} when an event is defined.
   * @type {number}
   */
  this.id = 0;

  /**
   * A machine-friendly name used to uniquely identify the event. It should be a
   * valid JavaScript literal (no spaces/etc).
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
   * Whether instances of this event type may have appended scope data.
   * This is set at load time based on whether appends were seen.
   * @type {boolean}
   */
  this.mayHaveAppendedArgs = false;

  /**
   * Additional data encoded with the event.
   * @type {!Array.<!wtf.data.Variable>}
   */
  this.args = args;

  var builder = wtf.db.EventType.getBuilder_();

  /**
   * Parse function.
   * Parses only the additional data arguments, if any.
   * @type {wtf.db.EventType.ParseFunction?}
   */
  this.parseBinaryArguments = args.length ? builder.generate(this) : null;

  /**
   * Parse function for the legacy format.
   * Parses only the additional data arguments, if any.
   * @type {wtf.db.EventType.LegacyParseFunction?}
   */
  this.parseLegacyArguments = args.length ? builder.generateLegacy(this) : null;
};


/**
 * Takes a buffer offset to the event data and returns the parsed values.
 * @typedef {function(!wtf.io.BufferView.Type):!Object}
 */
wtf.db.EventType.ParseFunction;


/**
 * Takes a buffer offset to the event data and returns the parsed values.
 * @typedef {function(!wtf.io.Buffer):!Object}
 */
wtf.db.EventType.LegacyParseFunction;


/**
 * Gets a pretty-formatted name for the event.
 * @return {string} Pretty-formatted name.
 */
wtf.db.EventType.prototype.toString = function() {
  return this.name;
};


/**
 * Gets the name of the event.
 * @return {string} Event name.
 */
wtf.db.EventType.prototype.getName = function() {
  return this.name;
};


/**
 * Gets the class of the event.
 * @return {wtf.data.EventClass} Event class.
 */
wtf.db.EventType.prototype.getClass = function() {
  return this.eventClass;
};


/**
 * Gets associated event flags.
 * @return {number} A bitmask of {@see wtf.data.EventFlag}.
 */
wtf.db.EventType.prototype.getFlags = function() {
  return this.flags;
};


/**
 * Gets a list of additional arguments encoded with the event.
 * @return {!Array.<!wtf.data.Variable>} Arguments.
 */
wtf.db.EventType.prototype.getArguments = function() {
  return this.args;
};


/**
 * Creates an instance event type from the given signature.
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtf.data.EventFlag} values.
 * @return {!wtf.db.EventType} Event type.
 */
wtf.db.EventType.createInstance = function(signature, opt_flags) {
  var parsedSignature = wtf.data.Variable.parseSignature(signature);
  return new wtf.db.EventType(
      parsedSignature.name,
      wtf.data.EventClass.INSTANCE,
      opt_flags || 0,
      parsedSignature.args);
};


/**
 * Creates a scope event type from the given signature.
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtf.data.EventFlag} values.
 * @return {!wtf.db.EventType} Event type.
 */
wtf.db.EventType.createScope = function(signature, opt_flags) {
  var parsedSignature = wtf.data.Variable.parseSignature(signature);
  return new wtf.db.EventType(
      parsedSignature.name,
      wtf.data.EventClass.SCOPE,
      opt_flags || 0,
      parsedSignature.args);
};


/**
 * Shared function builder singleton.
 * @type {wtf.db.EventTypeBuilder}
 * @private
 */
wtf.db.EventType.builder_ = null;


/**
 * Gets a shared event builder.
 * @return {!wtf.db.EventTypeBuilder} Builder.
 * @private
 */
wtf.db.EventType.getBuilder_ = function() {
  if (!wtf.db.EventType.builder_) {
    wtf.db.EventType.builder_ = new wtf.db.EventTypeBuilder();
  }
  return wtf.db.EventType.builder_;
};


goog.exportSymbol(
    'wtf.db.EventType',
    wtf.db.EventType);
goog.exportProperty(
    wtf.db.EventType.prototype, 'toString',
    wtf.db.EventType.prototype.toString);
goog.exportProperty(
    wtf.db.EventType.prototype, 'getName',
    wtf.db.EventType.prototype.getName);
goog.exportProperty(
    wtf.db.EventType.prototype, 'getClass',
    wtf.db.EventType.prototype.getClass);
goog.exportProperty(
    wtf.db.EventType.prototype, 'getFlags',
    wtf.db.EventType.prototype.getFlags);
goog.exportProperty(
    wtf.db.EventType.prototype, 'getArguments',
    wtf.db.EventType.prototype.getArguments);
