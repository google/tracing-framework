/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace utility functions.
 * Most of these will be exported onto the {@see wtf.trace} namespace but are
 * here to prevent dependency cycles.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.util');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.string');
goog.require('wtf');


/**
 * A raw equivalent of Date.now(), without tracing.
 * @return {number} Value of Date.now.
 */
wtf.trace.util.dateNow = (function() {
  return Date.now['raw'] || Date.now;
})();


/**
 * Attempts to get the WTF trace script URL.
 * @return {?string} Script URL, if found.
 */
wtf.trace.util.getScriptUrl = function() {
  if (goog.global['WTF_TRACE_SCRIPT_URL']) {
    return goog.global['WTF_TRACE_SCRIPT_URL'];
  }
  if (!wtf.NODE) {
    if (!goog.global.document) {
      return null;
    }
    var scriptEls = goog.dom.getElementsByTagNameAndClass(
        goog.dom.TagName.SCRIPT);
    for (var n = 0; n < scriptEls.length; n++) {
      var scriptEl = scriptEls[n];
      if (goog.string.contains(scriptEl.src, 'wtf_trace_web_js_compiled.js')) {
        return scriptEl.src;
      }
    }
  }
  return null;
};


/**
 * Marks an event listener as being ignored, meaning that it will not show up
 * in traces.
 * @param {!T} listener Event listener.
 * @return {!T} The parameter, for chaining.
 * @template T
 */
wtf.trace.util.ignoreListener = function(listener) {
  listener['__wtf_ignore__'] = true;
  return listener;
};


/**
 * Marks an entire tree of DOM elements as being ignored, meaning that no
 * events from them will show up in traces.
 * @param {!Element} el Root DOM element.
 */
wtf.trace.util.ignoreDomTree = function(el) {
  // Add the 'ignore me' property to all of the elements.
  el['__wtf_ignore__'] = true;
  var all = el.getElementsByTagName('*');
  for (var n = 0; n < all.length; n++) {
    all[n]['__wtf_ignore__'] = true;
  }
};


/**
 * Marks an event as being ignored.
 * This is useful for events that do not support cancellation.
 * This method only has an effect for types that dispatch through the custom
 * event target dispatcher in WTF.
 * @param {!Event} e Event.
 */
wtf.trace.util.ignoreEvent = function(e) {
  e['__wtf_ignore__'] = true;
};
