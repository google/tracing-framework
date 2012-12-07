/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Document view control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.DocumentView');

goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.ui.EmptyTabPanel');
goog.require('wtf.app.ui.Selection');
goog.require('wtf.app.ui.Statusbar');
goog.require('wtf.app.ui.Tabbar');
goog.require('wtf.app.ui.Toolbar');
goog.require('wtf.app.ui.documentview');
goog.require('wtf.app.ui.nav.Navbar');
goog.require('wtf.app.ui.tracks.TracksPanel');
goog.require('wtf.events.EventType');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.zoom.Viewport');



/**
 * Document view control.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {!wtf.doc.Document} doc Document.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.DocumentView = function(parentElement, dom, doc) {
  goog.base(this, parentElement, dom);

  /**
   * Document.
   * @type {!wtf.doc.Document}
   * @private
   */
  this.document_ = doc;
  this.registerDisposable(this.document_);

  /**
   * Local view into the document.
   * @type {!wtf.doc.View}
   * @private
   */
  this.localView_ = doc.createView();

  /**
   * Selection state tracker.
   * @type {!wtf.app.ui.Selection}
   * @private
   */
  this.selection_ = new wtf.app.ui.Selection(doc.getDatabase());
  this.registerDisposable(this.selection_);

  // HACK(benvanik): replace with shared camera
  /**
   * All viewports that have been created, for linking.
   * @type {!Array.<!wtf.ui.zoom.Viewport>}
   * @private
   */
  this.viewports_ = [];

  /**
   * Toolbar.
   * @type {!wtf.app.ui.Toolbar}
   * @private
   */
  this.toolbar_ = new wtf.app.ui.Toolbar(this, this.getChildElement(
      goog.getCssName('wtfAppUiDocumentViewToolbar')));
  this.registerDisposable(this.toolbar_);

  /**
   * Navigation bar.
   * @type {!wtf.app.ui.nav.Navbar}
   * @private
   */
  this.navbar_ = new wtf.app.ui.nav.Navbar(this, this.getChildElement(
      goog.getCssName('wtfAppUiDocumentViewInner')));
  this.registerDisposable(this.navbar_);

  /**
   * Tab bar.
   * @type {!wtf.app.ui.Tabbar}
   * @private
   */
  this.tabbar_ = new wtf.app.ui.Tabbar(this, this.getChildElement(
      goog.getCssName('wtfAppUiDocumentViewInner')));
  this.registerDisposable(this.tabbar_);

  /**
   * Statusbar.
   * @type {!wtf.app.ui.Statusbar}
   * @private
   */
  this.statusbar_ = new wtf.app.ui.Statusbar(this, this.getChildElement(
      goog.getCssName('wtfAppUiDocumentViewStatusbar')));
  this.registerDisposable(this.statusbar_);

  // Relayout as required.
  var vsm = goog.dom.ViewportSizeMonitor.getInstanceForWindow();
  this.getHandler().listen(vsm, goog.events.EventType.RESIZE, function() {
    this.layout_();
  }, false);
  this.navbar_.addListener(
      wtf.ui.ResizableControl.EventType.SIZE_CHANGED,
      this.layout_, this);

  this.tabbar_.addPanel(new wtf.app.ui.tracks.TracksPanel(this));
  this.tabbar_.addPanel(new wtf.app.ui.EmptyTabPanel(
      this, 'console', 'Console'));
  this.tabbar_.addPanel(new wtf.app.ui.EmptyTabPanel(
      this, 'something', 'Something'));
  this.tabbar_.addPanel(new wtf.app.ui.EmptyTabPanel(
      this, 'mumble', 'Mumble'));
};
goog.inherits(wtf.app.ui.DocumentView, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.DocumentView.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.documentview.control, undefined, undefined, dom));
};


/**
 * Gets the document this is a view of.
 * @return {!wtf.doc.Document} Document.
 */
wtf.app.ui.DocumentView.prototype.getDocument = function() {
  return this.document_;
};


/**
 * Gets the database of the active document.
 * @return {!wtf.analysis.db.EventDatabase} Event database.
 */
wtf.app.ui.DocumentView.prototype.getDatabase = function() {
  return this.document_.getDatabase();
};


/**
 * Gets the local view.
 * @return {!wtf.doc.View} Local view.
 */
wtf.app.ui.DocumentView.prototype.getLocalView = function() {
  return this.localView_;
};


/**
 * Gets the selection state object for the view.
 * @return {!wtf.app.ui.Selection} Selection state.
 */
wtf.app.ui.DocumentView.prototype.getSelection = function() {
  return this.selection_;
};


/**
 * Registers a viewport for linking.
 * @param {!wtf.ui.zoom.Viewport} viewport Viewport.
 */
wtf.app.ui.DocumentView.prototype.registerViewport = function(viewport) {
  for (var n = 0; n < this.viewports_.length; n++) {
    wtf.ui.zoom.Viewport.link(
        this.viewports_[n],
        viewport);
  }
  this.viewports_.push(viewport);

  var db = this.getDatabase();
  db.addListener(wtf.events.EventType.INVALIDATED, function() {
    viewport.invalidate();
  });
};


/**
 * Performs javascript-based layout.
 * @private
 */
wtf.app.ui.DocumentView.prototype.layout_ = function() {
  // Update the tabbar with the latest size.
  var currentSize = goog.style.getSize(
      this.getChildElement(goog.getCssName('wtfAppUiDocumentViewInner')));
  var tabbarHeight = currentSize.height - this.navbar_.getSplitterSize();
  goog.style.setHeight(this.tabbar_.getRootElement(), tabbarHeight);

  // Reset limits and keep the splitter above the fold when resizing the window.
  var navbarMinHeight = wtf.app.ui.nav.Navbar.MIN_HEIGHT;
  var navbarMaxHeight = wtf.app.ui.nav.Navbar.MAX_HEIGHT;
  this.navbar_.setSplitterLimits(
      navbarMinHeight, Math.min(navbarMaxHeight, currentSize.height));
  if (this.navbar_.getSplitterSize() > currentSize.height - navbarMinHeight) {
    this.navbar_.setSplitterSize(
        Math.max(navbarMinHeight, currentSize.height - navbarMinHeight));
  }

  this.navbar_.layout();
  this.tabbar_.layout();
};


/**
 * Navigates to the given panel path.
 * @param {string} path Panel path.
 */
wtf.app.ui.DocumentView.prototype.navigate = function(path) {
  this.tabbar_.navigate(path);
};


/**
 * Zooms the local view to fit the data.
 */
wtf.app.ui.DocumentView.prototype.zoomToFit = function() {
  var db = this.getDatabase();
  var summaryIndex = db.getSummaryIndex();
  var firstEventTime = summaryIndex.getFirstEventTime();
  var lastEventTime = summaryIndex.getLastEventTime();
  if (!lastEventTime) {
    return;
  }

  if (!this.viewports_.length) {
    return;
  }
  var viewport = this.viewports_[0];
  var width = viewport.getScreenWidth();
  viewport.set(-1000, 0, width / (lastEventTime - firstEventTime + 2000));

  // TODO(benvanik): bind viewports to the local view correctly - right now they
  //     are inverted and this doesn't work as it should.
  // var view = this.localView_;
  // view.setVisibleRange(firstEventTime, lastEventTime);
};
