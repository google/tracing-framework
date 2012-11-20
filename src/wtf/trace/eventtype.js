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
goog.require('wtf.data.EventClass');



/**
 * Event type definition.
 * A static object used to define events at compile time. At runtime code can
 * be generated to efficiently read or write the events.
 *
 * @param {string} name A machine-friendly name used to uniquely identify the
 *     event. It should be a valid Javascript literal (no spaces/etc).
 * @param {wtf.data.EventClass} eventClass Event class.
 * @param {number} flags A bitmask of {@see wtf.data.EventFlag}.
 * @param {Array.<!wtf.data.Variable>=} opt_args Additional arguments encoded
 *     with the event.
 * @constructor
 */
wtf.trace.EventType = function(name, eventClass, flags, opt_args) {
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
  this.args = opt_args || [];

  /**
   * Event wire ID, used when serializing.
   * This is set upon registration with the trace manager.
   * @type {number}
   */
  this.wireId = wtf.trace.EventType.nextEventWireId_++;
  goog.asserts.assert(this.wireId <= wtf.trace.EventType.MAX_EVENT_WIRE_ID_);

  var builder = wtf.trace.EventType.getBuilder_();
  var fn = builder.generate(this);

  // V8 optimization - always force to null before setting to a function.
  this.append = /** @type {wtf.trace.EventType.AppendFunction} */ (null);
  this.enterScope =
      /** @type {wtf.trace.EventType.EnterScopeFunction} */ (null);

  /**
   * Append function.
   * Only set on INSTANCE classes.
   * @type {wtf.trace.EventType.AppendFunction}
   */
  this.append =
      eventClass == wtf.data.EventClass.INSTANCE ? fn : goog.nullFunction;

  /**
   * Enter scope function.
   * Only set on SCOPE classes.
   * @type {wtf.trace.EventType.EnterScopeFunction}
   */
  this.enterScope =
      eventClass == wtf.data.EventClass.SCOPE ? fn : goog.nullFunction;

  /**
   * Current count.
   * Incremented each time the event is appended, if the COUNT flag is present.
   * @type {number}
   */
  this.count = 0;

  // NOTE: we do these crazy cases to ensure v8 picks up the right types for
  //     our members on its first pass.

  /**
   * Utility function to acquire a buffer for writing.
   * This is used by the generated append code and is only set in tracing
   * builds.
   * @type {function(number, number):wtf.io.Buffer}
   */
  this.acquireBuffer = /** @type {function(number, number):wtf.io.Buffer} */
      (goog.nullFunction);

  /**
   * Alias to {@see wtf.trace.Scope#enterTyped}.
   * @type {function(wtf.trace.Flow, number):!wtf.trace.Scope}
   */
  this.enterTypedScope =
      /** @type {function(wtf.trace.Flow, number):!wtf.trace.Scope} */ (
          goog.nullFunction);

  /**
   * Dummy scope.
   * @type {!wtf.trace.Scope}
   */
  this.dummyScope = /** @type {!wtf.trace.Scope} */ ({});
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
 * Takes as its first argument the current time.
 * All other arguments are defined by the event.
 * @typedef {function(number, ...)}
 */
wtf.trace.EventType.AppendFunction;


/**
 * Takes the current time and an optional flow.
 * All other arguments are defined by the event.
 * @typedef {function(number, wtf.trace.Flow, ...):!wtf.trace.Scope}
 */
wtf.trace.EventType.EnterScopeFunction;


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
    parts.push(arg.signatureName + ' ' + arg.name);
  }
  return parts.join(', ');
};


/**
 * Shared function builder singleton.
 * To prevent cycles the event registry initializes this.
 * @type {wtf.trace.EventTypeBuilder}
 * @private
 */
wtf.trace.EventType.builder_ = null;


/**
 * Gets a shared event builder.
 * @return {!wtf.trace.EventTypeBuilder} Builder.
 * @private
 */
wtf.trace.EventType.getBuilder_ = function() {
  goog.asserts.assert(wtf.trace.EventType.builder_);
  return wtf.trace.EventType.builder_;
};


/**
 * Sets the shared event builder.
 * This is done by the event registry to prevent cycles.
 * @param {!wtf.trace.EventTypeBuilder} eventTypeBuilder Event type builder.
 */
wtf.trace.EventType.setBuilder = function(eventTypeBuilder) {
  wtf.trace.EventType.builder_ = eventTypeBuilder;
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
    count: 0,
    acquireBuffer: 1,
    enterTypedScope: 2,
    dummyScope: 3
  });
  reflectedNames = goog.object.transpose(reflectedNames);
  return {
    count: reflectedNames[0],
    acquireBuffer: reflectedNames[1],
    enterTypedScope: reflectedNames[2],
    dummyScope: reflectedNames[3]
  };
};


/**
 * Exported method that calls into {@see #append}.
 * @param {number} time Time for the enter.
 * @param {...} var_args Scope data arguments.
 */
wtf.trace.EventType.prototype.appendExternal = function(time, var_args) {
  this.append.apply(this, arguments);
};


/**
 * Exported method that calls into {@see #enterScope}.
 * @param {number} time Time for the enter.
 * @param {wtf.trace.Flow} flow A flow to terminate on scope leave, if any.
 * @param {...} var_args Scope data arguments.
 * @return {!wtf.trace.Scope} An initialized scope object.
 */
wtf.trace.EventType.prototype.enterScopeExternal = function(
    time, flow, var_args) {
  return this.enterScope.apply(this, arguments);
};
