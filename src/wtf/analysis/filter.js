/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Filter base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.Filter');
goog.provide('wtf.analysis.FilterOperation');


/**
 * Denotes the operation of a filter.
 * @enum {number}
 */
wtf.analysis.FilterOperation = {
  /**
   * The filter should include all matched entries.
   */
  INCLUDE: 0,

  /**
   * The filter should exclude all matched entries.
   */
  EXCLUDE: 1
};



/**
 * Describes a filter.
 * Filters can be used to include or exclude specific entries in the trace
 * stream.
 *
 * @param {wtf.analysis.FilterOperation} operation Filter operation.
 * @constructor
 */
wtf.analysis.Filter = function(operation) {
  /**
   * Filter operation.
   * @type {wtf.analysis.FilterOperation}
   */
  this.operation = operation;
};
