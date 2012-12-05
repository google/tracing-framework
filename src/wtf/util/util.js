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
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventType');
goog.require('goog.fs');
goog.require('wtf.io');


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
 * Invokes a download action on the given buffers.
 * This must originate from a user action (click/etc).
 * @param {!Array.<!wtf.io.ByteArray>} buffers Buffers.
 * @param {string} filename Name of the file.
 * @param {string=} opt_mimeType File mime type.
 */
wtf.util.downloadData = function(buffers, filename, opt_mimeType) {
  // Create blob from all parts.
  var blob;
  if (wtf.io.HAS_TYPED_ARRAYS) {
    // Binary version.
    blob = new Blob(buffers, {
      'type': opt_mimeType || 'application/octet-stream'
    });
  } else {
    // Base64 version.
    var combinedBuffers = wtf.io.combineByteArrays(buffers);
    var stringData = wtf.io.byteArrayToString(combinedBuffers);
    blob = new Blob([stringData], {
      'type': opt_mimeType || 'text/plain'
    });
  }

  // IE10+
  if (goog.global.navigator['msSaveBlob']) {
    goog.global.navigator['msSaveBlob'](blob, filename);
    return;
  }

  // Download file. Wow.
  var doc = goog.dom.getDocument();
  var a = doc.createElement(goog.dom.TagName.A);
  a['download'] = filename;
  a.href = goog.fs.createObjectUrl(blob);
  var e = doc.createEvent('MouseEvents');
  e.initMouseEvent(
      goog.events.EventType.CLICK,
      true, false, goog.global, 0, 0, 0, 0, 0,
      false, false, false, false, 0, null);
  a.dispatchEvent(e);
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
