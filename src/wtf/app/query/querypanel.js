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

goog.provide('wtf.app.query.QueryPanel');

goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.TabPanel');
goog.require('wtf.app.query.QueryTableSource');
goog.require('wtf.app.query.querypanel');
goog.require('wtf.db.Database');
goog.require('wtf.db.EventIterator');
goog.require('wtf.db.QueryDumpFormat');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.pal');
goog.require('wtf.ui.SearchControl');
goog.require('wtf.ui.VirtualTable');
goog.require('wtf.util');



/**
 * Query panel, allowing for database query.
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @constructor
 * @extends {wtf.app.TabPanel}
 */
wtf.app.query.QueryPanel = function(documentView) {
  goog.base(this, documentView, 'query', 'Query');
  var dom = this.getDom();

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  /**
   * Database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Search text field.
   * @type {!wtf.ui.SearchControl}
   * @private
   */
  this.searchControl_ = new wtf.ui.SearchControl(
      this.getChildElement(goog.getCssName('searchBox')), dom);
  this.registerDisposable(this.searchControl_);
  this.searchControl_.setPlaceholderText(
      'substring or /regex/ with optional (foo==123, bar!="something")');

  /**
   * Zone selection dropdown.
   * @type {!Element}
   * @private
   */
  this.zoneSelect_ = this.getChildElement(goog.getCssName('zoneSelect'));
  this.updateZoneList_();
  this.getHandler().listen(this.zoneSelect_, goog.events.EventType.CHANGE,
      this.reissueQuery_, false, this);

  /**
   * Results table.
   * @type {!wtf.ui.VirtualTable}
   * @private
   */
  this.table_ = new wtf.ui.VirtualTable(
      this.getChildElement(goog.getCssName('results')), dom);
  this.registerDisposable(this.table_);

  /**
   * Current query results, if any.
   * @type {wtf.db.QueryResult}
   * @private
   */
  this.currentResults_ = null;

  /**
   * Query info element.
   * @type {!Element}
   * @private
   */
  this.infoEl_ = this.getChildElement(goog.getCssName('resultInfo'));

  /**
   * Root empty display container.
   * This is shown when there is an error or the search box is empty.
   * @type {!Element}
   * @private
   */
  this.emptyEl_ = this.getChildElement(goog.getCssName('empty'));

  /**
   * Error display element.
   * @type {!Element}
   * @private
   */
  this.errorEl_ = this.getChildElement(goog.getCssName('error'));

  /**
   * A list of the button <a>'s for easy toggling.
   * @type {!Array.<!Element>}
   * @private
   */
  this.buttonEls_ = [
    this.getChildElement(goog.getCssName('saveCsvResults'))
  ];

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

  // Button handling.
  this.getHandler().listen(
      this.getChildElement(goog.getCssName('saveCsvResults')),
      goog.events.EventType.CLICK,
      function(e) {
        e.preventDefault();
        if (!this.currentResults_) {
          return;
        }

        var dump = this.currentResults_.dump(wtf.db.QueryDumpFormat.CSV);
        if (dump) {
          var pal = wtf.pal.getPlatform();
          pal.writeTextFile('wtf-query.csv', dump, 'text/csv');
        }
      }, false);

  db.addListener(wtf.db.Database.EventType.ZONES_ADDED,
      this.updateZoneList_, this);

  this.clear();
};
goog.inherits(wtf.app.query.QueryPanel, wtf.app.TabPanel);


/**
 * @override
 */
wtf.app.query.QueryPanel.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  commandManager.unregisterCommand('query');
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.query.QueryPanel.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.query.querypanel.control, undefined, undefined, dom));
};


/**
 * @override
 */
wtf.app.query.QueryPanel.prototype.layoutInternal = function() {
  this.table_.layout();
};


/**
 * Sets up some simple keyboard shortcuts.
 * @private
 */
wtf.app.query.QueryPanel.prototype.setupKeyboardShortcuts_ = function() {
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
wtf.app.query.QueryPanel.prototype.setVisible = function(value) {
  goog.base(this, 'setVisible', value);
  this.keyboardScope_.setEnabled(value);
  if (value) {
    this.searchControl_.focus();
  }
};


/**
 * @override
 */
wtf.app.query.QueryPanel.prototype.navigate = function(pathParts) {
  // TODO(benvanik): support navigation
};


/**
 * Updates the zone drop down.
 * @private
 */
wtf.app.query.QueryPanel.prototype.updateZoneList_ = function() {
  var dom = this.getDom();

  var selectedIndex = this.zoneSelect_.selectedIndex;

  dom.removeChildren(this.zoneSelect_);

  var zones = this.db_.getZones();
  for (var n = 0; n < zones.length; n++) {
    var zone = zones[n];

    var option = dom.createElement(goog.dom.TagName.OPTION);
    option.value = n;
    dom.setTextContent(option, zone.getName());
    dom.appendChild(this.zoneSelect_, option);
  }

  if (selectedIndex == -1) {
    selectedIndex = 0;
  }
  this.zoneSelect_.selectedIndex = selectedIndex;
};


/**
 * Clears the results.
 */
wtf.app.query.QueryPanel.prototype.clear = function() {
  var dom = this.getDom();

  // Clear results.
  this.currentResults_ = null;
  this.table_.setSource(null);
  dom.setTextContent(this.infoEl_, '');
  dom.setTextContent(this.errorEl_, '');

  // Clear errors/show empty help text.
  this.searchControl_.toggleError(false);
  goog.style.setElementShown(this.emptyEl_, true);
  goog.style.setElementShown(this.errorEl_, false);

  // Disable all buttons.
  for (var n = 0; n < this.buttonEls_.length; n++) {
    var buttonEl = this.buttonEls_[n];
    goog.dom.classes.add(buttonEl, goog.getCssName('kDisabled'));
  }
};


/**
 * Reissues the current query.
 * @private
 */
wtf.app.query.QueryPanel.prototype.reissueQuery_ = function() {
  this.issueQuery_(this.searchControl_.getValue());
};


/**
 * Issues a query.
 * @param {string} expression Query string.
 * @private
 */
wtf.app.query.QueryPanel.prototype.issueQuery_ = function(expression) {
  var dom = this.getDom();

  // Clear results.
  this.clear();

  // Attempt to set the search control.
  this.searchControl_.setValue(expression);
  if (!expression.length) {
    return;
  }

  // Get the target zone.
  var selectedIndex = this.zoneSelect_.selectedIndex;
  var zone = this.db_.getZones()[selectedIndex];
  if (!zone) {
    return;
  }

  // Create the query.
  // It throws if there's an error parsing it.
  var query;
  var error = null;
  try {
    query = zone.query(expression);
  } catch (e) {
    error = e.toString();
  }

  // Toggle error state.
  this.searchControl_.toggleError(!!error);
  goog.style.setElementShown(this.emptyEl_, !!error);
  goog.style.setElementShown(this.errorEl_, !!error);
  if (error) {
    dom.setTextContent(this.infoEl_, '');
    dom.setTextContent(this.errorEl_, error);
    return;
  }
  this.infoEl_.title = query.getCompiledExpression().toString();

  // Enable buttons.
  this.currentResults_ = query;
  for (var n = 0; n < this.buttonEls_.length; n++) {
    var buttonEl = this.buttonEls_[n];
    goog.dom.classes.remove(buttonEl, goog.getCssName('kDisabled'));
  }

  var result = query.getValue();
  var count = 0;
  if (result instanceof wtf.db.EventIterator) {
    count = result.getCount();
  } else if (count !== null) {
    count = 1;
  }

  // Update info with query stats.
  dom.setTextContent(this.infoEl_, count + ' hits in ' +
      wtf.util.formatSmallTime(query.getDuration()));

  // Update the table.
  if (result instanceof wtf.db.EventIterator) {
    // Show using table.
    var tableSource = new wtf.app.query.QueryTableSource(result);
    tableSource.setUnits(this.db_.getUnits());
    this.table_.setSource(tableSource);
  } else {
    // Show simple result.
  }
};
