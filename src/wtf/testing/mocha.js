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
  assert.arraysEqual = function(a, b) {
    assert.lengthOf(a, b.length, 'byte arrays differ in length');
    for (var n = 0; n < a.length; n++) {
      if (a[n] != b[n]) {
        assert.fail(a, b, 'byte arrays differ');
      }
    }
  };
};

wtf.testing.mocha.setup_();
