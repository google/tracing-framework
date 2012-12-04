/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace utility functions.
 * Most of these will be exported onto the {@see wtf.trace} namespace but are
 * here to prevent dependency cycles.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.util');


/**
 * Dummy scope object.
 * Has the same exported methods as a real {@see wtf.trace.Scope}.
 * @type {!Object}
 */
wtf.trace.util.DUMMY_SCOPE = {
  /**
   * Leave mock.
   * @param {T=} opt_result Optional result to chain.
   * @return {T|undefined} The value of the {@code opt_result} parameter.
   * @template T
   */
  leave: function(opt_result) {
    return opt_result;
  }
};


/**
 * Marks an event listener as being ignored, meaning that it will not show up
 * in traces.
 * @param {!T} listener Event listener.
 * @return {!T} The parameter, for chaining.
 * @template T
 */
wtf.trace.util.ignoreListener = function(listener) {
  listener['__wtf_ignore__'] = true;
  return listener;
};
