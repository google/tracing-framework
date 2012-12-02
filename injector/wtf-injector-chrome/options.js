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
  BLACKLISTED: 'blacklisted'
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
 */
Options.prototype.load = function() {
  chrome.storage.local.get([
    'options'
  ], (function(items) {
    var values = items['options'];
    if (values) {
      this.showPageAction = values['showPageAction'] || true;
      this.showContextMenu = values['showContextMenu'] || false;
      this.showDevPanel = values['showDevPanel'] || false;
      this.pageWhitelist_ = values['pageWhitelist'] || [];
      this.pageBlacklist_ = values['pageBlacklist'] || [];
      this.pageOptions_ = values['pageOptions'] || {};
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
      'pageWhitelist': this.pageWhitelist_,
      'pageBlacklist': this.pageBlacklist_,
      'pageOptions': this.pageOptions_
    }
  });
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
 * @return {PageStatus} Page blacklist/whitelist status.
 */
Options.prototype.getPageStatus = function(url) {
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
 * Gets the default page options for the given URL.
 * @param {string} url Canonicalized page URL.
 * @return {!Object} Default options object.
 */
Options.prototype.getDefaultPageOptions = function(url) {
  // TODO(benvanik): pull from global options?
  var extensions = [
    // 'http://localhost:8080/extensions/test/extension.json',
    // 'http://localhost:8080/extensions/webglcapture/webglcapture.json'
  ];

  var options = {
    'wtf.trace.session.maximumMemoryUsage': 128 * 1024 * 1024,
    'wtf.hud.app.mode': this.defaultEndpoint_.mode,
    'wtf.hud.app.endpoint': this.defaultEndpoint_.endpoint,
    'wtf.extensions': extensions
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
    for (var key in storedOptions) {
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
