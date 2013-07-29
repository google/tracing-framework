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
goog.require('wtf.db.DataSourceInfo');
goog.require('wtf.db.Database');
goog.require('wtf.db.sources.ChunkedDataSource');
goog.require('wtf.io');
goog.require('wtf.io.cff.BinaryStreamSource');
goog.require('wtf.io.cff.JsonStreamSource');
goog.require('wtf.io.transports.MemoryReadTransport');
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
  // Because of the API change this will help people migrating scripts.
  if (!callback) {
    throw new Error('wtf.db.load now requires a callback.');
  }

  var platform = wtf.pal.getPlatform();

  var db = new wtf.db.Database();

  // Initialize streams based on input type.
  var deferred = new goog.async.Deferred();
  if (goog.isString(input)) {
    var sourceInfo = new wtf.db.DataSourceInfo(input, '');

    // Filename.
    if (goog.string.endsWith(input, '.wtf-trace')) {
      // TODO(benvanik): can stream this from disk - create a custom readstream
      var fileData = platform.readBinaryFile(input);
      if (!fileData) {
        goog.dispose(db);
        callback.call(opt_scope, null);
        return;
      }
      goog.asserts.assert(fileData);
      deferred = wtf.db.loadBinarySource_(db, sourceInfo, fileData);
    } else if (goog.string.endsWith(input, '.wtf-json')) {
      var jsonSource = platform.readTextFile(input);
      if (!jsonSource) {
        goog.dispose(db);
        callback.call(opt_scope, null);
        return;
      }
      deferred = wtf.db.loadJsonSource_(db, sourceInfo, jsonSource);
    } else {
      deferred = wtf.db.loadJsonSource_(db, sourceInfo, input);
    }
  } else if (wtf.io.isByteArray(input)) {
    // Binary buffer.
    var sourceInfo = new wtf.db.DataSourceInfo('', '');
    deferred = wtf.db.loadBinarySource_(
        db, sourceInfo, /** @type {!wtf.io.ByteArray} */ (input));
  } else if (goog.isObject(input)) {
    // JSON.
    var sourceInfo = new wtf.db.DataSourceInfo('', '');
    deferred = wtf.db.loadJsonSource_(db, sourceInfo, input);
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


/**
 * Adds a binary data source as an immediately-available stream.
 * @param {!wtf.db.Database} db Database.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Data source info.
 * @param {!wtf.io.BlobData} data Input data.
 * @return {!goog.async.Deferred} A deferred fulfilled when the source completes
 *     loading.
 * @private
 */
wtf.db.loadBinarySource_ = function(db, sourceInfo, data) {
  var transport = new wtf.io.transports.MemoryReadTransport();
  var streamSource = new wtf.io.cff.BinaryStreamSource(transport);
  var dataSource = new wtf.db.sources.ChunkedDataSource(
      db, sourceInfo, streamSource);
  var deferred = dataSource.start();

  transport.addData(data);
  transport.end();

  return deferred;
};


/**
 * Adds a JSON data source as an immediately-available stream.
 * @param {!wtf.db.Database} db Database.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Data source info.
 * @param {string|!Array|!Object|wtf.io.BlobData} data Input data.
 * @return {!goog.async.Deferred} A deferred fulfilled when the source completes
 *     loading.
 * @private
 */
wtf.db.loadJsonSource_ = function(db, sourceInfo, data) {
  // Always convert the incoming data to JSON to ensure we don't have it
  // modified while we work with it.
  if (typeof data != 'string') {
    data = goog.global.JSON.stringify(data);
  }
  var transport = new wtf.io.transports.MemoryReadTransport();
  var streamSource = new wtf.io.cff.JsonStreamSource(transport);
  var dataSource = new wtf.db.sources.ChunkedDataSource(
      db, sourceInfo, streamSource);
  var deferred = dataSource.start();

  transport.addData(data);
  transport.end();

  return deferred;
};


goog.exportSymbol(
    'wtf.db.load',
    wtf.db.load);
