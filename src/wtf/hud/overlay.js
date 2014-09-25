/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HUD overlay UI.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.hud.Overlay');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.BrowserEvent');
goog.require('goog.fs');
goog.require('goog.result.SimpleResult');
goog.require('goog.soy');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.userAgent');
goog.require('wtf.addon');
goog.require('wtf.events');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.hud.LiveGraph');
goog.require('wtf.hud.overlay');
goog.require('wtf.io');
goog.require('wtf.io.Blob');
goog.require('wtf.ipc');
goog.require('wtf.ipc.Channel');
goog.require('wtf.trace');
goog.require('wtf.trace.util');
goog.require('wtf.ui.ErrorDialog');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.SettingsDialog');
goog.require('wtf.ui.icons');
goog.require('wtf.util.Options');



/**
 * HUD overlay control UI.
 *
 * @param {!wtf.trace.Session} session Current tracing session.
 * @param {!wtf.util.Options} options Options.
 * @param {Element=} opt_parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.ResizableControl}
 */
wtf.hud.Overlay = function(session, options, opt_parentElement) {
  var dom = goog.dom.getDomHelper(opt_parentElement);
  var parentElement = /** @type {!Element} */ (
      opt_parentElement || dom.getDocument().body);
  // Wrap in #wtf for stylesheets.
  var wtfEl = dom.createElement(goog.dom.TagName.DIV);
  wtf.trace.util.ignoreDomTree(wtfEl);
  goog.dom.classes.add(wtfEl, goog.getCssName('wtfReset'));
  goog.style.setStyle(wtfEl, 'display', 'block');
  parentElement.appendChild(wtfEl);
  parentElement = wtfEl;

  goog.base(
      this,
      wtf.ui.ResizableControl.Orientation.VERTICAL,
      goog.getCssName('hudSplitter'),
      parentElement,
      dom);

  /**
   * DOM channel, if supported.
   * This can be used to listen to notifications from the extension or send
   * messages to the content script.
   * @type {wtf.ipc.Channel}
   * @private
   */
  this.extensionChannel_ =
      options.getOptionalBoolean('wtf.injector', false) ?
          wtf.ipc.getWindowMessageChannel(window) : null;

  /**
   * The last name used when opening a popup window.
   * @type {string}
   * @private
   */
  this.lastWindowName_ = 'wtf_ui';

  /**
   * Options.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * Docking position.
   * @type {wtf.hud.Overlay.DockPosition_}
   * @private
   */
  this.dockPosition_ = wtf.hud.Overlay.DockPosition_.BOTTOM_RIGHT;

  /**
   * The number of buttons currently added.
   * @type {number}
   * @private
   */
  this.buttonCount_ = 0;

  /**
   * Graph canvas.
   * @type {!wtf.hud.LiveGraph}
   * @private
   */
  this.liveGraph_ = new wtf.hud.LiveGraph(
      session, options, this.getChildElement(goog.getCssName('hudGraph')));
  this.registerDisposable(this.liveGraph_);

  var keyboard = wtf.events.getWindowKeyboard(dom);

  /**
   * Keyboard shortcut scope.
   * @type {!wtf.events.KeyboardScope}
   * @private
   */
  this.keyboardScope_ = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(this.keyboardScope_);

  // Initial resize.
  this.setSplitterLimits(59, 500);
  this.setSplitterSize(80);

  // Add buttons.
  this.addButton_(
      true,
      '/assets/icons/clear.png',
      'Clear current data', 'shift+esc',
      this.clearSnapshotClicked_, this);
  this.addButton_(
      true,
      '/assets/icons/popout_white.png',
      'Send to UI (middle click for new tab)', 'f9',
      this.sendSnapshotClicked_, this);
  this.addButton_(
      true,
      '/assets/icons/save.png',
      'Save Snapshot', 'f10',
      this.saveSnapshotClicked_, this);
  this.addButton_(
      true,
      '/assets/icons/settings.png',
      'Settings', null,
      this.settingsClicked_, this);

  // Listen for options changes and reload.
  this.options_.addListener(
      wtf.util.Options.EventType.CHANGED, this.reloadOptions_, this);
  this.reloadOptions_();

  // Listen for messages from the extension.
  if (this.extensionChannel_) {
    this.extensionChannel_.addListener(
        wtf.ipc.Channel.EventType.MESSAGE, this.extensionMessage_, this);
  }

  // TODO(benvanik): generate counter code
  /*
  'counters': [
    {
      'name': 'foo::bar',
      'min': 0,
      'max': 100,
      'style': 'bar',
      'format': '{CUR:2}ms ({MIN:2}-{MAX:2})'
    }, ...
  ]
  'default': {
    'display': 'foo::bar'
  }
  */
  // var providerInfos = wtf.data.getAllProviders();
  // var providerMap = {};
  // for (var n = 0; n < providerInfos.length; n++) {
  //   providerMap[providerInfos[n].name] = providerInfo;
  // }
  // for (var n = 0; n < counters.length; n++) {
  //   var counter = counters[n];
  //   var nameParts = counter.name.split('::');
  //   var providerInfo = providerMap[nameParts[0]];
  //   var eventInfo = providerInfo.getEventByName(nameParts[1]);
  //   //
  // }

  wtf.trace.ignoreDomTree(this.getRootElement());
};
goog.inherits(wtf.hud.Overlay, wtf.ui.ResizableControl);


/**
 * @override
 */
wtf.hud.Overlay.prototype.disposeInternal = function() {
  this.options_.removeListener(
      wtf.util.Options.EventType.CHANGED, this.reloadOptions_, this);
  goog.base(this, 'disposeInternal');
};


/**
 * Overlay docking position.
 * @enum {string}
 * @private
 */
wtf.hud.Overlay.DockPosition_ = {
  /**
   * Dock at the top-left of the screen.
   */
  TOP_LEFT: 'tl',

  /**
   * Dock at the bottom-left of the screen.
   */
  BOTTOM_LEFT: 'bl',

  /**
   * Dock at the top-right of the screen.
   */
  TOP_RIGHT: 'tr',

  /**
   * Dock at the bottom-right of the screen.
   */
  BOTTOM_RIGHT: 'br',

  /**
   * Dock at the top-middle of the screen.
   */
  TOP_MIDDLE: 'tm',

  /**
   * Dock at the bottom-middle of the screen.
   */
  BOTTOM_MIDDLE: 'bm'
};


/**
 * @override
 */
wtf.hud.Overlay.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.hud.overlay.control, undefined, undefined, dom));
};


/**
 * @override
 */
wtf.hud.Overlay.prototype.layoutInternal = function() {
  this.liveGraph_.layout();
};


/**
 * Reloads options.
 * @param {Array.<string>=} opt_changedKeys A list of keys that were changed.
 * @private
 */
wtf.hud.Overlay.prototype.reloadOptions_ = function(opt_changedKeys) {
  var options = this.options_;

  // This is a list of keys that are known safe and do not need a reload.
  // If a key is not in this list the page will be automatically reloaded.
  var safeReloadKeys = [
    'wtf.hud.dock'
  ];

  switch (options.getString('wtf.hud.dock', 'br')) {
    case 'tl':
      this.dockPosition_ = wtf.hud.Overlay.DockPosition_.TOP_LEFT;
      break;
    case 'bl':
      this.dockPosition_ = wtf.hud.Overlay.DockPosition_.BOTTOM_LEFT;
      break;
    case 'tr':
      this.dockPosition_ = wtf.hud.Overlay.DockPosition_.TOP_RIGHT;
      break;
    case 'br':
      this.dockPosition_ = wtf.hud.Overlay.DockPosition_.BOTTOM_RIGHT;
      break;
    case 'tm':
      this.dockPosition_ = wtf.hud.Overlay.DockPosition_.TOP_MIDDLE;
      break;
    case 'bm':
      this.dockPosition_ = wtf.hud.Overlay.DockPosition_.BOTTOM_MIDDLE;
      break;
  }

  // Adjust position on page.
  var rootElement = this.getRootElement();
  switch (this.dockPosition_) {
    default:
    case wtf.hud.Overlay.DockPosition_.TOP_LEFT:
      goog.style.setStyle(rootElement, {
        'top': 0,
        'bottom': null,
        'left': 0,
        'right': null,
        'margin-right': 'auto'
      });
      this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.TOP_LEFT);
      break;
    case wtf.hud.Overlay.DockPosition_.BOTTOM_LEFT:
      goog.style.setStyle(rootElement, {
        'top': null,
        'bottom': 0,
        'left': 0,
        'right': null,
        'margin-right': 'auto'
      });
      this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.TOP_LEFT);
      break;
    case wtf.hud.Overlay.DockPosition_.TOP_RIGHT:
      goog.style.setStyle(rootElement, {
        'top': 0,
        'bottom': null,
        'left': null,
        'right': 0,
        'margin-right': '3px'
      });
      this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.BOTTOM_RIGHT);
      break;
    case wtf.hud.Overlay.DockPosition_.BOTTOM_RIGHT:
      goog.style.setStyle(rootElement, {
        'top': null,
        'bottom': 0,
        'left': null,
        'right': 0,
        'margin-right': '3px'
      });
      this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.BOTTOM_RIGHT);
      break;
    case wtf.hud.Overlay.DockPosition_.TOP_MIDDLE:
      var halfWidth = this.getSplitterSize() / 2.0;
      var marginString = goog.string.buildString('-', halfWidth, 'px');
      goog.style.setStyle(rootElement, {
        'top': 0,
        'bottom': null,
        'left': null,
        'right': '50%',
        'margin-right': marginString
      });
      this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.TOP_LEFT);
      break;
    case wtf.hud.Overlay.DockPosition_.BOTTOM_MIDDLE:
      var halfWidth = this.getSplitterSize() / 2.0;
      var marginString = goog.string.buildString('-', halfWidth, 'px');
      goog.style.setStyle(rootElement, {
        'top': null,
        'bottom': 0,
        'left': null,
        'right': '50%',
        'margin-right': marginString
      });
      this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.TOP_LEFT);
      break;
  }

  // If any setting changed was reload-worthy, reload now.
  var needsReload = false;
  if (opt_changedKeys) {
    var changedKeys = opt_changedKeys.slice();
    for (var n = 0; n < safeReloadKeys.length; n++) {
      goog.array.remove(changedKeys, safeReloadKeys[n]);
    }
    needsReload = !!changedKeys.length;
  }

  // If there's an extension connected, save the settings to it.
  if (this.extensionChannel_) {
    this.extensionChannel_.postMessage({
      'command': 'save_settings',
      'content': this.options_.save(),
      'reload': needsReload
    });
  } else {
    // No extension - save to local storage.
    goog.global.localStorage.setItem('__wtf_options__', options.save());

    if (needsReload) {
      goog.global.location.reload(true);
    }
  }
};


/**
 * Shows the overlay.
 */
wtf.hud.Overlay.prototype.show = function() {
  goog.style.setStyle(this.getRootElement(), 'display', '');
  this.liveGraph_.setEnabled(true);
};


/**
 * Hides the overlay.
 */
wtf.hud.Overlay.prototype.hide = function() {
  goog.style.setStyle(this.getRootElement(), 'display', 'none');
  this.liveGraph_.setEnabled(false);
};


/**
 * Advances the HUD time.
 * @param {number=} opt_time New time. Prefer using {@see wtf#now}.
 */
wtf.hud.Overlay.prototype.advance = function(opt_time) {
  this.liveGraph_.advance(opt_time);
};


/**
 * @typedef {{
 *   title: string,
 *   icon: string,
 *   shortcut: string?,
 *   callback: function(Event=),
 *   scope: (Object|undefined)
 * }}
 */
wtf.hud.Overlay.ButtonInfo;


/**
 * Inserts a button to the left of the system buttons.
 * @param {!wtf.hud.Overlay.ButtonInfo} info Button info data.
 */
wtf.hud.Overlay.prototype.insertButton = function(info) {
  this.addButton_(
      false,
      info['icon'] || '',
      info['title'] || 'Action',
      info['shortcut'] || null,
      info['callback'],
      info['scope'] || undefined);
};


// TODO(benvanik): support toggleable actions
/**
 * Adds a button to the overlay button bar.
 * @param {boolean} isSystem System button.
 * @param {string} icon Data URI of an icon file or a CSS class name.
 * @param {string} title Title name for tooltips.
 * @param {string?} shortcut Shortcut key or null if not used.
 * @param {!function(this:T, Event=)} callback Callback when the action is
 *     invoked.
 * @param {T=} opt_scope Callback scope.
 * @template T
 * @private
 */
wtf.hud.Overlay.prototype.addButton_ = function(
    isSystem, icon, title, shortcut, callback, opt_scope) {
  var fullTitle = title;
  if (shortcut) {
    fullTitle += ' (' + shortcut + ')';
  }

  // Create button.
  var dom = this.getDom();
  var el = dom.createElement(goog.dom.TagName.A);
  goog.dom.classes.add(el, goog.getCssName('hudButton'));
  el['title'] = fullTitle;
  var img = /** @type {!HTMLImageElement} */ (
      dom.createElement(goog.dom.TagName.IMG));
  wtf.ui.icons.makeIcon(img, icon);
  dom.appendChild(el, img);

  // Add to DOM.
  var buttonBar = this.getChildElement(goog.getCssName('hudButtons'));
  if (isSystem) {
    dom.appendChild(buttonBar, el);
  } else {
    dom.insertChildAt(buttonBar, el, 0);
  }
  this.buttonCount_++;

  // Keyboard shortcut handler.
  if (shortcut) {
    this.keyboardScope_.addShortcut(shortcut, callback, opt_scope || this);
  }

  // Click handler.
  // We add this event directly to ensure we don't accidentally log it.
  el.onclick = wtf.trace.ignoreListener(function(e) {
    callback.call(opt_scope, e);
  });

  // Measure and update extents.
  var splitterSize = this.getSplitterSize();
  var oldMinWidth = (this.buttonCount_ - 1) * 27 + 4;
  var newMinWidth = this.buttonCount_ * 27 + 4;
  this.setSplitterLimits(newMinWidth, 500);
  this.setSplitterSize((splitterSize - oldMinWidth) + newMinWidth);
};


/**
 * Handles clicks on the clear snapshot button.
 * @param {Event=} opt_e Event, if this came from a click.
 * @private
 */
wtf.hud.Overlay.prototype.clearSnapshotClicked_ = function(opt_e) {
  // Clear the current snapshot by restarting the session.
  wtf.trace.reset();
};


/**
 * Handles clicks on the send to UI button.
 * @param {Event=} opt_e Event, if this came from a click.
 * @private
 */
wtf.hud.Overlay.prototype.sendSnapshotClicked_ = function(opt_e) {
  // Send snapshot.
  var newWindow = false;
  if (opt_e) {
    if (goog.userAgent.MAC) {
      newWindow = opt_e.metaKey;
    } else {
      newWindow = opt_e.ctrlKey;
    }
    if (opt_e.button == goog.events.BrowserEvent.MouseButton.MIDDLE) {
      newWindow = true;
    }
  }
  this.sendSnapshot(newWindow);
};


/**
 * Handles clicks on the save button.
 * @param {Event=} opt_e Event, if this came from a click.
 * @private
 */
wtf.hud.Overlay.prototype.saveSnapshotClicked_ = function(opt_e) {
  wtf.trace.snapshot();
};


/**
 * Handles clicks on the settings UI button.
 * @param {Event=} opt_e Event, if this came from a click.
 * @private
 */
wtf.hud.Overlay.prototype.settingsClicked_ = function(opt_e) {
  // If we failed to load settings from the injector, just yell at the user.
  if (this.options_.getBoolean('wtf.injector.failed', false)) {
    wtf.ui.ErrorDialog.show(
        'Unable to retrieve settings',
        'The extension could not load/store your settings due to <a ' +
        'target="_blank" ' +
        'href="https://code.google.com/p/chromium/issues/detail?id=295829">' +
        'Chrome bug 295829</a>. You won\'t be able to change them until it ' +
        'is fixed. Boo.',
        this.getDom());
    return;
  }

  // Show settings dialog.
  var dom = this.getDom();
  var body = dom.getDocument().body;
  goog.asserts.assert(body);
  var dialog = new wtf.ui.SettingsDialog(
      this.options_, 'Tracing Settings', this.getParentElement(), dom);

  // Add provider sections.
  var traceManager = wtf.trace.getTraceManager();
  var providers = traceManager.getProviders();
  var providersSections = [];
  for (var n = 0; n < providers.length; n++) {
    var provider = providers[n];
    goog.array.extend(providersSections, provider.getSettingsSectionConfigs());
  }

  var panes = [
    {
      'title': 'General',
      'sections': [
        {
          'title': 'HUD',
          'widgets': [
            {
              'type': 'dropdown',
              'key': 'wtf.hud.dock',
              'title': 'Dock at:',
              'options': [
                {'value': 'tl', 'title': 'Top Left'},
                {'value': 'tm', 'title': 'Top Middle'},
                {'value': 'tr', 'title': 'Top Right'},
                {'value': 'bl', 'title': 'Bottom Left'},
                {'value': 'bm', 'title': 'Bottom Middle'},
                {'value': 'br', 'title': 'Bottom Right'}
              ],
              'default': 'br'
            }
          ]
        }
      ]
    },
    {
      'title': 'Providers',
      'sections': providersSections
    }
  ];

  // Add addon panes.
  var addons = wtf.addon.getTraceAddons();
  for (var n = 0; n < addons.length; n++) {
    var manifest = addons[n].getManifest();
    var info = addons[n].getInfo();
    var addonSections = [
      {
        'title': 'Info',
        'widgets': [
          {
            'type': 'label',
            'title': 'Name:',
            'value': manifest.getName()
          },
          {
            'type': 'label',
            'title': 'Source:',
            'value': manifest.getUrl()
          }
        ]
      }
    ];
    goog.array.extend(addonSections, info.options);
    panes.push({
      'title': manifest.getName(),
      'sections': addonSections
    });
  }

  dialog.setup({
    'panes': panes
  });
};


/**
 * Sends a snapshot to the UI.
 * @param {boolean=} opt_newWindow Force into a new window.
 */
wtf.hud.Overlay.prototype.sendSnapshot = function(opt_newWindow) {
  var mode = this.options_.getString('wtf.hud.app.mode', 'page');
  var endpoint = this.options_.getOptionalString('wtf.hud.app.endpoint');
  switch (mode) {
    default:
    case 'page':
      this.sendSnapshotToPage_(endpoint, opt_newWindow);
      break;
    case 'remote':
      this.sendSnapshotToRemote_(endpoint);
      break;
  }
};


/**
 * Gets a fallback URL for the app maindisplay.html page.
 * This tries to guess the URL by looking for the WTF <script> tag, falling back
 * to a well-known address if that fails.
 * @return {string} URL of the maindisplay.html file.
 * @private
 */
wtf.hud.Overlay.prototype.getMainDisplayUrl_ = function() {
  // If we are compiled we can pull from the main appspot hosting site.
  // Otherwise, we are debug and should force to the current host.
  var baseUrl;
  if (COMPILED) {
    baseUrl = '//tracing-framework.appspot.com/CURRENT/';

    // If we find a script tag on the page with the injector js we can use that
    // as our base instead.
    var dom = this.getDom();
    var scripts = dom.getElementsByTagNameAndClass(goog.dom.TagName.SCRIPT);
    for (var n = 0; n < scripts.length; n++) {
      var script = scripts[n];
      if (script.src &&
          goog.string.endsWith(script.src, 'wtf_trace_web_js_compiled.js')) {
        // Use this as the script base.
        baseUrl = script.src;
        break;
      }
    }
  } else {
    var uri = new goog.Uri(goog.global.location.toString());
    uri.setPath('');
    baseUrl = uri.toString();
  }
  var uri = goog.Uri.resolve(baseUrl, 'app/maindisplay.html');
  return uri.toString();
};


/**
 * Sends a snapshot to a webpage via message channel.
 * @param {string=} opt_endpoint Target URL.
 * @param {boolean=} opt_newWindow Force into a new window.
 * @private
 */
wtf.hud.Overlay.prototype.sendSnapshotToPage_ = function(
    opt_endpoint, opt_newWindow) {
  // Get the page URL.
  var endpoint = opt_endpoint || this.getMainDisplayUrl_();
  var targetIsExtension =
      goog.string.startsWith(endpoint, 'chrome-extension://');

  // Only used in the !targetIsExtension case.
  var childChannelResult;

  // Open the target window now (if not an extension), so that we avoid the
  // popup blocker.
  if (!targetIsExtension) {
    childChannelResult = new goog.result.SimpleResult();

    // Wait for the child to connect. It's important to start waiting before
    // opening the child window so that we can be sure to have the onmessage
    // eventhandler set up before the child is able to open and send us a
    // message.
    wtf.ipc.waitForChildWindow(function(channel) {
      childChannelResult.setValue(channel);
    });

    // Create window and show.
    var windowName = this.lastWindowName_;
    if (opt_newWindow) {
      windowName = 'wtf_ui' + Date.now();
    }
    this.lastWindowName_ = windowName;
    window.open(endpoint + '?expect_data', windowName);
  }

  // Capture snapshot into memory buffers.
  // Sending may take a bit, so doing this now ensures we get the snapshot
  // immediately when requested.
  wtf.trace.snapshotAll(function(blobs) {
    var contentLength = 0;
    for (var n = 0; n < blobs.length; n++) {
      contentLength += blobs[n].getSize();
    }

    var traceManager = wtf.trace.getTraceManager();
    var contextInfo = traceManager.detectContextInfo();
    var contentSource = wtf.io.getTimedFilename(
        '', contextInfo.getFilename(), 'application/x-extension-wtf-trace');

    var contentTypes = [];
    var contentSources = [];
    for (var n = 0; n < blobs.length; n++) {
      contentTypes.push('application/x-extension-wtf-trace');
      contentSources.push(contentSource);
    }

    // TODO(benvanik): if the extension is attached always show snapshot through
    // it - this would ensure the UI runs in a different process.
    if (targetIsExtension) {
      // Opening in an extension window, need to marshal through the content
      // script to get it open.

      // Chrome extensions can read blobs cross-domain, so just give them
      // the blob URLs.
      var blobUrls = [];
      for (var i = 0; i < blobs.length; i++) {
        var blob = /** @type {!Blob} */ (wtf.io.Blob.toNative(blobs[i]));
        blobUrls.push(goog.fs.createObjectUrl(blob));
      }
      goog.asserts.assert(this.extensionChannel_);
      this.extensionChannel_.postMessage({
        'command': 'show_snapshot',
        'page_url': endpoint,
        'new_window': opt_newWindow || false,
        'content_types': contentTypes,
        'content_sources': contentSources,
        'content_urls': blobUrls,
        'content_length': contentLength
      });
    } else {
      // Regular pages don't support cross-domain reading. So we go the slow
      // path and read back our blobs as typed arrays and hope that the channel
      // supports transferrable arrays.
      var contentBuffers = new Array(blobs.length);
      var remainingReads = blobs.length;
      goog.array.forEach(blobs, function(blob, n) {
        blob.readAsArrayBuffer(function(value) {
          contentBuffers[n] = value;
          if (!--remainingReads) {
            childChannelResult.wait(function(result) {
              // Post now. Whew.
              result.getValue().postMessage({
                'command': 'snapshot',
                'content_types': contentTypes,
                'content_sources': contentSources,
                'content_buffers': contentBuffers,
                'content_length': contentLength
              }, contentBuffers);
            });
          }
        });
      });
    }
  }, this);
};


/**
 * Sends a snapshot to a remote UI over HTTP.
 * @param {string=} opt_endpoint Target host:port pair.
 * @private
 */
wtf.hud.Overlay.prototype.sendSnapshotToRemote_ = function(opt_endpoint) {
  // TODO(benvanik): something more sophisticated
  var host = COMPILED ? 'localhost:9023' : 'localhost:9024';
  host = opt_endpoint || host;
  var url = 'http://' + host + '/snapshot/upload';

  // Capture snapshot into memory buffers.
  wtf.trace.snapshot(url);
};


/**
 * Handles messages from the extension.
 * @param {!Object} data Message data.
 * @private
 */
wtf.hud.Overlay.prototype.extensionMessage_ = function(data) {
  // TODO(benvanik): handle messages from the extension.
};
