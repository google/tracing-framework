/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview TracksPanel infobar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.tracks.TrackInfoBar');

goog.require('goog.soy');
goog.require('wtf.app.ui.tracks.trackinfobar');
goog.require('wtf.events.EventType');
goog.require('wtf.events.Keyboard');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.SearchControl');



/**
 * TracksPanel infobar control.
 *
 * @param {!wtf.app.ui.tracks.TracksPanel} tracksPanel Parent tracks panel.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.tracks.TrackInfoBar = function(tracksPanel, parentElement) {
  var documentView = tracksPanel.getDocumentView();
  var dom = documentView.getDom();
  goog.base(this, parentElement, dom);

  /**
   * Parent tracks panel.
   * @type {!wtf.app.ui.tracks.TracksPanel}
   * @private
   */
  this.tracksPanel_ = tracksPanel;

  /**
   * Search text field.
   * @type {!wtf.ui.SearchControl}
   * @private
   */
  this.searchControl_ = new wtf.ui.SearchControl(
      this.getChildElement(goog.getCssName('wtfAppUiTracksPanelInfoHeader')),
      dom);
  this.registerDisposable(this.searchControl_);

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.Keyboard.getWindowKeyboard(dom.getWindow());
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addShortcut('ctrl+f', function() {
    this.searchControl_.focus();
  }, this);

  var filter = this.tracksPanel_.getFilter();
  this.searchControl_.addListener(
      wtf.events.EventType.INVALIDATED,
      function(newValue, oldValue) {
        var parsed = filter.setFromString(newValue);
        this.searchControl_.toggleError(!parsed);
      }, this);
};
goog.inherits(wtf.app.ui.tracks.TrackInfoBar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.tracks.TrackInfoBar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.tracks.trackinfobar.control, undefined, undefined, dom));
};
