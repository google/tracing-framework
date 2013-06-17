/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview In-page replay logic.
 * This file should only be included on pages when replay is intended and
 * it (currently) expects a query string with 'replay=some.wtf-trace'.
 *
 * Since we want to avoid injecting the WTF JS on the page this file does not
 * modify any global state. Instead it opens a popup that loads the WTF script.
 * This popup allows us to outlive the page lifetime by not closing when the
 * page reloads.
 *
 * On initial launch the popup will start loading the specified trace file.
 * Since the file *must* be loaded fully before the page scripts can run and
 * there's no way to do this, we expect a reload shortly after starting when
 * the popup has completed loading. This is lame, but required.
 *
 * The code in the popup (that lives under wtf.replay.timeTravel) will
 * instrument this pages global scope a bit for dispatching events/etc. We need
 * to make sure we don't mess with that and that we recognize when we should
 * stop.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


(function() {


/**
 * Parses a window query string into a map of key-value pairs.
 * No types are detected so assume all values are strings.
 * @param {string} queryString Query string.
 * @return {!Object.<string>} Key-value pairs.
 */
function parseQueryString(queryString) {
  var result = {};
  if (queryString.length) {
    queryString = queryString.substring(1); // trim ?
  }
  var queryParts = queryString.split('&');
  for (var n = 0; n < queryParts.length; n++) {
    var pair = queryParts[n];
    var equalIndex = pair.indexOf('=');
    if (equalIndex != -1) {
      // Has an =, split.
      pair = pair.split('=');
      result[pair[0]] = pair[1];
    } else {
      // No =, just a bool.
      result[pair] = true;
    }
  }
  return result;
};


/**
 * Prepares the page for running replay.
 * This takes care of connecting to existing popups or opening a new one.
 * @return {boolean} Whether the session will continue. If false it's likely
 *     that the page will be reloaded soon.
 */
function prepare() {
  // Grab query args.
  // TODO(benvanik): is it possible we've already been switched here? Pull out
  //     'raw' version?
  var queryArgs = parseQueryString(window.location.search);

  // Grab out the target wtf-trace path.
  var databasePath = queryArgs['replay'];
  if (!databasePath || !databasePath.length) {
    throw new Error('Invalid replay= value in the query string.');
  }

  console.log('WTF Time Travel Replay enabled: ' + databasePath);

  // Pull out other relevant options from the query string.

  // Options to be passed to the popup.
  var options = {};

  // Create (or connect to) the controller popup.
  var childWindow = window.open(
      '',
      'wtf_replay_controller',
      'width=680,height=400,toolbar=0,status=0,scrollbars=0',
      true);

  // If the controller is new load it up with the WTF script.
  function writeToChild(strs) {
    for (var n = 0; n < strs.length; n++) {
      childWindow.document.writeln(strs[n]);
    }
  };
  var expectingReload = false;
  if (!childWindow.wtf) {
    if (queryArgs['uncompiled']) {
      writeToChild([
        '<link rel="stylesheet" href="../wtf_ui_styles_debug.css"></link>',
        '<script>window.CLOSURE_NO_DEPS = true;</script>',
        '<script src="../third_party/closure-library/closure/goog/base.js"></script>',
        '<script src="../wtf_js-deps.js"></script>',
        '<script>goog.require(\'wtf.replay.timeTravel\');</script>'
      ]);
    } else {
      writeToChild([
        '<link rel="stylesheet" href="../wtf_ui_styles_release.css"></link>',
        '<script src="../wtf_ui_js_compiled.js"></script>'
      ]);
    }
    writeToChild([
      '<body></body>'
    ]);

    // We will be reloaded afterwards, so don't do anything else.
    expectingReload = true;
  }

  // If the popup is new it'll get initialized and start loading. Otherwise
  // we'll reuse it.
  writeToChild([
    '<script>wtf.replay.timeTravel.setup("' +
        databasePath + '", ' + JSON.stringify(options) + ');</script>'
  ]);

  return !expectingReload;
};


// Prepare the page.
if (!prepare()) {
  // Waiting -- likely to be reloaded soon.
  return;
}


// TODO(benvanik): other things?


})();
