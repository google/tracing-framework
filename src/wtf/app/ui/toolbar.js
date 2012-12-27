/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Toolbar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.Toolbar');

goog.require('goog.Uri');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.app.ui.toolbar');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.events');
goog.require('wtf.ui.Control');



/**
 * Toolbar control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.Toolbar = function(documentView, parentElement) {
  goog.base(this, parentElement, documentView.getDom());
  var eh = this.getHandler();

  /**
   * Parent document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  eh.listen(
      this.getChildElement(goog.getCssName('appUiToolbarButtonOpen')),
      goog.events.EventType.CLICK,
      this.openClicked_, false);
  eh.listen(
      this.getChildElement(
          goog.getCssName('appUiToolbarButtonOpenDrive')),
      goog.events.EventType.CLICK,
      this.openDriveClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('appUiToolbarButtonShare')),
      goog.events.EventType.CLICK,
      this.shareClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('appUiToolbarButtonSave')),
      goog.events.EventType.CLICK,
      this.saveClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('appUiToolbarButtonSettings')),
      goog.events.EventType.CLICK,
      this.settingsClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('appUiToolbarButtonHelp')),
      goog.events.EventType.CLICK,
      this.helpClicked_, false);

  this.toggleButton(goog.getCssName('appUiToolbarButtonOpen'), true);
  this.toggleButton(goog.getCssName('appUiToolbarButtonOpenDrive'),
      !wtf.CHROME_EXTENSION);
  this.toggleButton(goog.getCssName('appUiToolbarButtonShare'), false);
  this.toggleButton(goog.getCssName('appUiToolbarButtonSave'), true);
  this.toggleButton(goog.getCssName('appUiToolbarButtonSettings'), true);
  this.toggleButton(goog.getCssName('appUiToolbarButtonHelp'), true);

  var db = documentView.getDatabase();
  db.addListener(
      wtf.analysis.db.EventDatabase.EventType.SOURCES_CHANGED,
      this.updateDisplay_,
      this);
  this.updateDisplay_();
};
goog.inherits(wtf.app.ui.Toolbar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.Toolbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.toolbar.control, undefined, undefined, dom));
};


/**
 * Updates the toolbar display with the latest source/context information.
 * @private
 */
wtf.app.ui.Toolbar.prototype.updateDisplay_ = function() {
  var dom = this.getDom();

  var db = this.documentView_.getDatabase();
  var sources = db.getSources();
  if (!sources.length) {
    return;
  }
  var source = sources[0];
  if (!(source instanceof wtf.data.ScriptContextInfo)) {
    return;
  }

  var titleEl = this.getChildElement(
      goog.getCssName('appUiToolbarInfoTitle'));
  var urlEl = this.getChildElement(
      goog.getCssName('appUiToolbarInfoUrl'));

  dom.setTextContent(titleEl, source.title || '');
  dom.setTextContent(urlEl, source.uri);
  dom.setProperties(urlEl, {
    'href': source.uri
  });

  // Begin refreshing the icon - this may take some time, as packaged apps
  // have some crazy silly security rules...
  var iconUri = goog.Uri.resolve(source.uri, '/favicon.ico').toString();
  if (source.icon && source.icon.uri) {
    iconUri = source.icon.uri;
  }
  this.refreshIcon_(iconUri);
};


/**
 * Refreshes the favicon from the given URI.
 * @param {string} uri Icon URI.
 * @private
 */
wtf.app.ui.Toolbar.prototype.refreshIcon_ = function(uri) {
  var dom = this.getDom();
  var iconEl = this.getChildElement(
      goog.getCssName('appUiToolbarInfoIcon'));

  // TODO(benvanik): use XHR to grab the ico - if it fails, use a default.
  // TODO(benvanik): a way that is compatible with security - this may mean
  //     a proxy, a custom HTTP client, or <webview> in nightly Chromes
  // http://www.google.com/s2/favicons?domain=www.something.com
  // if (goog.global.chrome.runtime) {
  //   faviconUri = "chrome://favicon/" + source.icon.uri;
  // }
  dom.setProperties(iconEl, {
    'src': uri
  });
};


/**
 * Handles 'open' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.openClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('open_trace', this, null);
};


/**
 * Handles 'open drive' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.openDriveClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('open_drive_trace', this, null);
};


/**
 * Handles 'share' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.shareClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('share_trace', this, null);
};


/**
 * Handles 'save' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.saveClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('save_trace', this, null);
};


/**
 * Handles 'settings' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.settingsClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('show_settings', this, null);
};


/**
 * Handles 'help' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.helpClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('toggle_help', this, null);
};
