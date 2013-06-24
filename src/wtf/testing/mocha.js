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
    assert.lengthOf(a, b.length, 'byte arrays differ in length');
    for (var n = 0; n < a.length; n++) {
      if (a[n] != b[n]) {
        assert.fail(a, b, 'byte arrays differ');
        return;
      }
    }
  };

  /**
   * Asserts that an array has the given prefix.
   * @param {!wtf.io.ByteArray} a First array.
   * @param {!wtf.io.ByteArray} prefix Second array that is the prefix.
   */
  assert.arrayPrefix = function(a, prefix) {
    assert(a <= prefix, 'Target array must be at least as large as the prefix');
    for (var n = 0; n < prefix.length; n++) {
      if (a[n] != prefix[n]) {
        assert.fail(a[n], prefix[n], 'byte arrays differ');
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
};

wtf.testing.mocha.setup_();
