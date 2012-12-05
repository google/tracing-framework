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


if (wtf.NODE) {
  /**
   * Starts tracing and sets up a default save-on-exit handler.
   * @param {Object=} opt_options Options overrides.
   */
  wtf.trace.node.start = function(opt_options) {
    wtf.trace.start(opt_options);

    // Setup process shutdown hook to snapshot/flush.
    process.on('exit', function() {
      // Snapshot and retrieve the resulting buffers.
      wtf.trace.snapshot('file://');
      wtf.trace.stop();
    });
  };

  goog.exportSymbol(
      'wtf.trace.node.start',
      wtf.trace.node.start);
}
