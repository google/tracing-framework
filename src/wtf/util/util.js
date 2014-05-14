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
goog.require('goog.string');
goog.require('goog.userAgent.product');


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
 * @param {number=} opt_indent Level of indentation, defaults to 0.
 */
wtf.util.addArgumentLines = function(lines, data, opt_indent) {
  if (!data) {
    return;
  }

  var indent = '';
  if (opt_indent) {
    for (var i = 0; i < opt_indent; i++) {
      indent += '  ';
    }
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
      argValue = goog.global.JSON.stringify(argValue, undefined, 2);
    }
    lines.push(indent + argName + ': ' + argValue);
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
 * @param {Document=} opt_document Document, if not the current one.
 */
wtf.util.callWhenDomReady = function(callback, opt_scope, opt_document) {
  var doc = opt_document || goog.global.document;

  // TODO(benvanik): prevent leaking these events.
  if (doc.readyState == 'complete') {
    callback.call(opt_scope);
  } else {
    var hasFired = false;
    if (doc.addEventListener) {
      var listener = function() {
        if (hasFired) {
          return;
        }
        hasFired = true;
        doc.removeEventListener('DOMContentLoaded', listener, false);
        doc.removeEventListener('load', listener, false);
        callback.call(opt_scope);
      };
      listener['__wtf_ignore__'] = true;
      doc.addEventListener('DOMContentLoaded', listener, false);
      goog.global.addEventListener('load', listener, false);
    } else if (doc.attachEvent) {
      var listener = function() {
        if (hasFired) {
          return;
        }
        hasFired = true;
        doc.detachEvent('onload', listener);
        goog.global.detachEvent('load', listener);
        callback.call(opt_scope);
      };
      listener['__wtf_ignore__'] = true;
      doc.attachEvent('onload', listener);
      goog.global.attachEvent('load', listener);
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


/**
 * Converts a byte array into an ASCII string.
 * This is very unsafe and should only be used when the content is known-ASCII.
 * @param {!Uint8Array} value Source buffer.
 * @return {string} Resulting string.
 */
wtf.util.convertUint8ArrayToAsciiString = function(value) {
  // TODO(benvanik): evaluate not using a temp array
  var out = new Array(value.length);
  for (var n = 0; n < value.length; n++) {
    out[n] = String.fromCharCode(value[n]);
  }
  return out.join('');
};


/**
 * Generates an XPath expression that tries to uniquely identify a DOM element.
 * @param {Element|Object} targetElement DOM element.
 * @return {?string} XPath string or null if not possible.
 */
wtf.util.getElementXPath = function(targetElement) {
  if (!targetElement) {
    // No element is null.
    return null;
  } else if (targetElement == goog.global) {
    return 'window';
  } else if (targetElement.id) {
    // Element has an ID - easy.
    return '//*[@id="' + targetElement.id + '"]';
  }

  // TODO(benvanik): evaluate caching this string instance. We could check the
  //     cached copy on the element by walking up the tree - if it doesn't match
  //     (meaning the element has moved) we regenerate then. This would remove
  //     allocations in the common case.

  // Slow path - build a full xpath string.
  // We build the list of parts in reverse and then flip before joining.
  var paths = [];
  for (var el = targetElement;
      el && el.nodeType == Node.ELEMENT_NODE; el = el.parentNode) {
    var index = 0;
    for (var sibling = el.previousSibling; sibling;
        sibling = sibling.previousSibling) {
      if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
        continue;
      }
      if (sibling.nodeName == el.nodeName) {
        index++;
      }
    }
    paths.push(el.nodeName + '[' + (index + 1) + ']');
  }
  if (!paths.length) {
    return null;
  }

  // Add a leading '' to force a leading /.
  paths.push('');

  // Reverse the paths.
  wtf.util.reverse(paths);

  return paths.join('/');
};


/**
 * Attempts to find an element int he DOM by XPath.
 * @param {string?} path XPath query string.
 * @param {Document=} opt_document Document to query.
 * @return {Element|Object} Element, if found.
 */
wtf.util.findElementByXPath = function(path, opt_document) {
  var doc = opt_document || goog.global['document'];
  if (!path) {
    return null;
  } else if (path == 'window') {
    return doc['defaultView'];
  }
  var result = doc.evaluate(
      path,
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null);
  return result.singleNodeValue;
};


/**
 * Reverses the contents of the array inline.
 * This is up to 2x faster than the native browser reverse() in Chrome, but
 * slower in most other browsers.
 * @param {!Array} array Array to reverse.
 */
wtf.util.reverse = goog.userAgent.product.CHROME ? function(array) {
  var length = array.length;
  var halfLength = length >> 1;
  for (var n = 0; n < halfLength; n++) {
    var m = length - n - 1;
    var tmp = array[n];
    array[n] = array[m];
    array[m] = tmp;
  }
} : function(array) {
  array.reverse();
};


/**
 * Property name used to store the cache on the global object.
 * @type {string}
 * @const
 * @private
 */
wtf.util.GLOBAL_CACHE_KEY_ = 'wtf_util_global_cache';


/**
 * Gets a global cache object that can be used to store *cache only* data.
 * Use this instead of stashing properties on the global object yourself.
 * Since anything placed on here essentially leaks, it should only be used for
 * non-reference data (strings/numbers/etc) that is used for identity lookups
 * and such.
 *
 * <code>
 * var stash = wtf.util.getGlobalCacheObject('foo');
 * stash.someId = 53;
 * </code>
 *
 * @param {string} key Application-unique key.
 * @param {Object=} opt_global Global object to use instead of
 *     {@code goog.global}.
 * @return {!Object} An object that can be used to stash values.
 */
wtf.util.getGlobalCacheObject = function(key, opt_global) {
  var global = opt_global || goog.global;
  var root = global[wtf.util.GLOBAL_CACHE_KEY_];
  if (!root) {
    root = global[wtf.util.GLOBAL_CACHE_KEY_] = {};
  }
  var stash = root[key];
  if (!stash) {
    stash = root[key] = {};
  }
  return stash;
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
