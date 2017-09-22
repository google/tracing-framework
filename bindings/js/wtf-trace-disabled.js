/**
 * https://github.com/google/tracing-framework
 * Copyright 2013 Google, Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found at https://github.com/google/tracing-framework/blob/master/LICENSE.
 */

/**
 * @fileoverview Web Tracing Framework shim, hardcoded to disabled.
 * Use this file to allow a page to use the 'WTF' namespace safely but in
 * a disabled form. JavaScript engines will be pretty smart about the WTF calls
 * and add very little overhead.
 *
 * Original source: https://www.github.com/google/tracing-framework/
 *
 * @author benvanik@google.com (Ben Vanik)
 */


(function(global, exports) {

var WTF = exports;
WTF.data = {};
WTF.io = {};
WTF.trace = {};
WTF.trace.events = {};

function nullFunction() {};
function identityFunction(a) { return a; };

WTF.ENABLED = false;
WTF.EXPECTED_API_VERSION_ = 2;
WTF.PRESENT = false;
WTF.hasHighResolutionTimes = false;
WTF.timebase = function() { return 0; };
WTF.now = function() { return 0; };
WTF.data.EventFlag = {
  HIGH_FREQUENCY: (1 << 1),
  SYSTEM_TIME: (1 << 2),
  INTERNAL: (1 << 3),
  APPEND_SCOPE_DATA: (1 << 4),
  BUILTIN: (1 << 5),
  APPEND_FLOW_DATA: (1 << 6)
};
WTF.data.ZoneType = {
  SCRIPT: 'script',
  NATIVE_SCRIPT: 'native_script',
  NATIVE_GPU: 'native_gpu',
  NATIVE_BROWSER: 'native_browser'
};
WTF.trace.prepare = nullFunction;
WTF.trace.shutdown = nullFunction;
WTF.trace.start = nullFunction;
WTF.trace.snapshot = nullFunction;
WTF.trace.snapshotAll = nullFunction;
WTF.trace.reset = nullFunction;
WTF.trace.stop = nullFunction;
WTF.trace.createZone = nullFunction;
WTF.trace.deleteZone = nullFunction;
WTF.trace.pushZone = nullFunction;
WTF.trace.popZone = nullFunction;
WTF.trace.enterScope = nullFunction;
WTF.trace.enterTracingScope = nullFunction;
WTF.trace.leaveScope = function(scope, opt_result, opt_time) { return opt_result; };
WTF.trace.appendScopeData = nullFunction;
WTF.trace.branchFlow = nullFunction;
WTF.trace.extendFlow = nullFunction;
WTF.trace.terminateFlow = nullFunction;
WTF.trace.appendFlowData = nullFunction;
WTF.trace.clearFlow = nullFunction;
WTF.trace.spanFlow = nullFunction;
WTF.trace.mark = nullFunction;
WTF.trace.timeStamp = nullFunction;
WTF.trace.beginTimeRange = nullFunction;
WTF.trace.endTimeRange = nullFunction;
WTF.trace.ignoreListener = nullFunction;
WTF.trace.ignoreDomTree = nullFunction;
WTF.trace.initializeDomEventProperties = nullFunction;
WTF.trace.events.createInstance = function(signature, opt_flags) { return nullFunction; };
WTF.trace.events.createScope = function(signature, opt_flags) { return nullFunction; };
WTF.trace.instrument = identityFunction;
WTF.trace.instrumentType = identityFunction;
WTF.trace.instrumentTypeSimple = nullFunction;

})(this, (typeof exports === 'undefined' ? this['WTF'] = {} : exports));
