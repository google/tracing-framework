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

goog.require('goog.soy');
goog.require('wtf.app.ui.statusbar');
goog.require('wtf.ui.Control');



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
};
goog.inherits(wtf.app.ui.Statusbar, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.Statusbar.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.statusbar.control, undefined, undefined, dom));
};
