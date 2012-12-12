/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


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

  /**
   * All popup window tab IDs mapped by opener tab ID.
   * @type {!Object.<number, number>}
   * @private
   */
  this.popupWindows_ = {};

  chrome.tabs.onActivated.addListener(
      this.tabActivated_.bind(this));
  chrome.tabs.onUpdated.addListener(
      this.tabUpdated_.bind(this));
  chrome.pageAction.onClicked.addListener(
      this.pageActionClicked_.bind(this));

  // Handle tab closes.
  chrome.tabs.onRemoved.addListener((function(tabId) {
    for (var key in this.popupWindows_) {
      if (this.popupWindows_[key] === tabId) {
        delete this.popupWindows_[key];
        break;
      }
    }
  }).bind(this));

  // Listen for commands from content scripts.
  chrome.extension.onConnect.addListener(function(port) {
    if (port.name == 'injector') {
      // Setup the extended info provider for the page.
      var tab = port.sender.tab;
      var options = this.getOptions();
      var pageUrl = URI.canonicalize(tab.url);
      var pageOptions = options.getPageOptions(pageUrl);
      var extendedInfo = new ExtendedInfo(tab.id, port, pageOptions);

      // Listen for messages from the page.
      port.onMessage.addListener(this.pageMessageReceived_.bind(this));
    }
  }.bind(this));

  // Detect the application.
  this.detectApplication_();
  var detectApplication = this.detectApplication_.bind(this);
  chrome.management.onInstalled.addListener(detectApplication);
  chrome.management.onUninstalled.addListener(detectApplication);
  chrome.management.onEnabled.addListener(detectApplication);
  chrome.management.onDisabled.addListener(detectApplication);

  // Rescan all open tabs to reload any that are whitelisted.
  this.options_.load(function() {
    var whitelist = this.options_.getWhitelistedPages();
    for (var n = 0; n < whitelist.length; n++) {
      chrome.tabs.query({
        'url': whitelist[n]
      }, function(tabs) {
        for (var n = 0; n < tabs.length; n++) {
          chrome.tabs.reload(tabs[n].id, {});
        }
      });
    }
  }, this);
};


/**
 * Detects whether the application is installed and sets up options for it.
 * @private
 */
Extension.prototype.detectApplication_ = function() {
  // This is used to change the default options to use the app instead of the
  // embedded app.
  // TODO(benvanik): some way of talking to the app to get the right URL.
  var options = this.options_;
  options.setDefaultEndpoint('page',
      chrome.extension.getURL('app/maindisplay.html'));
      // TODO(benvanik): use debug URL somehow?
      //'http://localhost:8080/app/maindisplay-debug.html');

  chrome.management.getAll(function(results) {
    for (var n = 0; n < results.length; n++) {
      var result = results[n];
      if (!result.enabled) {
        continue;
      }
      if (result.name == 'Web Tracing Framework (App/DEBUG)') {
        // Always prefer the debug app, if installed.
        console.log('Discovered WTF App - debug ' + result.version);
        options.setDefaultEndpoint('remote', 'localhost:9024');
        break;
      } else if (result.id == 'ofamllpnllolodilannpkikhjjcnfegg') {
        // Otherwise use CWS ID.
        console.log('Discovered WTF App - release ' + result.version);
        options.setDefaultEndpoint('remote', 'localhost:9023');
        break;
      }
    }
  });
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
  /**
   * Name of the cookie that contains the options for the injection.
   * The data is just a blob GUID that is used to construct a URL to the blob
   * exposed by the extension.
   * @const
   * @type {string}
   */
  var WTF_OPTIONS_COOKIE = 'wtf';

  var options = this.getOptions();

  // Get page URL.
  var pageUrl = URI.canonicalize(tabUrl);
  if (!pageUrl.length) {
    return;
  }
  if (pageUrl.lastIndexOf('blob:') == 0 ||
      pageUrl.lastIndexOf('view-source:') == 0) {
    // Ignore blob: URLs.
    return;
  }
  var parsedUrl = URI.parse(pageUrl);
  if (parsedUrl.scheme.lastIndexOf('chrome') == 0) {
    // Ignore chrome*:// URIs - they'll error.
    return;
  }

  // Get tab toggle status.
  var status = options.getPageStatus(pageUrl);
  var pageOptions = options.getPageOptions(pageUrl);

  // Create an exported blob URL that the content script can access.
  // To save on cookie space send only the UUID.
  var pageOptionsBlob = new Blob([JSON.stringify(pageOptions)]);
  var pageOptionsUuid = webkitURL.createObjectURL(pageOptionsBlob);
  pageOptionsUuid =
      pageOptionsUuid.substr(pageOptionsUuid.lastIndexOf('/') + 1);

  // Add or remove document cookie.
  // This tells the content script to inject stuff.
  if (status == PageStatus.WHITELISTED) {
    var urlPath = parsedUrl.path;
    chrome.cookies.set({
      url: pageUrl,
      name: WTF_OPTIONS_COOKIE,
      value: pageOptionsUuid,
      path: urlPath
    });
  } else {
    chrome.cookies.remove({
      url: pageUrl,
      name: WTF_OPTIONS_COOKIE
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
      path: '/assets/icons/' + icon + '19.png'
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


/**
 * Converts a list of regular arrays to Uint8Arrays.
 * @param {!Array.<!Array.<number>>} sources Source arrays.
 * @return {!Array.<!Uint8Array>} Target arrays.
 * @private
 */
Extension.prototype.convertArraysToUint8Arrays_ = function(sources) {
  var targets = [];
  for (var n = 0; n < sources.length; n++) {
    var source = sources[n];
    var target = new Uint8Array(source.length);
    for (var i = 0; i < source.length; i++) {
      target[i] = source[i];
    }
    targets.push(target);
  }
  return targets;
};


/**
 * Handles incoming messages from injector content scripts.
 * @param {!Object} data Message.
 * @param {!Port} port Port the message was received on.
 * @private
 */
Extension.prototype.pageMessageReceived_ = function(data, port) {
  var tab = port.sender.tab;
  if (!tab) {
    return;
  }

  var options = this.getOptions();
  var pageUrl = URI.canonicalize(tab.url);

  switch (data['command']) {
    case 'reload':
      this.updatePageState_(tab.id, tab.url);
      chrome.tabs.reload(tab.id, {
        bypassCache: true
      });
      break;
    case 'save_settings':
      options.setPageOptions(
          pageUrl,
          JSON.parse(data['content']));
      break;
    case 'show_snapshot':
      this.showSnapshot_(
          tab,
          data['page_url'],
          data['content_type'],
          data['contents']);
      break;
  }
};


/**
 * Shows a snapshot in a new window.
 * @param {!Tab} sourceTab Source tab.
 * @param {string} pageUrl Page URL to open.
 * @param {string} contentType Data content type.
 * @param {!Array.<!Uint8Array>} contents Data.
 * @private
 */
Extension.prototype.showSnapshot_ = function(
    sourceTab, pageUrl, contentType, contents) {
  // TODO(benvanik): generalize this into an IPC channel
  var waiter = function(e) {
    // This is a packet from the wtf.ipc.MessageChannel type.
    var data = e.data;
    if (!data ||
        !data['wtf_ipc_connect_token'] ||
        !data['data']['hello']) {
      return;
    }

    // Stop snooping.
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener('message', waiter, true);

    // NOTE: postMessage doesn't support transferrables here.
    e.source.postMessage({
      'wtf_ipc_connect_token': true,
      'data': {
        'command': 'snapshot',
        'content_type': contentType,
        'contents': contents
      }
    }, '*');
    e.source.focus();
  };
  window.addEventListener('message', waiter, true);

  var existingTabId = this.popupWindows_[sourceTab.id];
  if (existingTabId === undefined) {
    // New tab needed.
    chrome.tabs.create({
      windowId: sourceTab.windowId,
      index: sourceTab.index + 1,
      url: pageUrl,
      active: true,
      openerTabId: sourceTab.id
    }, (function(newTab) {
      this.popupWindows_[sourceTab.id] = newTab.id;
    }).bind(this));
  } else {
    // Switch to existing tab.
    chrome.tabs.reload(existingTabId);
    chrome.tabs.get(existingTabId, function(existingTab) {
      chrome.windows.update(existingTab.windowId, {
        focused: true,
        drawAttention: true
      });
    });
    chrome.tabs.update(existingTabId, {
      active: true
    });
  }
};
