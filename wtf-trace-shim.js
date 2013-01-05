/**
 * https://github.com/google/tracing-framework
 * Copyright 2012 Google, Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found at https://github.com/google/tracing-framework/blob/master/LICENSE.
 */

/**
 * @fileoverview Web Tracing Framework shim.
 * This file gives compile-time control over the WTF API, allowing it to be
 * type-checked and extern-free when enabled and completely compiled out when
 * disabled.
 *
 * This file contains only the tracing-related functions that are exported in
 * compiled WTF builds. The signatures and descriptions are copied out
 * verbatim. Any types required to keep the compiler happy when looking at this
 * file are exposed as either dummy typedefs or mock objects.
 *
 * When this file is included in a compiled library all of these methods will
 * be renamed. By using 'wtfapi' as a namespace instead of 'wtf' there's no
 * risk of collision when running uncompiled.
 *
 * Original source: https://www.github.com/google/tracing-framework/
 *
 * @author benvanik@google.com (Ben Vanik)
 */


goog.provide('wtfapi');
goog.provide('wtfapi.data.EventFlag');
goog.provide('wtfapi.io.ByteArray');
goog.provide('wtfapi.trace');
goog.provide('wtfapi.trace.Flow');
goog.provide('wtfapi.trace.Scope');
goog.provide('wtfapi.trace.Zone');
goog.provide('wtfapi.trace.events');


/**
 * @define {boolean} True if WTF is enabled.
 * This should be defined to false in release builds to ensure that WTF is not
 * compiled in at all.
 */
wtfapi.ENABLED = true;


/**
 * The API version expected by the shim.
 * If WTF is present but its {@code wtf.trace.API_VERSION} does not match
 * this value it will be ignored. This allows code instrumented with older
 * versions of the API to keep working (without tracing) when a newer version
 * of the API is present in the page.
 * @type {number}
 * @const
 * @private
 */
wtfapi.EXPECTED_API_VERSION_ = 2;


/**
 * Whether WTF is enabled and present in the current global context.
 * This will only be true if the master enabled flag is true, 'wtf' is in the
 * global scope, and the version of WTF matches this shim.
 * @type {boolean}
 * @const
 */
wtfapi.PRESENT = wtfapi.ENABLED && !!goog.global['wtf'] &&
    (goog.global['wtf']['trace']['API_VERSION'] ==
        wtfapi.EXPECTED_API_VERSION_);


/**
 * Whether the runtime can provide high-resolution times.
 * @type {boolean}
 */
wtfapi.hasHighResolutionTimes = wtfapi.PRESENT ?
    goog.global['wtf']['hasHighResolutionTimes'] : false;


/**
 * Returns the wall time that {@see wtf#now} is relative to.
 * @return {number} A time, in ms.
 */
wtfapi.timebase = wtfapi.PRESENT ?
    goog.global['wtf']['timebase'] : function() { return 0; };


/**
 * Returns a non-wall time timestamp in milliseconds.
 * @return {number} A monotonically increasing timer with sub-millisecond
 *      resolution (if supported).
 */
wtfapi.now = wtfapi.PRESENT ?
    goog.global['wtf']['now'] : function() { return 0; };


/**
 * @typedef {Array.<number>|Uint8Array}
 */
wtfapi.io.ByteArray;


/**
 * @typedef {Object}
 */
wtfapi.trace.Zone;


/**
 * @typedef {Object}
 */
wtfapi.trace.Scope;


/**
 * @typedef {Object}
 */
wtfapi.trace.Flow;


/**
 * Event behavior flag bitmask.
 * Values can be ORed together to indicate different behaviors an event has.
 * @enum {number}
 */
wtfapi.data.EventFlag = {
  /**
   * Event is expected to occur at a very high frequency.
   * High frequency events will be optimized for size more than other event
   * types.
   */
  HIGH_FREQUENCY: (1 << 1),

  /**
   * Event represents some system event that should not be counted towards user
   * code. This can include things such as runtime events (GCs/etc) and tracing
   * framework time (buffer swaps/etc).
   */
  SYSTEM_TIME: (1 << 2),

  /**
   * Event represents some internal system event such as flow control events.
   * These should not be shown in the UI.
   */
  INTERNAL: (1 << 3),

  /**
   * Event arguments will be appended to the containing scope's arguments,
   * overwritting any with the same name.
   *
   * If this is combined with the INTERNAL flag then the event is assumed to
   * be a built-in system append event and will have special handling.
   */
  APPEND_SCOPE_DATA: (1 << 4),

  /**
   * Event is a builtin event.
   * These may receive special handling and enable optimizations. User events
   * should not have this flag set.
   */
  BUILTIN: (1 << 5),

  /**
   * Event arguments will be appended to the given flow's data, overwritting
   * any with the same name. The first argument must be a flow ID named
   * 'id' like 'flowId id'.
   *
   * If this is combined with the INTERNAL flag then the event is assumed to
   * be a built-in system append event and will have special handling.
   */
  APPEND_FLOW_DATA: (1 << 6)
};


/**
 * Main entry point for the tracing API.
 * This must be called as soon as possible and preferably before any application
 * code is executed (or even included on the page).
 *
 * This method does not setup a tracing session, but prepares the environment
 * for one. It should only ever be called once.
 *
 * @return {*} Ignored.
 */
wtfapi.trace.prepare = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['prepare'] : goog.nullFunction;


/**
 * Shuts down the tracing system.
 */
wtfapi.trace.shutdown = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['shutdown'] : goog.nullFunction;


/**
 * Starts a new tracing session.
 * The session mode is determined by the options provided, defaulting to
 * snapshotting. See {@code wtfapi.trace.mode} and
 * {@code wtfapi.trace.target} for more information.
 * @param {Object=} opt_options Options overrides.
 */
wtfapi.trace.start = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['start'] : goog.nullFunction;


/**
 * Takes a snapshot of the current state.
 * A session must be actively recording. This call is ignored if the session
 * does not support snapshotting.
 * @param {*=} opt_targetValue Stream target value.
 */
wtfapi.trace.snapshot = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['snapshot'] : goog.nullFunction;


/**
 * Clears all data in the current session by resetting all buffers.
 * This is only valid in snapshotting sessions.
 */
wtfapi.trace.reset = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['reset'] : goog.nullFunction;


/**
 * Stops the current session and disposes it.
 */
wtfapi.trace.stop = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['stop'] : goog.nullFunction;


/**
 * Creates and registers a new event type.
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtfapi.data.EventFlag} values.
 * @return {Function} New event type.
 */
wtfapi.trace.events.createInstance = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['events']['createInstance'] :
    function(signature, opt_flags) {
      return goog.nullFunction;
    };


/**
 * Creates and registers a new event type.
 * @param {string} signature Event signature.
 * @param {number=} opt_flags A bitmask of {@see wtfapi.data.EventFlag} values.
 * @return {Function} New event type.
 */
wtfapi.trace.events.createScope = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['events']['createScope'] :
    function(signature, opt_flags) {
      return goog.nullFunction;
    };


/**
 * Creates a new execution zone.
 * Execution zones are used to group regions of code in the trace stream.
 * For example, one zone may be 'Page' to indicate all page JS and another
 * 'Worker' to show events from a web worker.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @return {wtfapi.trace.Zone} Zone used for future calls.
 */
wtfapi.trace.createZone = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['createZone'] : goog.nullFunction;


/**
 * Deletes an execution zone.
 * The zone ID may be reused.
 * @param {wtfapi.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtfapi.trace.deleteZone = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['deleteZone'] : goog.nullFunction;


/**
 * Pushes a zone.
 * @param {wtfapi.trace.Zone} zone Zone returned from {@see #createZone}.
 */
wtfapi.trace.pushZone = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['pushZone'] : goog.nullFunction;


/**
 * Pops the active zone.
 */
wtfapi.trace.popZone = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['popZone'] : goog.nullFunction;


/**
 * Enters a scope.
 * @param {string} name Scope name.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 * @return {wtfapi.trace.Scope} An initialized scope object.
 */
wtfapi.trace.enterScope = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['enterScope'] : goog.nullFunction;


/**
 * Enters a tracing implementation overhead scope.
 * This should only be used by the tracing framework and extension to indicate
 * time used by non-user tasks.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 * @return {wtfapi.trace.Scope} An initialized scope object.
 */
wtfapi.trace.enterTracingScope = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['enterTracingScope'] : goog.nullFunction;


/**
 * Leaves a scope.
 * @param {wtfapi.trace.Scope} scope Scope to leave.
 * @param {T=} opt_result Optional result to chain.
 * @param {number=} opt_time Time for the leave; omit to use the current time.
 * @return {T|undefined} The value of the {@code opt_result} parameter.
 * @template T
 */
wtfapi.trace.leaveScope = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['leaveScope'] :
    function(scope, opt_result, opt_time) {
      return opt_result;
    };


/**
 * Appends a named argument of any type to the current scope.
 * This is slow and should only be used for very infrequent appends.
 * Prefer instead to use a custom instance event with the
 * {@see wtfapi.data.EventFlag#APPEND_SCOPE_DATA} flag set.
 *
 * @param {string} name Argument name. Must be ASCII.
 * @param {*} value Value. Will be JSON stringified.
 * @param {number=} opt_time Time for the enter; omit to use the current time.
 */
wtfapi.trace.appendScopeData = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['appendScopeData'] : goog.nullFunction;


/**
 * Branches the flow.
 * If no parent flow is given then the current scope flow is used.
 * @param {string} name Flow name.
 * @param {*=} opt_value Optional data value.
 * @param {wtfapi.trace.Flow=} opt_parentFlow Parent flow, if any.
 * @param {number=} opt_time Time for the branch; omit to use the current time.
 * @return {!wtfapi.trace.Flow} An initialized flow object.
 */
wtfapi.trace.branchFlow = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['branchFlow'] : goog.nullFunction;


/**
 * Extends the flow into the current scope.
 * @param {wtfapi.trace.Flow} flow Flow to extend.
 * @param {string} name Flow stage name.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the extend; omit to use the current time.
 */
wtfapi.trace.extendFlow = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['extendFlow'] : goog.nullFunction;


/**
 * Terminates a flow.
 * @param {wtfapi.trace.Flow} flow Flow to terminate.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the terminate; omit to use the current
 *     time.
 */
wtfapi.trace.terminateFlow = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['terminateFlow'] : goog.nullFunction;


/**
 * Appends a named argument of any type to the given flow.
 * This is slow and should only be used for very infrequent appends.
 * Prefer instead to use a custom instance event with the
 * {@see wtfapi.data.EventFlag#APPEND_FLOW_DATA} flag set.
 *
 * @param {wtfapi.trace.Flow} flow Flow to append.
 * @param {string} name Argument name. Must be ASCII.
 * @param {*} value Value. Will be JSON stringified.
 * @param {number=} opt_time Time for the event; omit to use the current time.
 */
wtfapi.trace.appendFlowData = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['appendFlowData'] : goog.nullFunction;


/**
 * Clears the current scope flow.
 */
wtfapi.trace.clearFlow = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['clearFlow'] : goog.nullFunction;


/**
 * Spans the flow across processes.
 * Flows must have been branched before this can be used.
 * @param {number} flowId Flow ID.
 * @return {!wtfapi.trace.Flow} An initialized flow object.
 */
wtfapi.trace.spanFlow = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['spanFlow'] : goog.nullFunction;


/**
 * Marks the stream with a generic instance event.
 * This is used by the UI to construct a simple navigation structure.
 * It's best to use custom events that make filtering easier, if possible.
 * @param {string} name Marker name.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the mark; omit to use the current time.
 */
wtfapi.trace.mark = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['mark'] : goog.nullFunction;


/**
 * Adds a timestamped event to the stream.
 * This is synonymous to {@code console.timeStamp}, and can be used to place
 * simple arg-less instance events in the timeline.
 * Prefer using custom events for faster, more flexible events.
 * @param {string} name Time stamp name.
 * @param {*=} opt_value Optional data value.
 * @param {number=} opt_time Time for the stamp; omit to use the current time.
 */
wtfapi.trace.timeStamp = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['timeStamp'] : goog.nullFunction;


/**
 * Marks an event listener as being ignored, meaning that it will not show up
 * in traces.
 * @param {!T} listener Event listener.
 * @return {!T} The parameter, for chaining.
 * @template T
 */
wtfapi.trace.ignoreListener = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['ignoreListener'] : goog.nullFunction;


/**
 * Marks an entire tree of DOM elements as being ignored, meaning that no
 * events from them will show up in traces.
 * @param {!Element} el Root DOM element.
 */
wtfapi.trace.ignoreDomTree = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['ignoreDomTree'] : goog.nullFunction;


/**
 * Initializes on* event properties on the given DOM element and optionally
 * for all children.
 * This must be called to ensure the properties work correctly.
 * @param {!Element} target Target DOM element.
 * @param {boolean=} opt_recursive Also initialize for all children.
 */
wtfapi.trace.initializeDomEventProperties = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['initializeDomEventProperties'] :
    goog.nullFunction;


/**
 * Automatically instruments a method.
 * This will likely produce code slower than manually instrumenting, but is
 * much more readable.
 *
 * <code>
 * my.Type.prototype.foo = wtfapi.trace.instrument(function(a, b) {
 *   return a + b;
 * }, 'my.Type.foo(uint8 b@1)');
 * </code>
 *
 * @param {Function} value Target function.
 * @param {string} signature Method signature.
 * @param {string=} opt_namePrefix String to prepend to the name.
 * @param {(function(Function, Function):Function)=} opt_generator
 *     A custom function generator that is responsible for taking the given
 *     {@code value} and returning a wrapped function that emits the given
 *     event type.
 * @param {(function())=} opt_pre Code to execute before the scope is entered.
 *     This is only called if {@code opt_generator} is not provided.
 * @return {Function} The instrumented input value.
 */
wtfapi.trace.instrument = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['instrument'] : goog.identityFunction;


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
 * my.Type = wtfapi.trace.instrumentType(
 *     my.Type, 'my.Type(uint8 a, uint8 b)',
 *     goog.reflect.object(my.Type, {
 *       foo: 'foo(uint8 a)'
 *     }));
 * </code>
 *
 * @param {T} value Target type.
 * @param {string} constructorSignature Type name and constructor signature.
 * @param {Object|!Object.<string>} methodMap A map of translated method names
 *     to method signatures. Only the methods in this map will be
 *     auto-instrumented.
 * @return {T} The instrumented input value.
 * @template T
 */
wtfapi.trace.instrumentType = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['instrumentType'] : goog.identityFunction;


/**
 * Automatically instruments the given prototype methods.
 * This is a simple variant of {@see wtfapi.trace.instrumentType} that does not
 * provide method arguments or work with overridden methods.
 *
 * @param {string} prefix A common prefix to use for all trace labels.
 * @param {!Object} classPrototype The prototype of the class.
 * @param {!Object.<!Function>} methodMap A mapping between method names
 *     and the methods themselves.
 */
wtfapi.trace.instrumentTypeSimple = wtfapi.PRESENT ?
    goog.global['wtf']['trace']['instrumentTypeSimple'] : goog.nullFunction;


// Replace goog.base in debug mode.
if (!COMPILED && wtfapi.PRESENT) {
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
  goog.global['goog']['base'] = function(me, opt_methodName, var_args) {
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
