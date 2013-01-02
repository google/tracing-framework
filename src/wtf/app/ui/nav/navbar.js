/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Navigation bar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.nav.Navbar');

goog.require('goog.soy');
goog.require('wtf.app.ui.nav.Framebar');
goog.require('wtf.app.ui.nav.Timeline');
goog.require('wtf.app.ui.nav.navbar');
goog.require('wtf.ui.ResizableControl');



/**
 * Navigation bar control.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {!Element} parentElement Element to display in.
 * @constructor
 * @extends {wtf.ui.ResizableControl}
 */
wtf.app.ui.nav.Navbar = function(documentView, parentElement) {
  goog.base(this,
      wtf.ui.ResizableControl.Orientation.HORIZONTAL,
      goog.getCssName('appUiNavbarSplitter'),
      parentElement, documentView.getDom());
  this.setSplitterLimits(wtf.app.ui.nav.Navbar.MIN_HEIGHT, undefined);

  /**
   * Parent document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * Timeline control.
   * @type {!wtf.app.ui.nav.Timeline}
   * @private
   */
  this.timeline_ = new wtf.app.ui.nav.Timeline(documentView,
      this.getChildElement(goog.getCssName('appUiNavbarTimeline')));
  this.registerDisposable(this.timeline_);

  /**
   * Framebar control.
   * @type {!wtf.app.ui.nav.Framebar}
   * @private
   */
  this.framebar_ = new wtf.app.ui.nav.Framebar(documentView,
      this.getChildElement(goog.getCssName('appUiNavbarFramebar')));
  this.registerDisposable(this.framebar_);
};
goog.inherits(wtf.app.ui.nav.Navbar, wtf.ui.ResizableControl);


/**
 * Minimum height of the navbar, in pixels.
 * @type {number}
 * @const
 */
wtf.app.ui.nav.Navbar.MIN_HEIGHT = 80;


/**
 * Maximum height of the navbar, in pixels.
 * @type {number}
 * @const
 */
wtf.app.ui.nav.Navbar.MAX_HEIGHT = 400;


/**
 * @override
 */
wtf.app.ui.nav.Navbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.nav.navbar.control, undefined, undefined, dom));
};


/**
 * Handles sizing/layout.
 * This is called by the document view when the control size changes.
 */
wtf.app.ui.nav.Navbar.prototype.layout = function() {
  this.timeline_.layout();
  this.framebar_.layout();
};
