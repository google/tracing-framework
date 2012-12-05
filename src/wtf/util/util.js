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
