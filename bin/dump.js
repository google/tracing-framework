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
    goog.global.console.log('usage: dump.js file.wtf-trace');
    return -1;
  }
  goog.global.console.log('Dumping ' + inputFile + '...');
  goog.global.console.log('');

  var traceListener = wtf.analysis.createTraceListener({
    'sourceAdded': function(timebase, contextInfo) {
      goog.global.console.log(
          wtf.tools.util.formatTime(timebase) + ' source added');
      wtf.tools.util.logContextInfo(contextInfo);
    },

    'wtf.discontinuity': function(e) {
      wtf.tools.util.logEvent(e);
    },

    'wtf.scope.enter': function(e) {
      wtf.tools.util.logEvent(e, e.scope.getId(), e.args);
    },
    'wtf.scope.leave': function(e) {
      wtf.tools.util.logEvent(e, e.scope.getId());
    },

    'wtf.flow.branch': function(e) {
      wtf.tools.util.logEvent(e, e.flow.getId(), e.args);
    },
    'wtf.flow.extend': function(e) {
      wtf.tools.util.logEvent(e, e.flow.getId(), e.args);
    },
    'wtf.flow.terminate': function(e) {
      wtf.tools.util.logEvent(e, e.flow.getId(), e.args);
    },

    'wtf.mark': function(e) {
      wtf.tools.util.logEvent(e, undefined, e.args);
    },

    'custom': function(e) {
      if (e instanceof wtf.analysis.ScopeEvent) {
        wtf.tools.util.logEvent(e, e.scope.getId(), e.args);
      } else {
        wtf.tools.util.logEvent(e, undefined, e.args);
      }
    }
  });

  if (!wtf.analysis.run(platform, traceListener, inputFile)) {
    goog.global.console.log('failed to start analysis!');
    return -1;
  }

  return 0;
};
