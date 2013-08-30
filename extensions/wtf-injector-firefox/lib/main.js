/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Firefox extension main script.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var pageMod = require('sdk/page-mod');
var prefs = require('sdk/preferences/service');
var self = require('sdk/self');
var tabs = require('sdk/tabs');
var timers = require('sdk/timers');
var widgets = require('sdk/widget');
var MatchPattern;
try {
  MatchPattern = require('sdk/util/match-pattern').MatchPattern;
} catch (e) {
  MatchPattern = require('sdk/page-mod/match-pattern').MatchPattern;
}

const {Cc, Ci, Cu} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');


var prefRoot = 'extensions.' + self.id + '.';


function setTemporaryPreference(key, value) {
  var json = prefs.get(prefRoot + 'modifiedPrefs', '{}');
  var modifiedPrefs = JSON.parse(json);
  if (!modifiedPrefs.hasOwnProperty(key)) {
    modifiedPrefs[key] = prefs.get(key);
  }
  prefs.set(prefRoot + 'modifiedPrefs', JSON.stringify(modifiedPrefs));

  prefs.set(key, value);
};
function resetTemporaryPreference(key) {
  var json = prefs.get(prefRoot + 'modifiedPrefs', '{}');
  var modifiedPrefs = JSON.parse(json);
  if (modifiedPrefs.hasOwnProperty(key)) {
    var originalValue = modifiedPrefs[key];
    prefs.set(key, originalValue);
    delete modifiedPrefs[key];
    prefs.set(prefRoot + 'modifiedPrefs', JSON.stringify(modifiedPrefs));
  }
};
function resetTemporaryPreferences() {
  var json = prefs.get(prefRoot + 'modifiedPrefs', '{}');
  var modifiedPrefs = JSON.parse(json);
  for (var key in modifiedPrefs) {
    prefs.set(key, modifiedPrefs[key]);
    prefs.set(prefRoot + 'modifiedPrefs', '{}');
  }
};


function getAllEnabledPageUrls() {
  var json = prefs.get(prefRoot + 'pages', '{}');
  if (!json) {
    return [];
  }
  var pageStore;
  try {
    pageStore = JSON.parse(json);
  } catch (e) {
    return [];
  }
  var urls = [];
  for (var key in pageStore) {
    urls.push(key);
  }
  return urls;
};


function getPagePreferences(url) {
  var json = prefs.get(prefRoot + 'pages', '{}');
  if (!json) {
    return null;
  }
  var pageStore;
  try {
    pageStore = JSON.parse(json);
  } catch (e) {
    return null;
  }
  return pageStore[url];
};


function setPagePreference(url, key, value) {
  var json = prefs.get(prefRoot + 'pages') || '{}';
  var pageStore;
  try {
    pageStore = JSON.parse(json);
  } catch (e) {
    pageStore = {};
  }
  var entry = pageStore[url];
  if (!entry) {
    entry = {};
  }
  if (entry[key] == value) {
    return false;
  }
  entry[key] = value;
  pageStore[url] = entry;
  json = JSON.stringify(pageStore);
  prefs.set(prefRoot + 'pages', json);
  return true;
};


/**
 * A list of all workers currently injected and active.
 * @type {!Array.<InjectedTab>}
 */
var injectedTabs = [];


/**
 * Reference count for the memory observer.
 * @type {number}
 */
var memoryObservationCount = 0;


/**
 * Handler for memory observation events.
 * @param {*} subject Anything.
 * @param {string} topic Event name.
 * @param {[type]} json JSON string of GC data.
 */
function handleMemoryEvent(subject, topic, json) {
  if (topic != 'garbage-collection-statistics') {
    return;
  }

  // Broadcast the event to all active workers.
  // We avoid parsing it here and let the pages handle it.
  for each (injectedTab in injectedTabs) {
    injectedTab.queueDebuggerRecord(['gc', json]);
  }
};


/**
 * Acquires a reference to the memory observer, starting it if this is the first
 * reference.
 */
function acquireMemoryObserver() {
  // Only enable on first use.
  ++memoryObservationCount;
  if (memoryObservationCount > 1) {
    return;
  }

  // Enable memory notification.
  setTemporaryPreference('javascript.options.mem.notify', true);

  // Listen for events.
  Services.obs.addObserver(
      handleMemoryEvent, 'garbage-collection-statistics', false);
};


/**
 * Releases a reference to the memory observer, stopping it if this was the
 * last reference.
 */
function releaseMemoryObserver() {
  // Only disable on last use.
  if (!memoryObservationCount) {
    return;
  }
  --memoryObservationCount;
  if (memoryObservationCount) {
    return;
  }

  // Unlisten for events.
  Services.obs.removeObserver(
      handleMemoryEvent, 'garbage-collection-statistics', false);

  // Reset memory notification to its original state.
  resetTemporaryPreference('javascript.options.mem.notify');
};


/**
 * All active page mods mapped by canonical URL.
 * @type {!Object.<PageMod>}
 */
var activePageMods = {};


/**
 * Canonicalizes a URL so that it can be matched against.
 * @param {string} url URL.
 * @return {string} Canonical URL.
 */
function getCanonicalUrl(url) {
  // Trim the #fragment. We are unique to query string, though.
  var hashIndex = url.indexOf('#');
  if (hashIndex != -1) {
    url = url.substring(0, hashIndex);
  }
  return url;
};


/**
 * Reloads all tabs that match the given URL (or #fragment variants).
 * @param {string} url URL of tabs to reload.
 */
function reloadTabsMatchingUrl(url) {
  var patterns = [
    new MatchPattern(url),
    new MatchPattern(url + '#*')
  ];
  for each (var tab in tabs) {
    var matchesAny = false;
    for each (var pattern in patterns) {
      if (pattern.test(tab.url)) {
        matchesAny = true;
        break;
      }
    }
    if (matchesAny) {
      tab.reload();
    }
  }
};


/**
 *
 * @param {string} url URL to test.
 * @return {boolean} True if injection is enabled for the given URL.
 */
function isInjectionEnabledForUrl(url) {
  var url = getCanonicalUrl(url);
  return !!activePageMods[url];
};


var wtfScriptContents = self.data.load('wtf_trace_web_js_compiled.js');


/**
 * Injected tab wrapper.
 * @param {string} url Canonical page URL.
 * @param {!Worker} worker Content script worker.
 * @constructor
 */
var InjectedTab = function(url, worker) {
  /**
   * Page URL.
   * @type {string}
   */
  this.url = url;

  /**
   * Firefox tab handle.
   * @type {!Tab}
   */
  this.tab = worker.tab;

  /**
   * Page worker running the content script.
   * @type {!Worker}
   */
  this.worker = worker;

  /**
   * Pending debugger records.
   * These are batched up so that we don't throw too many messages at the page.
   * @type {!Array.<!Object>}
   * @private
   */
  this.debuggerRecords_ = [];

  /**
   * Periodic timer to transmit debugger data.
   * @type {number}
   * @private
   */
  this.debuggerTransmitId_ = timers.setInterval((function() {
    var records = this.debuggerRecords_;
    if (records.length) {
      this.debuggerRecords_ = [];
      this.worker.port.emit('extension-event', JSON.stringify({
        'command': 'debugger_data',
        'records': records
      }));
    }
  }).bind(this), 1000);

  // Start watching GC events.
  acquireMemoryObserver();
};
InjectedTab.prototype.dispose = function() {
  // Clear off timer.
  if (this.debuggerTransmitId_ != -1) {
    timers.clearInterval(this.debuggerTransmitId_);
  }

  // End watching GC events.
  releaseMemoryObserver();
};
InjectedTab.prototype.queueDebuggerRecord = function(record) {
  this.debuggerRecords_.push(record);
};
InjectedTab.prototype.dispatchEvent = function(data) {
  switch (data['command']) {
    // Reloads the tab (bypassing cache).
    case 'reload':
      // TODO(benvanik): ensure this bypasses the cache.
      this.tab.reload();
      break;

    // Updates the tab settings.
    case 'save_settings':
      if (setPagePreference(this.url, 'options', data['content'])) {
        if (data['reload']) {
          disableInjectionForUrl(this.url, true);
          enableInjectionForUrl(this.url);
        }
      }
      break;

    // Pops up a UI with the given snapshot data.
    case 'show_snapshot':
      // data['page_url'],
      // data['new_window'],
      // data['content_types'],
      // data['content_sources'],
      // data['content_urls'],
      // data['content_length']
      break;

    // Grabs any pending data.
    case 'clear_debugger_data':
      this.debuggerRecords_ = [];
      break;
    case 'get_debugger_data':
      if (this.debuggerRecords_.length) {
        var records = this.debuggerRecords_;
        this.debuggerRecords_ = [];
        this.worker.emit('extension-event', {
          'command': 'debugger_data',
          'request_id': data['request_id'],
          'records': records
        });
      }
      break;
  }
};


/**
 * Enables injection for a URL and reloads tabs with that URL.
 * @param {string} url URL to activate on.
 */
function enableInjectionForUrl(url) {
  var url = getCanonicalUrl(url);
  if (activePageMods[url]) {
    return;
  }

  // Enable injection.
  setPagePreference(url, 'enabled', true);

  // Grab current options. Note that if they change we need to re-enable
  // injection to update the pagemod.
  var pagePrefs = getPagePreferences(url);
  var storedOptions = {};
  try {
    storedOptions = JSON.parse(pagePrefs.options);
  } catch (e) {
  }
  // Override defaults with specified values.
  // Except for a few that we don't want to track across session.
  var pageOptions = {
    // The presence of this indicates that the options come from the injector.
    'wtf.injector': true,

    // Larger buffers mean less waste when doing recordings with a large amount
    // of data (like WebGL captures).
    'wtf.trace.session.bufferSize': 6 * 1024 * 1024,

    // This is pretty excessive, but keeps us from truncating WebGL traces.
    // After this limit the file likely won't load due to v8 memory limits
    // anyway.
    'wtf.trace.session.maximumMemoryUsage': 512 * 1024 * 1024,

    // TODO(benvanik): endpoints
    // 'wtf.hud.app.mode': '',
    // 'wtf.hud.app.endpoint': '',

    'wtf.trace.provider.firefoxDebug.present': true
  };
  for (var key in storedOptions) {
    switch (key) {
      case 'wtf.injector':
      case 'wtf.hud.app.mode':
      case 'wtf.hud.app.endpoint':
      case 'wtf.addons':
      case 'wtf.trace.provider.firefoxDebug.present':
        continue;
    }
    pageOptions[key] = storedOptions[key];
  }

  // Create a page mod for the given URLs.
  var mod = pageMod.PageMod({
    include: [
      url,
      url + '#*'
    ],
    contentScriptFile: self.data.url('content-script.js'),
    contentScriptWhen: 'start',
    contentScriptOptions: {
      // Accessible as self.options in the content script.
      wtfScriptContents: wtfScriptContents,
      wtfOptions: pageOptions
    },
    attachTo: 'top',
    onAttach: function(worker) {
      var injectedTab = new InjectedTab(url, worker);
      injectedTabs.push(injectedTab);
      console.log('added worker for ' + url);

      worker.port.on('page-event', function(data) {
        injectedTab.dispatchEvent(JSON.parse(data));
      });

      worker.on('detach', function() {
        console.log('detached worker for ' + url);
        injectedTab.dispose();
        for (var n = 0; n < injectedTabs.length; n++) {
          if (injectedTabs[n].worker == worker) {
            injectedTabs.splice(n, 1);
            break;
          }
        }

      });
    }
  });
  activePageMods[url] = mod;

  // Find tabs with the URL and reload.
  reloadTabsMatchingUrl(url);
};


/**
 * Disables injection for a URL and reloads tabs with that URL.
 * @param {string} url URL to activate on.
 * @param {boolean=} opt_skipReload Whether to skip reloading of pages.
 */
function disableInjectionForUrl(url, opt_skipReload) {
  var url = getCanonicalUrl(url);

  // Disable injection.
  setPagePreference(url, 'enabled', false);

  // Find existing page mod and disable.
  // This will detach workers in those tabs.
  var mod = activePageMods[url];
  if (!mod) {
    return;
  }
  mod.destroy();
  delete activePageMods[url];

  if (!opt_skipReload) {
    // Find tabs with the URL and reload.
    reloadTabsMatchingUrl(url);
  }
};


var widget = widgets.Widget({
  id: 'wtf-toggle',
  label: 'Toggle Web Tracing Framework',
  contentURL: self.data.url('assets/icons/wtf-32.png'),
  onClick: function() {
    var url = tabs.activeTab.url;
    if (!isInjectionEnabledForUrl(url)) {
      enableInjectionForUrl(url);
    } else {
      disableInjectionForUrl(url);
    }
  }
});


exports.main = function(options, callbacks) {
  // Enable all pagemods for injected pages now.
  // This will reload any that are currently open.
  for each (var url in getAllEnabledPageUrls()) {
    enableInjectionForUrl(url);
  }
};

exports.onUnload = function (reason) {
  resetTemporaryPreferences();
};
