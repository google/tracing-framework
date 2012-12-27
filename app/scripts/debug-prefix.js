/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Prefix for the background/UI page in debug mode.
 * This should be included first, before Closure base.js or anything else.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var _gaq = _gaq || [];

window['CLOSURE_NO_DEPS'] = true;
window['CLOSURE_BASE_PATH'] = '../third_party/closure-library/closure/goog/';

if (window.chrome && chrome.runtime) {
  // Running inside the extension - need to do some nasty loads to ensure
  // in-order execution (that doesn't seem to work right in scripts).

  // This tracks all script imports in order for use by the
  // debugImportAndExecute function below.
  var allImports = [];
  window['CLOSURE_IMPORT_SCRIPT'] = function(src) {
    allImports.push(src);
    return true;
  };

  /**
   * Pseudo-synchronously imports the given namespaces (and their
   * dependencies) and issues the callback when done.
   * @param {!Array.<string>} namespaces Namespaces to import (like 'my.app').
   * @param {!Function} callback Function call when loading completes.
   */
  window['debugImportAndExecute'] = function(namespaces, callback) {
    for (var n = 0; n < namespaces.length; n++) {
      goog.require(namespaces[n]);
    }

    var queue = allImports.slice();
    function pumpQueue() {
      if (!queue.length) {
        callback();
        return;
      }
      var script = document.createElement('script');
      script.src = queue[0];
      queue.splice(0, 1);
      script.onload = function() {
        pumpQueue();
      };
      var target = document.head || document.body || document.documentElement;
      target.appendChild(script);
    };

    pumpQueue();
  };
} else {
  /**
   * Pseudo-synchronously imports the given namespaces (and their
   * dependencies) and issues the callback when done.
   * @param {!Array.<string>} namespaces Namespaces to import (like 'my.app').
   * @param {!Function} callback Function call when loading completes.
   */
  window['debugImportAndExecute'] = function(namespaces, callback) {
    // Require all namespaces - this will emit a bunch of document.writes.
    for (var n = 0; n < namespaces.length; n++) {
      goog.require(namespaces[n]);
    }

    // Callback thunk.
    window['__importCallback'] = function() {
      delete window['__importCallback'];
      callback();
    };
    document.write('<script>__importCallback()</script>');
  };
}
