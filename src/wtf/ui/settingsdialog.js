/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Settings dialog.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.SettingsDialog');

goog.require('goog.asserts');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.trace.util');
goog.require('wtf.ui.Dialog');
goog.require('wtf.ui.settingsdialog');



/**
 * Settings dialog control.
 * @param {!wtf.util.Options} options Options.
 * @param {string} title Dialog title.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.ui.SettingsDialog = function(options, title, parentElement, opt_dom) {
  goog.base(this, {
    modal: true
  }, parentElement, opt_dom);

  /**
   * Options.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * All created panes.
   * @type {!Array.<!wtf.ui.SettingsDialog.Pane_>}
   * @private
   */
  this.panes_ = [];

  /**
   * All panes, mapped by their title.
   * @type {!Object.<!wtf.ui.SettingsDialog.Pane_>}
   * @private
   */
  this.panesByTitle_ = {};

  /**
   * The currently selected pane, if any.
   * @type {wtf.ui.SettingsDialog.Pane_}
   * @private
   */
  this.currentPane_ = null;

  /**
   * Dialog configuration.
   * See {@see wtf.ui.SettingsDialog#setup} for information on the format.
   * @type {Object}
   * @private
   */
  this.config_ = null;

  var dom = this.getDom();
  var titleEl = this.getChildElement(goog.getCssName('title'));
  dom.setTextContent(titleEl, title);

  var eh = this.getHandler();
  eh.listen(
      this.getChildElement(goog.getCssName('buttonSave')),
      goog.events.EventType.CLICK,
      function() {
        this.saveSettings();
        this.close();
      }, false, this);
  eh.listen(
      this.getChildElement(goog.getCssName('buttonCancel')),
      goog.events.EventType.CLICK, function() {
        this.close();
      }, false, this);
};
goog.inherits(wtf.ui.SettingsDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.ui.SettingsDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.settingsdialog.control, undefined, undefined, dom));
};


/**
 * Sets up a dialog with the given configuration.
 * The given configuration object describes the dialog as a set of panes
 * that contain sections containing widgets that represent options.
 * If no configuration is given it's assumed that the dialog has had all
 * panes/sections/widgets manually created via the various {@code add} functions
 * prior to calling this method.
 *
 * <code>
 * {
 *   "panes": [
 *     {
 *       "title": General",
 *       "sections": [
 *         {
 *           "title": "Something",
 *           "widgets": [
 *             {
 *               "type": "label",
 *               "title": "Something:",
 *               "value": "woo"
 *             },
 *             {
 *               "type": "checkbox",
 *               "key": "my.option.value",
 *               "title": "Some option",
 *               "default": false
 *             },
 *             {
 *               "type": "dropdown",
 *               "key": "my.option.value",
 *               "title": "Some choice:",
 *               "options": [
 *                 {"value": "a", "title": "A"}
 *               ],
 *               "default": "a"
 *             },
 *             {
 *               "type": "textbox",
 *               "key": "my.option.value",
 *               "title": "Some input:",
 *               "empty": "I'm empty!",
 *               "default": "Default value!"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * </code>
 *
 * @param {Object=} opt_config Configuration.
 */
wtf.ui.SettingsDialog.prototype.setup = function(opt_config) {
  this.config_ = opt_config || null;
  this.setupFromConfig_();

  wtf.trace.util.ignoreDomTree(this.getRootElement());
};


/**
 * Sets up the dialog from the current config.
 * See {@see wtf.ui.SettingsDialog#setup} for information on the format.
 * @private
 */
wtf.ui.SettingsDialog.prototype.setupFromConfig_ = function() {
  var config = this.config_;
  if (!config) {
    return;
  }

  for (var n = 0; n < config['panes'].length; n++) {
    var paneConfig = config['panes'][n];
    var pane = this.addPane(paneConfig['title']);
    for (var m = 0; m < paneConfig['sections'].length; m++) {
      var sectionConfig = paneConfig['sections'][m];
      var section = pane.addSection(sectionConfig['title']);
      for (var i = 0; i < sectionConfig['widgets'].length; i++) {
        var widgetConfig = sectionConfig['widgets'][i];
        switch (widgetConfig['type']) {
          case 'label':
            section.addLabel(
                widgetConfig['title'],
                widgetConfig['value']);
            break;
          case 'checkbox':
            section.addCheckbox(
                widgetConfig['key'],
                widgetConfig['title'],
                widgetConfig['default']);
            break;
          case 'dropdown':
            section.addDropdown(
                widgetConfig['key'],
                widgetConfig['title'],
                widgetConfig['options'],
                widgetConfig['default']);
            break;
          case 'textbox':
            section.addTextBox(
                widgetConfig['key'],
                widgetConfig['title'],
                widgetConfig['empty'],
                widgetConfig['default']);
            break;
        }
      }
    }
  }
};


/**
 * Saves settings from the UI.
 * @protected
 */
wtf.ui.SettingsDialog.prototype.saveSettings = function() {
  var options = this.options_;
  options.beginChanging();

  for (var n = 0; n < this.panes_.length; n++) {
    var pane = this.panes_[n];
    for (var m = 0; m < pane.sections_.length; m++) {
      var section = pane.sections_[m];
      for (var i = 0; i < section.widgets_.length; i++) {
        var widget = section.widgets_[i];
        widget.save();
      }
    }
  }

  options.endChanging();
};


/**
 * Creates a settings pane.
 * @param {string} title Displayed title.
 * @return {!wtf.ui.SettingsDialog.Pane_} The new pane.
 */
wtf.ui.SettingsDialog.prototype.addPane = function(title) {
  var dom = this.getDom();
  var eh = this.getHandler();

  var pane = new wtf.ui.SettingsDialog.Pane_(this.options_, dom, title);
  this.panes_.push(pane);
  this.panesByTitle_[title] = pane;

  // Add the pane to the DOM.
  var contentEl = this.getChildElement(goog.getCssName('contents'));
  goog.style.setElementShown(pane.el_, false);
  dom.appendChild(contentEl, pane.el_);

  // Setup the button on the nav bar.
  eh.listen(pane.navLinkEl_, goog.events.EventType.CLICK, function() {
    this.selectPane(title);
  });

  // Add button to the nav bar.
  var navRootEl = this.getChildElement(goog.getCssName('nav'));
  var navUlEl = /** @type {Element} */ (dom.getElementsByTagNameAndClass(
      goog.dom.TagName.UL, null, navRootEl)[0]);
  dom.appendChild(navUlEl, pane.navEl_);

  // Select if the first one created.
  if (this.panes_.length == 1) {
    this.selectPane(title);
  }

  return pane;
};


/**
 * Selects the given settings pane.
 * @param {string} title Target pane title.
 */
wtf.ui.SettingsDialog.prototype.selectPane = function(title) {
  var pane = this.panesByTitle_[title];
  goog.asserts.assert(pane);
  if (!pane) {
    return;
  }
  if (this.currentPane_ == pane) {
    return;
  }

  if (this.currentPane_) {
    goog.dom.classes.remove(this.currentPane_.navLinkEl_,
        goog.getCssName('selected'));
    goog.style.setElementShown(this.currentPane_.el_, false);
  }
  this.currentPane_ = pane;
  goog.dom.classes.add(pane.navLinkEl_,
      goog.getCssName('selected'));
  goog.style.setElementShown(pane.el_, true);
};



/**
 * Grouping pane.
 * @param {!wtf.util.Options} options Options.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {string} title Displayed title.
 * @constructor
 * @private
 */
wtf.ui.SettingsDialog.Pane_ = function(options, dom, title) {
  /**
   * Options.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = dom;

  /**
   * All created sections.
   * @type {!Array.<!wtf.ui.SettingsDialog.Section_>}
   * @private
   */
  this.sections_ = [];

  /**
   * Root navigation item element.
   * @type {!Element}
   * @private
   */
  this.navEl_ = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.settingsdialog.paneNav, {
        title: title
      }, undefined, dom));

  /**
   * Navigation link element.
   * @type {!Element}
   * @private
   */
  this.navLinkEl_ = /** @type {!Element} */ (dom.getElementsByTagNameAndClass(
      goog.dom.TagName.A, null, this.navEl_)[0]);

  /**
   * Root pane element.
   * @type {!Element}
   * @private
   */
  this.el_ = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.settingsdialog.paneContent, {
      }, undefined, dom));
};


/**
 * Creates a new pane section.
 * @param {string} title Displayed title.
 * @return {!wtf.ui.SettingsDialog.Section_} New section.
 */
wtf.ui.SettingsDialog.Pane_.prototype.addSection = function(title) {
  var dom = this.dom_;

  var section = new wtf.ui.SettingsDialog.Section_(
      this.options_, this.dom_, title);
  this.sections_.push(section);

  // Add to the DOM.
  dom.appendChild(this.el_, section.el_);

  return section;
};



/**
 * Pane section.
 * @param {!wtf.util.Options} options Options.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {string} title Displayed title.
 * @constructor
 * @private
 */
wtf.ui.SettingsDialog.Section_ = function(options, dom, title) {
  /**
   * Options.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = dom;

  /**
   * All created widgets.
   * @type {!Array.<!wtf.ui.SettingsDialog.Widget_>}
   * @private
   */
  this.widgets_ = [];

  /**
   * Root section element.
   * @type {!Element}
   * @private
   */
  this.el_ = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.settingsdialog.section, {
        title: title
      }, undefined, dom));
};


/**
 * Adds a static label widget to the section.
 * @param {string} title Display title.
 * @param {string} value Value.
 */
wtf.ui.SettingsDialog.Section_.prototype.addLabel = function(title, value) {
  var dom = this.dom_;

  var el = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.settingsdialog.labelWidget, {
        title: title,
        value: value
      }, undefined, dom));

  // Add to section DOM.
  var p = /** @type {!Element} */ (dom.getElementsByTagNameAndClass(
      goog.dom.TagName.P, null, this.el_)[0]);
  dom.appendChild(p, el);
};


/**
 * Adds a checkbox widget to the section.
 * @param {string} key Options key.
 * @param {string} title Display title.
 * @param {boolean} defaultValue Default value.
 */
wtf.ui.SettingsDialog.Section_.prototype.addCheckbox = function(
    key, title, defaultValue) {
  var dom = this.dom_;

  var widget = new wtf.ui.SettingsDialog.CheckboxWidget_(
      this.options_, this.dom_, key, title, defaultValue);
  this.widgets_.push(widget);

  // Add to section DOM.
  var p = /** @type {!Element} */ (dom.getElementsByTagNameAndClass(
      goog.dom.TagName.P, null, this.el_)[0]);
  dom.appendChild(p, widget.el_);
};


/**
 * Adds a dropdown widget to the section.
 * @param {string} key Options key.
 * @param {string} title Display title.
 * @param {!Array.<!{value: string, title: string}>} options Options as a list
 *     of objects with value/title.
 * @param {string} defaultValue Default value.
 */
wtf.ui.SettingsDialog.Section_.prototype.addDropdown = function(
    key, title, options, defaultValue) {
  var dom = this.dom_;

  var widget = new wtf.ui.SettingsDialog.DropdownWidget_(
      this.options_, this.dom_, key, title, options, defaultValue);
  this.widgets_.push(widget);

  // Add to section DOM.
  var p = /** @type {!Element} */ (dom.getElementsByTagNameAndClass(
      goog.dom.TagName.P, null, this.el_)[0]);
  dom.appendChild(p, widget.el_);
};


/**
 * Adds a textbox widget to the section.
 * @param {string} key Options key.
 * @param {string} title Display title.
 * @param {string} emptyString String to display when the box is empty.
 * @param {string} defaultValue Default value.
 */
wtf.ui.SettingsDialog.Section_.prototype.addTextBox = function(
    key, title, emptyString, defaultValue) {
  // TODO(benvanik): textbox widget
};



/**
 * Abstract settings widget.
 * @param {!wtf.util.Options} options Options.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {string} key Options key.
 * @constructor
 * @private
 */
wtf.ui.SettingsDialog.Widget_ = function(options, dom, key) {
  /**
   * Options.
   * @type {!wtf.util.Options}
   * @protected
   */
  this.options = options;

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @protected
   */
  this.dom = dom;

  /**
   * Options key.
   * @type {string}
   * @protected
   */
  this.key = key;
};


/**
 * Saves the widget value, if it has changed.
 */
wtf.ui.SettingsDialog.Widget_.prototype.save = goog.abstractMethod;



/**
 * Checkbox widget.
 * @param {!wtf.util.Options} options Options.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {string} key Options key.
 * @param {string} title Display title.
 * @param {boolean} defaultValue Default value.
 * @constructor
 * @extends {wtf.ui.SettingsDialog.Widget_}
 * @private
 */
wtf.ui.SettingsDialog.CheckboxWidget_ = function(
    options, dom, key, title, defaultValue) {
  goog.base(this, options, dom, key);

  var value = options.getBoolean(key, defaultValue);

  /**
   * Root element.
   * @type {!Element}
   * @private
   */
  this.el_ = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.settingsdialog.checkboxWidget, {
        title: title
      }, undefined, dom));

  var inputEl = /** @type {HTMLInputElement} */ (
      dom.getElementsByTagNameAndClass(
          goog.dom.TagName.INPUT, null, this.el_)[0]);
  goog.asserts.assert(inputEl);
  inputEl.checked = value;

  var titleEl = /** @type {Element} */ (
      dom.getElementsByTagNameAndClass(
          goog.dom.TagName.SPAN, null, this.el_)[0]);
  goog.asserts.assert(titleEl);
  goog.events.listen(titleEl, goog.events.EventType.CLICK, function() {
    var value = !inputEl.checked;
    inputEl.checked = value;
  }, false, this);

  /**
   * Input element.
   * @type {!HTMLInputElement}
   * @private
   */
  this.inputEl_ = inputEl;
};
goog.inherits(
    wtf.ui.SettingsDialog.CheckboxWidget_, wtf.ui.SettingsDialog.Widget_);


/**
 * @override
 */
wtf.ui.SettingsDialog.CheckboxWidget_.prototype.save = function() {
  var value = this.inputEl_.checked;
  this.options.setBoolean(this.key, value);
};



/**
 * Dropdown widget.
 * @param {!wtf.util.Options} options Options.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {string} key Options key.
 * @param {string} title Display title.
 * @param {!Array.<!{value: string, title: string}>} optionsList Options as a
 *     list of objects with value/title.
 * @param {string} defaultValue Default value.
 * @constructor
 * @extends {wtf.ui.SettingsDialog.Widget_}
 * @private
 */
wtf.ui.SettingsDialog.DropdownWidget_ = function(
    options, dom, key, title, optionsList, defaultValue) {
  goog.base(this, options, dom, key);

  var value = options.getString(key, defaultValue);

  /**
   * Root element.
   * @type {!Element}
   * @private
   */
  this.el_ = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.settingsdialog.dropdownWidget, {
        title: title,
        options: optionsList
      }, undefined, dom));

  var selectEl = /** @type {HTMLSelectElement} */ (
      dom.getElementsByTagNameAndClass(
          goog.dom.TagName.SELECT, null, this.el_)[0]);
  goog.asserts.assert(selectEl);
  for (var n = 0; n < selectEl.options.length; n++) {
    if (selectEl.options[n].value == value) {
      selectEl.selectedIndex = n;
      break;
    }
  }

  /**
   * Input element.
   * @type {!HTMLSelectElement}
   * @private
   */
  this.selectEl_ = selectEl;
};
goog.inherits(
    wtf.ui.SettingsDialog.DropdownWidget_, wtf.ui.SettingsDialog.Widget_);


/**
 * @override
 */
wtf.ui.SettingsDialog.DropdownWidget_.prototype.save = function() {
  var value = this.selectEl_.options[this.selectEl_.selectedIndex].value;
  this.options.setString(this.key, value);
};
