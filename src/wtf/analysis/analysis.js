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
goog.require('wtf.analysis.db.EventDatabase');
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
    } else if (goog.string.endsWith(input, '.wtf-json')) {
      var jsonSource = platform.readTextFile(input);
      if (!jsonSource) {
        goog.dispose(session);
        return false;
      }
      session.addJsonSource(jsonSource);
    } else {
      session.addJsonSource(input);
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


/**
 * Creates and loads a database from the given input.
 *
 * Options allow for additional setup to occur before the database is returned.
 * <code>
 * {
 *   // Creates event indices with the given names. Retrieve them later with
 *   // {@see wtf.analysis.db.EventDatabase#getEventIndex}.
 *   'eventIndices': ['someEvent', 'otherEvent']
 * }
 * </code>
 *
 * @param {string|!wtf.io.ByteArray|!Object} input Input data.
 *     This can be a filename (if in node.js) or a byte buffer.
 * @param {Object=} opt_options Options.
 * @return {wtf.analysis.db.EventDatabase} Event database, if it could be
 *     loaded. It should be disposed when no longer needed.
 */
wtf.analysis.loadDatabase = function(input, opt_options) {
  var db = new wtf.analysis.db.EventDatabase();
  if (opt_options) {
    var eventIndices = opt_options['eventIndices'];
    if (eventIndices) {
      for (var n = 0; n < eventIndices.length; n++) {
        db.createEventIndex(eventIndices[n]);
      }
    }
  }
  if (!wtf.analysis.run(db.getTraceListener(), input)) {
    goog.dispose(db);
    return null;
  }
  return db;
};


goog.exportSymbol(
    'wtf.analysis.createTraceListener',
    wtf.analysis.createTraceListener);
goog.exportSymbol(
    'wtf.analysis.run',
    wtf.analysis.run);
goog.exportSymbol(
    'wtf.analysis.loadDatabase',
    wtf.analysis.loadDatabase);
