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

goog.provide('wtf.trace.EventType');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.reflect');



/**
 * Event type definition.
 * A static object used to define events at compile time. At runtime code can
 * be generated to efficiently read or write the events.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     event. It should be a valid JavaScript literal (no spaces/etc).
 * @param {wtf.data.EventClass} eventClass Event class.
 * @param {number} flags A bitmask of {@see wtf.data.EventFlag}.
 * @param {Array.<!wtf.data.Variable>=} opt_args Additional arguments encoded
 *     with the event.
 * @constructor
 */
wtf.trace.EventType = function(name, eventClass, flags, opt_args) {
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
   * Additional data encoded with the event.
   * @type {!Array.<!wtf.data.Variable>}
   */
  this.args = opt_args || [];

  /**
   * Event wire ID, used when serializing.
   * This is set upon registration with the trace manager.
   * @type {number}
   */
  this.wireId = wtf.trace.EventType.nextEventWireId_++;
  goog.asserts.assert(this.wireId <= wtf.trace.EventType.MAX_EVENT_WIRE_ID_);

  /**
   * Append function.
   * This is only set when a session is active and the function is bound to
   * that session.
   * @type {Function}
   */
  this.append = null;

  /**
   * Current count.
   * Incremented each time the event is appended, if the COUNT flag is present.
   * @type {number}
   */
  this.count = 0;
};


/**
 * Maximum event wire ID value.
 * @const
 * @type {number}
 * @private
 */
wtf.trace.EventType.MAX_EVENT_WIRE_ID_ = 0xFFFF;


/**
 * Next ID to assign to events.
 * 0 is reserved for system control messages.
 * @type {number}
 * @private
 */
wtf.trace.EventType.nextEventWireId_ = 1;


/**
 * Gets a pretty-formatted name for the event.
 * @return {string} Pretty-formatted name.
 */
wtf.trace.EventType.prototype.toString = function() {
  return this.name;
};


/**
 * Gets a serialized signature string for the arguments, if any.
 * @return {?string} Signature string (like 'uint8 foo, uint16 bar').
 */
wtf.trace.EventType.prototype.getArgString = function() {
  if (!this.args.length) {
    return null;
  }

  var parts = [];
  for (var n = 0; n < this.args.length; n++) {
    var arg = this.args[n];
    parts.push(arg.typeName + ' ' + arg.name);
  }
  return parts.join(', ');
};


/**
 * Generates event append code bound to the given session.
 * @param {!wtf.trace.EventTypeBuilder} builder Event type builder.
 * @param {!wtf.trace.EventSessionContextType} context Event session context.
 */
wtf.trace.EventType.prototype.generateCode = function(builder, context) {
  this.append = builder.generate(context, this);
};


/**
 * Gets an object mapping buffer member names to compiled names.
 * For example:
 * <code>
 * var nameMap = wtf.trace.EventType.getNameMap();
 * eventType[nameMap.count](5);
 * </code>
 * @return {!Object.<string>} Map from usable literals to compiled names.
 */
wtf.trace.EventType.getNameMap = function() {
  var reflectedNames = goog.reflect.object(wtf.trace.EventType, {
    count: 0
  });
  reflectedNames = goog.object.transpose(reflectedNames);
  return {
    count: reflectedNames[0]
  };
};
