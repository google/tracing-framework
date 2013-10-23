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
 * @param {PageStatus} pageStatus Page status.
 * @constructor
 */
var InjectedTab = function(extension, tab, pageStatus, pageOptions, port) {
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
   * Debugger source, if enabled.
   * @type {Debugger}
   * @private
   */
  this.debugger_ = null;

  if (pageStatus == PageStatus.WHITELISTED &&
      pageOptions['wtf.trace.provider.chromeDebug'] !== false) {
    var timelineEnabled =
        pageOptions['wtf.trace.provider.chromeDebug.timeline'] !== false;
    var memoryInfoEnabled =
        pageOptions['wtf.trace.provider.chromeDebug.memoryInfo'];
    var tracingEnabled =
        pageOptions['wtf.trace.provider.chromeDebug.tracing'];
    if (timelineEnabled || memoryInfoEnabled || tracingEnabled) {
      this.debugger_ = new Debugger(this.tabId_, this.pageOptions_);
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

  /**
   * Periodic timer to transmit debugger data.
   * @type {number}
   * @private
   */
  this.debuggerTransmitId_ = -1;

  if (this.debugger_) {
    this.debuggerTransmitId_ = window.setInterval((function() {
      var records = this.debugger_.getRecords();
      if (records.length) {
        this.port_.postMessage(JSON.stringify({
          'command': 'debugger_data',
          'records': records
        }));
        this.debugger_.clearRecords();
      }
    }).bind(this), 1000);
  }
};


/**
 * Cleans up all attached tab resources.
 */
InjectedTab.prototype.dispose = function() {
  if (this.debuggerTransmitId_ != -1) {
    window.clearInterval(this.debuggerTransmitId_);
  }

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
      if (data['reload']) {
        this.extension_.reloadTab(this.tabId_, tab.url);
      }
      break;

    // Pops up a UI with the given snapshot data.
    case 'show_snapshot':
      _gaq.push(['_trackEvent', 'extension', 'show_snapshot',
          null, data['content_length']]);
      this.extension_.showSnapshot(
          tab,
          data['page_url'],
          data['new_window'],
          data['content_types'],
          data['content_sources'],
          data['content_urls'],
          data['content_length']);
      break;

    // Grabs any pending data.
    case 'clear_debugger_data':
      this.debugger_.clearRecords();
      break;
    case 'get_debugger_data':
      if (this.debugger_) {
        var records = this.debugger_.getRecords();
        this.port_.postMessage(JSON.stringify({
          'command': 'debugger_data',
          'request_id': data['request_id'],
          'records': records
        }));
        this.debugger_.clearRecords();
      }
      break;

    // Starts/stops a chrome:tracing session.
    case 'start_chrome_tracing':
      this.startChromeTracing_();
      break;
    case 'stop_chrome_tracing':
      this.stopChromeTracing_(data['tracker_id'], data['include_threads']);
      break;
  }
};


/**
 * Starts tracing.
 * If any previous tracing is running the data is dropped.
 * @private
 */
InjectedTab.prototype.startChromeTracing_ = function() {
  var tracer = this.extension_.getTracer();
  if (!tracer) {
    return;
  }

  tracer.stop();
  tracer.start(this.tabId_);
};


/**
 * Stops tracing and gets the data.
 * @param {?string} trackerId ID of the user thread to track.
 * @param {Array.<string>} includeThreads List of thread names to include.
 * @private
 */
InjectedTab.prototype.stopChromeTracing_ = function(trackerId, includeThreads) {
  var tracer = this.extension_.getTracer();
  if (!tracer) {
    return;
  }

  tracer.stop(function(data) {
    // In order to minimize the amount of data sent to the page, we do a quick
    // filter here. We also build a thread info table so that the processing
    // in the page can run a bit faster. It also hides a lot of the details of
    // the chrome:tracing format from the provider code, keeping it simpler.

    // First we need to walk the data to find the threads by __metadata.
    // Unfortunately these come out of order.
    // We also search for sync events and assume they all come from us.
    // The thread that has them is our thread for inspection.
    var nextZoneId = 0;
    var threads = {};
    var timeDelta = 0;
    for (var i = 0; i < data.length; i++) {
      var innerList = data[i];
      for (var j = 0; j < innerList.length; j++) {
        var e = innerList[j];
        if (!e) {
          continue;
        }

        var threadKey = e.pid + ':' + e.tid;
        var thread = threads[threadKey];
        if (!thread) {
          thread = threads[threadKey] = {
            pid: e.pid,
            tid: e.tid,
            name: null,
            included: false,
            zoneId: nextZoneId++
          };
        }

        if (e.cat == '__metadata') {
          if (e.name == 'thread_name') {
            thread.name = e.args.name;
            if (includeThreads && includeThreads.indexOf(thread.name) != -1) {
              thread.included = true;
            }
          }
          innerList[j] = null;
        }

        // Sniff out our sync interval events.
        if (e.ph == 'S' &&
            e.name[0] == '$' &&
            e.name.lastIndexOf('$WTFTRACE') == 0) {
          var time = parseFloat(e.name.substr(e.name.lastIndexOf(':') + 1));
          timeDelta = e.ts - time;
          innerList[j] = null;

          // TODO(benvanik): match on trackerId

          // Assume this thread is us.
          thread.included = true;
        }
      }
    }

    // Build zone list.
    var zoneList = [];
    for (var threadKey in threads) {
      var thread = threads[threadKey];
      if (thread.included) {
        zoneList.push({
          'id': thread.zoneId,
          'name': thread.name
        });
      }
    }

    // Filter and modify the data.
    var filteredData = [];
    for (var i = 0; i < data.length; i++) {
      var innerList = data[i];
      for (var j = 0; j < innerList.length; j++) {
        var e = innerList[j];
        if (!e) {
          continue;
        }
        var threadKey = e.pid + ':' + e.tid;
        var thread = threads[threadKey];
        if (!thread.included || !e.ts) {
          continue;
        }

        // Only send along B/E/I events.
        var ts = e.ts - timeDelta;
        switch (e.ph) {
          case 'B':
          {
            var ed = [0, thread.zoneId, ts, e.name];
            if (e.args['name'] == e.name) {
              // Ignore args.
            } else {
              // Append args as key, value. This prevents the need for another
              // list/object.
              for (var key in e.args) {
                ed.push(key);
                ed.push(e.args[key]);
              }
            }
            filteredData.push(ed);
            break;
          }
          case 'E':
            filteredData.push([
              1, thread.zoneId, ts
            ]);
            break;
          case 'I':
            filteredData.push([
              2, thread.zoneId, ts, e.name
            ]);
            break;
          default:
            // Ignore unsupported types.
            continue;
        }
      }
    }

    this.port_.postMessage(JSON.stringify({
      'command': 'chrome_tracing_data',
      'zone_list': zoneList,
      'event_list': filteredData
    }));
  }, this);
};
