/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Dump trace listener.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.tools.dump.DumpTraceListener');

goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.analysis.TraceListener');
goog.require('wtf.tools.util');



/**
 * Custom trace listener.
 * @constructor
 * @extends {wtf.analysis.TraceListener}
 */
wtf.tools.dump.DumpTraceListener = function() {
  goog.base(this);

  this.addListeners({
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
};
goog.inherits(wtf.tools.dump.DumpTraceListener, wtf.analysis.TraceListener);


/**
 * @override
 */
wtf.tools.dump.DumpTraceListener.prototype.sourceAdded = function(
    timebase, contextInfo) {
  window.console.log(wtf.tools.util.formatTime(timebase) + ' source added');
  wtf.tools.util.logContextInfo(contextInfo);
};
