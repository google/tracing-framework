/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Conversion tool.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


goog.provide('wtf.tools.convert.ConvertTool');

goog.require('wtf.analysis');
goog.require('wtf.tools.Tool');
goog.require('wtf.tools.convert.ConvertTraceListener');



/**
 * Convert tool.
 *
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @constructor
 * @extends {wtf.tools.Tool}
 */
wtf.tools.convert.ConvertTool = function(platform) {
  goog.base(this, platform);
};
goog.inherits(wtf.tools.convert.ConvertTool, wtf.tools.Tool);


/**
 * @override
 */
wtf.tools.convert.ConvertTool.prototype.run = function(args) {
  var inputFile = args[0];
  var outputFile = args[1];
  if (!inputFile || !outputFile) {
    goog.global.console.log('usage: convert.js file.wtf-trace out.json');
    return -1;
  }
  goog.global.console.log('Converting ' + inputFile + ' to JSON...');
  goog.global.console.log('');

  var traceListener = new wtf.tools.convert.ConvertTraceListener();
  if (!wtf.analysis.run(this.platform, traceListener, inputFile)) {
    goog.global.console.log('failed to start analysis!');
    return -1;
  }

  var json = traceListener.getJson();
  this.platform.writeTextFile(outputFile, JSON.stringify(json));

  return 0;
};
