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

goog.provide('wtf.app.HealthDialog');

goog.require('goog.soy');
goog.require('wtf.app.healthdialog');
goog.require('wtf.ui.Dialog');
goog.require('wtf.util');



/**
 * Health overlay screen.
 *
 * @param {!wtf.db.Database} db Database.
 * @param {!wtf.db.HealthInfo} healthInfo Health info.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.app.HealthDialog = function(db, healthInfo, parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);

  var dom = this.getDom();

  // Not all traces have this information.
  if (healthInfo.getOverheadPerScopeNs()) {
    dom.setTextContent(
        this.getChildElement(goog.getCssName('overheadPerScope')),
        (healthInfo.getOverheadPerScopeNs() / 1000) + '\u00B5s');
    dom.setTextContent(
        this.getChildElement(goog.getCssName('totalOverhead')),
        wtf.util.formatSmallTime(healthInfo.getTotalOverheadMs()) + ' ' +
        '(~' + healthInfo.getTotalOverheadPercent().toFixed(3) + '%)');
  }

  var warningsDiv = this.getChildElement(goog.getCssName('warningsList'));
  var warnings = healthInfo.getWarnings();
  for (var n = 0; n < warnings.length; n++) {
    var warning = warnings[n];

    var div = goog.soy.renderAsFragment(
        wtf.app.healthdialog.warning, {
          title: warning.getTitle(),
          suggestion: warning.getSuggestion(),
          details: warning.getDetails(),
          link: warning.getLink()
        }, undefined, dom);
    dom.appendChild(warningsDiv, div);
  }
};
goog.inherits(wtf.app.HealthDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.HealthDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.healthdialog.control, {
      }, undefined, dom));
};
