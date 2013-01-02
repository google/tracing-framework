/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tab bar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.Tabbar');

goog.require('goog.array');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.app.ui.tabbar');
goog.require('wtf.events');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.ui.Control');



/**
 * Tab bar control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.Tabbar = function(documentView, parentElement) {
  var dom = documentView.getDom();
  goog.base(this, parentElement, dom);

  /**
   * Parent document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * All panels, in their display order.
   * @type {!Array.<!wtf.app.ui.TabPanel>}
   * @private
   */
  this.panels_ = [];

  /**
   * A map of panels by panel path.
   * @type {!Object.<!wtf.app.ui.TabPanel>}
   * @private
   */
  this.panelsByPath_ = {};

  /**
   * A list of all tabs, in their display order.
   * @type {!Array.<!wtf.app.ui.Tabbar.Tab_>}
   * @private
   */
  this.tabs_ = [];

  /**
   * Currently selected tab.
   * @type {wtf.app.ui.Tabbar.Tab_?}
   * @private
   */
  this.selectedTab_ = null;

  var keyboard = wtf.events.getWindowKeyboard(dom);

  /**
   * Keyboard scope for tab selection.
   * @type {!wtf.events.KeyboardScope}
   * @private
   */
  this.keyboardScope_ = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(this.keyboardScope_);

  this.keyboardScope_.addShortcut(
      'ctrl+open-square-bracket', this.previousTab_, this);
  this.keyboardScope_.addShortcut(
      'ctrl+close-square-bracket', this.nextTab_, this);
};
goog.inherits(wtf.app.ui.Tabbar, wtf.ui.Control);


/**
 * @typedef {{name: string, tabElement: !Element, panel: !wtf.app.ui.TabPanel}}
 * @private
 */
wtf.app.ui.Tabbar.Tab_;


/**
 * @override
 */
wtf.app.ui.Tabbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.tabbar.control, undefined, undefined, dom));
};


/**
 * Adds a new panel.
 * @param {!wtf.app.ui.TabPanel} panel New panel.
 */
wtf.app.ui.Tabbar.prototype.addPanel = function(panel) {
  var dom = this.getDom();

  // Create tab button.
  var name = panel.getName();
  var tabElement = dom.createElement(goog.dom.TagName.A);
  goog.dom.classes.add(tabElement, goog.getCssName('kTab'));
  dom.setTextContent(tabElement, name);
  dom.appendChild(
      this.getChildElement(goog.getCssName('kTabHeaderTabs')),
      tabElement);
  this.getHandler().listen(
      tabElement,
      goog.events.EventType.CLICK,
      function(e) {
        e.preventDefault();
        this.setSelectedPanel(panel);
      }, false, this);

  // Stash. Register for disposable so it's cleaned up when the tabbar dies.
  this.panels_.push(panel);
  this.panelsByPath_[panel.getPath()] = panel;
  this.registerDisposable(panel);
  this.tabs_.push({
    name: name,
    tabElement: tabElement,
    panel: panel
  });

  // Add to DOM now - we don't defer in case the panel expects to really be
  // in the DOM.
  dom.appendChild(
      this.getChildElement(goog.getCssName('appUiTabbarContents')),
      panel.getRootElement());

  // Select the first panel added by default.
  if (this.panels_.length == 1) {
    this.setSelectedPanel(panel);
  }

  // Register a key chord for this tab.
  this.keyboardScope_.addShortcut(
      'ctrl+' + (1 + (this.panels_.length - 1)),
      function() {
        this.setSelectedPanel(panel);
      }, this);
};


/**
 * Gets a list of all panels.
 * @return {!Array.<!wtf.app.ui.TabPanel>} A list of panels. Do not modify.
 */
wtf.app.ui.Tabbar.prototype.getPanels = function() {
  return this.panels_;
};


/**
 * Gets the currently selected panel, if any.
 * @return {wtf.app.ui.TabPanel} Selected panel, if any is selected.
 */
wtf.app.ui.Tabbar.prototype.getSelectedPanel = function() {
  return this.selectedTab_ ? this.selectedTab_.panel : null;
};


/**
 * Sets the selected panel, or clears the selection.
 * @param {wtf.app.ui.TabPanel} value New panel to select.
 */
wtf.app.ui.Tabbar.prototype.setSelectedPanel = function(value) {
  var newTab = value ? this.getTabForPanel_(value) : null;
  if (this.selectedTab_ == newTab) {
    return;
  }

  var oldTab = this.selectedTab_;
  this.selectedTab_ = null;
  if (oldTab) {
    goog.dom.classes.enable(
        oldTab.tabElement, goog.getCssName('kTabSelected'), false);
    oldTab.panel.setVisible(false);
  }

  if (!newTab) {
    return;
  }

  this.selectedTab_ = newTab;
  goog.dom.classes.enable(
      newTab.tabElement, goog.getCssName('kTabSelected'), true);
  newTab.panel.setVisible(true);
  newTab.panel.layout();
};


/**
 * Switches to the previous tab from the currently selected one.
 * @private
 */
wtf.app.ui.Tabbar.prototype.previousTab_ = function() {
  if (!this.selectedTab_ || !this.tabs_.length) {
    return;
  }
  var index = goog.array.indexOf(this.tabs_, this.selectedTab_);
  index--;
  if (index < 0) {
    index = this.tabs_.length - 1;
  }
  this.setSelectedPanel(this.tabs_[index].panel);
};


/**
 * Switches to the next tab from the currently selected one.
 * @private
 */
wtf.app.ui.Tabbar.prototype.nextTab_ = function() {
  if (!this.selectedTab_ || !this.tabs_.length) {
    return;
  }
  var index = goog.array.indexOf(this.tabs_, this.selectedTab_);
  index++;
  if (index > this.tabs_.length - 1) {
    index = 0;
  }
  this.setSelectedPanel(this.tabs_[index].panel);
};


/**
 * Navigates to the given panel path.
 * @param {string} path Panel path.
 */
wtf.app.ui.Tabbar.prototype.navigate = function(path) {
  var parts = path.split('/');
  if (parts.length) {
    var panel = this.panelsByPath_[parts[0]];
    if (panel) {
      this.setSelectedPanel(panel);
      panel.navigate(parts.slice(1));
    } else {
      goog.global.console.log('Unknown panel path: ' + path);
    }
  }
};


/**
 * Gets the tab entry for the given panel.
 * @param {!wtf.app.ui.TabPanel} panel Panel.
 * @return {wtf.app.ui.Tabbar.Tab_?} Tab for the given panel, if found.
 * @private
 */
wtf.app.ui.Tabbar.prototype.getTabForPanel_ = function(panel) {
  for (var n = 0; n < this.tabs_.length; n++) {
    if (this.tabs_[n].panel == panel) {
      return this.tabs_[n];
    }
  }
  return null;
};


/**
 * Handles sizing/layout.
 * This is called by the document view when the control size changes.
 */
wtf.app.ui.Tabbar.prototype.layout = function() {
  if (this.selectedTab_) {
    this.selectedTab_.panel.layout();
  }
};
