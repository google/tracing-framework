/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Statusbar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.Statusbar');

goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.statusbar');
goog.require('wtf.db.Unit');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.Keyboard');
goog.require('wtf.ui.Control');
goog.require('wtf.util');



/**
 * Statusbar control.
 *
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.Statusbar = function(documentView, parentElement) {
  goog.base(this, parentElement, documentView.getDom());

  /**
   * Parent document view.
   * @type {!wtf.app.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Content DIVs.
   * @type {!Object.<!HTMLDivElement>}
   * @private
   */
  this.divs_ = {
    selectionCounts: this.getChildElement(
        goog.getCssName('selectionCounts')),
    selectionTimes: this.getChildElement(
        goog.getCssName('selectionTimes')),
    timeTotals: this.getChildElement(
        goog.getCssName('timeTotals')),
    timeRange: this.getChildElement(
        goog.getCssName('timeRange'))
  };

  var commandManager = wtf.events.getCommandManager();
  var eh = this.getHandler();
  eh.listen(this.getChildElement('selectAll'),
      goog.events.EventType.CLICK, function(e) {
        e.preventDefault();
        commandManager.execute('select_all', this, null);
      });
  eh.listen(this.getChildElement('selectVisible'),
      goog.events.EventType.CLICK, function(e) {
        e.preventDefault();
        commandManager.execute('select_visible', this, null);
      });
  eh.listen(this.getChildElement('viewHealthLink'),
      goog.events.EventType.CLICK, function(e) {
        e.preventDefault();
        commandManager.execute('view_trace_health', this, null);
      });

  var db = this.documentView_.getDatabase();
  db.addListener(wtf.events.EventType.INVALIDATED, this.update_, this);
  var selection = this.documentView_.getSelection();
  selection.addListener(wtf.events.EventType.INVALIDATED, this.update_, this);

  this.update_();
};
goog.inherits(wtf.app.Statusbar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.Statusbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.statusbar.control, {
        system_key: wtf.events.Keyboard.SYSTEM_KEY
      }, undefined, dom));
};


/**
 * Updates the statusbar when the database/selection/etc change.
 * @private
 */
wtf.app.Statusbar.prototype.update_ = function() {
  var dom = this.getDom();
  var db = this.documentView_.getDatabase();
  var selection = this.documentView_.getSelection();
  var units = db.getUnits();

  if (!db.getLastEventTime()) {
    goog.style.setElementShown(this.getRootElement(), false);
    return;
  }
  goog.style.setElementShown(this.getRootElement(), true);

  var timebase = db.getTimebase();
  var firstEventTime = db.getFirstEventTime();
  var lastEventTime = db.getLastEventTime();
  var totalEventCount = 0;
  var zones = db.getZones();
  for (var n = 0; n < zones.length; n++) {
    var eventList = zones[n].getEventList();
    totalEventCount += eventList.getTotalEventCount();
  }

  var table = selection.getSelectionStatistics();
  var filteredEventCount = table.getEventCount();

  var selectionCounts = [
    filteredEventCount,
    totalEventCount
  ].join('/');
  dom.setTextContent(this.divs_.selectionCounts, selectionCounts);

  var totalDuration = wtf.db.Unit.format(lastEventTime - firstEventTime, units);
  if (selection.hasTimeRangeSpecified()) {
    var selectionTimeStart = selection.getTimeStart();
    var selectionTimeEnd = selection.getTimeEnd();
    dom.setTextContent(this.divs_.selectionTimes, [
      wtf.db.Unit.format(selectionTimeEnd - selectionTimeStart, units),
      totalDuration
    ].join('/'));
  } else {
    dom.setTextContent(this.divs_.selectionTimes, [
      totalDuration,
      totalDuration
    ].join('/'));
  }

  if (units == wtf.db.Unit.TIME_MILLISECONDS) {
    dom.setTextContent(this.divs_.timeRange, [
      wtf.util.formatWallTime(timebase + firstEventTime),
      wtf.util.formatWallTime(timebase + lastEventTime)
    ].join('-'));
  } else {
    dom.setTextContent(this.divs_.timeRange, '');
  }
};
