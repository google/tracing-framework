/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace listener type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.EventfulTraceListener');

goog.require('wtf.analysis.TraceListener');
goog.require('wtf.data.EventFlag');



/**
 * Trace listener base type.
 * Consumers of the analysis framework should subclass this to receive events
 * from the trace session.
 *
 * @constructor
 * @extends {wtf.analysis.TraceListener}
 */
wtf.analysis.EventfulTraceListener = function() {
  goog.base(this);
};
goog.inherits(wtf.analysis.EventfulTraceListener, wtf.analysis.TraceListener);


/**
 * @override
 */
wtf.analysis.EventfulTraceListener.prototype.sourceAdded = function(
    timebase, contextInfo) {
  this.emitEvent(wtf.analysis.EventfulTraceListener.EventType.SOURCE_ADDED,
      timebase, contextInfo);
};


/**
 * @override
 */
wtf.analysis.EventfulTraceListener.prototype.sourceError = function(
    message, opt_detail) {
  this.emitEvent(wtf.analysis.EventfulTraceListener.EventType.SOURCE_ERROR,
      message, opt_detail);
};


/**
 * @override
 */
wtf.analysis.EventfulTraceListener.prototype.traceEvent = function(e) {
  if (!(e.eventType.flags & wtf.data.EventFlag.BUILTIN)) {
    this.emitEvent(wtf.analysis.EventfulTraceListener.EventType.CUSTOM, e);
  }
  this.emitEvent(e.eventType.name, e);
};


/**
 * Event type values for the events dispatched on trace listeners.
 * @enum {string}
 */
wtf.analysis.EventfulTraceListener.EventType = {
  /**
   * Args: [timebase, wtf.data.ContextInfo]
   */
  SOURCE_ADDED: 'sourceAdded',

  /**
   * Args: [message, opt_detail]
   */
  SOURCE_ERROR: 'sourceError',

  /**
   * Args: [wtf.analysis.Event]
   */
  DISCONTINUITY: 'wtf.trace#discontinuity',

  /**
   * Args: [wtf.analysis.ZoneEvent]
   */
  CREATE_ZONE: 'wtf.zone#create',

  /**
   * Args: [wtf.analysis.ZoneEvent]
   */
  DELETE_ZONE: 'wtf.zone#delete',

  /**
   * Args: [wtf.analysis.ScopeEvent]
   */
  ENTER_SCOPE: 'wtf.scope#enter',

  /**
   * Args: [wtf.analysis.ScopeEvent]
   */
  LEAVE_SCOPE: 'wtf.scope#leave',

  /**
   * Args: [wtf.analysis.FlowEvent]
   */
  BRANCH_FLOW: 'wtf.flow#branch',

  /**
   * Args: [wtf.analysis.FlowEvent]
   */
  EXTEND_FLOW: 'wtf.flow#extend',

  /**
   * Args: [wtf.analysis.FlowEvent]
   */
  TERMINATE_FLOW: 'wtf.flow#terminate',

  /**
   * Args: [wtf.analysis.Event]
   */
  MARK: 'wtf.trace#mark',

  /**
   * Args: [wtf.analysis.Event]
   */
  TIMESTAMP: 'wtf.trace#timeStamp',

  /**
   * Args: [wtf.analysis.Event]
   */
  CUSTOM: 'custom'
};
