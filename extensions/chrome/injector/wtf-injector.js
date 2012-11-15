/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension content script.
 * Injected onto all pages at all times. Checks for the existence of a special
 * cookie ({@see WTF_ENABLED_COOKIE}) to know whether to actually add the
 * scripts to the page.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

(function() {


/**
 * Name of the cookie that is used to indicate injection should occur.
 * @const
 * @type {string}
 */
var WTF_ENABLED_COOKIE = 'wtfE';


/**
 * Root path for extension files.
 * @const
 * @type {string}
 */
var WTF_PATH_ROOT = window.WTF_EXTENSION_DEBUG ? 'extensions/chrome' : '';


// Check for the injection cookie.
var isEnabled = false;
var cookies = document.cookie.split('; ');
for (var n = 0; n < cookies.length; n++) {
  if (cookies[n].lastIndexOf(WTF_ENABLED_COOKIE) == 0) {
    isEnabled = true;
    break;
  }
}

// Perform injection.
if (isEnabled) {
  if (window.WTF_EXTENSION_DEBUG) {
    // Debug variant.
    injectScriptFile(chrome.extension.getURL(
        'build-out/wtf_trace_web_js_compiled.js'));
  } else {
    // Release variant.
    injectScriptFile(chrome.extension.getURL(
        WTF_PATH_ROOT + '/wtf_trace_web_js_compiled.js'));
  }

  // Pick an app URL.
  var appEndpoint = 'localhost:9024';

  // Inject preparation code to start tracing with the desired options.
  // TODO(benvanik): make something up based on page title/domain/etc?
  var filePrefix = 'trace';
  injectScriptFunction(prepareTracing, [
    appEndpoint,
    filePrefix
  ]);
}


/**
 * In-page trace preparation function.
 * This is directly inserted into the page and should run immediately after
 * the library has been loaded.
 *
 * This function is stringified and passed to the page, so expect no closure
 * variables and all arguments must be serializable.
 *
 * @param {string|undefined} appEndpoint App endpoint in 'host:port' form.
 * @param {string} filePrefix Trace filename prefix.
 */
function prepareTracing(appEndpoint, filePrefix) {
  // Setup tracing library.
  wtf.trace.prepare();

  var options = {
    'wtf.app.endpoint': appEndpoint,
    'wtf.trace.target': 'file://' + filePrefix
    //'wtf.trace.target': 'http://localhost:9024'
  };

  // Show HUD.
  wtf.hud.prepare(options);

  // Start recording.
  wtf.trace.startSnapshottingSession(options);
  //wtf.trace.startStreamingSession(options);
};


/**
 * Injects a <script> tag into the document as early as possible.
 * The hope is that the injected contents run before any of the user code.
 * @param {!Element} script <script> element.
 */
function injectScriptTag(script) {
  // Get some kind of target to put the script in.
  // Only valid documents get body/head, so this is a nice way to ignore bad
  // ones. Try to insert as early as possible.
  var targetElement =
      document.documentElement || document.head || document.body;
  if (targetElement) {
    if (targetElement.firstElementChild) {
      targetElement.insertBefore(script, targetElement.firstElementChild);
    } else {
      targetElement.appendChild(script);
    }
    script.parentNode.removeChild(script);
  }
};


/**
 * Injects a function into the page.
 * @param {!Function} fn Function to inject.
 * @param {Array=} opt_args Arguments array. All must be string serializable.
 */
function injectScriptFunction(fn, opt_args) {
  // Header to let users know what's up.
  var header = [
    '/* Web Tracing Framework injected function: ' + fn.name + ' */'
  ].join('\n');

  // Format args as strings that can go in the source.
  var args = opt_args || [];
  for (var n = 0; n < args.length; n++) {
    if (args[n] === undefined) {
      args[n] = 'undefined';
    } else if (args[n] === null) {
      args[n] = 'null';
    } else if (typeof args[n] == 'string') {
      // TODO(benvanik): escape
      args[n] = '"' + args[n] + '"';
    }
  }
  args = args.join(',');

  // TODO(benvanik): escape fn source
  var source = String(fn);

  // Create script tag.
  var script = document.createElement('script');
  script.appendChild(
      document.createTextNode(header + '\n\n(' + source + ')(' + args + ');'));

  // Add to page.
  injectScriptTag(script);
};


/**
 * Injects a script file into the page.
 * If the URL is to a chrome:// path it must be in the web_accessible_resources
 * manifest group.
 * @param {string} url Script URL.
 */
function injectScriptFile(url) {
  // Header to let users know what's up.
  var header = [
    '/* Web Tracing Framework injected content: ' + url + ' */'
  ].join('\n');

  // Synchronous read of the source.
  // The target path must be in the web_accessible_resources manifest group.
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send('');
  var rawText = xhr.responseText;

  // Setup script tag with the raw source.
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = header + '\n\n(function() {\n' + rawText + '\n})();';

  // Add to page.
  injectScriptTag(script);
};


})();
