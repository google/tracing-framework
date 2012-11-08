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
  mocha['run']();
};


wtf.testing.mocha.run();
