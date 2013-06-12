/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace data storage.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.DataStorage');

goog.require('goog.Disposable');



/**
 * Trace data storage.
 * This contains copies of all data streams and can be used for quickly
 * saving the data off.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.db.DataStorage = function() {
  goog.base(this);
};
goog.inherits(wtf.db.DataStorage, goog.Disposable);
