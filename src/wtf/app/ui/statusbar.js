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

goog.provide('wtf.app.ui.Statusbar');

goog.require('goog.dom');
goog.require('goog.soy');
goog.require('wtf.app.ui.statusbar');
goog.require('wtf.events.EventType');
goog.require('wtf.ui.Control');
goog.require('wtf.util');



/**
 * Statusbar control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.Statusbar = function(documentView, parentElement) {
  goog.base(this, parentElement, documentView.getDom());

  /**
   * Parent document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Content DIVs.
   * @type {!Object.<!HTMLDivElement>}
   * @private
   */
  this.divs_ = {
    selection: this.getChildElement(
        goog.getCssName('wtfAppUiStatusbarSelection')),
    timeTotals: this.getChildElement(
        goog.getCssName('wtfAppUiStatusbarTimeTotals')),
    timeRange: this.getChildElement(
        goog.getCssName('wtfAppUiStatusbarTimeRange'))
  };

  var db = this.documentView_.getDatabase();
  db.addListener(wtf.events.EventType.INVALIDATED, this.update_, this);
  var selection = this.documentView_.getSelection();
  selection.addListener(wtf.events.EventType.INVALIDATED, this.update_, this);

  this.update_();
};
goog.inherits(wtf.app.ui.Statusbar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.Statusbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.statusbar.control, undefined, undefined, dom));
};


/**
 * Updates the statusbar when the database/selection/etc change.
 * @private
 */
wtf.app.ui.Statusbar.prototype.update_ = function() {
  var dom = this.getDom();
  var db = this.documentView_.getDatabase();
  var selection = this.documentView_.getSelection();

  var timebase = db.getTimebase();
  var firstEventTime = db.getFirstEventTime();
  var lastEventTime = db.getLastEventTime();
  var totalEventCount = db.getTotalEventCount();

  var zoneIndices = db.getZoneIndices();
  var totalTime = 0;
  var totalUserTime = 0;
  for (var n = 0; n < zoneIndices.length; n++) {
    var zoneIndex = zoneIndices[n];
    totalTime += zoneIndex.getRootTotalTime();
    totalUserTime += zoneIndex.getRootUserTime();
  }

  if (selection.hasTimeRangeSpecified()) {
    var selectionTimeStart = selection.getTimeStart();
    var selectionTimeEnd = selection.getTimeEnd();
    //
  }

  var table = selection.computeEventDataTable();
  var filteredEventCount = table.getFilteredEventCount();

  var selectionCounts = [
    filteredEventCount,
    totalEventCount
  ].join('/');
  goog.dom.setTextContent(this.divs_.selection, selectionCounts);

  goog.dom.setTextContent(this.divs_.timeTotals, [
    wtf.util.formatTime(totalUserTime) + ' u',
    wtf.util.formatTime(totalTime) + ' t'
  ].join('/') +
      ' (' + wtf.util.formatTime(lastEventTime - firstEventTime) + ')');

  goog.dom.setTextContent(this.divs_.timeRange, [
    wtf.util.formatWallTime(timebase + firstEventTime),
    wtf.util.formatWallTime(timebase + lastEventTime)
  ].join('-'));
};
