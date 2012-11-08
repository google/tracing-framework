/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timing Javascript event definitions.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.Timing');

goog.require('wtf.data.Variable');
goog.require('wtf.trace.events');


/**
 * Timing event provider info.
 * @type {!Object.<!wtf.trace.EventType>}
 */
wtf.trace.Timing = {
  /**
   * Indicates a render frame has occurred. Maybe.
   */
  frameMarker: wtf.trace.events.createInstance(
      'browser.timing.frameMarker', [
        new wtf.data.Variable.Uint32('number')
      ]),

  /**
   * Call to setTimeout.
   */
  setTimeout: wtf.trace.events.createInstance(
      'browser.timing.setTimeout', [
        new wtf.data.Variable.Uint32('delay'),
        new wtf.data.Variable.Uint32('timeoutId')
      ]),

  /**
   * Call to clearTimeout.
   */
  clearTimeout: wtf.trace.events.createInstance(
      'browser.timing.clearTimeout', [
        new wtf.data.Variable.Uint32('timeoutId')
      ]),

  /**
   * Callback from setTimeout.
   */
  setTimeoutCallback: wtf.trace.events.createScope(
      'browser.timing.setTimeout.callback', [
        new wtf.data.Variable.Uint32('timeoutId')
      ]),

  /**
   * Call to setInterval.
   */
  setInterval: wtf.trace.events.createInstance(
      'browser.timing.setInterval', [
        new wtf.data.Variable.Uint32('delay'),
        new wtf.data.Variable.Uint32('intervalId')
      ]),

  /**
   * Call to clearInterval.
   */
  clearInterval: wtf.trace.events.createInstance(
      'browser.timing.clearInterval', [
        new wtf.data.Variable.Uint32('intervalId')
      ]),

  /**
   * Callback from setInterval.
   */
  setIntervalCallback: wtf.trace.events.createScope(
      'browser.timing.setInterval.callback', [
        new wtf.data.Variable.Uint32('intervalId')
      ]),

  /**
   * Call to setImmediate.
   */
  setImmediate: wtf.trace.events.createInstance(
      'browser.timing.setImmediate', [
        new wtf.data.Variable.Uint32('immediateId')
      ]),

  /**
   * Call to clearImmediate.
   */
  clearImmediate: wtf.trace.events.createInstance(
      'browser.timing.clearImmediate', [
        new wtf.data.Variable.Uint32('immediateId')
      ]),

  /**
   * Callback from a setImmediate.
   */
  setImmediateCallback: wtf.trace.events.createScope(
      'browser.timing.setImmediate.callback', [
        new wtf.data.Variable.Uint32('immediateId')
      ]),

  /**
   * Call to requestAnimationFrame.
   */
  requestAnimationFrame: wtf.trace.events.createInstance(
      'browser.timing.requestAnimationFrame', [
        new wtf.data.Variable.Uint32('handle')
      ]),

  /**
   * Call to clearAnimationFrame.
   */
  clearAnimationFrame: wtf.trace.events.createInstance(
      'browser.timing.clearAnimationFrame', [
        new wtf.data.Variable.Uint32('handle')
      ]),

  /**
   * Callback from a requestAnimationFrame.
   */
  requestAnimationFrameCallback: wtf.trace.events.createScope(
      'browser.timing.requestAnimationFrame.callback', [
        new wtf.data.Variable.Uint32('handle')
      ])
};
