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

goog.provide('wtf.app.tracks.TrackInfoBar');

goog.require('goog.positioning.Corner');
goog.require('goog.soy');
goog.require('goog.ui.Component');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.PopupMenu');
goog.require('wtf.app.tracks.StatisticsTableSource');
goog.require('wtf.app.tracks.trackinfobar');
goog.require('wtf.db.SortMode');
goog.require('wtf.db.Unit');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.SearchControl');
goog.require('wtf.ui.VirtualTable');



/**
 * TracksPanel infobar control.
 *
 * @param {!wtf.app.tracks.TracksPanel} tracksPanel Parent tracks panel.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.ResizableControl}
 */
wtf.app.tracks.TrackInfoBar = function(tracksPanel, parentElement) {
  var documentView = tracksPanel.getDocumentView();
  var dom = documentView.getDom();
  goog.base(
      this,
      wtf.ui.ResizableControl.Orientation.VERTICAL,
      goog.getCssName('splitter'),
      parentElement, dom);
  this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.BOTTOM_RIGHT);
  this.setSplitterLimits(300, undefined);

  /**
   * Parent tracks panel.
   * @type {!wtf.app.tracks.TracksPanel}
   * @private
   */
  this.tracksPanel_ = tracksPanel;

  var docView = this.tracksPanel_.getDocumentView();
  /**
   * Selection state.
   * @type {!wtf.app.Selection}
   * @private
   */
  this.selection_ = docView.getSelection();
  this.selection_.addListener(
      wtf.events.EventType.INVALIDATED, this.updateInfo_, this);

  /**
   * Search text field.
   * @type {!wtf.ui.SearchControl}
   * @private
   */
  this.searchControl_ = new wtf.ui.SearchControl(
      this.getChildElement(goog.getCssName('searchBox')), dom);
  this.registerDisposable(this.searchControl_);
  this.searchControl_.setPlaceholderText('Partial name or /regex/');

  /**
   * Results table.
   * @type {!wtf.ui.VirtualTable}
   * @private
   */
  this.table_ = new wtf.ui.VirtualTable(
      this.getChildElement(goog.getCssName('results')), dom);
  this.registerDisposable(this.table_);

  /**
   * Results table source.
   * @type {!wtf.app.tracks.StatisticsTableSource}
   * @private
   */
  this.tableSource_ = new wtf.app.tracks.StatisticsTableSource();
  this.registerDisposable(this.tableSource_);
  this.table_.setSource(this.tableSource_);

  /**
   * Current sort mode.
   * @type {wtf.db.SortMode}
   * @private
   */
  this.sortMode_ = wtf.db.SortMode.TOTAL_TIME;

  var unitName;
  var db = documentView.getDatabase();
  switch (db.getUnits()) {
    default:
    case wtf.db.Unit.TIME_MILLISECONDS:
      unitName = 'Time';
      break;
    case wtf.db.Unit.SIZE_KILOBYTES:
      unitName = 'Size';
      break;
    case wtf.db.Unit.COUNT:
      unitName = 'Value';
      break;
  }

  // Setup sort buttons.
  var menu = new goog.ui.PopupMenu(dom);
  this.registerDisposable(menu);
  menu.attach(
      this.getChildElement(goog.getCssName('sortButton')),
      goog.positioning.Corner.BOTTOM_LEFT);
  menu.setToggleMode(true);
  menu.addChild(new goog.ui.MenuItem(
      'Sort by Total ' + unitName, wtf.db.SortMode.TOTAL_TIME, dom), true);
  menu.addChild(new goog.ui.MenuItem(
      'Sort by Own ' + unitName, wtf.db.SortMode.OWN_TIME, dom), true);
  menu.addChild(new goog.ui.MenuItem(
      'Sort by Mean ' + unitName, wtf.db.SortMode.MEAN_TIME, dom), true);
  menu.addChild(new goog.ui.MenuItem(
      'Sort by Count', wtf.db.SortMode.COUNT, dom), true);
  menu.render();
  var eh = this.getHandler();
  menu.forEachChild(function(item) {
    item.setCheckable(true);
    eh.listen(item, goog.ui.Component.EventType.ACTION, function(e) {
      menu.forEachChild(function(otherItem) {
        otherItem.setChecked(false);
      });
      item.setChecked(true);
      this.searchControl_.focus();
      this.sortMode_ = item.getModel();
      this.updateInfo_();
    });
  });
  menu.getChildAt(0).setChecked(true);

  var commandManager = wtf.events.getCommandManager();
  commandManager.registerSimpleCommand(
      'filter_events', function(source, target, filterString, only) {
        if (only) {
          // TODO(benvanik): escape other characters?
          filterString =
              '/^' +
              filterString.replace(/([\.\$\-\*\+\[\]\(\)\{\}])/g, '\\$1') +
              '$/';
        }
        var parsed = this.selection_.setFilterExpression(filterString);
        this.searchControl_.toggleError(!parsed);
        this.searchControl_.setValue(filterString);
      }, this);

  this.searchControl_.addListener(
      wtf.events.EventType.INVALIDATED,
      function(newValue, oldValue) {
        commandManager.execute('filter_events', this, null, newValue);
      }, this);

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addShortcut('command+f', function() {
    this.searchControl_.focus();
  }, this);
  keyboardScope.addShortcut('esc', function() {
    commandManager.execute('filter_events', this, null, '');
  }, this);

  // Update on database change.
  // TODO(benvanik): avoid when streaming? make incremental?
  db.addListener(wtf.events.EventType.INVALIDATED, function() {
    this.updateInfo_();
  }, this);
  this.updateInfo_();
};
goog.inherits(wtf.app.tracks.TrackInfoBar, wtf.ui.ResizableControl);


/**
 * @override
 */
wtf.app.tracks.TrackInfoBar.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  commandManager.unregisterCommand('filter_events');
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.tracks.TrackInfoBar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.tracks.trackinfobar.control, undefined, undefined, dom));
};


/**
 * @override
 */
wtf.app.tracks.TrackInfoBar.prototype.layoutInternal = function() {
  goog.base(this, 'layoutInternal');
  this.table_.layout();
};


/**
 * Updates information based on the current filter.
 * This is called each time the filter changes.
 * @private
 */
wtf.app.tracks.TrackInfoBar.prototype.updateInfo_ = function() {
  // This will generate the stats on demand and may take some time.
  var table = this.selection_.getSelectionStatistics();

  var db = this.tracksPanel_.getDocumentView().getDatabase();
  this.tableSource_.setUnits(db.getUnits());

  this.tableSource_.update(table, this.sortMode_);
};
