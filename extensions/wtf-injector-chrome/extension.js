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
   * Page options JSON strings mapped by UUID.
   * These are used as a lookup for the HTTP header hack.
   * @type {!Object.<string>}
   * @private
   */
  this.pageOptionsBlobs_ = {};

  /**
   * Injected tabs, mapped by tab ID.
   * @type {!Object.<!InjectedTab>}
   * @private
   */
  this.injectedTabs_ = {};

  /**
   * Tracer.
   * @type {Tracer}
   * @private
   */
  this.tracer_ = null;

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

  // Handle tab closes.
  chrome.tabs.onRemoved.addListener((function(tabId) {
    for (var key in this.popupWindows_) {
      if (this.popupWindows_[key] === tabId) {
        delete this.popupWindows_[key];
        break;
      }
    }
    if (tabId in this.injectedTabs_) {
      var injectedTab = this.injectedTabs_[tabId];
      this.injectedTabs_[tabId] = null;
      injectedTab.dispose();
    }
  }).bind(this));

  // Listen for commands from content scripts.
  chrome.extension.onConnect.addListener(function(port) {
    var options = this.getOptions();
    if (port.name == 'injector') {
      // Setup the extended info provider for the page.
      var tab = port.sender.tab;
      if (!tab) {
        // This sometimes happens on about:blank and the new tab page.
        return;
      }
      var pageUrl = URI.canonicalize(tab.url);
      var pageStatus = options.getPageStatus(pageUrl, tab.id);
      var pageOptions = options.getPageOptions(pageUrl);

      _gaq.push(['_trackEvent', 'extension', 'injected']);

      var injectedTab = new InjectedTab(
          this, tab, pageStatus, pageOptions, port);
      this.injectedTabs_[tab.id] = injectedTab;
    } else if (port.name == 'popup') {
      // Get info about the selected tab and send back.
      // Note: port.sender is the popup tab, not the current tab.
      chrome.tabs.getSelected(null, (function(tab) {
        var pageUrl = URI.canonicalize(tab.url);
        if (!pageUrl.length) {
          return;
        }
        this.sendPopupInfo_(pageUrl, tab.id, port);

        // Listen for messages from the popup.
        port.onMessage.addListener((function(data, port) {
          this.popupMessageReceived_(tab, data, port);
        }).bind(this));
      }).bind(this));
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
    var whitelistMap = {};
    for (var n = 0; n < whitelist.length; n++) {
      whitelistMap[whitelist[n]] = true;
    }
    chrome.tabs.query({}, (function(tabs) {
      var tabsReloaded = 0;
      for (var n = 0; n < tabs.length; n++) {
        var pageUrl = URI.canonicalize(tabs[n].url);
        if (whitelistMap[pageUrl]) {
          tabsReloaded++;
          this.reloadTab(tabs[n].id, tabs[n].url);
        }
      }
      _gaq.push(['_trackEvent', 'extension', 'tabs_reloaded',
          null, tabsReloaded]);
    }).bind(this));
  }, this);

  // This hacky thing lets people open wtf from the omnibox.
  // HACK(benvanik): https://code.google.com/p/chromium/issues/detail?id=237817
  try {
    chrome.omnibox.setDefaultSuggestion({
      description: '<url><match>%s</match></url> Open trace file'
    });
  } catch (e) {
  }
  chrome.omnibox.onInputChanged.addListener((function(text, suggest) {
    suggest([
      {
        content: 'ui',
        description: 'Open the UI'
      }
    ]);
  }).bind(this));
  chrome.omnibox.onInputEntered.addListener((function(text) {
    chrome.tabs.getSelected(null, (function(tab) {
      text = text.trim();
      if (text == 'ui' || text.length == 0) {
        // Open the UI.
        _gaq.push(['_trackEvent', 'extension', 'omnibox_show_ui']);
        this.showUi_({
          targetTab: tab
        });
      } else {
        // A URL? File path? etc?
        if (text.indexOf('http') == 0) {
          _gaq.push(['_trackEvent', 'extension', 'omnibox_show_file']);
          this.showFileInUi_({
            targetTab: tab
          }, text);
        }
      }
    }).bind(this));
  }).bind(this));

  // FileBrowserHandler requests, on Chrome OS.
  if (chrome.fileBrowserHandler) {
    chrome.fileBrowserHandler.onExecute.addListener((function(id, details) {
      chrome.tabs.get(details.tab_id, (function(tab) {
        switch (id) {
          case 'open':
            this.showFileEntriesInUi_({
              targetTab: tab
            }, details.entries);
            break;
        }
      }).bind(this));
    }).bind(this));
  }

  // This is a workaround for a regression in Chrome that prevents blob URIs
  // from work in content scripts. Instead, we smuggle the options data
  // synchronously via HTTP headers. Yeah, I know. FML.
  // https://code.google.com/p/chromium/issues/detail?id=295829
  chrome.webRequest.onHeadersReceived.addListener((function(details) {
    var uuid = details.url.substr(details.url.lastIndexOf('/') + 1);
    var headerValue = this.pageOptionsBlobs_[uuid];
    return {
      responseHeaders: [
        {
          name: 'X-WTF-Options',
          value: headerValue
        }
      ]
    };
  }).bind(this), {
    urls: ['http://tracing-framework.appspot.com/tab-options/*'],
    types: ['xmlhttprequest']
  }, ['blocking']);
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
        _gaq.push(['_trackEvent', 'extension', 'app_discovered']);
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
 * Gets the shared tracer, if available.
 * @return {Tracer} Tracer.
 */
Extension.prototype.getTracer = function() {
  if (this.tracer_ && this.tracer_.isAvailable()) {
    return this.tracer_;
  }
  return null;
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

  // Setup tracing.
  // This may fail and immediately kill itself.
  this.tracer_ = new Tracer();
};


/**
 * Cleans up the extension, removing all injected bits.
 */
Extension.prototype.cleanup = function() {
  // Remove all context menu items.
  chrome.contextMenus.removeAll();

  // Stop tracing.
  if (this.tracer_) {
    this.tracer_.dispose();
    this.tracer_ = null;
  }
};


/**
 * Removes an injected tab from the list.
 * This does not dispose the tab. It should only be used by the InjectedTab
 * dispose call.
 * @param {number} tabId Tab ID.
 */
Extension.prototype.removeInjectedTab = function(tabId) {
  delete this.injectedTabs_[tabId];
};


/**
 * Reloads the given tab.
 * @param {number} tabId Tab ID.
 * @param {string} tabUrl Target tab URL.
 */
Extension.prototype.reloadTab = function(tabId, tabUrl) {
  this.updatePageState_(tabId, tabUrl);
  chrome.tabs.reload(tabId, {
    bypassCache: true
  });
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

  /**
   * Cookie used for instrumentation options.
   * @const
   * @type {string}
   */
  var WTF_INSTRUMENTATION_COOKIE = 'wtfi';

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

  // Check for query parameter to enable the extension for automated tests.
  var reloadUrl = null;
  var forceWhitelistRegex = /[&?]wtf__force_whitelist\b/;
  if (forceWhitelistRegex.test(URI.parse(tabUrl).query)) {
    options.whitelistPage(pageUrl);
    // Reload the page without the parameter after updating settings.
    reloadUrl = tabUrl.replace(forceWhitelistRegex, '');
  }

  // Get tab toggle status.
  var status = options.getPageStatus(pageUrl, tabId);

  // Add or remove document cookie.
  // This tells the content script to inject stuff.
  switch (status) {
    case PageStatus.WHITELISTED:
      var pageOptions = options.getPageOptions(pageUrl);

      // Set availablility overrides.
      pageOptions['wtf.trace.provider.chromeDebug.tracing'] =
          !!this.getTracer();

      // Create an exported blob URL that the content script can access.
      // To save on cookie space send only the UUID.
      var pageOptionsString = JSON.stringify(pageOptions);
      var pageOptionsBlob = new Blob([pageOptionsString]);
      var pageOptionsUuid = webkitURL.createObjectURL(pageOptionsBlob);
      pageOptionsUuid =
          pageOptionsUuid.substr(pageOptionsUuid.lastIndexOf('/') + 1);

      // Stash options in our lookup for the HTTP header fallback.
      this.pageOptionsBlobs_[pageOptionsUuid] = pageOptionsString;

      var urlPath = parsedUrl.path;
      chrome.cookies.set({
        url: pageUrl,
        name: WTF_OPTIONS_COOKIE,
        value: pageOptionsUuid,
        path: urlPath
      });
      break;
    case PageStatus.INSTRUMENTED:
      var instrumentationOptions = options.getInstrumentationOptions(tabId);
      // TODO(benvanik): clever serialization of this.
      var urlPath = parsedUrl.path;
      chrome.cookies.set({
        url: pageUrl,
        name: WTF_INSTRUMENTATION_COOKIE,
        value: JSON.stringify(instrumentationOptions),
        path: urlPath
      });
      break;
    default:
    case PageStatus.NONE:
    case PageStatus.BLACKLISTED:
      chrome.cookies.remove({
        url: pageUrl,
        name: WTF_OPTIONS_COOKIE
      });
      chrome.cookies.remove({
        url: pageUrl,
        name: WTF_INSTRUMENTATION_COOKIE
      });
      break;
  }

  if (options.showPageAction) {
    // Determine UI title/icon.
    var title = '';// 'Toggle Web Tracing Framework on this page';
    var icon;
    var badgeText = '';
    switch (status) {
      case PageStatus.NONE:
        icon = 'pageAction';
        badgeText = '';
        break;
      case PageStatus.BLACKLISTED:
        icon = 'pageActionDisabled';
        badgeText = '';
        break;
      case PageStatus.WHITELISTED:
      case PageStatus.INSTRUMENTED:
        icon = 'pageActionEnabled';
        badgeText = 'REC';
        break;
    }

    // Setup page action.
    chrome.browserAction.setIcon({
      tabId: tabId,
      path: {
        '19': '/assets/icons/' + icon + '19.png',
        '38': '/assets/icons/' + icon + '38.png'
      }
    });
    chrome.browserAction.setBadgeText({
      tabId: tabId,
      text: badgeText
    });

    if (reloadUrl) {
      chrome.tabs.update(tabId, {url: reloadUrl});
    }
  }
};


/**
 * Handles tab activation events.
 * @param {!Object} activeInfo Activate information.
 * @private
 */
Extension.prototype.tabActivated_ = function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, (function(tab) {
    if (tab) {
      this.updatePageState_(tab.id, tab.url);
    }
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
 * Sends the latest information to the popup.
 * @param {string} pageUrl Canonical page URL.
 * @param {number} tabId Requesting tab ID.
 * @param {!Port} port Message port.
 * @private
 */
Extension.prototype.sendPopupInfo_ = function(pageUrl, tabId, port) {
  var options = this.getOptions();
  port.postMessage({
    'command': 'info',
    'info': {
      'url': pageUrl,
      'status': options.getPageStatus(pageUrl, tabId),
      'options': options.getPageOptions(pageUrl),
      'all_addons': options.getAddons()
    }
  });
};


/**
 * Handles incoming messages from page action popups.
 * @param {!Tab} tab Current tab.
 * @param {!Object} data Message.
 * @param {!Port} port Port the message was received on. Popup.
 * @private
 */
Extension.prototype.popupMessageReceived_ = function(tab, data, port) {
  var options = this.getOptions();
  var pageUrl = URI.canonicalize(tab.url);

  var needsReload = false;
  switch (data.command) {
    case 'toggle':
      // Perform toggling.
      var status = options.getPageStatus(pageUrl, tab.id);
      switch (status) {
        case PageStatus.NONE:
        case PageStatus.BLACKLISTED:
          _gaq.push(['_trackEvent', 'extension', 'page_enabled']);
          options.whitelistPage(pageUrl);
          break;
        case PageStatus.WHITELISTED:
          _gaq.push(['_trackEvent', 'extension', 'page_disabled']);
          options.blacklistPage(pageUrl);
          break;
        case PageStatus.INSTRUMENTED:
          _gaq.push(['_trackEvent', 'extension', 'instrumentation_disabled']);
          options.uninstrumentTab(tab.id);
          break;
      }
      // Force update the page action ASAP.
      this.updatePageState_(tab.id, tab.url);
      needsReload = true;
      break;
    case 'reset_settings':
      // Reset.
      _gaq.push(['_trackEvent', 'extension', 'page_settings_reset']);
      options.resetPageOptions(pageUrl);
      // Force update the page action ASAP.
      this.updatePageState_(tab.id, tab.url);
      needsReload = true;
      break;

    case 'show_ui':
      this.showUi_({
        newWindow: true
      });
      break;
    case 'show_files':
      this.showFileBlobsInUi_({
        newWindow: true
      }, data.files);
      break;

    case 'instrument':
      if (data.needsHelp) {
        _gaq.push(['_trackEvent', 'extension', 'instrumentation_help']);
        chrome.tabs.create({
          url: 'https://github.com/google/tracing-framework/blob/master/docs/memory_tracing.md',
          active: true
        });
      } else {
        _gaq.push(['_trackEvent', 'extension', 'instrumentation_enabled']);
        options.instrumentTab(tab.id, {
          'type': data.type
        });
        // Force update the page action ASAP.
        this.updatePageState_(tab.id, tab.url);
        needsReload = true;
      }
      break;

    case 'add_addon':
      _gaq.push(['_trackEvent', 'extension', 'addon_added']);
      options.addAddon(data.url, data.manifest);
      this.sendPopupInfo_(pageUrl, tab.id, port);
      break;
    case 'remove_addon':
      _gaq.push(['_trackEvent', 'extension', 'addon_removed']);
      options.removeAddon(data.url);
      this.sendPopupInfo_(pageUrl, tab.id, port);
      break;
    case 'toggle_addon':
      var pageOptions = options.getPageOptions(pageUrl);
      var i = pageOptions['wtf.addons'].indexOf(data.url);
      if (data.enabled) {
        if (i == -1) {
          pageOptions['wtf.addons'].push(data.url);
          _gaq.push(['_trackEvent', 'extension', 'page_addon_enabled']);
        }
      } else {
        pageOptions['wtf.addons'].splice(i, 1);
        _gaq.push(['_trackEvent', 'extension', 'page_addon_disabled']);
      }
      options.setPageOptions(pageUrl, pageOptions);
      this.sendPopupInfo_(pageUrl, tab.id, port);
      needsReload =
          options.getPageStatus(pageUrl, tab.id) == PageStatus.WHITELISTED;
      this.updatePageState_(tab.id, tab.url);
      break;
  }

  // Reload (and inject).
  if (needsReload) {
    chrome.tabs.reload(tab.tabId, {
      bypassCache: true
    });
  }
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
 * @typedef {{
 *   pageUrl: string|null,
 *   sourceTab: Tab|undefined,
 *   targetTab: Tab|undefined
 * }}
 */
Extension.ShowOptions;


/**
 * Shows the empty UI.
 * @param {Extension.ShowOptions?} options Options.
 * @private
 */
Extension.prototype.showUi_ = function(options, opt_callback, opt_scope) {
  var pageUrl = (options ? options.pageUrl : null) ||
      chrome.extension.getURL('app/maindisplay.html');
  var newWindow = options ? options.newWindow : false;
  var sourceTab = options ? options.sourceTab : null;
  var targetTab = options ? options.targetTab : null;

  // If we have a callback it means we're likely going to be controlling the UI,
  // so prevent the splash screen.
  if (opt_callback) {
    pageUrl += '?expect_data';
  }

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

    if (opt_callback) {
      opt_callback.call(opt_scope, e.source);
    }
    e.source.focus();
  };
  window.addEventListener('message', waiter, true);

  var existingTabId = sourceTab ? this.popupWindows_[sourceTab.id] : undefined;
  if (newWindow) {
    // Force a new tab if requested.
    existingTabId = undefined;
  }
  if (existingTabId === undefined) {
    // New tab needed.
    if (targetTab) {
      chrome.tabs.update(targetTab.id, {
        url: pageUrl,
        active: true
      });
    } else {
      var openOptions = {
        url: pageUrl,
        active: true
      };
      if (sourceTab) {
        openOptions.windowId = sourceTab.windowId;
        openOptions.index = sourceTab.index + 1;
        openOptions.openerTabId = sourceTab.id;
        chrome.tabs.create(openOptions, (function(newTab) {
          this.popupWindows_[sourceTab.id] = newTab.id;
        }).bind(this));
      } else {
        chrome.tabs.create(openOptions);
      }
    }
  } else {
    // Switch to existing tab.
    // Note that we reset to the pageUrl in case we lost are arguments.
    chrome.tabs.update(existingTabId, {
      url: pageUrl,
      active: true
    });
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


/**
 * Shows a file at the given URL in the UI.
 * @param {Extension.ShowOptions?} options Options.
 * @param {string} url URL to open.
 * @private
 */
Extension.prototype.showFileInUi_ = function(options, url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = (function() {
    if (xhr.status == 200) {
      var contentType = 'application/x-extension-wtf-trace';
      var blob = new Blob([
        new Uint8Array(xhr.response)
      ], {
        type: 'application/octet-stream'
      });
      var blobUrl = URL.createObjectURL(blob);
      var contentTypes = [contentType];
      var contentSources = [url];
      var contentUrls = [blobUrl];
      var contentLength = blob.size;
      this.showUi_(options, function(port) {
        // NOTE: postMessage doesn't support transferrables here.
        port.postMessage({
          'wtf_ipc_connect_token': true,
          'data': {
            'command': 'snapshot',
            'content_types': contentTypes,
            'content_sources': contentSources,
            'content_urls': contentUrls,
            'content_length': contentLength,
            'revoke_blob_urls': true
          }
        }, '*');
      });
    }
  }).bind(this);
  xhr.send(null);
};


/**
 * Shows file blobs in the UI.
 * @param {Extension.ShowOptions?} options Options.
 * @param {!Array} files File blob infos.
 * @private
 */
Extension.prototype.showFileBlobsInUi_ = function(options, files) {
  if (!files.length) {
    return;
  }

  var contentTypes = [];
  var contentSources = [];
  var contentUrls = [];
  var contentLength = 0;
  for (var n = 0; n < files.length; n++) {
    var file = files[n];
    var contentType = 'application/x-extension-wtf-trace';
    var fileName = file.name;
    var dotIndex = fileName.lastIndexOf('.');
    if (dotIndex != -1) {
      extension = fileName.substring(dotIndex + 1);
      contentType = 'application/x-extension-' + extension;
    }
    contentTypes.push(contentType);

    contentSources.push(fileName);
    contentUrls.push(file.url);
    contentLength += file.size;
  }

  this.showUi_(options, function(port) {
    // NOTE: postMessage doesn't support transferrables here.
    port.postMessage({
      'wtf_ipc_connect_token': true,
      'data': {
        'command': 'snapshot',
        'content_types': contentTypes,
        'content_sources': contentSources,
        'content_urls': contentUrls,
        'content_length': contentLength,
        'revoke_blob_urls': true
      }
    }, '*');
  });
};


/**
 * Shows a file at the given URL in the UI.
 * @param {Extension.ShowOptions?} options Options.
 * @param {!Array.<!FileEntry>} fileEntries List of HTML File System entries.
 * @private
 */
Extension.prototype.showFileEntriesInUi_ = function(options, fileEntries) {
  if (!fileEntries.length) {
    return;
  }

  var processFiles = (function(files) {
    var contentTypes = [];
    var contentSources = [];
    var contentUrls = [];
    var contentLength = 0;
    for (var n = 0; n < files.length; n++) {
      var contentType = 'application/x-extension-wtf-trace';
      var fileName = files[n].name;
      var dotIndex = fileName.lastIndexOf('.');
      if (dotIndex != -1) {
        extension = fileName.substring(dotIndex + 1);
        contentType = 'application/x-extension-' + extension;
      }
      contentTypes.push(contentType);

      var blob = new Blob([files[n]], {
        type: 'application/octet-stream'
      });
      contentSources.push(fileName);
      contentUrls.push(URL.createObjectURL(blob));
      contentLength += blob.size;
    }
    this.showUi_(options, function(port) {
      // NOTE: postMessage doesn't support transferrables here.
      port.postMessage({
        'wtf_ipc_connect_token': true,
        'data': {
          'command': 'snapshot',
          'content_types': contentTypes,
          'content_sources': contentSources,
          'content_urls': contentUrls,
          'content_length': contentLength,
          'revoke_blob_urls': true
        }
      }, '*');
    });
  }).bind(this);

  var files = [];
  var remaining = fileEntries.length;
  fileEntries.forEach(function(entry) {
    entry.file(function(file) {
      files.push(file);
      remaining--;
      if (!remaining) {
        processFiles(files);
      }
    });
  });
};


/**
 * Shows a snapshot in a new window.
 * @param {!Tab} sourceTab Source tab.
 * @param {string} pageUrl Page URL to open.
 * @param {boolean} newWindow Whether to show in a new window.
 * @param {!Array.<string>} contentTypes Data content type.
 * @param {!Array.<string>} contentSources Data content type.
 * @param {!Array.<string>} contentUrls Content URLs.
 * @param {number} contentLength Content length, in bytes.
 * @private
 */
Extension.prototype.showSnapshot = function(
    sourceTab, pageUrl, newWindow,
    contentTypes, contentSources, contentUrls, contentLength) {
  this.showUi_({
    pageUrl: pageUrl,
    newWindow: newWindow,
    sourceTab: sourceTab
  }, function(port) {
    // NOTE: postMessage doesn't support transferrables here.
    port.postMessage({
      'wtf_ipc_connect_token': true,
      'data': {
        'command': 'snapshot',
        'content_types': contentTypes,
        'content_sources': contentSources,
        'content_urls': contentUrls,
        'content_length': contentLength,
        'revoke_blob_urls': true
      }
    }, '*');
  });
};
