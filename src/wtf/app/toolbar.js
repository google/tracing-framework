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

goog.provide('wtf.app.Toolbar');

goog.require('goog.Uri');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.toolbar');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.Keyboard');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.ui.Control');



/**
 * Toolbar control.
 *
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.Toolbar = function(documentView, parentElement) {
  goog.base(this, parentElement, documentView.getDom());
  var dom = this.getDom();
  var eh = this.getHandler();

  /**
   * Parent document view.
   * @type {!wtf.app.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  var healthPane = this.getChildElement(
      goog.getCssName('healthPane'));
  goog.style.setElementShown(healthPane, false);

  eh.listen(
      this.getChildElement(goog.getCssName('viewHealthLink')),
      goog.events.EventType.CLICK,
      this.viewHealthClicked_, false);

  eh.listen(
      this.getChildElement(goog.getCssName('buttonOpen')),
      goog.events.EventType.CLICK,
      this.openClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('buttonSave')),
      goog.events.EventType.CLICK,
      this.saveClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('buttonSettings')),
      goog.events.EventType.CLICK,
      this.settingsClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('buttonHelp')),
      goog.events.EventType.CLICK,
      this.helpClicked_, false);

  // Setup dropdown buttons.
  this.setupDropDownButton(
      goog.getCssName('buttonOpen'),
      goog.getCssName('buttonOpenDisclosure'), [
        {
          name: 'Open from File',
          command: 'open_local_trace'
        },
        {
          name: 'Open from Drive',
          command: 'open_drive_trace'
        }
      ]);
  this.setupDropDownButton(
      goog.getCssName('buttonSave'),
      goog.getCssName('buttonSaveDisclosure'), [
        {
          name: 'Save to File',
          command: 'save_local_trace'
        },
        {
          name: 'Save to Drive',
          command: 'save_drive_trace'
        }
      ]);

  this.toggleButton(goog.getCssName('buttonOpen'), true);
  this.toggleButton(goog.getCssName('buttonSave'), true);
  this.toggleButton(goog.getCssName('buttonSettings'), true);
  this.toggleButton(goog.getCssName('buttonHelp'), true);

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addCommandShortcut('command+o', 'open_local_trace');
  keyboardScope.addCommandShortcut('command+s', 'save_local_trace');
  keyboardScope.addCommandShortcut('shift+/', 'toggle_help');

  var db = documentView.getDatabase();
  db.addListener(
      wtf.events.EventType.INVALIDATED, this.updateDisplay_, this);
  this.updateDisplay_();
};
goog.inherits(wtf.app.Toolbar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.Toolbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.toolbar.control, {
        system_key: wtf.events.Keyboard.SYSTEM_KEY
      }, undefined, dom));
};


/**
 * Updates the toolbar display with the latest source/context information.
 * @private
 */
wtf.app.Toolbar.prototype.updateDisplay_ = function() {
  var dom = this.getDom();

  var db = this.documentView_.getDatabase();
  var sources = db.getSources();
  if (!sources.length) {
    return;
  }
  if (!sources[0].isInitialized()) {
    return;
  }
  var contextInfo = sources[0].getContextInfo();
  if (!(contextInfo instanceof wtf.data.ScriptContextInfo)) {
    return;
  }

  var titleEl = this.getChildElement(
      goog.getCssName('infoTitle'));
  var urlEl = this.getChildElement(
      goog.getCssName('infoUrl'));

  dom.setTextContent(titleEl, contextInfo.title || '');
  dom.setTextContent(urlEl, contextInfo.uri);
  dom.setProperties(urlEl, {
    'href': contextInfo.uri
  });

  // Begin refreshing the icon - this may take some time, as packaged apps
  // have some crazy silly security rules...
  var iconUri = goog.Uri.resolve(contextInfo.uri, '/favicon.ico').toString();
  if (contextInfo.icon && contextInfo.icon.uri) {
    iconUri = contextInfo.icon.uri;
  }
  this.refreshIcon_(iconUri);

  var healthInfo = this.documentView_.getHealthInfo();
  var healthPane = this.getChildElement(
      goog.getCssName('healthPane'));
  goog.style.setElementShown(healthPane, healthInfo.isBad());
};


/**
 * Refreshes the favicon from the given URI.
 * @param {string} uri Icon URI.
 * @private
 */
wtf.app.Toolbar.prototype.refreshIcon_ = function(uri) {
  var dom = this.getDom();
  var iconEl = this.getChildElement(
      goog.getCssName('infoIcon'));

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
 * Handles 'view health' link clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.Toolbar.prototype.viewHealthClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('view_trace_health', this, null);
};


/**
 * Handles 'open' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.Toolbar.prototype.openClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('open_local_trace', this, null);
};


/**
 * Handles 'save' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.Toolbar.prototype.saveClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('save_local_trace', this, null);
};


/**
 * Handles 'settings' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.Toolbar.prototype.settingsClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('show_settings', this, null);
};


/**
 * Handles 'help' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.Toolbar.prototype.helpClicked_ = function(e) {
  e.preventDefault();
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('toggle_help', this, null);
};
