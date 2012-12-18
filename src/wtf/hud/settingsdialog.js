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

goog.require('goog.asserts');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.hud.settingsdialog');
goog.require('wtf.trace');
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
  var styleEl = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.hud.settingsdialog.style, undefined, undefined, dom));
  this.addRelatedElement(styleEl);
  dom.appendChild(this.getParentElement(), styleEl);

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

  /**
   * A map of feature enable flag values.
   * @type {!Object.<number>}
   * @private
   */
  this.featureMap_ = {};

  var featuresContainerEl =
      this.getChildElement('wtfHudSettingsGeneralFeaturesContent');
  var features = [
    {
      key: 'wtf.trace.provider.javascript',
      title: 'Javascript system events'
    }
  ];
  for (var n = 0; n < features.length; n++) {
    var featureKey = features[n].key;
    var featureTitle = features[n].title;
    var defaultValue = options.getNumber(featureKey, 0);
    this.featureMap_[featureKey] = defaultValue;
    this.addCheckbox_(
        featuresContainerEl,
        featureTitle,
        defaultValue > 0,
        function(value) {
          this.featureMap_[featureKey] = value ? 1 : 0;
        }, this);
  }

  this.loadSettings();

  wtf.trace.ignoreDomTree(this.getRootElement());
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

  for (var featureKey in this.featureMap_) {
    options.setNumber(featureKey, this.featureMap_[featureKey]);
  }

  options.endChanging();
};


/**
 * Adds a checkbox to the given element.
 * @param {!Element} parentElement Parent element.
 * @param {string} title Human-readable title.
 * @param {boolean} defaultValue Default value.
 * @param {function(this: T, boolean)} callback Callback called upon change.
 * @param {T=} opt_scope Callback scope.
 * @template T
 * @private
 */
wtf.hud.SettingsDialog.prototype.addCheckbox_ = function(
    parentElement, title, defaultValue, callback, opt_scope) {
  var dom = this.getDom();
  var eh = this.getHandler();

  var el = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.hud.settingsdialog.checkbox, {
        'title': title
      }, undefined, dom));
  dom.appendChild(parentElement, el);

  var inputEl = /** @type {HTMLInputElement} */ (
      dom.getElementsByTagNameAndClass(
          goog.dom.TagName.INPUT, null, this.rootElement_)[0]);
  goog.asserts.assert(inputEl);
  inputEl.checked = defaultValue;

  eh.listen(inputEl, goog.events.EventType.CHANGE, function(e) {
    var value = inputEl.checked;
    callback.call(opt_scope, value);
  });

  var titleEl = /** @type {Element} */ (
      dom.getElementsByTagNameAndClass(
          goog.dom.TagName.SPAN, null, this.rootElement_)[0]);
  goog.asserts.assert(titleEl);
  eh.listen(titleEl, goog.events.EventType.CLICK, function() {
    var value = !inputEl.checked;
    inputEl.checked = value;
    callback.call(opt_scope, value);
  });
};
