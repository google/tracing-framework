/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Loading dialog screen.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.LoadingDialog');

goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.app.ui.LoaderEntry');
goog.require('wtf.app.ui.loadingdialog');
goog.require('wtf.ui.Dialog');



/**
 * Loading overlay screen.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {!Array.<!wtf.app.ui.LoaderEntry>} entries Loader entries.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.app.ui.LoadingDialog = function(parentElement, entries, opt_dom) {
  goog.base(this, {
    modal: true,
    clickToClose: false
  }, parentElement, opt_dom);

  for (var n = 0; n < entries.length; n++) {
    this.addEntryRow_(entries[n]);
  }
  this.center();
};
goog.inherits(wtf.app.ui.LoadingDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.ui.LoadingDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.loadingdialog.control, {
      }, undefined, dom));
};


/**
 * Adds a progress row for a loader entry.
 * @param {!wtf.app.ui.LoaderEntry} entry Loader entry.
 * @private
 */
wtf.app.ui.LoadingDialog.prototype.addEntryRow_ = function(entry) {
  var dom = this.getDom();

  var sourceInfo = entry.getSourceInfo();

  var el = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.loadingdialog.entry, {
        filename: sourceInfo.filename
      }, undefined, dom));
  dom.appendChild(this.getChildElement(goog.getCssName('list')), el);

  var progressTrackEl = this.getChildElement(
      goog.getCssName('track'), el);
  var progressTextEl = this.getChildElement(
      goog.getCssName('percentComplete'), el);
  entry.addListener(wtf.app.ui.LoaderEntry.EventType.PROGRESS,
      function(loaded, total) {
        var percent = Math.floor(loaded / total * 100);
        goog.style.setWidth(progressTrackEl, percent + '%');
        dom.setTextContent(progressTextEl, String(percent));
      }, this);
};
