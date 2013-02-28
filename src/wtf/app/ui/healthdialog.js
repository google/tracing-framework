/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Health dialog screen.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.HealthDialog');

goog.require('goog.soy');
goog.require('wtf.app.ui.healthdialog');
goog.require('wtf.ui.Dialog');



/**
 * Health overlay screen.
 *
 * @param {!wtf.db.Database} db Database.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.app.ui.HealthDialog = function(db, parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);

  var healthInfo = db.getHealthInfo();
  goog.global.console.log(healthInfo);
};
goog.inherits(wtf.app.ui.HealthDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.ui.HealthDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.healthdialog.control, {
      }, undefined, dom));
};
