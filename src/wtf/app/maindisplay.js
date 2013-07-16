/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Main WTF UI.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.MainDisplay');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.addon');
goog.require('wtf.app.DocumentView');
goog.require('wtf.app.HelpDialog');
goog.require('wtf.app.Loader');
goog.require('wtf.app.SplashDialog');
goog.require('wtf.app.maindisplay');
goog.require('wtf.doc.Document');
goog.require('wtf.events.CommandManager');
goog.require('wtf.ipc');
goog.require('wtf.ipc.Channel');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.Dialog');
goog.require('wtf.ui.SettingsDialog');



/**
 * Main WTF UI.
 * Manages the main UI (menus/etc), active traces (and their trace views), etc.
 *
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!wtf.util.Options} options Options.
 * @param {Element=} opt_parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.MainDisplay = function(
    platform, options, opt_parentElement, opt_dom) {
  var dom = opt_dom || goog.dom.getDomHelper(opt_parentElement);
  var parentElement = /** @type {!Element} */ (
      opt_parentElement || dom.getDocument().body);
  goog.base(this, parentElement, dom);

  /**
   * Options overrides.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * Platform abstraction layer.
   * @type {!wtf.pal.IPlatform}
   * @private
   */
  this.platform_ = platform;

  /**
   * Command manager.
   * @type {!wtf.events.CommandManager}
   * @private
   */
  this.commandManager_ = new wtf.events.CommandManager();
  wtf.events.CommandManager.setShared(this.commandManager_);

  /**
   * Any active dialog.
   * @type {wtf.ui.Dialog}
   * @private
   */
  this.activeDialog_ = null;

  /**
   * The current document view, if any.
   * @type {wtf.app.DocumentView}
   * @private
   */
  this.documentView_ = null;

  /**
   * Tracing loading utility.
   * @type {!wtf.app.Loader}
   * @private
   */
  this.loader_ = new wtf.app.Loader(this);
  this.registerDisposable(this.loader_);

  /**
   * Parent window channel, if one exists.
   * @type {wtf.ipc.Channel}
   * @private
   */
  this.channel_ = null;
  wtf.ipc.connectToParentWindow(function(channel) {
    if (channel) {
      this.channel_ = channel;
      this.channel_.addListener(
          wtf.ipc.Channel.EventType.MESSAGE,
          this.channelMessage_, this);
    }
  }, this);

  // Setup command manager.
  this.commandManager_.registerSimpleCommand(
      'open_local_trace', this.requestLocalTraceLoad, this);
  this.commandManager_.registerSimpleCommand(
      'open_drive_trace', this.requestDriveTraceLoad, this);
  this.commandManager_.registerSimpleCommand(
      'show_settings', this.showSettings_, this);
  this.commandManager_.registerSimpleCommand(
      'toggle_help', this.toggleHelpDialog_, this);

  this.setupDragDropLoading_();

  // Look for launch arguments.
  var startupLoad = false;
  var launchUri = goog.Uri.parse(dom.getWindow().location.toString());
  var queryData = launchUri.getQueryData();
  if (queryData.containsKey('url')) {
    // ?url=a.wtf.trace,b.wtf-trace
    // A list of URLs to open via XHR.
    var urls = queryData.get('url');
    if (urls && urls.length) {
      _gaq.push(['_trackEvent', 'app', 'open_querystring_files']);
      this.loader_.loadUrls(urls.split(','));
      startupLoad = true;
    }
  } else if (queryData.containsKey('expect_data')) {
    // ?expect_data
    // Indicates that a snapshot is incoming and the UI should be ready for it.
    // Strip this off and reset the URL so that if the user reloads/etc it
    // doesn't mess things up.
    queryData.remove('expect_data');
    startupLoad = true;
  }

  // Replace URL with a sanitized version.
  if (goog.global.history && goog.global.history.replaceState) {
    goog.global.history.replaceState(null, dom.getDocument().title || '',
        launchUri.toString());
  }

  // Show the splash screen only if we aren't expecting data.
  if (!startupLoad) {
    this.showSplashDialog_(true);
  }
};
goog.inherits(wtf.app.MainDisplay, wtf.ui.Control);


/**
 * @override
 */
wtf.app.MainDisplay.prototype.disposeInternal = function() {
  goog.dispose(this.activeDialog_);
  this.activeDialog_ = null;

  goog.dom.removeNode(this.getRootElement());
  this.setDocumentView(null);

  wtf.events.CommandManager.setShared(null);

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.MainDisplay.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.maindisplay.control, {
      }, undefined, dom));
};


/**
 * Sets up drag-drop file loading for wtf-trace files.
 * @private
 */
wtf.app.MainDisplay.prototype.setupDragDropLoading_ = function() {
  var doc = this.getDom().getDocument();
  var eh = this.getHandler();
  eh.listen(doc.body, goog.events.EventType.DRAGENTER, function(e) {
    e.preventDefault();
  }, false, this);
  eh.listen(doc.body, goog.events.EventType.DRAGOVER, function(e) {
    e.preventDefault();
  }, false, this);
  eh.listen(doc.body, goog.events.EventType.DROP, function(e) {
    var browserEvent = e.getBrowserEvent();
    if (browserEvent.dataTransfer && browserEvent.dataTransfer.files &&
        browserEvent.dataTransfer.files.length) {
      e.stopPropagation();
      e.preventDefault();

      // Hide the splash dialog if it's up.
      this.showSplashDialog_(false);

      _gaq.push(['_trackEvent', 'app', 'open_drag_files']);

      this.loader_.loadFiles(browserEvent.dataTransfer.files);
    }
  }, false, this);
};


/**
 * Sets the title of the tab.
 * This portion is used as the suffix after the application name.
 * @param {string?} value New value, or null to clear.
 */
wtf.app.MainDisplay.prototype.setTitle = function(value) {
  var title = 'Web Tracing Framework';
  if (!COMPILED) {
    title += ' (DEBUG)';
  }
  if (value && value.length) {
    title += ': ' + value;
  }
  var doc = this.getDom().getDocument();
  doc.title = title;
};


/**
 * Gets the active document view.
 * @return {wtf.app.DocumentView} Document view, if any.
 */
wtf.app.MainDisplay.prototype.getDocumentView = function() {
  return this.documentView_;
};


/**
 * Sets the active document view, disposing any previous one.
 * @param {wtf.app.DocumentView} documentView New document view.
 * @param {boolean=} opt_preventSplash True to prevent the splash screen from
 *     being shown.
 */
wtf.app.MainDisplay.prototype.setDocumentView = function(documentView,
    opt_preventSplash) {
  if (this.documentView_ == documentView) {
    return;
  }

  goog.dispose(this.documentView_);
  this.documentView_ = null;

  // Show the splash dialog if needed.
  if (!opt_preventSplash) {
    this.showSplashDialog_(!documentView);
  }

  if (documentView) {
    // TODO(benvanik): notify of change?
    this.documentView_ = documentView;
  } else {
    this.setTitle(null);
  }
};


/**
 * Sets up a new document view for the given document and switches to it.
 * @param {!wtf.doc.Document} doc Document.
 * @return {!wtf.app.DocumentView} The new document view.
 */
wtf.app.MainDisplay.prototype.openDocument = function(doc) {
  _gaq.push(['_trackEvent', 'app', 'open_document']);

  var documentView = new wtf.app.DocumentView(
      this.getChildElement(goog.getCssName('appUiMainDocumentView')),
      this.getDom(),
      doc);
  this.setDocumentView(documentView);
  return documentView;
};


/**
 * Handles channel messages from the parent window.
 * @param {!Object} data Incoming data.
 * @private
 */
wtf.app.MainDisplay.prototype.channelMessage_ = function(data) {
  switch (data['command']) {
    case 'snapshot':
      this.handleSnapshotCommand_(data);
      break;
    case 'stream_created':
      this.handleStreamCreatedCommand_(data);
      break;
    case 'stream_appended':
      this.handleStreamAppendedCommand_(data);
      break;
  }
};


/**
 * Handles snapshot IPC commands.
 * @param {!Object} data Command data.
 * @private
 */
wtf.app.MainDisplay.prototype.handleSnapshotCommand_ = function(data) {
  this.loader_.loadSnapshot(data);
};


/**
 * Handles stream create IPC commands.
 * @param {!Object} data Command data.
 * @private
 */
wtf.app.MainDisplay.prototype.handleStreamCreatedCommand_ = function(data) {
  // var sessionId = data['session_id'];
  var streamId = data['stream_id'] || '0';
  var contentType = data['content_type'];

  _gaq.push(['_trackEvent', 'app', 'open_stream']);

  // TODO(benvanik): get from document? or in stream command?
  this.setTitle('streaming');

  // TODO(benvanik): support multiple streams into the same trace/etc
  var doc = new wtf.doc.Document(this.platform_);
  this.openDocument(doc);
  doc.beginEventStream(streamId, contentType);
};


/**
 * Handles stream append IPC commands.
 * @param {!Object} data Command data.
 * @private
 */
wtf.app.MainDisplay.prototype.handleStreamAppendedCommand_ = function(data) {
  // var sessionId = data['session_id'];
  var streamId = data['stream_id'] || '0';
  var datas = data['contents'];

  // Note that if this is not the right document the data is ignored.
  if (this.documentView_) {
    var doc = this.documentView_.getDocument();
    if (!doc.appendEventStreamData(streamId, datas)) {
      return;
    }
  }
};


/**
 * Requests a load of a trace file.
 */
wtf.app.MainDisplay.prototype.requestLocalTraceLoad = function() {
  this.loader_.requestLocalOpenDialog(function selected() {
    // Hide the splash dialog if it's up.
    this.showSplashDialog_(false);
  }, this);
};


/**
 * Requests a file load from Google Drive.
 */
wtf.app.MainDisplay.prototype.requestDriveTraceLoad = function() {
  // Hide the splash dialog if it's up.
  this.showSplashDialog_(false);

  this.loader_.requestDriveOpenDialog(function cancelled() {
    // Cancelled.
    // If nothing is displayed, show the splash dialog.
    if (!this.documentView_) {
      this.showSplashDialog_(true);
    }
  }, this);
};


/**
 * Shows the settings dialog.
 * @private
 */
wtf.app.MainDisplay.prototype.showSettings_ = function() {
  // Show settings dialog.
  var dom = this.getDom();
  var body = dom.getDocument().body;
  goog.asserts.assert(body);
  var dialog = new wtf.ui.SettingsDialog(
      this.options_, 'App Settings', body, dom);

  var panes = [
    {
      'title': 'General',
      'sections': [
        {
          'title': 'TODO',
          'widgets': [
            {
              'type': 'label',
              'title': 'Coming soon!',
              'value': ''
            }
          ]
        }
      ]
    }
  ];

  // Add addon panes.
  var addons = wtf.addon.getAppAddons();
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

  _gaq.push(['_trackEvent', 'app', 'show_settings']);
};


/**
 * Toggles the display of the help overlay.
 * @private
 */
wtf.app.MainDisplay.prototype.toggleHelpDialog_ = function() {
  // Close existing help dialog (only).
  if (this.activeDialog_) {
    if (this.activeDialog_ instanceof wtf.app.HelpDialog) {
      goog.dispose(this.activeDialog_);
      this.activeDialog_ = null;
    }
    return;
  }

  // Show help dialog.
  var body = this.getDom().getDocument().body;
  goog.asserts.assert(body);
  this.activeDialog_ = new wtf.app.HelpDialog(
      body,
      this.getDom());
  this.activeDialog_.addListener(wtf.ui.Dialog.EventType.CLOSED, function() {
    this.activeDialog_ = null;
  }, this);

  _gaq.push(['_trackEvent', 'app', 'show_help']);
};


/**
 * Toggles the display of the splash overlay.
 * @param {boolean} visible True to show.
 * @private
 */
wtf.app.MainDisplay.prototype.showSplashDialog_ = function(visible) {
  if (this.activeDialog_) {
    if (this.activeDialog_ instanceof wtf.app.SplashDialog) {
      if (visible) {
        // No-op - already visible.
        return;
      } else {
        // Hide.
        this.activeDialog_.close();
        this.activeDialog_ = null;
      }
    } else {
      // Another kind of dialog is up - ignore.
      return;
    }
  }

  if (!visible) {
    // Already hidden, ignore.
    return;
  }

  // Show splash dialog.
  var body = this.getDom().getDocument().body;
  goog.asserts.assert(body);
  this.activeDialog_ = new wtf.app.SplashDialog(
      body,
      this.getDom());
  this.activeDialog_.addListener(wtf.ui.Dialog.EventType.CLOSED, function() {
    this.activeDialog_ = null;
  }, this);
};
