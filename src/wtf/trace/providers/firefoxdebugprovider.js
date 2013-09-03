/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extension extended data proxy.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.FirefoxDebugProvider');

goog.require('goog.async.Deferred');
goog.require('wtf');
goog.require('wtf.data.EventFlag');
goog.require('wtf.ipc');
goog.require('wtf.ipc.Channel');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Inserts data from the extension extended information proxy.
 *
 * @param {!wtf.trace.TraceManager} traceManager Trace manager.
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.FirefoxDebugProvider = function(traceManager, options) {
  goog.base(this, options);

  /**
   * Whether the extension is available.
   * @type {boolean}
   * @private
   */
  this.available_ = false;

  if (!options.getNumber('wtf.trace.provider.firefoxDebug', 1) ||
      !options.getBoolean('wtf.trace.provider.firefoxDebug.present', false)) {
    return;
  }

  /**
   * Dispatch table for each event type that comes from the extension.
   * @type {!Object.<function(!Array)>}
   * @private
   */
  this.eventDispatch_ = {};
  this.setupEventDispatch_();

  /**
   * The next ID used when making an async data request to the extension.
   * @type {number}
   * @private
   */
  this.nextRequestId_ = 0;

  /**
   * Pending data requests.
   * @type {!Object.<!goog.async.Deferred>}
   * @private
   */
  this.pendingRequests_ = {};

  /**
   * DOM channel, if supported.
   * This can be used to listen to notifications from the extension or send
   * messages to the content script.
   * @type {wtf.ipc.Channel}
   * @private
   */
  this.extensionChannel_ = wtf.ipc.getWindowMessageChannel(window);

  // TODO(benvanik): check to see if the content script is active - if not, die.

  if (this.extensionChannel_) {
    this.extensionChannel_.addListener(
        wtf.ipc.Channel.EventType.MESSAGE, this.extensionMessage_, this);
  }

  this.available_ = !!this.extensionChannel_;
};
goog.inherits(wtf.trace.providers.FirefoxDebugProvider, wtf.trace.Provider);


/**
 * Gets a value indicating whether the extension is available for use.
 * @return {boolean} True if the extension is available.
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.isAvailable = function() {
  return this.available_;
};


/**
 * @override
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'Firefox Debugging',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.firefoxDebug',
          'title': 'Enabled',
          'default': true
        }
      ]
    }
  ];
};


/**
 * Sends a message to the extension.
 * @param {!Object} data Message data.
 * @private
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.sendMessage_ =
    function(data) {
  if (!this.extensionChannel_) {
    return;
  }
  this.extensionChannel_.postMessage(data);
};


/**
 * Handles messages from the extension.
 * @param {string} rawData Message data.
 * @private
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.extensionMessage_ =
    function(rawData) {
  var tracingScope = wtf.trace.enterTracingScope();

  var data = goog.global.JSON.parse(rawData);
  if (!data['command']) {
    return;
  }

  switch (data['command']) {
    case 'debugger_data':
      this.processDebuggerRecords_(data['records']);
      var deferred = this.pendingRequests_[data['request_id']];
      if (deferred) {
        delete this.pendingRequests_[data['request_id']];
        deferred.callback(null);
      }
      break;
  }

  wtf.trace.leaveScope(tracingScope);
};


/**
 * Processes a list of debugger timeline records.
 * @param {!Array.<!Array>} records Records.
 * @private
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.processDebuggerRecords_ =
    function(records) {
  for (var n = 0; n < records.length; n++) {
    var record = records[n];
    var dispatch = this.eventDispatch_[record[0]];
    if (dispatch) {
      dispatch(record);
    }
  }
};


/**
 * Sets up the record dispatch table.
 * @private
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.setupEventDispatch_ =
    function() {
  var timebase = wtf.timebase();

  // GCEvent: garbage collections.
  var gcNumber = 0;
  var gcEvent = wtf.trace.events.createScope(
      'javascript#gc(uint32 run, ascii reason)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.eventDispatch_['gc'] = function(record) {
    // Format of this data:
    // https://developer.mozilla.org/en-US/docs/SpiderMonkey/Internals/GC/Statistics_API
    var data = goog.global.JSON.parse(record[1]);
    var run = gcNumber++;

    // var startTime = (data['timestamp'] / 1000) - timebase;
    // var totalTime = data['total_time'];
    // var endTime = startTime + totalTime;

    // log('GC', startTime, totalTime);
    var slices = data['slices'];
    for (var n = 0; n < slices.length; n++) {
      var slice = slices[n];
      var sliceStartTime = (slice['start_timestamp'] / 1000) - timebase;
      var sliceEndTime = (slice['end_timestamp'] / 1000) - timebase;
      var scope = gcEvent(run, slice['reason'], sliceStartTime);
      wtf.trace.leaveScope(scope, undefined, sliceEndTime);
    }
  };
};


/**
 * Forces a gather of all pending debugger data.
 * This is not required as the debugger will send down data periodically, but
 * can be used to ensure all data is received upon a snapshot.
 * @return {!goog.async.Deferred} A deferred that completes when all data is
 *     available.
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.gatherData = function() {
  var deferred = new goog.async.Deferred();
  var requestId = this.nextRequestId_++;
  this.pendingRequests_[requestId] = deferred;
  this.sendMessage_({
    'command': 'get_debugger_data',
    'request_id': requestId
  });
  return deferred;
};


/**
 * Resets any pending debugger data.
 */
wtf.trace.providers.FirefoxDebugProvider.prototype.resetData = function() {
  this.sendMessage_({
    'command': 'clear_debugger_data'
  });
};
