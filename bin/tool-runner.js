#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tool runner script.
 * Used to prepare the node environment and launch tools.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var fs = require('fs');
var path = require('path');


var args = process.argv.slice(2);
// TODO(benvanik): real options parser stuff
var debugArgIndex = args.indexOf('--debug');
var debugMode = debugArgIndex != -1;
if (debugMode) {
  args.splice(debugArgIndex, 1);
}


/**
 * Prepares the global context for running a tool with the debug WTF.
 */
function prepareDebug() {
  // Import Closure Library and deps.js.
  require('../src/wtf/bootstrap/node').importClosureLibrary([
    'wtf_js-deps.js'
  ]);

  // Disable asserts unless debugging - asserts cause all code to deopt.
  if (debugMode) {
    goog.require('goog.asserts');
    goog.asserts.assert = function(condition, opt_message) {
      console.assert(condition, opt_message);
      return condition;
    };
  } else {
    goog.DEBUG = false;
    goog.require('goog.asserts');
    goog.asserts.assert = function(condition) {
      return condition;
    };
  }

  // Load WTF and configure options.
  goog.require('wtf');
  wtf.NODE = true;
  goog.require('wtf.analysis.exports');
  goog.require('wtf.analysis.node');
};


/**
 * Prepares the global context for running a tool with the release WTF.
 */
function prepareRelease() {
  // Load WTF binary. Search a few paths.
  // TODO(benvanik): look in ENV?
  var searchPaths = [
    '.',
    './build-out',
    '../build-out'
  ];
  var modulePath = path.dirname(module.filename);
  var wtfPath = null;
  for (var n = 0; n < searchPaths.length; n++) {
    var searchPath = path.join(
        searchPaths[n], 'wtf_node_js_compiled.js');
    searchPath = path.join(modulePath, searchPath);
    if (fs.existsSync(searchPath)) {
      wtfPath = path.relative(modulePath, searchPath);
      break;
    }
  }
  if (!wtfPath) {
    console.log('Unable to find wtf_node_js_compiled.js');
    process.exit(-1);
    return;
  }
  var wtf = require(wtfPath.replace('.js', ''));
  global.wtf = wtf;
};


if (debugMode) {
  prepareDebug();
} else {
  prepareRelease();
}


/**
 * @typedef {!function(!Array.<string>):(number|!Function)}
 */
var ToolRunFunction;


/**
 * Launches the given tool function.
 * @param {!ToolRunFunction} toolFn Tool run function.
 * @return {number} Return code.
 */
exports.launch = function(toolFn) {
  // Get the platform abstraction layer.
  var platform = wtf.pal.getPlatform();

  // Execute the tool, potentially async.
  var returnValue = toolFn(platform, args);
  if (typeof returnValue == 'number') {
    process.exit(returnValue);
  } else if (typeof returnValue == 'function') {
    returnValue(function(opt_arg) {
      process.exit(opt_arg || 0);
    });
  } else {
    process.exit(0);
  }
};


exports.util = {};


/**
 * Pads a number with leading or trailing spaces.
 * @param {number|string} value Value to pad.
 * @param {number} count Length to pad to.
 * @return {string} Padded number.
 */
exports.util.pad = function(value, count) {
  value = String(value);
  if (count >= 0) {
    while (value.length < count) {
      value += ' ';
    }
  } else {
    while (value.length < -count) {
      value = ' ' + value;
    }
  }
  return value;
};


/**
 * Pads a number with leading zeros.
 * @param {number|string} value Value to pad.
 * @param {number} count Length to pad to.
 * @return {string} Padded number.
 */
exports.util.pad0 = function(value, count) {
  value = String(value);
  while (value.length < count) {
    value = '0' + value;
  }
  return value;
};


/**
 * Formats time in the standard format.
 * @param {number} value Wall-time.
 * @return {string} Formatted time string.
 */
exports.util.formatTime = function(value) {
  // Format time: 05:33:28.105.25530
  var dt = new Date(value);
  return '' +
      exports.util.pad0(dt.getHours(), 2) + ':' +
      exports.util.pad0(dt.getMinutes(), 2) + ':' +
      exports.util.pad0(dt.getSeconds(), 2) + '.' +
      String((dt.getMilliseconds() / 1000).toFixed(3)).slice(2, 5) + '.' +
      exports.util.pad0(Math.floor((value - Math.floor(value)) * 10000), 4);
};


/**
 * Generates a string from the given arguments and their spacings.
 * @param {!Array.<number>} spacing Spacing values.
 * @param {...*} var_args Arguments.
 * @return {string} Spaced and concatenated values.
 */
exports.util.spaceValues = function(spacing, var_args) {
  var result = [];
  for (var n = 1; n < arguments.length; n++) {
    var arg = arguments[n];
    if (arg === undefined || arg === null) {
      arg = '';
    } else if (typeof arg == 'number') {
      arg = exports.util.pad0(arg.toString(16), 8);
    }
    result.push(exports.util.pad(arg, spacing[n - 1]));
  }
  return result.join(' ');
};


/**
 * Spacing values for log event lines.
 * @type {!Array.<number>}
 */
var logEventSpacing = [17, 1, 8, 1, 48, 13];


/**
 * Logs event information to the console.
 * @param {!wtf.analysis.Event} e Event.
 * @param {(string|number)=} opt_tag Event identifier.
 * @param {*=} opt_extra Extra information/object data/etc.
 */
exports.util.logEvent = function(e, opt_tag, opt_extra) {
  if (opt_extra instanceof Object) {
    opt_extra = JSON.stringify(opt_extra);
  }
  var line = exports.util.spaceValues(logEventSpacing,
      exports.util.formatTime(e.time), '[', e.zone, ']',
      e.eventType.name, opt_tag, opt_extra);
  console.log(line);
};


/**
 * Logs context information to the console.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 */
exports.util.logContextInfo = function(contextInfo) {
  var lineSpacing = [-10, -10, 8];
  console.log(exports.util.spaceValues(lineSpacing,
      'URI:', contextInfo.uri));
  if (contextInfo.title) {
    console.log(exports.util.spaceValues(lineSpacing,
        'Title:', contextInfo.title));
  }
  if (contextInfo.icon && contextInfo.icon.uri) {
    console.log(exports.util.spaceValues(lineSpacing,
        'Icon:', contextInfo.icon.uri));
  }
  if (contextInfo.taskId) {
    console.log(exports.util.spaceValues(lineSpacing,
        'Task ID:', contextInfo.taskId));
  }
  if (contextInfo.args.length) {
    console.log(exports.util.spaceValues(lineSpacing,
        'Args:', contextInfo.args));
  }
  console.log(exports.util.spaceValues(lineSpacing,
      'UA:', contextInfo.userAgent.value));
  console.log(exports.util.spaceValues(lineSpacing,
      ' ', 'Device:', contextInfo.userAgent.device));
  console.log(exports.util.spaceValues(lineSpacing,
      ' ', 'Platform:',
      contextInfo.userAgent.platform,
      contextInfo.userAgent.platformVersion));
  console.log(exports.util.spaceValues(lineSpacing,
      ' ', 'Type:', contextInfo.userAgent.type));
};
