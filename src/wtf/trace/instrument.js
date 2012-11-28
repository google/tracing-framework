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
goog.require('wtf');
goog.require('wtf.data.Variable');
goog.require('wtf.trace');
goog.require('wtf.trace.events');
goog.require('wtf.util');


if (!COMPILED) {
  /**
   * A variant of {@code goog.base} that supports our method rewriting.
   * This should only be used in uncompiled builds.
   *
   * To use, replace {@code goog.base} with this method as soon as possible.
   *
   * @param {!Object} me Should always be "this".
   * @param {*=} opt_methodName The method name if calling a super method.
   * @param {...*} var_args The rest of the arguments.
   * @return {*} The return value of the superclass method.
   */
  wtf.trace.base = function(me, opt_methodName, var_args) {
    var caller = arguments.callee.caller;
    if (caller.superClass_) {
      // This is a constructor. Call the superclass constructor.
      return caller.superClass_.constructor.apply(
          me, Array.prototype.slice.call(arguments, 1));
    }

    var args = Array.prototype.slice.call(arguments, 2);
    var foundCaller = false;
    for (var ctor = me.constructor;
         ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
      if (ctor.prototype[opt_methodName] === caller ||
          ctor.prototype[opt_methodName]['uninstrumented'] === caller) {
        foundCaller = true;
      } else if (foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args);
      }
    }

    // If we did not find the caller in the prototype chain,
    // then one of two things happened:
    // 1) The caller is an instance method.
    // 2) This method was not called by the right caller.
    if (me[opt_methodName] === caller ||
        me[opt_methodName]['uninstrumented'] === caller) {
      return me.constructor.prototype[opt_methodName].apply(me, args);
    } else {
      throw Error(
          'goog.base called from a method of one name ' +
          'to a method of a different name');
    }
  };
}


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
 * @param {(function(Function, !wtf.trace.EventType):Function)=} opt_generator
 *     A custom function generator that is responsible for taking the given
 *     {@code value} and returning a wrapped function that emits the given
 *     event type.
 * @param {(function())=} opt_pre Code to execute before the scope is entered.
 *     This is only called if {@code opt_generator} is not provided.
 * @return {Function} The instrumented input value.
 */
wtf.trace.instrument = function(value, signature, opt_namePrefix,
    opt_generator, opt_pre) {
  // Parse signature.
  // 'a.b.c(<params>)'
  // ["a.b.c(t1 x, t1 y, t3 z@3)", "a.b.c", "(<params>)", "<params>"]
  var signatureParts = /^([a-zA-Z0-9_\.:]+)(\((.*)\)$)?/.exec(signature);
  var signatureName = signatureParts[1]; // entire name before ()
  var signatureArgs = signatureParts[3]; // contents of () (excluding ())

  // Build argument mapping.
  var argMap = null;
  var argList = null;
  if (signatureArgs) {
    argMap = wtf.data.Variable.parseSignatureArguments(signatureArgs);
    argList = [];
    for (var n = 0; n < argMap.length; n++) {
      argList.push(argMap[n].variable);
    }
  }

  // Define a custom event type at runtime.
  if (opt_namePrefix) {
    signatureName = opt_namePrefix + signatureName;
  }
  var customEvent = wtf.trace.events.createScope(signatureName, argList);
  goog.asserts.assert(customEvent);

  // TODO(benvanik): use a FunctionBuilder to generate the argument stuff from
  //     the signature.
  var result;
  if (opt_generator) {
    result = opt_generator(value, customEvent);
  } else if (!argMap || !argMap.length) {
    // Simple function - no custom data.
    result = function() {
      if (opt_pre) {
        opt_pre.call(this);
      }
      var scope = customEvent.enterScope(wtf.now(), null);
      var result = value.apply(this, arguments);
      return scope.leave(result);
    };
  } else {
    // Custom arguments.
    var eventArgs = new Array(2 + argMap.length);
    eventArgs[0] = 0;
    eventArgs[1] = null; // no flow
    result = function() {
      if (opt_pre) {
        opt_pre.call(this);
      }
      eventArgs[0] = wtf.now();
      for (var n = 0; n < argMap.length; n++) {
        eventArgs[n + 2] = arguments[argMap[n].ordinal];
      }
      var scope = customEvent.enterScope.apply(customEvent, eventArgs);
      var result = value.apply(this, arguments);
      return scope.leave(result);
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
 * @param {!Object.<string>} methodMap A map of translated method names
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
  //var signatureParts = wtf.trace.SIGNATURE_REGEX_.exec(constructorSignature);
  var signatureParts = /^([a-zA-Z0-9_\.:]+)(\((.*)\)$)?/.exec(
      constructorSignature);
  var typeName = signatureParts[1]; // entire name before ()

  // Instrument all methods.
  var proto = newValue.prototype;
  for (var methodName in methodMap) {
    var methodSignature = methodMap[methodName];
    var method = proto[methodName];
    if (method) {
      proto[methodName] = wtf.trace.instrument(
          method, methodSignature, typeName + '#');
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
