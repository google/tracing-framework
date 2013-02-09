/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Automatic function and type instrumentation utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.instrument');
goog.provide('wtf.trace.instrumentType');

goog.require('goog.asserts');
goog.require('wtf.data.Variable');
goog.require('wtf.trace');
goog.require('wtf.trace.events');
goog.require('wtf.util');


/**
 * Automatically instruments a method.
 * This will likely produce code slower than manually instrumenting, but is
 * much more readable.
 *
 * <code>
 * my.Type.prototype.foo = wtf.trace.instrument(function(a, b) {
 *   return a + b;
 * }, 'my.Type.foo(uint8 b@1)');
 * </code>
 *
 * @param {Function} value Target function.
 * @param {string} signature Method signature.
 * @param {string=} opt_namePrefix String to prepend to the name.
 * @param {?(function(Function, Function):Function)=} opt_generator
 *     A custom function generator that is responsible for taking the given
 *     {@code value} and returning a wrapped function that emits the given
 *     event type.
 * @param {(function())=} opt_pre Code to execute before the scope is entered.
 *     This is only called if {@code opt_generator} is not provided.
 * @return {Function} The instrumented input value.
 */
wtf.trace.instrument = function(value, signature, opt_namePrefix,
    opt_generator, opt_pre) {
  if (opt_namePrefix) {
    signature = opt_namePrefix + signature;
  }

  // Parse signature.
  var parsedSignature = wtf.data.Variable.parseSignature(signature);
  var argMap = parsedSignature.argMap;

  // Define a custom event type at runtime.
  var customEvent = wtf.trace.events.createScope(signature);
  goog.asserts.assert(customEvent);

  // TODO(benvanik): use a FunctionBuilder to generate the argument stuff from
  //     the signature.
  var result;
  var leaveScope = wtf.trace.leaveScope;
  if (opt_generator) {
    result = opt_generator(value, customEvent);
  } else if (!argMap || !argMap.length) {
    // Simple function - no custom data.
    if (opt_pre) {
      result = function() {
        opt_pre.call(this);
        var scope = customEvent();
        var result = value.apply(this, arguments);
        leaveScope(scope);
        return result;
      };
    } else {
      result = function() {
        var scope = customEvent();
        var result = value.apply(this, arguments);
        leaveScope(scope);
        return result;
      };
    }
  } else {
    // Custom arguments.
    // TODO(benvanik): optimize this function to not require the for-loop.
    var eventArgs = new Array(argMap.length);
    result = function() {
      if (opt_pre) {
        opt_pre.call(this);
      }
      for (var n = 0; n < argMap.length; n++) {
        eventArgs[n] = arguments[argMap[n].ordinal];
      }
      var scope = customEvent.apply(customEvent, eventArgs);
      var result = value.apply(this, arguments);
      leaveScope(scope);
      return result;
    };
  }

  // Stash original method on the result - it's used by our modified goog.base
  // when searching up the prototype chain.
  result['uninstrumented'] = value;
  return result;
};


/**
 * Automatically instruments an entire type.
 *
 * <code>
 * my.Type = function(a, b) {
 *   goog.base(this);
 *   this.value = a + b;
 * };
 * goog.inherits(my.Type, some.BaseType);
 * my.Type.prototype.foo = function(a) { return a; };
 * my.Type = wtf.trace.instrumentType(
 *     my.Type, 'my.Type(uint8 a, uint8 b)',
 *     goog.reflect.object(my.Type, {
 *       foo: 'foo(uint8 a)'
 *     }));
 * </code>
 *
 * @param {Function} value Target type.
 * @param {string} constructorSignature Type name and constructor signature.
 * @param {Object|!Object.<string>} methodMap A map of translated method names
 *     to method signatures. Only the methods in this map will be
 *     auto-instrumented.
 * @return {Function} The instrumented input value.
 */
wtf.trace.instrumentType = function(value, constructorSignature, methodMap) {
  // Rewrite constructor. This requires changing the entire type, which is why
  // we return the result.
  var newValue = wtf.trace.instrument(value, constructorSignature);
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = value.prototype;
  newValue.superClass_ = value.prototype;
  newValue.prototype = new tempCtor();
  /** @override */
  newValue.prototype.constructor = newValue;

  // Copy any static methods.
  // TODO(benvanik): allow for instrumentation of static methods?
  for (var key in value) {
    if (value.hasOwnProperty(key)) {
      newValue[key] = value[key];
    }
  }

  // Stash original.
  newValue['uninstrumented'] = value;

  // Parse signature to get the type name.
  var parsedSignature = wtf.data.Variable.parseSignature(constructorSignature);
  var typeName = parsedSignature.name;

  // Instrument all methods.
  if (methodMap) {
    var proto = newValue.prototype;
    for (var methodName in methodMap) {
      var methodSignature = methodMap[methodName];
      var method = proto[methodName];
      if (method) {
        proto[methodName] = wtf.trace.instrument(
            method, methodSignature, typeName + '#');
      }
    }
  }

  return newValue;
};


/**
 * Automatically instruments the given prototype methods.
 * This is a simple variant of {@see wtf.trace.instrumentType} that does not
 * provide method arguments or work with overridden methods.
 *
 * @param {string} prefix A common prefix to use for all trace labels.
 * @param {!Object} classPrototype The prototype of the class.
 * @param {!Object.<!Function>} methodMap A mapping between method names
 *     and the methods themselves.
 */
wtf.trace.instrumentTypeSimple = function(prefix, classPrototype, methodMap) {
  for (var methodName in methodMap) {
    var functionRef = methodMap[methodName];
    var functionName = wtf.util.getCompiledMemberName(
        classPrototype, functionRef);
    if (functionName) {
      classPrototype[functionName] = wtf.trace.instrument(
          classPrototype[functionName], methodName, prefix + '#');
    }
  }
};
