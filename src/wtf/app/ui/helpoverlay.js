/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Help overlay screen.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.HelpOverlay');

goog.require('goog.soy');
goog.require('wtf.app.ui.helpoverlay');
goog.require('wtf.ui.Dialog');



/**
 * Help overlay screen.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.app.ui.HelpOverlay = function(parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);
};
goog.inherits(wtf.app.ui.HelpOverlay, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.ui.HelpOverlay.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.helpoverlay.control, undefined, undefined, dom));
};
