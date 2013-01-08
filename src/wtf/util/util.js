/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Library-private utilties.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.util');

goog.require('goog.asserts');
/** @suppress {extraRequire} */
goog.require('goog.debug.ErrorHandler');
goog.require('goog.string');


/**
 * Pads a number with leading zeros.
 * @param {number|string} value Value to pad.
 * @param {number} count Length to pad to.
 * @return {string} Padded number.
 */
wtf.util.pad0 = function(value, count) {
  value = String(value);
  while (value.length < count) {
    value = '0' + value;
  }
  return value;
};


/**
 * Formats a time value, rounding to ms at 3 decimal places.
 * @param {number} value Time value.
 * @return {string} Formatted time string.
 */
wtf.util.formatTime = function(value) {
  return value.toFixed(3) + 'ms';
};


/**
 * Formats a time value, rounding to ms and to ms at 3 decimal places if <1.
 * @param {number} value Time value.
 * @return {string} Formatted time string, plus units.
 */
wtf.util.formatSmallTime = function(value) {
  if (value == 0) {
    return '0ms';
  } else if (value < 1) {
    return value.toFixed(3) + 'ms';
  } else if (value < 10) {
    return value.toFixed(2) + 'ms';
  }
  return value.toFixed(0) + 'ms';
};


/**
 * Formats time in the standard format.
 * @param {number} value Wall-time.
 * @return {string} Formatted time string.
 */
wtf.util.formatWallTime = function(value) {
  // Format time: 05:33:28.105.25530
  var dt = new Date(value);
  return '' +
      goog.string.padNumber(dt.getHours(), 2) + ':' +
      goog.string.padNumber(dt.getMinutes(), 2) + ':' +
      goog.string.padNumber(dt.getSeconds(), 2) + '.' +
      String((dt.getMilliseconds() / 1000).toFixed(3)).slice(2, 5) + '.' +
      goog.string.padNumber(Math.floor((value - Math.floor(value)) * 10000), 4);
};


// TODO(benvanik): replace with fancy tooltip formatting.
/**
 * Adds event argument lines to the line list.
 * @param {!Array.<string>} lines List of lines that will be added to.
 * @param {Object} data Argument data object.
 */
wtf.util.addArgumentLines = function(lines, data) {
  if (!data) {
    return;
  }

  for (var argName in data) {
    var argValue = data[argName];
    if (argValue === undefined) {
      continue;
    }
    if (argValue === null) {
      argValue = 'null';
    } else if (goog.isArray(argValue)) {
      argValue = '[' + argValue + ']';
    } else if (argValue.buffer && argValue.buffer instanceof ArrayBuffer) {
      // TODO(benvanik): better display of big data blobs.
      var argString = '[';
      var maxCount = 16;
      for (var n = 0; n < Math.min(argValue.length, maxCount); n++) {
        if (n) {
          argString += ',';
        }
        argString += argValue[n];
      }
      if (argValue.length > maxCount) {
        argString += ' ...';
      }
      argString += ']';
      argValue = argString;
    } else if (goog.isObject(argValue)) {
      // TODO(benvanik): prettier object printing.
      argValue = goog.global.JSON.stringify(argValue);
    }
    lines.push(argName + ': ' + argValue);
  }
};


/**
 * Gets the compiled name of a member on an object.
 * This looks up by member value, so only use with known-good values.
 * @param {!Object} obj Representative object.
 * @param {*} memberValue Member value.
 * @return {string?} Member name, if found.
 */
wtf.util.getCompiledMemberName = function(obj, memberValue) {
  // This does not early-exit to ensure that duplicates throw errors instead of
  // behaving unpredictably.
  var foundName = null;
  for (var name in obj) {
    if (obj[name] === memberValue) {
      if (foundName) {
        goog.asserts.fail('duplicate members found');
        return null;
      }
      foundName = name;
    }
  }
  return foundName;
};


/**
 * Calls a function when the DOM is ready.
 * The callback may be issued immediately if the DOM is already ready.
 * @param {!Function} callback Function to call.
 * @param {Object=} opt_scope Scope to call the function in.
 */
wtf.util.callWhenDomReady = function(callback, opt_scope) {
  // TODO(benvanik): prevent leaking these events.
  if (document.readyState == 'complete' ||
      document.readyState == 'interactive') {
    callback.call(opt_scope);
  } else {
    if (document.addEventListener) {
      var listener = function() {
        document.removeEventListener('DOMContentLoaded', listener, false);
        callback.call(opt_scope);
      };
      listener['__wtf_ignore__'] = true;
      document.addEventListener('DOMContentLoaded', listener, false);
    } else if (document.attachEvent) {
      var listener = function() {
        document.detachEvent('onload', listener);
        callback.call(opt_scope);
      };
      listener['__wtf_ignore__'] = true;
      document.attachEvent('onload', listener);
    }
  }
};


/**
 * Converts an ASCII string into a byte array.
 * This is very unsafe and should only be used when the content is known-ASCII.
 * @param {string} value Source string.
 * @return {!Uint8Array} Resulting array buffer.
 */
wtf.util.convertAsciiStringToUint8Array = function(value) {
  var buffer = new Uint8Array(value.length);
  for (var n = 0; n < buffer.length; n++) {
    buffer[n] = value.charCodeAt(n) & 0xFF;
  }
  return buffer;
};


goog.exportSymbol(
    'wtf.util.formatTime',
    wtf.util.formatTime);
goog.exportSymbol(
    'wtf.util.formatSmallTime',
    wtf.util.formatSmallTime);
goog.exportSymbol(
    'wtf.util.formatWallTime',
    wtf.util.formatWallTime);
