/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension background page.
 * Entry point for the extension, setting up all browser UI bits and
 * coordinating the various pieces.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


/**
 * Name of the cookie that is used to indicate injection should occur.
 * @const
 * @type {string}
 */
var WTF_ENABLED_COOKIE = 'wtfE';


/**
 * Root path for extension files.
 * @const
 * @type {string}
 */
var WTF_PATH_ROOT = window.WTF_EXTENSION_DEBUG ? 'extensions/chrome' : '';



/**
 * URI utilities.
 * @constructor
 */
var URI = function() {};


/**
 * Douglas Crockford's URL regex from JavaScript: The Good Parts.
 * @const
 * @type {RegExp}
 * @private
 */
URI.regex_ = /^(?:([A-Za-z-]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;


/**
 * Parses a URI into its parts.
 * @param {string} value URI value.
 * @return {!{
 *   uri: string,
 *   scheme: string,
 *   slash: string,
 *   host: string,
 *   port: string,
 *   path: string,
 *   query: string,
 *   hash: string
 * }}
 */
URI.parse = function(value) {
  var result = URI.regex_.exec(value);
  return {
    uri: result[0],
    scheme: result[1] || '',
    host: result[3] || '',
    port: result[4] || '',
    path: '/' + (result[5] || ''),
    query: result[6] || '',
    hash: result[7] || ''
  };
};


/**
 * Canonicalizes a URI by stripping ?queries and #hashes.
 * @param {string} value URI value.
 * @return {string} Canonical URI.
 */
URI.canonicalize = function(value) {
  var lastIndex;
  lastIndex = value.indexOf('?');
  if (lastIndex != -1) {
    value = value.substring(0, lastIndex);
  }
  lastIndex = value.indexOf('#');
  if (lastIndex != -1) {
    value = value.substring(0, lastIndex);
  }
  return value;
};


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
   */
  this.pageWhitelist = [];

  /**
   * A list of page match patterns that will have tracing off.
   * @type {!Array.<string>}
   */
  this.pageBlacklist = [];
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
      this.showPageAction = values['showPageAction'];
      this.showContextMenu = values['showContextMenu'];
      this.showDevPanel = values['showDevPanel'];
      this.pageWhitelist = values['pageWhitelist'];
      this.pageBlacklist = values['pageBlacklist'];
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
      'pageWhitelist': this.pageWhitelist,
      'pageBlacklist': this.pageBlacklist
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
  for (var n = 0; n < this.pageBlacklist.length; n++) {
    if (this.matchPagePattern_(this.pageBlacklist[n], url)) {
      return PageStatus.BLACKLISTED;
    }
  }

  // Check whitelist to see if enabled.
  for (var n = 0; n < this.pageWhitelist.length; n++) {
    if (this.matchPagePattern_(this.pageWhitelist[n], url)) {
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
  for (var n = 0; n < this.pageBlacklist.length; n++) {
    if (this.pageBlacklist[n] == url) {
      this.pageBlacklist.splice(n, 1);
      break;
    }
  }

  // Add to the whitelist, but only if not present.
  for (var n = 0; n < this.pageWhitelist.length; n++) {
    if (this.pageWhitelist[n] == url) {
      // Already present.
      return;
    }
  }
  this.pageWhitelist.push(url);

  this.save();
};


/**
 * Adds a page to the blacklist.
 * @param {string} url Canonicalized page URL.
 */
Options.prototype.blacklistPage = function(url) {
  // If explicit URL is in the whitelist, remove.
  for (var n = 0; n < this.pageWhitelist.length; n++) {
    if (this.pageWhitelist[n] == url) {
      this.pageWhitelist.splice(n, 1);
      break;
    }
  }

  // Add to the whitelist, but only if not present.
  for (var n = 0; n < this.pageBlacklist.length; n++) {
    if (this.pageBlacklist[n] == url) {
      // Already present.
      return;
    }
  }
  this.pageBlacklist.push(url);

  this.save();
};



/**
 * Chrome extension.
 *
 * @constructor
 */
var Extension = function() {
  /**
   * Current options values.
   * These are only ever modified by using the {@see #setOptions} call.
   * @type {!Options}
   * @private
   */
  this.options_ = new Options();
  this.options_.load();

  chrome.tabs.onActivated.addListener(
      this.tabActivated_.bind(this));
  chrome.tabs.onUpdated.addListener(
      this.tabUpdated_.bind(this));
  chrome.pageAction.onClicked.addListener(
      this.pageActionClicked_.bind(this));
};


/**
 * Gets the current extension options.
 * The returned object should not be modified.
 * @return {!Options} Options.
 */
Extension.prototype.getOptions = function() {
  return this.options_;
};


/**
 * Sets new options values, reloading the extension as required.
 * @param {!Options} value New options.
 */
Extension.prototype.setOptions = function(value) {
  this.cleanup();
  this.options_ = value;
  this.options_.save();
  this.setup();
};


/**
 * Sets up the extension in the browser.
 * This will add the (optional) page actions and browser actions.
 */
Extension.prototype.setup = function() {
  var options = this.getOptions();

  // Add context menu items.
  if (options.showContextMenu) {
    // chrome.contextMenus.create
  }

  // Bind for devtools events.
  if (options.showDevPanel) {
  }
};


/**
 * Cleans up the extension, removing all injected bits.
 */
Extension.prototype.cleanup = function() {
  // Remove all context menu items.
  chrome.contextMenus.removeAll();
};


/**
 * Updates the page state (cookie, action visibility, etc).
 * @param {number} tabId Tab ID.
 * @param {string} tabUrl Tab URL.
 * @private
 */
Extension.prototype.updatePageState_ = function(tabId, tabUrl) {
  var options = this.getOptions();

  // Get page URL.
  var pageUrl = URI.canonicalize(tabUrl);
  var parsedUrl = URI.parse(pageUrl);
  if (parsedUrl.scheme.lastIndexOf('chrome') == 0) {
    // Ignore chrome*:// URIs - they'll error.
    return;
  }

  // Get tab toggle status.
  var status = options.getPageStatus(pageUrl);

  // Add or remove document cookie.
  // This tells the content script to inject stuff.
  if (status == PageStatus.WHITELISTED) {
    var urlPath = parsedUrl.path;
    chrome.cookies.set({
      url: pageUrl,
      name: WTF_ENABLED_COOKIE,
      value: '1',
      path: urlPath
    });
  } else {
    chrome.cookies.remove({
      url: pageUrl,
      name: WTF_ENABLED_COOKIE
    });
  }

  if (options.showPageAction) {
    // Determine UI title/icon.
    var title;
    var icon;
    switch (status) {
      case PageStatus.NONE:
        title = 'Enable Web Tracing Framework on this page';
        icon = 'pageAction';
        break;
      case PageStatus.BLACKLISTED:
        title = 'Enable Web Tracing Framework on this page';
        icon = 'pageActionDisabled';
        break;
      case PageStatus.WHITELISTED:
        title = 'Disable Web Tracing Framework on this page';
        icon = 'pageActionEnabled';
        break;
    }

    // Setup page action.
    chrome.pageAction.setTitle({
      tabId: tabId,
      title: title
    });
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: WTF_PATH_ROOT + '/assets/icons/' + icon + '19.png'
    });
    chrome.pageAction.show(tabId);
  } else {
    // Hide page action.
    chrome.pageAction.hide(tabId);
  }
};


/**
 * Handles tab activation events.
 * @param {!Object} activeInfo Activate information.
 * @private
 */
Extension.prototype.tabActivated_ = function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, (function(tab) {
    this.updatePageState_(tab.id, tab.url);
  }).bind(this));
};


/**
 * Handles tab update events.
 * @param {number} tabId Tab ID.
 * @param {!Object} changeInfo Change information.
 * @param {!Object} tab Tab.
 * @private
 */
Extension.prototype.tabUpdated_ = function(tabId, changeInfo, tab) {
  this.updatePageState_(tabId, tab.url);
};


/**
 * Handles clicks on the page action icon.
 * @param {!Object} tab Tab clicked on.
 * @private
 */
Extension.prototype.pageActionClicked_ = function(tab) {
  var options = this.getOptions();

  // Canonicalize URL. This makes matching easier.
  var pageUrl = URI.canonicalize(tab.url);

  // Perform toggling.
  var status = options.getPageStatus(pageUrl);
  switch (status) {
    case PageStatus.NONE:
    case PageStatus.BLACKLISTED:
      options.whitelistPage(pageUrl);
      break;
    case PageStatus.WHITELISTED:
      options.blacklistPage(pageUrl);
      break;
  }

  // Force update the page action ASAP.
  this.updatePageState_(tab.id, tab.url);

  // Reload (and inject).
  chrome.tabs.reload(tab.tabId, {
    bypassCache: true
  });
};



// main()
var extension = new Extension();
extension.setup();


chrome.management.getAll(function(result) {
  console.log(result);
});
