/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview 'Query' panel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.query.QueryPanel');

goog.require('goog.dom.TagName');
goog.require('goog.soy');
goog.require('wtf.app.ui.TabPanel');
goog.require('wtf.app.ui.query.querypanel');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.ui.SearchControl');
goog.require('wtf.util');



/**
 * Query panel, allowing for database query.
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @constructor
 * @extends {wtf.app.ui.TabPanel}
 */
wtf.app.ui.query.QueryPanel = function(documentView) {
  goog.base(this, documentView, 'query', 'Query');
  var dom = this.getDom();

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  var headerEl = this.getChildElement(
      goog.getCssName('headerLeft'));
  /**
   * Search text field.
   * @type {!wtf.ui.SearchControl}
   * @private
   */
  this.searchControl_ = new wtf.ui.SearchControl(headerEl, dom);
  this.registerDisposable(this.searchControl_);
  this.searchControl_.setPlaceholderText('XPath-like query');

  var commandManager = wtf.events.getCommandManager();
  commandManager.registerSimpleCommand(
      'query', function(source, target, expression) {
        this.issueQuery_(expression);
      }, this);

  this.searchControl_.addListener(
      wtf.events.EventType.INVALIDATED,
      function(newValue, oldValue) {
        commandManager.execute('query', this, null, newValue);
      }, this);

  // Setup keyboard hooks. These are only valid when the panel is active.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  /**
   * Keyboard scope.
   * @type {!wtf.events.KeyboardScope}
   * @private
   */
  this.keyboardScope_ = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(this.keyboardScope_);
  this.setupKeyboardShortcuts_();
};
goog.inherits(wtf.app.ui.query.QueryPanel, wtf.app.ui.TabPanel);


/**
 * @override
 */
wtf.app.ui.query.QueryPanel.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  commandManager.unregisterCommand('filter_events');
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.ui.query.QueryPanel.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.query.querypanel.control, undefined, undefined, dom));
};


/**
 * Sets up some simple keyboard shortcuts.
 * @private
 */
wtf.app.ui.query.QueryPanel.prototype.setupKeyboardShortcuts_ = function() {
  var commandManager = wtf.events.getCommandManager();
  var keyboardScope = this.keyboardScope_;

  keyboardScope.addShortcut('command+f', function() {
    this.searchControl_.focus();
  }, this);
  keyboardScope.addShortcut('esc', function() {
    commandManager.execute('query', this, null, '');
  }, this);
};


/**
 * @override
 */
wtf.app.ui.query.QueryPanel.prototype.setVisible = function(value) {
  goog.base(this, 'setVisible', value);
  this.keyboardScope_.setEnabled(value);
};


/**
 * @override
 */
wtf.app.ui.query.QueryPanel.prototype.navigate = function(pathParts) {
  // TODO(benvanik): support navigation
};


/**
 * Issues a query.
 * @param {string} expression Query string.
 * @private
 */
wtf.app.ui.query.QueryPanel.prototype.issueQuery_ = function(expression) {
  var dom = this.getDom();

  var resultsEl = this.getChildElement(goog.getCssName('results'));
  dom.setTextContent(resultsEl, '');

  var infoEl = this.getChildElement(goog.getCssName('headerRight'));
  dom.setTextContent(infoEl, '');

  this.searchControl_.setValue(expression);
  if (!expression.length) {
    this.searchControl_.toggleError(false);
    return;
  }

  var query;
  try {
    query = this.db_.query(expression);
    this.searchControl_.toggleError(false);
  } catch (e) {
    resultsEl.innerText = e.toString();
    this.searchControl_.toggleError(true);
    return;
  }

  var result = query.getValue();

  dom.setTextContent(infoEl,
      (goog.isArray(result) ? result.length : 1) +
      ' hits in ' + wtf.util.formatSmallTime(query.getDuration()));

  this.addResults_(resultsEl, result);
};


/**
 * Adds results to the given element.
 * @param {!Element} resultsEl Results element.
 * @param {wtf.analysis.db.QueryResultType} result Result.
 * @private
 */
wtf.app.ui.query.QueryPanel.prototype.addResults_ = function(
    resultsEl, result) {
  var dom = this.getDom();
  if (typeof result == 'boolean' ||
      typeof result == 'number' ||
      typeof result == 'string') {
    var el = dom.createElement(goog.dom.TagName.DIV);
    dom.setTextContent(el, result.toString());
    resultsEl.appendChild(el);
    return;
  } else if (!result || (goog.isArray(result) && !result.length)) {
    var el = dom.createElement(goog.dom.TagName.DIV);
    dom.setTextContent(el, 'Nothing matched');
    resultsEl.appendChild(el);
    return;
  }

  if (goog.isArray(result)) {
    for (var n = 0; n < result.length; n++) {
      this.addResults_(resultsEl, result[n]);
    }
  } else {
    var el = dom.createElement(goog.dom.TagName.DIV);
    dom.setTextContent(el, result.toString());
    resultsEl.appendChild(el);
  }
};
