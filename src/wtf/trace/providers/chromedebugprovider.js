/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extension extended data proxy.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.ChromeDebugProvider');

goog.require('goog.async.Deferred');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('wtf');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.ZoneType');
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
wtf.trace.providers.ChromeDebugProvider = function(traceManager, options) {
  goog.base(this, options);

  /**
   * HUD buttons.
   * @type {!Array.<!Object>}
   * @private
   */
  this.hudButtons_ = [];

  /**
   * Whether the extension is available.
   * @type {boolean}
   * @private
   */
  this.available_ = false;

  if (!options.getNumber('wtf.trace.provider.chromeDebug', 0) ||
      !options.getBoolean('wtf.trace.provider.chromeDebug.present', false)) {
    return;
  }

  /**
   * Dispatch table for each event type that comes from the extension.
   * @type {!Object.<function(!Array)>}
   * @private
   */
  this.timelineDispatch_ = {};
  this.setupTimelineDispatch_();

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
   * Whether the extension is currently capturing chrome:tracing data.
   * @type {boolean}
   * @private
   */
  this.isCapturingTracing_ = false;

  /**
   * Whether this provider is waiting for chrome:tracing data from the
   * extension.
   * @type {boolean}
   * @private
   */
  this.awaitingTracingData_ = false;

  /**
   * Unique ID injected into the chrome:tracing command stream that is used to
   * identify this thread.
   * @type {string}
   * @private
   */
  this.tracingTrackerId_ = String(goog.now());

  /**
   * setInterval ID for the chrome:tracing tracker.
   * @type {number}
   * @private
   */
  this.tracingTrackerIntervalId_ = -1;

  /**
   * A <div> that is displayed on the page to show the status of the
   * chrome:tracing request.
   * @type {!Element}
   */
  this.tracingProgressEl_ = this.createTracingProgressElement_();

  /**
   * DOM channel, if supported.
   * This can be used to listen to notifications from the extension or send
   * messages to the content script.
   * @type {wtf.ipc.DomChannel}
   * @private
   */
  this.extensionChannel_ = null;
  if (goog.global.document) {
    this.extensionChannel_ = wtf.ipc.openDomChannel(
        goog.global.document,
        'WtfContentScriptEvent');
  }
  this.registerDisposable(this.extensionChannel_);

  // Listen for messages from the extension.
  if (this.extensionChannel_) {
    this.extensionChannel_.addListener(
        wtf.ipc.Channel.EventType.MESSAGE, this.extensionMessage_, this);
  }

  this.available_ = !!this.extensionChannel_;

  if (this.available_ &&
      options.getBoolean('wtf.trace.provider.chromeDebug.tracing', false)) {
    this.hudButtons_.push({
      'title': 'Toggle chrome:tracing Capture',
      'icon': '/assets/icons/chrometracing.svg',
      'shortcut': 'f3',
      'callback': function() {
        this.toggleCapture_();

        // TODO(benvanik): set button toggle state
      },
      'scope': this
    });
  }
};
goog.inherits(wtf.trace.providers.ChromeDebugProvider, wtf.trace.Provider);


/**
 * Gets a value indicating whether the extension is available for use.
 * @return {boolean} True if the extension is available.
 */
wtf.trace.providers.ChromeDebugProvider.prototype.isAvailable = function() {
  return this.available_;
};


/**
 * @override
 */
wtf.trace.providers.ChromeDebugProvider.prototype.getHudButtons = function() {
  return this.hudButtons_;
};


/**
 * @override
 */
wtf.trace.providers.ChromeDebugProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'Chrome Debugging',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.chromeDebug',
          'title': 'Enabled',
          'default': true
        },
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.chromeDebug.timeline',
          'title': 'GCs/paints/layouts/etc',
          'default': true
        },
        // {
        //   'type': 'checkbox',
        //   'key': 'wtf.trace.provider.chromeDebug.memoryInfo',
        //   'title': 'Memory information (todo)',
        //   'default': false
        // },
        // This value is set to true by the extension when tracing is available.
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.chromeDebug.tracing',
          'title': 'chrome:tracing',
          'default': false
        },
        {
          'type': 'label',
          'title': '',
          'value': 'Launch Chrome with --remote-debugging-port=9222 to use chrome:tracing.'
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
wtf.trace.providers.ChromeDebugProvider.prototype.sendMessage_ =
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
wtf.trace.providers.ChromeDebugProvider.prototype.extensionMessage_ =
    function(rawData) {
  var tracingScope = wtf.trace.enterTracingScope();

  var data = goog.global.JSON.parse(rawData);
  switch (data['command']) {
    case 'debugger_data':
      this.processDebuggerRecords_(data['records']);
      var deferred = this.pendingRequests_[data['request_id']];
      if (deferred) {
        delete this.pendingRequests_[data['request_id']];
        deferred.callback(null);
      }
      break;

    case 'chrome_tracing_data':
      this.processChromeTracingData_(data['zone_list'], data['event_list']);
      this.awaitingTracingData_ = false;

      // Clear the tracing active region.
      wtf.trace.mark('');

      this.updateTracingProgress_(null);
      break;
  }

  wtf.trace.leaveScope(tracingScope);
};


/**
 * Processes a list of debugger timeline records.
 * @param {!Array.<!Array>} records Records.
 * @private
 */
wtf.trace.providers.ChromeDebugProvider.prototype.processDebuggerRecords_ =
    function(records) {
  for (var n = 0; n < records.length; n++) {
    var record = records[n];
    var dispatch = this.timelineDispatch_[record[0]];
    if (dispatch) {
      dispatch(record);
    }
  }
};


/**
 * Sets up the record dispatch table.
 * @private
 */
wtf.trace.providers.ChromeDebugProvider.prototype.setupTimelineDispatch_ =
    function() {
  // This table should match the one in injector/wtf-injector-chrome/debugger.js
  var timebase = wtf.timebase();

  // GCEvent: garbage collections.
  var gcEvent = wtf.trace.events.createScope(
      'javascript#gc(uint32 usedHeapSize, uint32 usedHeapSizeDelta)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['GCEvent'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = gcEvent(record[3], record[4], startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // EvaluateScript: script runtime/parsing/etc.
  var evalScriptEvent = wtf.trace.events.createScope(
      'javascript#evalscript(uint32 usedHeapSize, uint32 usedHeapSizeDelta)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['EvaluateScript'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = evalScriptEvent(record[3], record[4], startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // ParseHTML: parsing of HTML in a page.
  var parseHtmlEvent = wtf.trace.events.createScope(
      'browser#parseHtml(uint32 contentLength)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['ParseHTML'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = parseHtmlEvent(record[3], startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // ScheduleStyleRecalculation: a style has been invalidated - expect a
  // RecalculateStyles.
  var invalidateStylesEvent = wtf.trace.events.createInstance(
      'browser#invalidateStyles()');
  this.timelineDispatch_['ScheduleStyleRecalculation'] = function(record) {
    var startTime = record[1] - timebase;
    invalidateStylesEvent(startTime);
  };

  // RecalculateStyles: style recalculation is occurring.
  var recalculateStylesEvent = wtf.trace.events.createScope(
      'browser#recalculateStyles()',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['ParseHTML'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = recalculateStylesEvent(startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // InvalidateLayout: DOM layout was invalidated - expect a Layout.
  var invalidateLayoutEvent = wtf.trace.events.createInstance(
      'browser#invalidateLayout()');
  this.timelineDispatch_['InvalidateLayout'] = function(record) {
    var startTime = record[1] - timebase;
    invalidateLayoutEvent(startTime);
  };

  // Layout: DOM layout.
  var layoutEvent = wtf.trace.events.createScope(
      'browser#layout(int32 x, int32 y, int32 width, int32 height)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['Layout'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = layoutEvent(
        record[3], record[4], record[5], record[6], startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // Paint: DOM element painting.
  var paintEvent = wtf.trace.events.createScope(
      'browser#paint(int32 x, int32 y, int32 width, int32 height)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['Paint'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = paintEvent(
        record[3], record[4], record[5], record[6], startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // CompositeLayers: the compositor ran and composited the page.
  var compositeLayersEvent = wtf.trace.events.createScope(
      'browser#compositeLayers()',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['CompositeLayers'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = compositeLayersEvent(startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // DecodeImage: a compressed image was decoded.
  var decodeImageEvent = wtf.trace.events.createScope(
      'browser#decodeImage(ascii imageType)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['DecodeImage'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = decodeImageEvent(record[3], startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // ResizeImage: a resized version of a decoded image was required.
  var resizeImageEvent = wtf.trace.events.createScope(
      'browser#resizeImage(bool cached)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['ResizeImage'] = function(record) {
    var startTime = record[1] - timebase;
    var endTime = record[2] - timebase;
    var scope = resizeImageEvent(record[3], startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };
};


/**
 * Forces a gather of all pending debugger data.
 * This is not required as the debugger will send down data periodically, but
 * can be used to ensure all data is received upon a snapshot.
 */
wtf.trace.providers.ChromeDebugProvider.prototype.gatherData = function() {
  var deferred = new goog.async.Deferred();
  var requestId = this.nextRequestId_++;
  var request = {
    deferred: deferred
  };
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
wtf.trace.providers.ChromeDebugProvider.prototype.resetData = function() {
  this.sendMessage_({
    'command': 'clear_debugger_data'
  });
};


/**
 * Creates the chrome:tracing progress <div>.
 * @return {!Element} <div>.
 * @private
 */
wtf.trace.providers.ChromeDebugProvider.prototype.
    createTracingProgressElement_ = function() {
  var dom = goog.dom.getDomHelper();
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.style.setStyle(el, {
    'position': 'fixed',
    'top': '5px',
    'right': '5px',
    'background-color': 'white',
    'border': '1px solid black',
    'color': 'black',
    'z-index': 9999999
  });
  return el;
};


/**
 * Shows/hides the chrome:tracing progress <div> and updates the message.
 * @param {string?} message New message or null to hide.
 */
wtf.trace.providers.ChromeDebugProvider.prototype.updateTracingProgress_ =
    function(message) {
  var doc = goog.dom.getDocument();
  if (message) {
    goog.dom.setTextContent(this.tracingProgressEl_, message);
    if (!this.tracingProgressEl_.parentNode) {
      doc.body.appendChild(this.tracingProgressEl_);
    }
  } else {
    if (this.tracingProgressEl_.parentNode) {
      doc.body.removeChild(this.tracingProgressEl_);
    }
  }
};


/**
 * Toggles capture of chrome:tracing data.
 * @private
 */
wtf.trace.providers.ChromeDebugProvider.prototype.toggleCapture_ = function() {
  // Ignore if we are waiting for tracing data.
  if (this.awaitingTracingData_) {
    goog.global.console.log(
        'Ignoring chrome:tracing request while data is pending...');
    return;
  }

  var setInterval =
      goog.global.setInterval['raw'] || goog.global.setInterval;
  var clearInterval =
      goog.global.clearInterval['raw'] || goog.global.clearInterval;
  var consoleTime =
      goog.global.console.time['raw'] || goog.global.console.time;
  var consoleTimeEnd =
      goog.global.console.timeEnd['raw'] || goog.global.console.timeEnd;

  // TODO(benvanik): fix chrome so that this isn't required.
  // This function should be called periodically to insert special events into
  // the chrome:tracing stream that let us identify our thread and the time
  // delta on timestamps used.
  // We do the tracing scope so that the user won't get confused when they
  // see the setInterval dispatch in the native zone.
  function emitTraceTracker() {
    var tracingScope = wtf.trace.enterTracingScope();

    var syncName = '$WTFTRACE:' + Math.floor(wtf.now() * 1000);
    // TODO(benvanik): use timestamp instead
    consoleTime.call(goog.global.console, syncName);
    consoleTimeEnd.call(goog.global.console, syncName);

    wtf.trace.leaveScope(tracingScope);
  };

  if (!this.isCapturingTracing_) {
    // Start tracing.
    this.isCapturingTracing_ = true;
    this.sendMessage_({
      'command': 'start_chrome_tracing'
    });

    // Kick off the tracker events.
    this.tracingTrackerIntervalId_ = setInterval.call(
        goog.global, emitTraceTracker, 100);

    this.updateTracingProgress_('tracing...');

    // Mark the region tracing is active.
    // This is cleared when the data comes back.
    wtf.trace.mark('tracing');
  } else {
    // Stop the tracker interval.
    clearInterval.call(goog.global, this.tracingTrackerIntervalId_);
    this.tracingTrackerIntervalId_ = -1;

    this.updateTracingProgress_('waiting for chrome:tracing data...');

    this.isCapturingTracing_ = false;
    this.awaitingTracingData_ = true;
    this.sendMessage_({
      'command': 'stop_chrome_tracing',
      'tracker_id': this.tracingTrackerId_,
      'include_threads': [
        'CrBrowserMain',
        'CrGpuMain'
      ]
    });
  }
};


/**
 * Processes chrome:tracing data.
 * @param {!Array.<!Object>} zoneList Zone list.
 * @param {!Array.<!Array>} eventList Trace event list.
 * @private
 */
wtf.trace.providers.ChromeDebugProvider.prototype.processChromeTracingData_ =
    function(zoneList, eventList) {
  // Create all zones.
  var traceZones = {};
  for (var n = 0; n < zoneList.length; n++) {
    var zoneInfo = zoneList[n];
    var name = zoneInfo['name'];
    var type = '';
    var location = '';
    switch (name) {
      case 'CrBrowserMain':
        type = wtf.data.ZoneType.NATIVE_BROWSER;
        break;
      case 'CrGpuMain':
        type = wtf.data.ZoneType.NATIVE_GPU;
        break;
      default:
        type = wtf.data.ZoneType.NATIVE_SCRIPT;
        break;
    }
    traceZones[zoneInfo['id']] = {
      zone: wtf.trace.createZone(name, type, location),
      openScopes: []
    };
  }

  // Record events.
  for (var n = 0; n < eventList.length; n++) {
    var e = eventList[n];
    var traceZone = traceZones[e[1]];
    wtf.trace.pushZone(traceZone.zone);
    switch (e[0]) {
      case 0: // enter scope
        {
          var scope = wtf.trace.enterScope(e[3], e[2]);
          traceZone.openScopes.push(scope);
          for (var m = 4; m < e.length; m += 2) {
            wtf.trace.appendScopeData(e[m], e[m + 1], e[2]);
          }
          break;
        }
      case 1: // leave scope
        {
          var scope = traceZone.openScopes.pop();
          wtf.trace.leaveScope(scope, undefined, e[2]);
          break;
        }
      case 2: // timestamp
        {
          wtf.trace.timeStamp(e[3], e[2]);
          break;
        }
    }
    wtf.trace.popZone();
  }

  // Close any open scopes.
  for (var zoneId in traceZones) {
    var traceZone = traceZones[zoneId];
    while (traceZone.openScopes.length) {
      wtf.trace.leaveScope(traceZone.openScopes.pop());
    }
  }
};
