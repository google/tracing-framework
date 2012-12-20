/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Help dialog screen.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.HelpDialog');

goog.require('goog.soy');
goog.require('wtf.app.ui.helpdialog');
goog.require('wtf.ui.Dialog');
goog.require('wtf.version');



/**
 * Help overlay screen.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.app.ui.HelpDialog = function(parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);
};
goog.inherits(wtf.app.ui.HelpDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.ui.HelpDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.helpdialog.control, {
        version: wtf.version.toString(),
        version_commit: wtf.version.getCommit()
      }, undefined, dom));
};
