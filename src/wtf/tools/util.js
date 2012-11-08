/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tool utility namespace.
 * These utility functions should only be useful to tools, unlike the shared
 * wtf.util namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.tools.util');


/**
 * Pads a number with leading or trailing spaces.
 * @param {number|string} value Value to pad.
 * @param {number} count Length to pad to.
 * @return {string} Padded number.
 */
wtf.tools.util.pad = function(value, count) {
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
wtf.tools.util.pad0 = function(value, count) {
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
wtf.tools.util.formatTime = function(value) {
  // Format time: 05:33:28.105.25530
  var dt = new Date(value);
  return '' +
      wtf.tools.util.pad0(dt.getHours(), 2) + ':' +
      wtf.tools.util.pad0(dt.getMinutes(), 2) + ':' +
      wtf.tools.util.pad0(dt.getSeconds(), 2) + '.' +
      String((dt.getMilliseconds() / 1000).toFixed(3)).slice(2, 5) + '.' +
      wtf.tools.util.pad0(Math.floor((value - Math.floor(value)) * 10000), 4);
};


/**
 * Generates a string from the given arguments and their spacings.
 * @param {!Array.<number>} spacing Spacing values.
 * @param {...*} var_args Arguments.
 * @return {string} Spaced and concatenated values.
 */
wtf.tools.util.spaceValues = function(spacing, var_args) {
  var result = [];
  for (var n = 1; n < arguments.length; n++) {
    var arg = arguments[n];
    if (arg === undefined || arg === null) {
      arg = '';
    } else if (typeof arg == 'number') {
      arg = wtf.tools.util.pad0(arg.toString(16), 8);
    }
    result.push(wtf.tools.util.pad(arg, spacing[n - 1]));
  }
  return result.join(' ');
};


/**
 * Spacing values for log event lines.
 * @type {!Array.<number>}
 * @private
 */
wtf.tools.util.logEventSpacing_ = [17, 1, 8, 1, 48, 13];


/**
 * Logs event information to the console.
 * @param {!wtf.analysis.Event} e Event.
 * @param {(string|number)=} opt_tag Event identifier.
 * @param {*=} opt_extra Extra information/object data/etc.
 */
wtf.tools.util.logEvent = function(e, opt_tag, opt_extra) {
  if (opt_extra instanceof Object) {
    opt_extra = goog.global.JSON.stringify(opt_extra);
  }
  var line = wtf.tools.util.spaceValues(wtf.tools.util.logEventSpacing_,
      wtf.tools.util.formatTime(e.time), '[', e.zone, ']',
      e.eventType.name, opt_tag, opt_extra);
  goog.global.console.log(line);
};


/**
 * Logs context information to the console.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 */
wtf.tools.util.logContextInfo = function(contextInfo) {
  var lineSpacing = [-10, -10, 8];
  goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
      'URI:', contextInfo.uri));
  if (contextInfo.title) {
    goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
        'Title:', contextInfo.title));
  }
  if (contextInfo.icon && contextInfo.icon.uri) {
    goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
        'Icon:', contextInfo.icon.uri));
  }
  if (contextInfo.taskId) {
    goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
        'Task ID:', contextInfo.taskId));
  }
  if (contextInfo.args.length) {
    goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
        'Args:', contextInfo.args));
  }
  goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
      'UA:', contextInfo.userAgent.value));
  goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
      ' ', 'Device:', contextInfo.userAgent.device));
  goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
      ' ', 'Platform:',
      contextInfo.userAgent.platform,
      contextInfo.userAgent.platformVersion));
  goog.global.console.log(wtf.tools.util.spaceValues(lineSpacing,
      ' ', 'Type:', contextInfo.userAgent.type));
};
