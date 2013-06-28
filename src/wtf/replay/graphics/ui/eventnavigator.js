/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Navigation of events in graphics replay.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.EventNavigator');

goog.require('goog.soy');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.ui.EventNavigatorTableSource');
goog.require('wtf.replay.graphics.ui.eventNavigator');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.VirtualTable');



/**
 * Navigation of events control.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.EventNavigator = function(
    playback, parentElement, opt_domHelper) {
  goog.base(this, parentElement, opt_domHelper);

  /**
   * Source of table.
   * @type {!wtf.replay.graphics.ui.EventNavigatorTableSource}
   * @private
   */
  this.tableSource_ =
      new wtf.replay.graphics.ui.EventNavigatorTableSource(playback);
  this.registerDisposable(this.tableSource_);

  /**
   * Results table.
   * @type {!wtf.ui.VirtualTable}
   * @private
   */
  this.table_ = new wtf.ui.VirtualTable(
      this.getChildElement(
          goog.getCssName('replayGraphicsEventNavigatorTable')),
      this.getDom());
  this.registerDisposable(this.table_);
  this.table_.setSource(this.tableSource_);

  // Listen to changes in step.
  this.listenToStepUpdates_(playback);
};
goog.inherits(wtf.replay.graphics.ui.EventNavigator, wtf.ui.Control);


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigator.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.eventNavigator.controller,
      undefined, undefined, dom));
};


/**
 * Changes the layout of elements to fit the container.
 */
wtf.replay.graphics.ui.EventNavigator.prototype.layout = function() {
  this.table_.layout();
};


/**
 * Ensures that the event table updates when the step changes.
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @private
 */
wtf.replay.graphics.ui.EventNavigator.prototype.listenToStepUpdates_ =
    function(playback) {
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.STEP_CHANGED,
      function() {
        this.tableSource_.invalidate();
      }, this);
};
