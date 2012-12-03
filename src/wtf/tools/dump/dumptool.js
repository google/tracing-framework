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
goog.require('wtf.analysis.EventfulTraceListener');
goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.tools.Tool');
goog.require('wtf.tools.util');



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

  var traceListener = new wtf.analysis.EventfulTraceListener();
  traceListener.addListeners({
    'sourceAdded': function(timebase, contextInfo) {
      window.console.log(wtf.tools.util.formatTime(timebase) + ' source added');
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
  }, this);

  if (!wtf.analysis.run(this.platform, traceListener, inputFile)) {
    goog.global.console.log('failed to start analysis!');
    return -1;
  }

  return 0;
};
