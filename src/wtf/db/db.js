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
goog.provide('wtf.db.Granularity');

goog.require('goog.string');
goog.require('wtf.db.Database');
goog.require('wtf.io');
goog.require('wtf.pal');
/** @suppress {extraRequire} */
goog.require('wtf.pal.IPlatform');


/**
 * Useful time granularities, in ms.
 * @enum {number}
 */
wtf.db.Granularity = {
  /** s */
  SECOND: 1000,
  /** ds */
  DECISECOND: 100,
  /** cs */
  CENTISECOND: 10,
  /** ms */
  MILLISECOND: 1,

  // TODO(benvanik): make this a setting on the summary index instead?
  /**
   * The finest granularity to work with.
   */
  FINEST: 100
};


/**
 * Loads a database from the given input.
 * @param {string|!wtf.io.ByteArray|!Object} input Input data.
 *     This can be a filename (if in node.js) or a byte buffer.
 * @return {wtf.db.Database} Event database, if it could be loaded. If should be
 *     disposed when no longer needed.
 */
wtf.db.load = function(input) {
  var platform = wtf.pal.getPlatform();

  var db = new wtf.db.Database();

  // Initialize streams based on input type.
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
      db.addBinarySource(fileData);
    } else if (goog.string.endsWith(input, '.wtf-json')) {
      var jsonSource = platform.readTextFile(input);
      if (!jsonSource) {
        goog.dispose(db);
        return null;
      }
      db.addJsonSource(jsonSource);
    } else {
      db.addJsonSource(input);
    }
  } else if (wtf.io.isByteArray(input)) {
    // Binary buffer.
    db.addBinarySource(/** @type {!wtf.io.ByteArray} */ (input));
  } else if (goog.isObject(input)) {
    // JSON.
    db.addJsonSource(input);
  }

  return db;
};


goog.exportSymbol(
    'wtf.db.load',
    wtf.db.load);
