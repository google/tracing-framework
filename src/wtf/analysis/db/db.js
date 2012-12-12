/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Analysis DB shared types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.Granularity');
goog.provide('wtf.analysis.db.SortMode');


/**
 * Useful time granularities, in ms.
 * @enum {number}
 */
wtf.analysis.db.Granularity = {
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
 * Sorting mode to use when retrieving entries.
 * @enum {number}
 */
wtf.analysis.db.SortMode = {
  ANY: 0,
  COUNT: 1,
  TOTAL_TIME: 2,
  MEAN_TIME: 3
};


goog.exportSymbol(
    'wtf.analysis.db.SortMode',
    wtf.analysis.db.SortMode);
goog.exportProperty(
    wtf.analysis.db.SortMode, 'ANY',
    wtf.analysis.db.SortMode.ANY);
goog.exportProperty(
    wtf.analysis.db.SortMode, 'COUNT',
    wtf.analysis.db.SortMode.COUNT);
goog.exportProperty(
    wtf.analysis.db.SortMode, 'TOTAL_TIME',
    wtf.analysis.db.SortMode.TOTAL_TIME);
goog.exportProperty(
    wtf.analysis.db.SortMode, 'MEAN_TIME',
    wtf.analysis.db.SortMode.MEAN_TIME);
