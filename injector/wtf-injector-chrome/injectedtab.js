/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Injected tab data channel and control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */



/**
 * Channel to an injected tab.
 * This is created once for each tab when the content script is connected.
 * It handles message dispatch from the content script and sending data to the
 * content script based on enabled features (like debugging).
 *
 * @param {!Extension} extension Hosting extension.
 * @param {!Tab} tab Injected tab.
 * @param {!Object} pageOptions Page options.
 * @param {!Port} port Message port to the content script.
 * @constructor
 */
var InjectedTab = function(extension, tab, pageOptions, port) {
  /**
   * Hosting extension.
   * @type {!Extension}
   * @private
   */
  this.extension_ = extension;

  /**
   * Target tab ID.
   * @type {number}
   * @private
   */
  this.tabId_ = tab.id;

  /**
   * Page URL.
   * @type {string}
   * @private
   */
  this.pageUrl_ = URI.canonicalize(tab.url);

  /**
   * Page options.
   * @type {!Object}
   * @private
   */
  this.pageOptions_ = pageOptions;

  /**
   * Message port connected to the content script.
   * @type {!Port}
   * @private
   */
  this.port_ = port;

  /**
   * Data pending send.
   * @type {!Array.<!Object>}
   * @private
   */
  this.queuedData_ = [];

  /**
   * Debugger source, if enabled.
   * @type {Debugger}
   * @private
   */
  this.debugger_ = null;

  if (pageOptions['wtf.trace.provider.browser']) {
    var timelineEnabled = pageOptions['wtf.trace.provider.browser.timeline'];
    if (timelineEnabled === undefined) {
      timelineEnabled = true;
    }
    var memoryInfoEnabled =
        pageOptions['wtf.trace.provider.browser.memoryInfo'];
    if (memoryInfoEnabled === undefined) {
      memoryInfoEnabled = false;
    }
    if (timelineEnabled || memoryInfoEnabled) {
      this.debugger_ = new Debugger(
          this.tabId_, this.pageOptions_, this.queueTraceEvents_.bind(this));
    }
  }

  /**
   * Registered event handlers.
   * @type {!Object}
   * @private
   */
  this.eventHandlers_ = {
    onMessage: this.messageReceived_.bind(this),
    onDisconnect: this.disconnected_.bind(this)
  };

  this.port_.onMessage.addListener(this.eventHandlers_.onMessage);
  this.port_.onDisconnect.addListener(this.eventHandlers_.onDisconnect);
};


/**
 * Cleans up all attached tab resources.
 */
InjectedTab.prototype.dispose = function() {
  this.port_.onMessage.removeListener(this.eventHandlers_.onMessage);
  this.port_.onDisconnect.removeListener(this.eventHandlers_.onDisconnect);

  // Kill tracing if it was running and we had requested it.
  var tracer = this.extension_.getTracer();
  if (tracer) {
    tracer.abort(this.tabId_);
  }

  // Detach the debugger.
  if (this.debugger_) {
    this.debugger_.dispose();
    this.debugger_ = null;
  }

  this.port_ = null;
};


/**
 * Handles tab disconnects.
 * @private
 */
InjectedTab.prototype.disconnected_ = function() {
  this.extension_.removeInjectedTab(this.tabId_);
  this.dispose();
};


/**
 * Queues WTF event data for sending to the target tab.
 * @param {!Object} data Event data.
 * @private
 */
InjectedTab.prototype.queueTraceEvents_ = function(data) {
  this.queuedData_.push({
    'command': 'trace_events',
    'contents': [data]
  });

  // TODO(benvanik): delay flush for a bit? 100ms? etc?
  this.flush();
};


/**
 * Queues chrome:tracing data for sending to the target tab.
 * @param {string} data chrome:tracing JSON data.
 * @private
 */
InjectedTab.prototype.queueChromeTracingData_ = function(data) {
  this.queuedData_.push({
    'command': 'chrome_tracing_data',
    'contents': [data]
  });

  // TODO(benvanik): delay flush for a bit? 100ms? etc?
  this.flush();
};


/**
 * Flushes all pending event data to the target tab.
 */
InjectedTab.prototype.flush = function() {
  // Send all pending data to the target tab content script.
  for (var n = 0; n < this.queuedData_.length; n++) {
    this.port_.postMessage(this.queuedData_[n]);
  }
  this.queuedData_.length = 0;
};


/**
 * Handles incoming messages from injector content scripts.
 * @param {!Object} data Message.
 * @param {!Port} port Port the message was received on.
 * @private
 */
InjectedTab.prototype.messageReceived_ = function(data, port) {
  var tab = port.sender.tab;
  if (!tab || tab.id != this.tabId_) {
    return;
  }

  switch (data['command']) {
    // Reloads the tab (bypassing cache).
    case 'reload':
      this.extension_.reloadTab(this.tabId_, tab.url);
      break;

    // Updates the tab settings.
    case 'save_settings':
      _gaq.push(['_trackEvent', 'extension', 'page_settings_updated']);
      var options = this.extension_.getOptions();
      options.setPageOptions(
          this.pageUrl_,
          JSON.parse(data['content']));
      break;

    // Pops up a UI with the given snapshot data.
    case 'show_snapshot':
      _gaq.push(['_trackEvent', 'extension', 'show_snapshot',
          null, data['content_length']]);
      this.extension_.showSnapshot(
          tab,
          data['page_url'],
          data['content_type'],
          data['content_urls'],
          data['content_length']);
      break;

    // Starts/stops a chrome:tracing session.
    case 'start_chrome_tracing':
      this.startChromeTracing();
      break;
    case 'stop_chrome_tracing':
      this.stopChromeTracing();
      break;
  }
};


/**
 * Starts tracing.
 * If any previous tracing is running the data is dropped.
 */
InjectedTab.prototype.startChromeTracing = function() {
  var tracer = this.extension_.getTracer();
  if (!tracer) {
    return;
  }

  tracer.stop();
  tracer.start(this.tabId_);
};


InjectedTab.prototype.stopChromeTracing = function() {
  var tracer = this.extension_.getTracer();
  if (!tracer) {
    return;
  }

  tracer.stop(this.queueChromeTracingData_, this);
};
