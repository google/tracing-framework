/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview mocha testing runner.
 *
 * This file is required at the very end of the testing process to kick off
 * mocha.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.testing.mocha.run');


/**
 * Runs mocha with all tests currently loaded.
 */
wtf.testing.mocha.run = function() {
  var mocha = goog.global['mocha'];
  mocha['run'](function() {
    // Fired when tests have completed.
    wtf.testing.mocha.run.hasCompleted = true;
    var mochaCompletionWaiter = goog.global['mochaCompletionWaiter'];
    if (mochaCompletionWaiter) {
      mochaCompletionWaiter();
    }
  });
};


/**
 * Set to true when the mocha run has completed.
 * @type {boolean}
 */
wtf.testing.mocha.run.hasCompleted = false;


wtf.testing.mocha.run();
