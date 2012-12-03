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
goog.require('wtf.analysis.EventfulTraceListener');
goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.tools.Tool');



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

  /**
   * Source JSON.
   * @type {!Array.<!Object>}
   */
  var sourceJson = [];

  /**
   * Event JSON.
   * @type {!Array.<!Object>}
   */
  var eventJson = [];

  var traceListener = new wtf.analysis.EventfulTraceListener();
  traceListener.addListeners({
    'sourceAdded': function(timebase, contextInfo) {
      sourceJson.push({
        'timebase': timebase,
        'taskId': contextInfo.taskId,
        'uri': contextInfo.uri,
        'args': contextInfo.args,
        'userAgent': contextInfo.userAgentString,
        'device': contextInfo.device,
        'platform': contextInfo.type + ' (contextInfo.platformVersion)'
      });
    },

    'wtf.discontinuity': function(e) {
    },

    'wtf.scope.enter': function(e) {
      eventJson.push({
        'ph': 'B',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000,
        'name': e.args['msg'] || e.eventType.name
      });
    },
    'wtf.scope.leave': function(e) {
      eventJson.push({
        'ph': 'E',
        'pid': e.zone.toString(),
        'tid': '',
        'ts': e.time * 1000
      });
    },

    'wtf.flow.branch': function(e) {
      eventJson.push({
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
      eventJson.push({
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
      eventJson.push({
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
      eventJson.push({
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
        eventJson.push({
          'ph': 'B',
          'pid': e.zone.toString(),
          'tid': '',
          'ts': e.time * 1000,
          'name': e.scope.getEnterEvent().eventType.name
        });
      } else {
        eventJson.push({
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

  if (!wtf.analysis.run(this.platform, traceListener, inputFile)) {
    goog.global.console.log('failed to start analysis!');
    return -1;
  }

  var json = return {
    'sources': sourceJson,
    'traceEvents': eventJson
  };
  this.platform.writeTextFile(outputFile, JSON.stringify(json));

  return 0;
};
