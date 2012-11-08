/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Convert trace listener.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.tools.convert.ConvertTraceListener');

goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.analysis.TraceListener');



/**
 * Custom trace listener.
 * @constructor
 * @extends {wtf.analysis.TraceListener}
 */
wtf.tools.convert.ConvertTraceListener = function() {
  goog.base(this);

  /**
   * Source JSON.
   * @type {!Array.<!Object>}
   * @private
   */
  this.sourceJson_ = [];

  /**
   * Event JSON.
   * @type {!Array.<!Object>}
   * @private
   */
  this.eventJson_ = [];

  this.addListeners({
    'wtf.discontinuity': function(e) {
    },

    'wtf.scope.enter': function(e) {
      this.eventJson_.push({
        'ph': 'B',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000,
        'name': e.args['msg'] || e.eventType.name
      });
    },
    'wtf.scope.leave': function(e) {
      this.eventJson_.push({
        'ph': 'E',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000
      });
    },

    'wtf.flow.branch': function(e) {
      this.eventJson_.push({
        'ph': 'S',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000,
        'id': e.flow.getId(),
        'name': 'wtf.flow.branch',
        'args': {
          'msg': e.args['msg']
        }
      });
    },
    'wtf.flow.extend': function(e) {
      this.eventJson_.push({
        'ph': 'T',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000,
        'id': e.flow.getId(),
        'name': 'wtf.flow.extend',
        'args': {
          'msg': e.args['msg']
        }
      });
    },
    'wtf.flow.terminate': function(e) {
      this.eventJson_.push({
        'ph': 'F',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000,
        'id': e.flow.getId(),
        'name': 'wtf.flow.terminate',
        'args': {
          'msg': e.args['msg']
        }
      });
    },

    'wtf.mark': function(e) {
      this.eventJson_.push({
        'ph': 'E',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000,
        'name': 'wtf.mark',
        'args': {
          'msg': e.args['msg']
        }
      });
    },

    'custom': function(e) {
      if (e instanceof wtf.analysis.ScopeEvent) {
        this.eventJson_.push({
          'ph': 'B',
          'pid': e.zone.toString(),
          'tid': '',
          'ts': e.time * 1000,
          'name': e.scope.getEnterEvent().eventType.name
        });
      } else {
        this.eventJson_.push({
          'ph': 'I',
          'pid': e.zone.toString(),
          'tid': '',
          'ts': e.time * 1000,
          //'cat': eventType.providerInfo.name,
          'name': e.eventType.name,
          'args': e.args
        });
      }
    }
  }, this);
};
goog.inherits(wtf.tools.convert.ConvertTraceListener,
    wtf.analysis.TraceListener);


/**
 * Gets the JSON object representing the trace.
 * @return {!Object} JSON object.
 */
wtf.tools.convert.ConvertTraceListener.prototype.getJson = function() {
  return {
    'sources': this.sourceJson_,
    'traceEvents': this.eventJson_
  };
};


/**
 * @override
 */
wtf.tools.convert.ConvertTraceListener.prototype.sourceAdded = function(
    timebase, contextInfo) {
  this.sourceJson_.push({
    'timebase': timebase,
    'taskId': contextInfo.taskId,
    'uri': contextInfo.uri,
    'args': contextInfo.args,
    'userAgent': contextInfo.userAgentString,
    'device': contextInfo.device,
    'platform': contextInfo.type + ' (contextInfo.platformVersion)'
  });
};
