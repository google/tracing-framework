/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Panel control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.EmptyTabPanel');
goog.provide('wtf.app.TabPanel');

goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.style');
goog.require('wtf.ui.Control');



/**
 * Abstract view panel control.
 *
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @param {string} path Path used for navigation.
 * @param {string} name Panel name.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.TabPanel = function(documentView, path, name) {
  var dom = documentView.getDom();
  var fragment = dom.getDocument().createDocumentFragment();
  var fragmentDiv = dom.createElement(goog.dom.TagName.DIV);
  fragment.appendChild(fragmentDiv);
  goog.base(this, fragmentDiv, dom);

  /**
   * Parent document view.
   * @type {!wtf.app.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Panel path used for navigation.
   * This is used as the root name when navigating, such as /mypanel/123/.
   * @type {string}
   * @private
   */
  this.path_ = path;

  /**
   * The panel name to display in the tab.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Whether the panel is visible.
   * @type {boolean}
   * @private
   */
  this.visible_ = false;
  goog.style.setElementShown(this.getRootElement(), false);
};
goog.inherits(wtf.app.TabPanel, wtf.ui.Control);


/**
 * Gets the parent document view.
 * @return {!wtf.app.DocumentView} Parent document view.
 */
wtf.app.TabPanel.prototype.getDocumentView = function() {
  return this.documentView_;
};


/**
 * Gets the path of the panel used for navigation.
 * @return {string} Panel path.
 */
wtf.app.TabPanel.prototype.getPath = function() {
  return this.path_;
};


/**
 * Gets the name of the panel to display in the tab.
 * @return {string} Panel name.
 */
wtf.app.TabPanel.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets a value indicating whether the panel is visible.
 * @return {boolean} True if the panel is visible.
 */
wtf.app.TabPanel.prototype.isVisible = function() {
  return this.visible_;
};


/**
 * Sets whether the panel is visible.
 * @param {boolean} value New visibility flag.
 */
wtf.app.TabPanel.prototype.setVisible = function(value) {
  this.visible_ = value;

  goog.style.setElementShown(this.getRootElement(), value);
};


/**
 * Navigates to the given panel path.
 * @param {!Array.<string>} pathParts Panel path parts split by /, excluding
 *     the panel path identifier.
 */
wtf.app.TabPanel.prototype.navigate = goog.nullFunction;



/**
 * A dummy empty panel.
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @param {string} path Path used for navigation.
 * @param {string} name Panel name.
 * @constructor
 * @extends {wtf.app.TabPanel}
 */
wtf.app.EmptyTabPanel = function(documentView, path, name) {
  goog.base(this, documentView, path, name);
};
goog.inherits(wtf.app.EmptyTabPanel, wtf.app.TabPanel);


/**
 * @override
 */
wtf.app.EmptyTabPanel.prototype.createDom = function(dom) {
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(el, goog.getCssName('appUiTabPanel'));
  dom.setTextContent(el, 'TODO');
  return el;
};
