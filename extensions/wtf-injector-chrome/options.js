/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extension options wrapper.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


/**
 * @enum {string}
 */
var PageStatus = {
  UNKNOWN: 'unknown',
  WHITELISTED: 'whitelisted',
  BLACKLISTED: 'blacklisted',
  INSTRUMENTED: 'instrumented'
};



/**
 * Options wrapper.
 * Saves settings with the Chrome settings store.
 * Settings are saved as a big blob to enable syncrhonous access to values.
 *
 * @constructor
 */
var Options = function() {
  /**
   * Whether to show the page-action 'inject' icon.
   * @type {boolean}
   */
  this.showPageAction = true;

  /**
   * Whether to show the context menu items.
   * @type {boolean}
   */
  this.showContextMenu = false;

  /**
   * Whether to show the devtools panel.
   * @type {boolean}
   */
  this.showDevPanel = false;

  /**
   * A list of all added extensions, mapped by URL.
   * @type {!Object.<!Object>}
   * @private
   */
  this.addons_ = {};

  /**
   * A map of instrumented tab IDs to their instrumentation options.
   * If a tab has an entry in this map it is considered instrumented and
   * that superceeds other whitelisting options.
   * This is not saved (yet), as it's usually a one-off thing.
   * @type {!Object.<number, Object>}
   */
  this.instrumentedTabs_ = {};

  /**
   * A list of page match patterns that will have tracing on.
   * @type {!Array.<string>}
   * @private
   */
  this.pageWhitelist_ = [];

  /**
   * A list of page match patterns that will have tracing off.
   * @type {!Array.<string>}
   * @private
   */
  this.pageBlacklist_ = [];

  /**
   * A map of URLs to page options objects.
   * @type {!Object.<!Object>}
   * @private
   */
  this.pageOptions_ = {};

  /**
   * Default endpoint to use for pages.
   * @type {{mode: string, endpoint: string}}
   * @private
   */
  this.defaultEndpoint_ = {
    mode: 'page',
    endpoint: chrome.extension.getURL('app/maindisplay.html')
  };
};


/**
 * Sets the default endpoint.
 * @param {string} mode Mode.
 * @param {string} endpoint Endpoint.
 */
Options.prototype.setDefaultEndpoint = function(mode, endpoint) {
  this.defaultEndpoint_ = {
    mode: mode,
    endpoint: endpoint
  };
};


/**
 * Loads the options.
 * @param {Function=} opt_callback Callback when loaded.
 * @param {Object=} opt_scope Callback scope.
 */
Options.prototype.load = function(opt_callback, opt_scope) {
  chrome.storage.local.get([
    'options'
  ], (function(items) {
    var values = items['options'];
    if (values) {
      this.showPageAction = values['showPageAction'] || true;
      this.showContextMenu = values['showContextMenu'] || false;
      this.showDevPanel = values['showDevPanel'] || false;
      this.addons_ = values['extensions'] || {};
      this.pageWhitelist_ = values['pageWhitelist'] || [];
      this.pageBlacklist_ = values['pageBlacklist'] || [];
      this.pageOptions_ = values['pageOptions'] || {};
    }
    if (opt_callback) {
      opt_callback.call(opt_scope, this);
    }
  }).bind(this));
};


/**
 * Saves the options, overwriting all previous values.
 */
Options.prototype.save = function() {
  chrome.storage.local.set({
    'options': {
      'showPageAction': this.showPageAction,
      'showContextMenu': this.showContextMenu,
      'showDevPanel': this.showDevPanel,
      'extensions': this.addons_,
      'pageWhitelist': this.pageWhitelist_,
      'pageBlacklist': this.pageBlacklist_,
      'pageOptions': this.pageOptions_
    }
  });
};


/**
 * Adds an addon.
 * @param {string} url Addon URL.
 * @param {!Object} manifest Addon manifest.
 */
Options.prototype.addAddon = function(url, manifest) {
  this.addons_[url] = manifest;
  this.save();
};


/**
 * Removes an addon.
 * @param {string} url Addon URL.
 */
Options.prototype.removeAddon = function(url) {
  delete this.addons_[url];
  this.save();
};


/**
 * Gets a list of all addons.
 * @return {!Array.<{url: string, manifest: !Object}} A list of addons.
 */
Options.prototype.getAddons = function() {
  var result = [];
  for (var url in this.addons_) {
    result.push({
      url: url,
      manifest: this.addons_[url]
    });
  }
  return result;
};


/**
 * Gets a list of all pages that are whitelisted.
 * @return {!Array.<string>} Whitelist.
 */
Options.prototype.getWhitelistedPages = function() {
  return this.pageWhitelist_;
};


/**
 * Matches a URL against a pattern.
 * @param {string} pattern URL pattern.
 * @param {string} url URL to test.
 * @return {boolean} True if the pattern matches.
 */
Options.prototype.matchPagePattern_ = function(pattern, url) {
  // TODO(benvanik): real pattern matching
  return pattern == url;
};


/**
 * Checks to see if a page is enabled based on the blacklist/whitelist.
 * @param {string} url Canonicalized page URL.
 * @param {number=} opt_tabId Tab ID.
 * @return {PageStatus} Page blacklist/whitelist status.
 */
Options.prototype.getPageStatus = function(url, opt_tabId) {
  // Check instrumentation for the tab first, if given.
  if (opt_tabId !== undefined) {
    if (this.instrumentedTabs_[opt_tabId]) {
      return PageStatus.INSTRUMENTED;
    }
  }

  // Check blacklist - if present, force disabled.
  for (var n = 0; n < this.pageBlacklist_.length; n++) {
    if (this.matchPagePattern_(this.pageBlacklist_[n], url)) {
      return PageStatus.BLACKLISTED;
    }
  }

  // Check whitelist to see if enabled.
  for (var n = 0; n < this.pageWhitelist_.length; n++) {
    if (this.matchPagePattern_(this.pageWhitelist_[n], url)) {
      return PageStatus.WHITELISTED;
    }
  }

  return PageStatus.NONE;
};


/**
 * Adds a page to the whitelist.
 * @param {string} url Canonicalized page URL.
 */
Options.prototype.whitelistPage = function(url) {
  // If explicit URL is in the blacklist, remove.
  for (var n = 0; n < this.pageBlacklist_.length; n++) {
    if (this.pageBlacklist_[n] == url) {
      this.pageBlacklist_.splice(n, 1);
      break;
    }
  }

  // Add to the whitelist, but only if not present.
  for (var n = 0; n < this.pageWhitelist_.length; n++) {
    if (this.pageWhitelist_[n] == url) {
      // Already present.
      return;
    }
  }
  this.pageWhitelist_.push(url);

  this.save();
};


/**
 * Adds a page to the blacklist.
 * @param {string} url Canonicalized page URL.
 */
Options.prototype.blacklistPage = function(url) {
  // If explicit URL is in the whitelist, remove.
  for (var n = 0; n < this.pageWhitelist_.length; n++) {
    if (this.pageWhitelist_[n] == url) {
      this.pageWhitelist_.splice(n, 1);
      break;
    }
  }

  // Add to the whitelist, but only if not present.
  for (var n = 0; n < this.pageBlacklist_.length; n++) {
    if (this.pageBlacklist_[n] == url) {
      // Already present.
      return;
    }
  }
  this.pageBlacklist_.push(url);

  this.save();
};


/**
 * Instruments a tab.
 * @param {number} tabId Tab ID.
 * @param {!Object} options Instrumentation options.
 */
Options.prototype.instrumentTab = function(tabId, options) {
  this.instrumentedTabs_[tabId] = options;
};


/**
 * Gets the instrumentation options for the given tab.
 * @param {number} tabId Tab ID.
 * @return {Object} Options for the tab or null if not instrumented.
 */
Options.prototype.getInstrumentationOptions = function(tabId) {
  return this.instrumentedTabs_[tabId] || null;
};


/**
 * Uninstruments a tab.
 * @param {number} tabId Tab ID.
 */
Options.prototype.uninstrumentTab = function(tabId) {
  delete this.instrumentedTabs_[tabId];
};


/**
 * Gets the default page options for the given URL.
 * @param {string} url Canonicalized page URL.
 * @return {!Object} Default options object.
 */
Options.prototype.getDefaultPageOptions = function(url) {
  // TODO(benvanik): pull from global options?
  var addons = [
    // 'http://localhost:8080/addons/test/extension.json',
  ];

  var options = {
    // The presence of this indicates that the options come from the injector.
    'wtf.injector': true,

    // Larger buffers mean less waste when doing recordings with a large amount
    // of data (like WebGL captures).
    'wtf.trace.session.bufferSize': 6 * 1024 * 1024,

    // This is pretty excessive, but keeps us from truncating WebGL traces.
    // After this limit the file likely won't load due to v8 memory limits
    // anyway.
    'wtf.trace.session.maximumMemoryUsage': 512 * 1024 * 1024,

    'wtf.hud.app.mode': this.defaultEndpoint_.mode,
    'wtf.hud.app.endpoint': this.defaultEndpoint_.endpoint,

    'wtf.addons': addons,

    'wtf.trace.provider.chromeDebug.present': true,
    'wtf.trace.provider.chromeDebug.tracing': false
  };

  // TODO(benvanik): make a different page action setting?
  // Snapshotting:
  options['wtf.trace.mode'] = 'snapshotting';
  // TODO(benvanik): make something up based on page title/domain/etc?
  options['wtf.trace.target'] = 'file://';
  // Streaming:
  // options['wtf.trace.mode'] = 'streaming';
  // options['wtf.trace.target'] = 'http://' + appEndpoint;

  return options;
};


/**
 * Gets the page options for the given URL.
 * @param {string} url Canonicalized page URL.
 * @return {!Object} Options object, or defaults.
 */
Options.prototype.getPageOptions = function(url) {
  // Get default options. This will be used as a base.
  var options = this.getDefaultPageOptions(url);

  // Get stored page options, if any.
  var storedOptions = this.pageOptions_[url] || {};
  if (storedOptions) {
    // Override defaults with specified values.
    // Except for a few that we don't want to track across session.
    for (var key in storedOptions) {
      switch (key) {
        case 'wtf.injector':
        case 'wtf.hud.app.mode':
        case 'wtf.hud.app.endpoint':
        case 'wtf.addons':
        case 'wtf.trace.provider.chromeDebug.present':
        case 'wtf.trace.provider.chromeDebug.tracing':
          continue;
      }
      options[key] = storedOptions[key];
    }
  }

  return options;
};


/**
 * Sets the page options for the given URL.
 * @param {string} url Canonicalized page URL.
 * @param {!Object} options Options object.
 */
Options.prototype.setPageOptions = function(url, options) {
  // If the options from the page don't have the sentinel, ignore.
  // This prevents pages that override the options from manual embedding
  // from overwritting injector settings.
  if (!options['wtf.injector']) {
    return;
  }

  // Cleanup by removing all defaults that are still the same.
  var defaultOptions = this.getDefaultPageOptions(url);
  var cleanedOptions = {};
  var anyValues = false;
  // TODO(benvanik): better deepCompare
  for (var key in options) {
    var value = options[key];
    var other = defaultOptions[key];
    if (Array.isArray(value) && value.length == other.length) {
      var allSame = true;
      for (var n = 0; n < value.length; n++) {
        if (value[n] != other[n]) {
          allSame = false;
          break;
        }
      }
      if (allSame) {
        continue;
      }
    } else if (value == other) {
      continue;
    }
    cleanedOptions[key] = value;
    anyValues = true;
  }

  if (anyValues) {
    this.pageOptions_[url] = cleanedOptions;
  } else {
    delete this.pageOptions_[url];
  }

  this.save();
};


/**
 * Resets all options for the given URL.
 * @param {string} url Canonicalized page URL.
 */
Options.prototype.resetPageOptions = function(url) {
  // Delete options.
  delete this.pageOptions_[url];

  // Remove from whitelist and blacklist.
  for (var n = 0; n < this.pageWhitelist_.length; n++) {
    if (this.pageWhitelist_[n] == url) {
      this.pageWhitelist_.splice(n, 1);
      break;
    }
  }
  for (var n = 0; n < this.pageBlacklist_.length; n++) {
    if (this.pageBlacklist_[n] == url) {
      this.pageBlacklist_.splice(n, 1);
      break;
    }
  }

  this.save();
};
