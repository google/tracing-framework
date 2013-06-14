#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Dump tool.
 * Dumps the given trace file to stdout.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var toolRunner = require('./tool-runner');
var util = toolRunner.util;
toolRunner.launch(runTool);


/**
 * Dump tool.
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!Array.<string>} args Command line arguments.
 * @param {function(number)} done Call to end the program with a return code.
 */
function runTool(platform, args, done) {
  var inputFile = args[0];
  if (!inputFile) {
    console.log('usage: dump.js file.wtf-trace');
    done(1);
    return;
  }
  console.log('Dumping ' + inputFile + '...');
  console.log('');

  wtf.db.load(inputFile, function(db) {
    if (db instanceof Error) {
      console.log('ERROR: unable to open ' + inputFile, db, db.stack);
      done(1);
    } else {
      done(dumpDatabase(db));
    }
  });
};


/**
 * Dump the database.
 * @param {!wtf.db.Database} db Database.
 * @return {number} Return code.
 */
function dumpDatabase(db) {
  var sources = db.getSources();
  for (var n = 0; n < sources.length; n++) {
    util.logContextInfo(sources[n].getContextInfo());
  }

  var zones = db.getZones();
  if (!zones.length) {
    console.log('No zones');
    return 0;
  }

  var zone = zones[0];
  var eventList = zone.getEventList();
  var it = eventList.begin();
  for (; !it.done(); it.next()) {
    util.logEvent(it, zone);
  }

  return 0;
};
