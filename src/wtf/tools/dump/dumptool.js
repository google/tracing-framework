/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Dump tool.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


goog.provide('wtf.tools.dump.DumpTool');

goog.require('wtf.analysis');
goog.require('wtf.tools.Tool');
goog.require('wtf.tools.dump.DumpTraceListener');



/**
 * Dump tool.
 *
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @constructor
 * @extends {wtf.tools.Tool}
 */
wtf.tools.dump.DumpTool = function(platform) {
  goog.base(this, platform);
};
goog.inherits(wtf.tools.dump.DumpTool, wtf.tools.Tool);


/**
 * @override
 */
wtf.tools.dump.DumpTool.prototype.run = function(args) {
  var inputFile = args[0];
  if (!inputFile) {
    goog.global.console.log('usage: dump.js file.wtf-trace');
    return -1;
  }
  goog.global.console.log('Dumping ' + inputFile + '...');
  goog.global.console.log('');

  var traceListener = new wtf.tools.dump.DumpTraceListener();
  if (!wtf.analysis.run(this.platform, traceListener, inputFile)) {
    goog.global.console.log('failed to start analysis!');
    return -1;
  }

  return 0;
};
