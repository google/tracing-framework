/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HUD settings dialog.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.hud.SettingsDialog');

goog.require('goog.soy');
goog.require('wtf.hud.settingsdialog');
goog.require('wtf.ui.Dialog');



/**
 * Settings dialog control.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.hud.SettingsDialog = function(parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);

  // Add stylesheet to page.
  // Note that we don't use GSS so that we can avoid another file dependency
  // and renaming issues.
  var dom = this.getDom();
  dom.appendChild(this.getParentElement(),
      /** @type {!Element} */ (goog.soy.renderAsFragment(
          wtf.hud.settingsdialog.style, undefined, undefined, dom)));
};
goog.inherits(wtf.hud.SettingsDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.hud.SettingsDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.hud.settingsdialog.control, undefined, undefined, dom));
};
