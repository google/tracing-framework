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
goog.require('goog.style');
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
      goog.getCssName('wtfAppUiNavbarSplitter'),
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
      this.getChildElement(goog.getCssName('wtfAppUiNavbarTimeline')));
  this.registerDisposable(this.timeline_);
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
  var currentSize = goog.style.getSize(this.getChildElement(
      goog.getCssName('wtfAppUiNavbarFramebar')));
  // TODO(benvanik): disable framebar if currentSize.height == 0

  this.timeline_.layout();
};
