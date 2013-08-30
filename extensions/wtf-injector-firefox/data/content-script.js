/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Firefox extension content script.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

(function() {

// console.log utility that doesn't explode when it's not present.
var log = window.console ?
    window.console.log.bind(window.console) : function() {};


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
  script.text = source;

  // Add to page.
  injectScriptTag(script);
};


/**
 * Injects a script file into the page.
 * @param {string} url Script URL.
 * @param {string} rawText Script raw text contents.
 */
function injectScriptFile(url, rawText) {
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
};


/**
 * Sets up two-way communications with the page.
 * This enables proxying to the background page.
 */
function setupCommunications() {
  // Listen for data from the extension.
  self.port.on('extension-event', function(data) {
    // We try to keep the data opaque so we don't waste any time here.
    sendMessage(data);
  });

  // Setup a communication channel with the page via events.
  var localId = String(Number(Date.now() + Math.random()));
  document.defaultView.addEventListener('message', function(e) {
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

    e.stopPropagation();

    // NOTE: Chrome ports do not support transferrables! Need to convert!

    // Pass through the messages.
    // We trust the Chrome security model and just send the data along.
    var data = packet['data'];
    self.port.emit('page-event', JSON.stringify(data));
  }, true);

  function sendMessage(data) {
    var packet = {
      'wtf_ipc_connect_token': true,
      'wtf_ipc_sender_token': localId,
      'data': data
    };
    document.defaultView.postMessage(packet, '*');
  };
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
    log('WTF Addon Installed: ' + name + ' (' + url + ')');
    wtf.addon.registerAddon(url, addons[url]);
  }

  // Show HUD.
  wtf.hud.prepare();

  // Start recording.
  wtf.trace.start();
};


/**
 * Injects the extension, if needed.
 * This is called on startup in the content-script context.
 */
function main() {
  var wtfOptions = self.options.wtfOptions || {};

  setupCommunications();

  injectScriptFile(
      'wtf_trace_web_js_compiled.js', self.options.wtfScriptContents);
  injectScriptFunction(function(options) {
    wtf.trace.prepare(options);
  }, [
    wtfOptions
  ]);
  injectScriptFunction(startTracing, []);
};


main();


})();
