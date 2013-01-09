/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tracing Node.js entry point.
 * Exports some utility functions for node applications.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.node');

goog.require('wtf');
goog.require('wtf.trace');
goog.require('wtf.trace.prepare');


if (wtf.NODE) {
  /**
   * Starts tracing and sets up a default save-on-exit handler.
   * @param {Object=} opt_options Options overrides.
   */
  wtf.trace.node.start = function(opt_options) {
    // To make life easier we call prepare here.
    wtf.trace.prepare(opt_options);

    // Start tracing.
    wtf.trace.start(opt_options);

    // Setup process shutdown hook to snapshot/flush.
    process.on('exit', function() {
      // Snapshot and retrieve the resulting buffers.
      wtf.trace.snapshot('file://');
      wtf.trace.stop();
    });

    // Handle ctrl-c.
    // NOTE: this may not work on Windows.
    process.on('SIGINT', function() {
      process.exit();
    });
  };

  goog.exportSymbol(
      'wtf.trace.node.start',
      wtf.trace.node.start);
}
