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
goog.require('goog.string');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.app.ui.toolbar');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.io');
goog.require('wtf.ui.Control');
goog.require('wtf.util');



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
      this.getChildElement(goog.getCssName('wtfAppUiToolbarButtonShare')),
      goog.events.EventType.CLICK,
      this.shareClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('wtfAppUiToolbarButtonSave')),
      goog.events.EventType.CLICK,
      this.saveClicked_, false);
  eh.listen(
      this.getChildElement(goog.getCssName('wtfAppUiToolbarButtonSettings')),
      goog.events.EventType.CLICK,
      this.settingsClicked_, false);

  this.toggleButton(goog.getCssName('wtfAppUiToolbarButtonShare'), false);
  this.toggleButton(goog.getCssName('wtfAppUiToolbarButtonSave'), true);

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
      goog.getCssName('wtfAppUiToolbarInfoTitle'));
  var urlEl = this.getChildElement(
      goog.getCssName('wtfAppUiToolbarInfoUrl'));

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
      goog.getCssName('wtfAppUiToolbarInfoIcon'));

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
 * Handles 'share' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.shareClicked_ = function(e) {
  e.preventDefault();

  // TODO(benvanik): share current data
  window.console.log('share');
};


/**
 * Handles 'save' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.saveClicked_ = function(e) {
  e.preventDefault();

  var doc = this.documentView_.getDocument();
  var db = doc.getDatabase();
  var sources = db.getSources();
  if (!sources.length) {
    return;
  }
  // Just pick the first source for naming.
  var contextInfo = sources[0];
  var filename = contextInfo.getFilename();

  // prefix-YYYY-MM-DDTHH-MM-SS
  var dt = new Date();
  var filenameSuffix = '-' +
      dt.getFullYear() +
      goog.string.padNumber(dt.getMonth() + 1, 2) +
      goog.string.padNumber(dt.getDate(), 2) + 'T' +
      goog.string.padNumber(dt.getHours(), 2) +
      goog.string.padNumber(dt.getMinutes(), 2) +
      goog.string.padNumber(dt.getSeconds(), 2);
  filename += filenameSuffix;

  var storage = doc.getStorage();
  var dataStreams = storage.snapshotDataStreamBuffers();
  for (var n = 0; n < dataStreams.length; n++) {
    var dataStream = dataStreams[n];
    var streamFilename = filename;
    if (dataStreams.length > 1) {
      streamFilename += '-' + n;
    }
    switch (dataStream.type) {
      case 'application/x-extension-wtf-trace':
        streamFilename += wtf.io.FILE_EXTENSION;
        break;
    }
    wtf.util.downloadData([dataStream.data], streamFilename, dataStream.type);
  }
};


/**
 * Handles 'settings' button clicks.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.app.ui.Toolbar.prototype.settingsClicked_ = function(e) {
  e.preventDefault();

  // TODO(benvanik): show settings
  window.console.log('settings');
};
