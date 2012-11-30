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
  // Grab options - if not found, not injected.
  var options = fetchOptions();
  if (!options) {
    return;
  }

  // Inject the tracing framework script and the prepare function.
  injectScriptFile(chrome.extension.getURL('wtf_trace_web_js_compiled.js'));
  injectScriptFunction(function() {
    wtf.trace.prepare();
  });

  // Inject extensions, if required.
  var extensions = injectExtensions(options['wtf.extensions'] || []);

  // Inject preparation code to start tracing with the desired options.
  injectScriptFunction(startTracing, [
    options,
    extensions
  ]);

  setupCommunications();
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

  // Check for the injection cookie.
  var optionsUuid = null;
  var cookies = document.cookie.split('; ');
  for (var n = 0; n < cookies.length; n++) {
    if (cookies[n].lastIndexOf(WTF_OPTIONS_COOKIE) == 0) {
      optionsUuid = cookies[n].substr(cookies[n].indexOf('=') + 1);
      break;
    }
  }
  if (!optionsUuid) {
    return null;
  }

  // Fetch the options from the extension.
  try {
    // blob:chrome-extension%3A//[extension id]/[options uuid]
    var optionsUrl = 'blob:' +
        chrome.extension.getURL(optionsUuid).replace(':', '%3A');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', optionsUrl, false);
    xhr.send(null);
    if (xhr.status != 200) {
      log('Failed to load WTF injection options:',
          optionsUrl,
          xhr.status, xhr.statusText);
      return null;
    }
    return JSON.parse(xhr.responseText);
  } catch(e) {
    log('Failed to parse WTF injection options:', e, xhr.responseText);
    return null;
  }

  return null;
};


/**
 * Injects the given extensions into the page.
 * @param {!Array.<string>} manifestUrls Extension manifest JSON URLs.
 * @return {!Object.<!Object>} Extension manifests, mapped by manifest URL.
 */
function injectExtensions(manifestUrls) {
  var extensions = {};
  for (var n = 0; n < manifestUrls.length; n++) {
    // Fetch Manifest JSON.
    var url = manifestUrls[n];
    var json = getUrl(url);
    if (!json) {
      log('Unable to fetch manifest JSON: ' + url);
      continue;
    }
    json = JSON.parse(json);
    extensions[url] = json;

    // If it has a tracing node, inject scripts.
    var tracingInfo = json['tracing'];
    if (tracingInfo && tracingInfo['scripts']) {
      var tracingScripts = tracingInfo['scripts'];
      for (var m = 0; m < tracingScripts.length; m++) {
        var scriptUrl = resolveUrl(url, tracingScripts[m]);
        if (!injectScriptFile(scriptUrl)) {
          log('Error loading extension ' + url + ':');
          log('Tracing script file not found: ' + scriptUrl);
        }
      }
    }
  }
  return extensions;
};


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
function startTracing(options, extensions) {
  // NOTE: this code is injected by string and cannot access any closure
  //     variables!
  // Register extensions.
  for (var url in extensions) {
    var name = extensions[url]['name'];
    if (window.console) {
      console.log('WTF Extension Installed: ' + name + ' (' + url + ')');
    }
    wtf.ext.registerExtension(url, extensions[url]);
  }

  // Show HUD.
  wtf.hud.prepare(options);

  // Start recording.
  wtf.trace.start(options);
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

  // Setup a communication channel with the page via events.
  var channelElement = document;
  var localId = String(Number(Date.now()));
  channelElement.addEventListener('WtfContentScriptEvent', function(e) {
    // The message here is from the wtf.ipc.DomChannel, and has some header
    // data in it.
    var packet = e.detail;
    if (!packet ||
        !packet['wtf_ipc_connect_token'] ||
        packet['wtf_ipc_sender_token'] == localId) {
      return;
    }
    var data = packet['data'];
    switch (data['command']) {
      case 'reload':
        port.postMessage({
          'command': 'reload'
        });
        break;
      case 'save_settings':
        port.postMessage({
          'command': 'save_settings',
          'content': data['content']
        });
        break;
    }
  }, false);

  function sendMessage(data) {
    var packet = {
      'wtf_ipc_connect_token': true,
      'wtf_ipc_sender_token': localId,
      'data': data
    };
    var e = channelElement.createEvent('CustomEvent');
    e.initCustomEvent('WtfContentScriptEvent', false, false, packet);
    channelElement.dispatchEvent(e);
  };

  // TODO(benvanik): listen on port and proxy messages from extension?
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


main();


})();
