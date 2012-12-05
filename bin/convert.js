#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Convert tool.
 * This converts wtf-trace files to JSON files compatiable with the Chrome
 * about:tracing utility. Events are converted as best-guess.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var toolRunner = require('./tool-runner');
var util = toolRunner.util;
toolRunner.launch(runTool);


/**
 * Convert tool.
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!Array.<string>} args Command line arguments.
 * @return {number|!goog.async.Deferred} Return code or a deferred that is
 *     called back when the tool exits.
 */
function runTool(platform, args) {
  var inputFile = args[0];
  var outputFile = args[1];
  if (!inputFile || !outputFile) {
    console.log('usage: convert.js file.wtf-trace out.json');
    return -1;
  }
  console.log('Converting ' + inputFile + ' to JSON...');
  console.log('');

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

  var traceListener = wtf.analysis.createTraceListener({
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
  });

  if (!wtf.analysis.run(traceListener, inputFile)) {
    console.log('failed to start analysis!');
    return -1;
  }

  var json = {
    'sources': sourceJson,
    'traceEvents': eventJson
  };
  platform.writeTextFile(outputFile, JSON.stringify(json));

  return 0;
};
