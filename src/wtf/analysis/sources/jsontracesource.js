/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview JSON WTF trace event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.sources.JsonTraceSource');

goog.require('wtf.analysis.TraceSource');



/**
 * Single-source trace stream implenting the WTF JSON format.
 * For more information on the format see {@code docs/wtf-json.md}.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener.
 * @param {!Object} sourceData Source JSON data. Not cloned, so do not modify.
 * @constructor
 * @extends {wtf.analysis.TraceSource}
 */
wtf.analysis.sources.JsonTraceSource = function(traceListener, sourceData) {
  goog.base(this, traceListener);

  // TODO(*): implement!
};
goog.inherits(wtf.analysis.sources.JsonTraceSource, wtf.analysis.TraceSource);
