/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Query tool.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.tools.query.QueryTool');

goog.require('wtf.analysis');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.tools.Tool');



/**
 * Query tool.
 *
 * @param {!wtf.util.IPlatform} platform Platform abstraction layer.
 * @constructor
 * @extends {wtf.tools.Tool}
 */
wtf.tools.query.QueryTool = function(platform) {
  goog.base(this, platform);
};
goog.inherits(wtf.tools.query.QueryTool, wtf.tools.Tool);


/**
 * @override
 */
wtf.tools.query.QueryTool.prototype.run = function(args) {
  var inputFile = args[0];
  if (!inputFile) {
    goog.global.console.log('usage: query.js file.wtf-trace');
    return -1;
  }
  goog.global.console.log('Querying ' + inputFile + '...');
  goog.global.console.log('');

  // Create database for querying.
  var db = new wtf.analysis.db.EventDatabase();
  db.createEventIndex('browser.timing.frameMarker');

  // Run to populate the db.
  var traceListener = db.getTraceListener();
  if (!wtf.analysis.run(this.platform, traceListener, inputFile)) {
    goog.global.console.log('failed to start analysis!');
    return -1;
  }

  var markerIndex = db.getEventIndex('browser.timing.frameMarker');
  // markerIndex.forEach(0, Number.MAX_VALUE, function(e) {
  //   wtf.tools.util.logEvent(
  //       e.zone, e.time, e.eventType.name, undefined, e.data);
  // });
  console.log(markerIndex.getCount() + ' frame events');

  var summaryIndex = db.getSummaryIndex();
  summaryIndex.forEach(0, Number.MAX_VALUE, 1, function(summary) {
    console.log(summary);
  });

  console.log(summaryIndex.querySummary(0, Number.MAX_VALUE));
  console.log(summaryIndex.querySummary(1459882725.01, 1459883141.502));

  //summaryIndex.dump();

  goog.dispose(db);
  return 0;
};
