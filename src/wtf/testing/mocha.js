/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview mocha testing setup.
 *
 * This file is used by both the node.js and browser tests to setup mocha to
 * and dependent libraries.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.testing.mocha');


/**
 * Sets up the mocha testing framework.
 * @private
 */
wtf.testing.mocha.setup_ = function() {
  // Setup Chai.
  var chai = goog.global['chai'];
  chai['Assertion']['includeStack'] = true;
  goog.global['assert'] = chai['assert'];

  // Note: if we wanted to augment the assertion library, this would be the
  // place to do it.
  // See: http://chaijs.com/guide/helpers/
  var assert = goog.global['assert'];

  /**
   * Compares two arrays, either of which may be byte arrays.
   * @param {!wtf.io.ByteArray} a First array.
   * @param {!wtf.io.ByteArray} b Second array.
   */
  assert.arraysEqual = function(a, b) {
    if (a.length != b.length) {
      assert.fail(a, b, 'byte arrays differ in length');
      return;
    }
    for (var n = 0; n < a.length; n++) {
      if (a[n] != b[n]) {
        assert.fail(a, b, 'byte arrays differ');
        return;
      }
    }
  };

  /**
   * Begins an async event check, ensuring that the given event is fired.
   * This will ensure that the given event fires with the given arguments.
   * The returned function *must* be called.
   * <code>
   * // Assert that MY_EVENT is fired with the single argument 'a':
   * var check = assert.expectEvent(obj, EventType.MY_EVENT, ['a']);
   * doSomething();
   * check();
   * </code>
   * @param {!wtf.events.EventEmitter} target Event emitter.
   * @param {string} eventType Event type name.
   * @param {Array=} opt_eventArgs Arguments that are required. Omit to not
   *     check.
   * @return {!function()} A function that must be called after the event scope.
   */
  assert.expectEvent = function(target, eventType, opt_eventArgs) {
    var didFire = false;
    var handler = function() {
      target.removeListener(eventType, handler);
      if (opt_eventArgs) {
        assert.deepEqual(arguments, opt_eventArgs);
      }
      didFire = true;
    };
    target.addListener(eventType, handler);
    return function() {
      target.removeListener(eventType, handler);
      if (!didFire) {
        assert.fail('Event ' + eventType + ' did not fire');
      }
    };
  };

  /**
   * Begins an async no-event check, ensuring that the given event is not fired.
   * The returned function *must* be called.
   * <code>
   * // Assert that MY_EVENT is not fired.
   * var check = assert.expectNoEvent(obj, EventType.MY_EVENT);
   * doSomething();
   * check();
   * </code>
   * @param {!wtf.events.EventEmitter} target Event emitter.
   * @param {string} eventType Event type name.
   * @return {!function()} A function that must be called after the event scope.
   */
  assert.expectNoEvent = function(target, eventType) {
    var handler = function() {
      target.removeListener(eventType, handler);
      assert.fail('Event ' + eventType + ' fired when it shouldn\'t have');
    };
    target.addListener(eventType, handler);
    return function() {
      target.removeListener(eventType, handler);
    };
  };

  /**
   * Asserts that a sequence of events is called in order and allows for
   * staged validation.
   * <code>
   * assert.expectEventSequence(obj, [
   *   ['MY_EVENT_1', function() { assert.isTrue(obj.foo); }],
   *   ['MY_EVENT_2', function() { assert.isTrue(obj.foo); }],
   *   ['MY_EVENT_1', function() { assert.isTrue(obj.foo); }]
   * ]);
   * </code>
   * @param {!wtf.events.EventEmitter} target Event emitter.
   * @param {!Array.<!Array>} sequence A list of (event name, callback) tuples.
   */
  assert.expectEventSequence = function(target, sequence) {
    // Gather events.
    var eventList = [];
    var callbackList = [];
    var allEventTypes = {};
    for (var n = 0; n < sequence.length; n++) {
      var eventType = sequence[n][0];
      var callback = sequence[n][1];
      eventList.push(eventType);
      callbackList.push(callback);
      allEventTypes[eventType] = true;
    }
    for (var eventType in allEventTypes) {
      target.addListener(eventType, goog.partial(handler, eventType));
    }

    var eventsActuallyEmitted = [];
    function handler(eventType) {
      var index = eventsActuallyEmitted.length;
      eventsActuallyEmitted.push(eventType);
      if (eventType != eventList[index]) {
        assert.fail('Event ' + eventType + ' called when ' +
            eventList[index] + ' was expected');
        return;
      }
      if (index >= eventList.length) {
        assert.fail('Too many events called');
        return;
      }

      var args = Array.prototype.slice.call(arguments, 1);
      callbackList[index].apply(null, args);
    };
  };
};

wtf.testing.mocha.setup_();
