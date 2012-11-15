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

goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.hud.settingsdialog');
goog.require('wtf.ui.Dialog');



/**
 * Settings dialog control.
 * @param {!wtf.util.Options} options Options.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.hud.SettingsDialog = function(options, parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);

  /**
   * Options.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  // Add stylesheet to page.
  // Note that we don't use GSS so that we can avoid another file dependency
  // and renaming issues.
  var dom = this.getDom();
  dom.appendChild(this.getParentElement(),
      /** @type {!Element} */ (goog.soy.renderAsFragment(
          wtf.hud.settingsdialog.style, undefined, undefined, dom)));

  var eh = this.getHandler();
  eh.listen(
      this.getChildElement('wtfHudSettingsButtonSave'),
      goog.events.EventType.CLICK,
      function() {
        this.saveSettings();
        this.close();
      }, false, this);
  eh.listen(
      this.getChildElement('wtfHudSettingsButtonCancel'),
      goog.events.EventType.CLICK, this.close, false, this);

  this.loadSettings();
};
goog.inherits(wtf.hud.SettingsDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.hud.SettingsDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.hud.settingsdialog.control, undefined, undefined, dom));
};


/**
 * Loads settings and updates the UI.
 * @protected
 */
wtf.hud.SettingsDialog.prototype.loadSettings = function() {
  var options = this.options_;

  // TODO(benvanik): load settings

  var dockOption = options.getString('wtf.hud.dock', 'br');
  var wtfHudSettingsHudDockLocation = this.getChildElement(
      'wtfHudSettingsHudDockLocation');
  for (var n = 0; n < wtfHudSettingsHudDockLocation.options.length; n++) {
    var option = wtfHudSettingsHudDockLocation.options[n];
    if (option.value == dockOption) {
      wtfHudSettingsHudDockLocation.selectedIndex = n;
      break;
    }
  }
};


/**
 * Saves settings from the UI.
 * @protected
 */
wtf.hud.SettingsDialog.prototype.saveSettings = function() {
  var options = this.options_;
  options.beginChanging();

  // TODO(benvanik): save settings

  var wtfHudSettingsHudDockLocation = this.getChildElement(
      'wtfHudSettingsHudDockLocation');
  var dockOption = wtfHudSettingsHudDockLocation.options[
      wtfHudSettingsHudDockLocation.selectedIndex].value;
  options.setString('wtf.hud.dock', dockOption || 'br');

  options.endChanging();
};
