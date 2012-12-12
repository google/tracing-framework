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

goog.require('goog.dom.TagName');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf');
goog.require('wtf.analysis.db.InstanceEventDataEntry');
goog.require('wtf.analysis.db.ScopeEventDataEntry');
goog.require('wtf.analysis.db.SortMode');
goog.require('wtf.app.ui.tracks.trackinfobar');
goog.require('wtf.data.EventFlag');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.SearchControl');
goog.require('wtf.util');



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

  var docView = this.tracksPanel_.getDocumentView();
  /**
   * Selection state.
   * @type {!wtf.app.ui.Selection}
   * @private
   */
  this.selection_ = docView.getSelection();
  this.selection_.addListener(
      wtf.events.EventType.INVALIDATED, this.updateInfo_, this);

  var headerEl = this.getChildElement(
      goog.getCssName('wtfAppUiTracksPanelInfoHeader'));
  /**
   * Search text field.
   * @type {!wtf.ui.SearchControl}
   * @private
   */
  this.searchControl_ = new wtf.ui.SearchControl(headerEl, dom);
  this.registerDisposable(this.searchControl_);

  /**
   * Current sort mode.
   * @type {wtf.analysis.db.SortMode}
   * @private
   */
  this.sortMode_ = wtf.analysis.db.SortMode.TOTAL_TIME;

  // Add sort buttons.
  // TODO(benvanik): fancy dropdown popup button thing.
  var eh = this.getHandler();
  function addSortButton(title, tooltip, mode) {
    var el = dom.createElement(goog.dom.TagName.A);
    goog.style.setStyle(el, 'margin-left', '2px');
    el.innerText = title;
    el.title = tooltip;
    eh.listen(el, goog.events.EventType.CLICK, function(e) {
      e.preventDefault();
      this.sortMode_ = mode;
      this.updateInfo_();
    });
    dom.appendChild(headerEl, el);
  };
  addSortButton(
      'count', 'Sort by total event count.',
      wtf.analysis.db.SortMode.COUNT);
  addSortButton(
      'total', 'Sort by total event time.',
      wtf.analysis.db.SortMode.TOTAL_TIME);
  addSortButton(
      'mean', 'Sort by average event duration.',
      wtf.analysis.db.SortMode.MEAN_TIME);

  var commandManager = wtf.events.getCommandManager();
  commandManager.registerSimpleCommand(
      'filter_events', function(source, target, filterString) {
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
  keyboardScope.addShortcut('ctrl+f', function() {
    this.searchControl_.focus();
  }, this);
  keyboardScope.addShortcut('esc', function() {
    commandManager.execute('filter_events', this, null, '');
  }, this);

  // Update on database change.
  // TODO(benvanik): avoid when streaming? make incremental?
  var db = documentView.getDatabase();
  db.addListener(wtf.events.EventType.INVALIDATED, function() {
    this.updateInfo_();
  }, this);
};
goog.inherits(wtf.app.ui.tracks.TrackInfoBar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.tracks.TrackInfoBar.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  commandManager.unregisterCommand('filter_events');
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.ui.tracks.TrackInfoBar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.tracks.trackinfobar.control, undefined, undefined, dom));
};


/**
 * Updates information based on the current filter.
 * This is called each time the filter changes.
 * @private
 */
wtf.app.ui.tracks.TrackInfoBar.prototype.updateInfo_ = function() {
  var documentView = this.tracksPanel_.getDocumentView();
  var db = documentView.getDatabase();

  var beginTime = wtf.now();
  var table = this.selection_.computeEventDataTable();
  var updateDuration = wtf.now() - beginTime;
  //goog.global.console.log('update info', updateDuration);

  var contentEl = this.getChildElement(
      goog.getCssName('wtfAppUiTracksPanelInfoContent'));
  var dom = this.getDom();
  contentEl.innerText = '';

  var sortMode = this.sortMode_;
  table.forEach(function(entry) {
    // Ignore system events.
    if (entry.eventType.flags & wtf.data.EventFlag.INTERNAL) {
      return;
    }

    var el = this.buildTableRow_(entry, sortMode);
    dom.appendChild(contentEl, el);
  }, this, sortMode);
};


/**
 * Builds the HTML for a table row.
 * @param {!wtf.analysis.db.EventDataEntry} entry Event data entry.
 * @param {wtf.analysis.db.SortMode} sortMode Sort mode used.
 * @return {!Element} HTML element.
 * @private
 */
wtf.app.ui.tracks.TrackInfoBar.prototype.buildTableRow_ = function(
    entry, sortMode) {
  var dom = this.getDom();

  var eventType = entry.getEventType();
  var title = eventType.name;

  var content = '';
  if (entry instanceof wtf.analysis.db.ScopeEventDataEntry) {
    var totalTime = wtf.util.formatSmallTime(entry.getTotalTime());
    var userTime = wtf.util.formatSmallTime(entry.getUserTime());
    var meanTime = wtf.util.formatSmallTime(entry.getMeanTime());
    content +=
        entry.getCount() + ', ' +
        totalTime + ' t, ' +
        userTime + ' u, ' +
        meanTime + ' a';
  } else if (entry instanceof wtf.analysis.db.InstanceEventDataEntry) {
    content += entry.getCount();
  }

  var value = '';
  switch (sortMode) {
    case wtf.analysis.db.SortMode.COUNT:
      value = String(entry.getCount());
      break;
    case wtf.analysis.db.SortMode.TOTAL_TIME:
      value = totalTime || '';
      break;
    case wtf.analysis.db.SortMode.MEAN_TIME:
      value = meanTime || '';
      break;
  }

  var el = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.tracks.trackinfobar.entry, {
        'title': title,
        'value': value,
        'content': content
      }, undefined, dom));

  // TODO(benvanik): add event handlers for expansion/etc.
  var eh = this.getHandler();
  eh.listen(el, goog.events.EventType.CLICK, function(e) {
    e.preventDefault();
    var commandManager = wtf.events.getCommandManager();
    commandManager.execute('filter_events', this, null, eventType.name);
  }, true);

  return el;
};
