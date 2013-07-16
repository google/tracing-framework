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

goog.provide('wtf.app.HelpDialog');

goog.require('goog.soy');
goog.require('wtf');
goog.require('wtf.app.helpdialog');
goog.require('wtf.events.Keyboard');
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
wtf.app.HelpDialog = function(parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);
};
goog.inherits(wtf.app.HelpDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.HelpDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.helpdialog.control, {
        version: wtf.version.toString(),
        version_commit: wtf.version.getCommit(),
        system_key: wtf.events.Keyboard.SYSTEM_KEY,
        is_chrome_extension: wtf.CHROME_EXTENSION
      }, undefined, dom));
};
