#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Query tool.
 * A debug query tool.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var toolRunner = require('./tool-runner');
var util = toolRunner.util;
toolRunner.launch(runTool);


/**
 * Query tool.
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!Array.<string>} args Command line arguments.
 * @return {number|!goog.async.Deferred} Return code or a deferred that is
 *     called back when the tool exits.
 */
function runTool(platform, args) {
  var inputFile = args[0];
  if (!inputFile) {
    console.log('usage: query.js file.wtf-trace');
    return -1;
  }
  console.log('Querying ' + inputFile + '...');
  console.log('');

  // Create database for querying.
  var db = new wtf.analysis.db.EventDatabase();
  db.createEventIndex('timing.frameEnd');

  // Run to populate the db.
  var traceListener = db.getTraceListener();
  if (!wtf.analysis.run(traceListener, inputFile)) {
    console.log('failed to start analysis!');
    return -1;
  }

  var markerIndex = db.getEventIndex('timing.frameEnd');
  // markerIndex.forEach(0, Number.MAX_VALUE, function(e) {
  //   util.logEvent(
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

  db.dispose();
  return 0;
};
