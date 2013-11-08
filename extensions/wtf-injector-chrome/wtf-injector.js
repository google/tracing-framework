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

// console.log utility that doesn't explode when it's not present.
var log = window.console ?
    window.console.log.bind(window.console) : function() {};


/**
 * Injects the extension, if needed.
 * This is called on startup in the content-script context.
 */
function main() {
  var topWindow = window.top;
  var isTop = window.top === window;

  // Check the top window for options.
  var options = null;
  try {
    var optionsEl = topWindow.document.querySelector('x-wtf-options');
    if (optionsEl) {
      // Options exist in the DOM, use those.
      options = JSON.parse(optionsEl.text);
    }
  } catch (e) {
    // Failed, likely because of cross-domain iframe issues.
  }

  // Grab options - if not found, not injected.
  if (!options) {
    options = fetchOptions(topWindow);
  }
  if (!options) {
    return;
  }

  // Add options to the document for other frames/etc to find.
  if (!optionsEl) {
    try {
      optionsEl = document.createElement('x-wtf-options');
      optionsEl.text = JSON.stringify(options);
      topWindow.document.documentElement.appendChild(optionsEl);
    } catch (e) {
      // Failed, likely because of cross-domain iframe issues.
    }
  }

  if (options['__instrumented__']) {
    // Instrumentation mode.
    if (isTop) {
      // Create a blob that is both the falafel and process scripts.
      // This is used to create the worker.
      var xhr = new XMLHttpRequest();
      xhr.open('GET', chrome.extension.getURL('third_party/falafel.js'), false);
      xhr.send();
      var falafelSource = xhr.responseText;
      xhr = new XMLHttpRequest();
      xhr.open('GET', chrome.extension.getURL('wtf-process.js'), false);
      xhr.send();
      var processSource = xhr.responseText;
      var blob = new Blob([
        falafelSource,
        processSource
      ], {
        type: 'application/javascript'
      });
      var blobUrl = URL.createObjectURL(blob);
      options['wtf.instrumentation.blob'] = blobUrl;

      injectScriptFile(chrome.extension.getURL('third_party/falafel.js'));
      injectScriptFile(chrome.extension.getURL('wtf-process.js'));
      injectScriptFile(chrome.extension.getURL('wtf-call-tracing.js'));
    }
    injectScriptFunction(function(options) {
      // If we are nested in an iframe, protect against cross-origin errors.
      try {
        window.top.wtfi.prepare(options, window);
      } catch (e) {
      }
    }, [
      options
    ]);
  } else {
    // Normal tracing mode.
    // Inject the tracing framework script and the prepare function.
    if (isTop) {
      var traceScriptUrl =
        chrome.extension.getURL('wtf_trace_web_js_compiled.js');
      injectScriptFunction(function(traceScriptUrl) {
        window.WTF_TRACE_SCRIPT_URL = traceScriptUrl;
      }, [traceScriptUrl]);
      injectScriptFile(traceScriptUrl);
    }
    injectScriptFunction(function(options) {
      // If we are nested in an iframe, protect against cross-origin errors.
      try {
        window.top.wtf.trace.prepare(options, window);
      } catch (e) {
      }
    }, [
      options
    ]);

    if (isTop) {
      // Inject addons, if required.
      var addons = injectAddons(options['wtf.addons'] || []);
      // Inject preparation code to start tracing with the desired options.
      injectScriptFunction(startTracing, [
        addons
      ]);
    }
  }

  if (isTop) {
    setupCommunications();
  }
};


/**
 * Fetches the options from the extension background page.
 * This will only return a value if the options were injected in a cookie, and
 * if no options are returned it means the injection is not active.
 * @return {!Object} Options object.
 */
function fetchOptions() {
  /**
   * Name of the cookie that contains the options for the injection.
   * The data is just a blob GUID that is used to construct a URL to the blob
   * exposed by the extension.
   * @const
   * @type {string}
   */
  var WTF_OPTIONS_COOKIE = 'wtf';

  /**
   * Cookie used for instrumentation options.
   * @const
   * @type {string}
   */
  var WTF_INSTRUMENTATION_COOKIE = 'wtfi';

  // Check for the injection cookie.
  var optionsUuid = null;
  var instrumentationOptions = null;
  var cookies = document.cookie.split('; ');
  for (var n = 0; n < cookies.length; n++) {
    if (cookies[n].lastIndexOf(WTF_OPTIONS_COOKIE + '=') == 0) {
      optionsUuid = cookies[n].substr(cookies[n].indexOf('=') + 1);
    }
    if (cookies[n].lastIndexOf(WTF_INSTRUMENTATION_COOKIE + '=') == 0) {
      instrumentationOptions = cookies[n].substr(cookies[n].indexOf('=') + 1);
    }
  }
  if (!optionsUuid && !instrumentationOptions) {
    return null;
  }

  // If we have an instrumentation cookie we use that and go into
  // instrumentation mode.
  if (instrumentationOptions) {
    instrumentationOptions = JSON.parse(instrumentationOptions);
    instrumentationOptions['__instrumented__'] = true;
    return instrumentationOptions;
  }

  // Fetch the options from the extension.
  // This is complicated by a regression in Chrome that prevents the blob trick
  // from working in certain versions. We try that first (as it's the best) and
  // if it fails we fallback to a nasty HTTP header trick.
  // https://code.google.com/p/chromium/issues/detail?id=295829

  // blob:chrome-extension%3A//[extension id]/[options uuid]
  var blobUrl = 'blob:' +
      chrome.extension.getURL(optionsUuid).replace(':', '%3A');
  var headerUrl =
      'http://tracing-framework.appspot.com/tab-options/' + optionsUuid;

  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', blobUrl, false);
    xhr.send(null);
    if (xhr.status != 200) {
      log('Failed to load WTF injection options:',
          blobUrl,
          xhr.status, xhr.statusText);
      return null;
    }
    return JSON.parse(xhr.responseText);
  } catch(e) {
    log('Failed to parse WTF injection options (falling back to headers)... ' +
        'See https://code.google.com/p/chromium/issues/detail?id=295829');

    // Try the headers.
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', headerUrl, false);
      xhr.send(null);
      var optionsData = xhr.getResponseHeader('X-WTF-Options');
      if (!optionsData) {
        log('Failed to load WTF injection options from header:' + headerUrl);
        log('Using defaults for settings :(');
        return {
          'wtf.injector': true,
          'wtf.injector.failed': true,
          'wtf.trace.session.bufferSize': 6 * 1024 * 1024,
          'wtf.trace.session.maximumMemoryUsage': 512 * 1024 * 1024,
          'wtf.trace.provider.chromeDebug.present': true,
          'wtf.trace.provider.chromeDebug.tracing': false
        };
      }
      return JSON.parse(optionsData);
    } catch(e) {
      log('Really failed to fetch WTF injection options, aborting', e);

      // Try again!
      window.setTimeout(function() {
        window.location.reload();
      }, 100);

      return null;
    }
  }

  return null;
};


/**
 * Injects the given addons into the page.
 * @param {!Array.<string>} manifestUrls Addon manifest JSON URLs.
 * @return {!Object.<!Object>} Addon manifests, mapped by manifest URL.
 */
function injectAddons(manifestUrls) {
  var addons = {};
  for (var n = 0; n < manifestUrls.length; n++) {
    // Fetch Manifest JSON.
    var url = manifestUrls[n];
    var json = getUrl(url);
    if (!json) {
      log('Unable to fetch manifest JSON: ' + url);
      continue;
    }
    json = JSON.parse(json);
    addons[url] = json;

    // If it has a tracing node, inject scripts.
    var tracingInfo = json['tracing'];
    if (tracingInfo && tracingInfo['scripts']) {
      var tracingScripts = tracingInfo['scripts'];
      for (var m = 0; m < tracingScripts.length; m++) {
        var scriptUrl = resolveUrl(url, tracingScripts[m]);
        if (!injectScriptFile(scriptUrl)) {
          log('Error loading addon ' + url + ':');
          log('Tracing script file not found: ' + scriptUrl);
        }
      }
    }
  }
  return addons;
};


/**
 * In-page trace preparation function.
 * This is directly inserted into the page and should run immediately after
 * the library has been loaded.
 *
 * This function is stringified and passed to the page, so expect no closure
 * variables and all arguments must be serializable.
 *
 * @param {!Object.<!Object>} addons A map of URL to addon JSON.
 */
function startTracing(addons) {
  // NOTE: this code is injected by string and cannot access any closure
  //     variables!
  // Register addons.
  for (var url in addons) {
    var name = addons[url]['name'];
    if (window.console) {
      console.log('WTF Addon Installed: ' + name + ' (' + url + ')');
    }
    wtf.addon.registerAddon(url, addons[url]);
  }

  // Show HUD.
  wtf.hud.prepare();

  // Start recording.
  wtf.trace.start();
};


/**
 * Converts a list of Uint8Arrays to regular arrays.
 * @param {!Array.<!Uint8Array>} sources Source arrays.
 * @return {!Array.<!Array.<number>>} Target arrays.
 */
function convertUint8ArraysToArrays(sources) {
  var targets = [];
  for (var n = 0; n < sources.length; n++) {
    var source = sources[n];
    var target = new Array(source.length);
    for (var i = 0; i < source.length; i++) {
      target[i] = source[i];
    }
    targets.push(target);
  }
  return targets;
};


/**
 * Sets up two-way communications with the page.
 * This enables proxying to the background page.
 */
function setupCommunications() {
  // Initiate a connection to the background page that we can use as a
  // channel for settings saving/etc.
  var port = chrome.extension.connect({
    name: 'injector'
  });

  // Listen for data from the extension.
  port.onMessage.addListener(function(data, port) {
    // We try to keep the data opaque so we don't waste any time here.
    sendMessage(data);
  });

  // Setup a communication channel with the page via events.
  var localId = String(Number(Date.now()));
  window.addEventListener('message', function(e) {
    // The message here is from the wtf.ipc.MessageChannel, and has some header
    // data in it.
    // Note that because we are also sending messages it's possible to get
    // our own messages back, so filter that by localId.
    var packet = e.data;
    if (!packet ||
        !packet['wtf_ipc_connect_token'] ||
        packet['wtf_ipc_sender_token'] == localId) {
      return;
    }
    var data = packet['data'];

    e.stopPropagation();

    // NOTE: Chrome ports do not support transferrables! Need to convert!

    // Pass through the messages.
    // We trust the Chrome security model and just send the data along.
    port.postMessage(data);
  }, false);

  function sendMessage(data) {
    var packet = {
      'wtf_ipc_connect_token': true,
      'wtf_ipc_sender_token': localId,
      'data': data
    };
    window.postMessage(packet, '*');
  };
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
  var source = [
    '(' + String(fn) + ')(' + args + ');',
    '// Web Tracing Framework injected function: ' + fn.name,
    '//# sourceURL=x://wtf-injector/' + fn.name
  ].join('\n');

  // Create script tag.
  var script = document.createElement('script');
  script.appendChild(document.createTextNode(source));

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
  // Synchronous read of the source.
  var rawText = getUrl(url);
  if (!rawText) {
    return false;
  }

  var filename = url;
  var lastSlash = url.lastIndexOf('/');
  if (lastSlash != -1) {
    filename = url.substr(lastSlash + 1);
  }

  var source = [
    '(function() {' + rawText + '})();',
    '// Web Tracing Framework injected file: ' + url,
    '//# sourceURL=x://wtf-injector/' + filename
  ].join('\n');

  // Setup script tag with the raw source.
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = source;

  // Add to page.
  injectScriptTag(script);

  return true;
};


main();


})();
