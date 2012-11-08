/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Abstract summary generator base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.SummaryData');
goog.provide('wtf.analysis.db.SummaryGenerator');

goog.require('goog.Disposable');



/**
 *
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.db.SummaryGenerator = function() {
  goog.base(this);
};
goog.inherits(wtf.analysis.db.SummaryGenerator, goog.Disposable);


// TODO(benvanik): SummaryGenerator: generate/combine/etc



/**
 *
 *
 * @param {number} timeStart Wall-time this summary starts at.
 * @param {number} timeEnd Wall-time this summary ends at.
 * @constructor
 */
wtf.analysis.db.SummaryData = function(timeStart, timeEnd) {
  /**
   * Wall-time this summary starts at.
   * @type {number}
   */
  this.timeStart = timeStart;

  /**
   * Wall-time this summary ends at.
   * @type {number}
   */
  this.timeEnd = timeEnd;

  /**
   * Total number of events within this time range.
   * @type {number}
   */
  this.totalEventCount = 0;

  // TODO(benvanik): counters
  // TODO(benvanik): event counts
  // TODO(benvanik): custom data / summary generator stuff
};
