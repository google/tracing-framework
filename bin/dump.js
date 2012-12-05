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
 * @return {number|!goog.async.Deferred} Return code or a deferred that is
 *     called back when the tool exits.
 */
function runTool(platform, args) {
  var inputFile = args[0];
  if (!inputFile) {
    console.log('usage: dump.js file.wtf-trace');
    return -1;
  }
  console.log('Dumping ' + inputFile + '...');
  console.log('');

  var traceListener = wtf.analysis.createTraceListener({
    'sourceAdded': function(timebase, contextInfo) {
      console.log(
          util.formatTime(timebase) + ' source added');
      util.logContextInfo(contextInfo);
    },

    'wtf.discontinuity': function(e) {
      util.logEvent(e);
    },

    'wtf.scope.enter': function(e) {
      util.logEvent(e, e.scope.getId(), e.args);
    },
    'wtf.scope.leave': function(e) {
      util.logEvent(e, e.scope.getId());
    },

    'wtf.flow.branch': function(e) {
      util.logEvent(e, e.flow.getId(), e.args);
    },
    'wtf.flow.extend': function(e) {
      util.logEvent(e, e.flow.getId(), e.args);
    },
    'wtf.flow.terminate': function(e) {
      util.logEvent(e, e.flow.getId(), e.args);
    },

    'wtf.mark': function(e) {
      util.logEvent(e, undefined, e.args);
    },

    'custom': function(e) {
      if (e instanceof wtf.analysis.ScopeEvent) {
        util.logEvent(e, e.scope.getId(), e.args);
      } else {
        util.logEvent(e, undefined, e.args);
      }
    }
  });

  if (!wtf.analysis.run(traceListener, inputFile)) {
    console.log('failed to start analysis!');
    return -1;
  }

  return 0;
};
