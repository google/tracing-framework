/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Analysis utility namespace.
 * Contains helper methods and standard definitions for common code
 * actions.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis');

goog.require('goog.string');
goog.require('wtf.analysis.EventfulTraceListener');
goog.require('wtf.analysis.Session');
goog.require('wtf.io');
goog.require('wtf.pal');
/** @suppress {extraRequire} */
goog.require('wtf.pal.IPlatform');


/**
 * Creates a trace listener that targets the given events.
 * @param {!Object.<!Function>} eventMap A map of event names to callbacks.
 * @param {Object=} opt_scope Scope for the callback functions.
 * @return {!wtf.analysis.TraceListener} New trace listener.
 */
wtf.analysis.createTraceListener = function(eventMap, opt_scope) {
  var traceListener = new wtf.analysis.EventfulTraceListener();
  traceListener.addListeners(eventMap, opt_scope);
  return traceListener;
};


/**
 * Runs an analysis session on the given input.
 * @param {!wtf.analysis.TraceListener} traceListener Custom trace listener.
 * @param {string|!wtf.io.ByteArray|!Object} input Input data.
 *     This can be a filename (if in node.js) or a byte buffer.
 * @return {boolean} Whether the run succeeded.
 */
wtf.analysis.run = function(traceListener, input) {
  var platform = wtf.pal.getPlatform();

  // Create session around trace listener.
  // TODO(benvanik): options?
  var session = new wtf.analysis.Session(traceListener, {
  });

  // Initialize streams based on input type.
  if (goog.isString(input)) {
    // Filename.
    if (goog.string.endsWith(input, '.wtf-trace')) {
      // TODO(benvanik): can stream this from disk - create a custom readstream
      var fileData = platform.readBinaryFile(input);
      if (!fileData) {
        goog.dispose(session);
        return false;
      }
      session.addBinarySource(fileData);
    } else {
      var jsonSource = platform.readTextFile(input);
      if (!jsonSource) {
        goog.dispose(session);
        return false;
      }
      var json = goog.global.JSON.parse(jsonSource);
      if (!json) {
        goog.dispose(session);
        return false;
      }
      session.addJsonSource(/** @type {!Object} */ (json));
    }
  } else if (wtf.io.isByteArray(input)) {
    // Binary buffer.
    session.addBinarySource(/** @type {!wtf.io.ByteArray} */ (input));
  } else if (goog.isObject(input)) {
    // JSON.
    session.addJsonSource(input);
  }

  // TODO(benvanik): disposeWhenIdle() or something similar
  // Only valid because the streams are not async.
  goog.dispose(session);

  return true;
};
