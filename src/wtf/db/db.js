/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Shared database types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.string');
goog.require('wtf.db.Database');
goog.require('wtf.io');
goog.require('wtf.pal');
/** @suppress {extraRequire} */
goog.require('wtf.pal.IPlatform');


/**
 * Loads a database from the given input.
 *
 * This is an asynchronous operation and may fail.
 * Pass in a callback that will be called with either a loaded database or an
 * error object describing the error that occured during load.
 * The callback will not be called until the entire database is loaded and ready
 * to use.
 *
 * @param {string|!wtf.io.ByteArray|!Object} input Input data.
 *     This can be a filename (if in node.js) or a byte buffer.
 * @param {!function(this:T, (wtf.db.Database|Error))} callback
 *     A callback that will receive an event database, if it could be loaded.
 *     If should be disposed when no longer needed. If an error occurred an
 *     Error object will be passed.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.db.load = function(input, callback, opt_scope) {
  var platform = wtf.pal.getPlatform();

  var db = new wtf.db.Database();

  // Initialize streams based on input type.
  var deferred = new goog.async.Deferred();
  if (goog.isString(input)) {
    // Filename.
    if (goog.string.endsWith(input, '.wtf-trace')) {
      // TODO(benvanik): can stream this from disk - create a custom readstream
      var fileData = platform.readBinaryFile(input);
      if (!fileData) {
        goog.dispose(db);
        return null;
      }
      goog.asserts.assert(fileData);
      deferred = db.addBinarySource(fileData);
    } else if (goog.string.endsWith(input, '.wtf-json')) {
      var jsonSource = platform.readTextFile(input);
      if (!jsonSource) {
        goog.dispose(db);
        return null;
      }
      deferred = db.addJsonSource(jsonSource);
    } else {
      deferred = db.addJsonSource(input);
    }
  } else if (wtf.io.isByteArray(input)) {
    // Binary buffer.
    deferred = db.addBinarySource(/** @type {!wtf.io.ByteArray} */ (input));
  } else if (goog.isObject(input)) {
    // JSON.
    deferred = db.addJsonSource(input);
  }

  if (!deferred) {
    callback.call(opt_scope, new Error('Unrecognized input data.'));
  }

  deferred.addCallbacks(function() {
    callback.call(opt_scope, db);
  }, function(e) {
    callback.call(opt_scope, e);
  });
};


goog.exportSymbol(
    'wtf.db.load',
    wtf.db.load);
