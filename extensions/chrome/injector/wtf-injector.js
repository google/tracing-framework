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

// Pick an app URL.
var appEndpoint = 'localhost:9024';

// Setup default options.
var options = {
  'wtf.app.endpoint': appEndpoint,
  'wtf.extensions': [
    //'http://localhost:8080/test/extension.json'
  ]
};

// TODO(benvanik): load other options


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

  // Inject extensions.
  var manifestUrls = options['wtf.extensions'] || [];
  var extensions = {};
  for (var n = 0; n < manifestUrls.length; n++) {
    // Fetch Manifest JSON.
    var url = manifestUrls[n];
    var json = getUrl(url);
    if (!json) {
      console.log('Unable to fetch manifest JSON: ' + url);
      continue;
    }
    json = JSON.parse(json);
    extensions[url] = json;

    // If it has a tracing node, inject scripts.
    var tracingInfo = json['tracing'];
    if (tracingInfo && tracingInfo['scripts']) {
      var tracingScripts = tracingInfo['scripts'];
      for (var n = 0; n < tracingScripts.length; n++) {
        var scriptUrl = resolveUrl(url, tracingScripts[n]);
        if (!injectScriptFile(scriptUrl)) {
          console.log('Error loading extension ' + url + ':');
          console.log('Tracing script file not found: ' + scriptUrl);
        }
      }
    }
  }

  // Snapshotting:
  options['wtf.trace.mode'] = 'snapshotting';
  // TODO(benvanik): make something up based on page title/domain/etc?
  options['wtf.trace.target'] = 'file://' + 'trace';
  // Streaming:
  // options['wtf.trace.mode'] = 'streaming';
  // options['wtf.trace.target'] = 'http://' + appEndpoint;

  // Inject preparation code to start tracing with the desired options.
  injectScriptFunction(prepareTracing, [
    options,
    extensions
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
 * @param {!Object.<!Object>} extensions A map of URL to extension JSON.
 */
function prepareTracing(options, extensions) {
  // Setup tracing library.
  wtf.trace.prepare();

  // Register extensions.
  for (var url in extensions) {
    wtf.ext.registerExtension(url, extensions[url]);
  }

  // Show HUD.
  wtf.hud.prepare(options);

  // Start recording.
  switch (options['wtf.trace.mode']) {
    default:
    case 'snapshotting':
      wtf.trace.startSnapshottingSession(options);
      break;
    case 'streaming':
      wtf.trace.startStreamingSession(options);
      break;
  }
};


/**
 * Synchronously fetch the given URL.
 * If the URL is a reference to an extension resource it must be in the
 * web_accessible_resources manifest group.
 * @param {string} url URL to fetch.
 * @return {string|null} URL contents.
 */
function getUrl(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send('');
  if (xhr.status != 200) {
    return null;
  }
  return xhr.responseText;
};


/**
 * Hackily resolves a URL relative to a base.
 * @param {string} base Base URL.
 * @param {string} url Relative or absolute URL.
 * @return {string} Resolved URL.
 */
function resolveUrl(base, url) {
  var value = '';
  if (url.indexOf('://') != -1) {
    // Likely absolute...
    value = url;
  } else {
    // Combine by smashing together and letting the browser figure it out.
    if (url.length && url[0] == '/') {
      // URL is absolute, so strip base to just host.
      var i = url.indexOf('://') + 3;
      i = url.indexOf('/', i);
      if (i != -1) {
        value = base + url;
      } else {
        value = base.substr(0, i) + url;
      }
    } else {
      // URL is relative, so combine with base.
      if (base[base.length] == '/') {
        value = base + '/' + url;
      } else {
        value = base + '/../' + url;
      }
    }
  }
  return value;
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
    } else if (typeof args[n] == 'object') {
      args[n] = JSON.stringify(args[n]);
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
 * @return {boolean} Whether the source file was found.
 */
function injectScriptFile(url) {
  // Header to let users know what's up.
  var header = [
    '/* Web Tracing Framework injected content: ' + url + ' */'
  ].join('\n');

  // Synchronous read of the source.
  var rawText = getUrl(url);
  if (!rawText) {
    return false;
  }

  // Setup script tag with the raw source.
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = header + '\n\n(function() {\n' + rawText + '\n})();';

  // Add to page.
  injectScriptTag(script);

  return true;
};


})();
