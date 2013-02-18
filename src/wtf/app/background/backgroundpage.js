/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome app background page.
 * Entry point for the app, setting up networking services and coordinating
 * launches.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.background.BackgroundPage');

goog.require('goog.Disposable');
goog.require('wtf.app.background.HttpServiceEndpoint');
goog.require('wtf.app.background.ServiceEndpoint');
goog.require('wtf.ipc');
goog.require('wtf.ipc.Channel');
goog.require('wtf.pal');



/**
 * @param {!Object} options Options overrides.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.app.background.BackgroundPage = function(options) {
  goog.base(this);

  /**
   * Options overrides.
   * @type {!Object}
   * @private
   */
  this.options_ = options;

  /**
   * Platform abstraction layer.
   * @type {!wtf.pal.IPlatform}
   * @private
   */
  this.platform_ = wtf.pal.getPlatform();

  /**
   * All created service endpoints.
   * @type {!Array.<!wtf.app.background.ServiceEndpoint>}
   * @private
   */
  this.serviceEndpoints_ = [];

  /**
   * IPC channel to the UI, if it is open.
   * @type {wtf.ipc.Channel}
   * @private
   */
  this.channel_ = null;

  /**
   * Whether a channel is pending creation (window has been opened, waiting
   * a response).
   * @type {boolean}
   * @private
   */
  this.pendingChannel_ = false;

  /**
   * Messages waiting for a new channel to open.
   * @type {!Array.<!Object>}
   * @private
   */
  this.queuedMessages_ = [];

  // Wait for channels.
  // This may fire multiple times (if the child window is reloaded/etc).
  wtf.ipc.listenForChildWindows(function(channel) {
    this.pendingChannel_ = false;
    goog.dispose(this.channel_);
    this.channel_ = channel;
    this.channel_.addListener(
        wtf.ipc.Channel.EventType.MESSAGE,
        this.channelMessage_, this);

    while (this.queuedMessages_.length) {
      var nextMessage = this.queuedMessages_.shift();
      this.channel_.postMessage(nextMessage);
    }
  }, this);

  /**
   * Current app window, if any.
   * @type {ChromeAppWindow?}
   * @private
   */
  this.currentWindow_ = null;

  // Setup services.
  this.bindEndpoints_(options['endpoints'] || []);

  // Bind extension events.
  chrome.runtime.onStartup.addListener(goog.bind(
      this.browserStarted_, this));
  chrome.runtime.onInstalled.addListener(goog.bind(
      this.appInstalled_, this));
  chrome.app.runtime.onLaunched.addListener(goog.bind(
      this.appLaunched_, this));
  chrome.runtime.onSuspend.addListener(goog.bind(function() {
    window.console.log('unloading');
  }, this));
};
goog.inherits(wtf.app.background.BackgroundPage, goog.Disposable);


/**
 * @override
 */
wtf.app.background.BackgroundPage.prototype.disposeInternal = function() {
  // TODO(benvanik): unbind events?
  goog.base(this, 'disposeInternal');
};


/**
 * Binds all service endpoints.
 * @param {!Array.<string>} endpoints A list of {@code type:port} endpoints.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.bindEndpoints_ =
    function(endpoints) {
  var allHttpPorts = [];

  for (var n = 0; n < endpoints.length; n++) {
    var endpoint = endpoints[n];
    var parts = endpoint.split(':');
    var type = parts[0];
    var port = Number(parts[1]);
    switch (type) {
      case 'http':
        allHttpPorts.push(port);
        break;
    }
  }

  // Register HTTP endpoints.
  if (allHttpPorts.length) {
    var httpServiceEndpoint = new wtf.app.background.HttpServiceEndpoint(
        this.platform_, allHttpPorts);
    this.serviceEndpoints_.push(httpServiceEndpoint);
    this.registerDisposable(httpServiceEndpoint);
  }

  // Listen for events.
  for (var n = 0; n < this.serviceEndpoints_.length; n++) {
    var serviceEndpoint = this.serviceEndpoints_[n];
    serviceEndpoint.addListener(
        wtf.app.background.ServiceEndpoint.EventType.SNAPSHOT,
        this.snapshotReceived_, this);
    serviceEndpoint.addListener(
        wtf.app.background.ServiceEndpoint.EventType.STREAM_CREATED,
        this.streamCreated_, this);
    serviceEndpoint.addListener(
        wtf.app.background.ServiceEndpoint.EventType.STREAM_APPENDED,
        this.streamAppended_, this);
  }
};


/**
 * Handles browser startup events.
 * This will be fired exactly once when the browser is first started and the
 * app is installed.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.browserStarted_ = function() {
  window.console.log('browser started');
};


/**
 * Handles application install events.
 * This will be fired when the application is first installed and on every
 * subsequent update.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.appInstalled_ = function() {
  window.console.log('app installed');
};


/**
 * Handles application launch events.
 * This is fired every time the application is launched - either via the new tab
 * page, the extension, or an intent.
 * @param {Object=} opt_intent Web intent data, if launched via intents.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.appLaunched_ =
    function(opt_intent) {
  if (opt_intent) {
    var data = opt_intent['data'];
    window.console.log('launched with intent', data);
    this.showWindow_(function() {
      // TODO(benvanik): something with data
    }, this);
  } else {
    window.console.log('launched');
    this.showWindow_();
  }
};


/**
 * Queues a message for dispatch to the client window (sending immediately if it
 * can).
 * @param {!Object} message Message to send.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.queueMessage_ = function(message) {
  if (this.channel_ && this.channel_.isConnected()) {
    this.channel_.postMessage(message);
  } else {
    this.queuedMessages_.push(message);
  }
};


/**
 * Handles incoming snapshot data events.
 * @param {string} contentType Snapshot content type.
 * @param {!Uint8Array} data Snapshot data.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.snapshotReceived_ = function(
    contentType, data) {
  this.showWindow_(function() {
    this.queueMessage_({
      'command': 'snapshot',
      'content_type': contentType,
      'content_buffers': [data],
      'content_length': data.length
    });
  }, this);
};


/**
 * Handles incoming streaming session events.
 * @param {string} sessionId Session ID.
 * @param {string} streamId Stream ID.
 * @param {string} contentType Stream content type.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.streamCreated_ = function(
    sessionId, streamId, contentType) {
  this.showWindow_(function() {
    this.queueMessage_({
      'command': 'stream_created',
      'session_id': sessionId,
      'stream_id': streamId,
      'content_type': contentType
    });
  }, this);
};


/**
 * Handles incoming streaming session events.
 * @param {string} sessionId Session ID.
 * @param {string} streamId Stream ID.
 * @param {!wtf.io.ByteArray} data New data buffer.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.streamAppended_ = function(
    sessionId, streamId, data) {
  this.queueMessage_({
    'command': 'stream_appended',
    'session_id': sessionId,
    'stream_id': streamId,
    'contents': [data]
  });
};


/**
 * @const
 * @type {string}
 * @private
 */
wtf.app.background.BackgroundPage.MAIN_WINDOW_ID_ = 'wtf_ui_maindisplay';


/**
 * Focuses the window, creating if needed.
 * @param {function()=} opt_callback Function called when the window is opened.
 * @param {Object=} opt_scope Callback scope.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.showWindow_ = function(
    opt_callback, opt_scope) {
  if (this.currentWindow_ && !this.currentWindow_.contentWindow.closed) {
    this.currentWindow_.focus();
    if (opt_callback) {
      opt_callback.call(opt_scope);
    }
    return;
  }

  this.pendingChannel_ = true;

  var url = this.options_['mainDisplayUrl'] || 'maindisplay.html';
  chrome.app.window.create(url, {
    'id': wtf.app.background.BackgroundPage.MAIN_WINDOW_ID_,
    'type': 'shell',
    'frame': 'chrome',
    'minWidth': 506,
    'minHeight': 400,
    'defaultWidth': 1100,
    'defaultHeight': 800
  }, goog.bind(function(appWindow) {
    this.currentWindow_ = appWindow;

    // TODO(benvanik): listen for closing?

    if (opt_callback) {
      opt_callback.call(opt_scope);
    }
  }, this));
};


/**
 * Handles channel messages from the popup window.
 * @param {!Object} data Data.
 * @private
 */
wtf.app.background.BackgroundPage.prototype.channelMessage_ = function(data) {
  // switch (data['command']) {
  // }
};
