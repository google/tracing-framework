/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Timeline control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.nav.Timeline');

goog.require('goog.soy');
goog.require('wtf.app.ui.nav.TimelinePainter');
goog.require('wtf.app.ui.nav.timeline');
goog.require('wtf.doc.View');
goog.require('wtf.events.ListEventType');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.PaintContext');



/**
 * Timeline control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.nav.Timeline = function(documentView, parentElement) {
  var dom = documentView.getDom();
  goog.base(this, parentElement, dom);

  /**
   * Document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Timeline canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.timelineCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('wtfAppUiTimelineCanvas')));

  var doc = documentView.getDocument();
  var db = doc.getDatabase();

  // Hook the view list and bind to all existing views to track updates.
  // This allows us to show where each view is looking.
  var viewList = doc.getViewList();
  viewList.forEach(function(view) {
    view.addListener(
        wtf.doc.View.EventType.VISIBLE_RANGE_CHANGED,
        this.requestRepaint, this);
  }, this);
  viewList.addListener(
      wtf.events.ListEventType.VALUES_ADDED,
      function(values) {
        for (var n = 0; n < values.length; n++) {
          var view = values[n];
          view.addListener(
              wtf.doc.View.EventType.VISIBLE_RANGE_CHANGED,
              this.requestRepaint, this);
        }
      }, this);

  var paintContext = new wtf.ui.PaintContext(this.timelineCanvas_);
  this.setPaintContext(paintContext);

  /**
   * Timeline painter.
   * @type {!wtf.app.ui.nav.TimelinePainter}
   * @private
   */
  this.timelinePainter_ = new wtf.app.ui.nav.TimelinePainter(
      paintContext, documentView);

  this.requestRepaint();
};
goog.inherits(wtf.app.ui.nav.Timeline, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.nav.Timeline.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.nav.timeline.control, undefined, undefined, dom));
};
