/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Search textbox control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.SearchControl');

goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.ui.Control');



/**
 * Search textbox control.
 *
 * INVALIDATED events are fired when the search term changes and have the args
 * [newValue, oldValue].
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.ui.SearchControl = function(parentElement, opt_dom) {
  goog.base(this, parentElement, opt_dom);

  /**
   * Current search value.
   * @type {string}
   * @private
   */
  this.value_ = '';

  var el = this.getRootElement();

  var dom = this.getDom();
  var eh = this.getHandler();

  // Manage keyboard bindings.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardSuspended = false;
  eh.listen(el, goog.events.EventType.FOCUS, function() {
    if (keyboardSuspended) {
      return;
    }
    keyboardSuspended = true;
    keyboard.suspend();
  }, false);
  eh.listen(el, goog.events.EventType.BLUR, function() {
    if (keyboardSuspended) {
      keyboard.resume();
      keyboardSuspended = false;
    }
  }, false);

  // Bind input to watch for escape/etc.
  // TODO(benvanik): handle escape to clear? globally?
  eh.listen(el, goog.events.EventType.KEYDOWN, function(e) {
    if (e.keyCode == 27) {
      if (el.value.length) {
        el.value = '';
        this.setValue('');
      } else {
        el.blur();
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, true);

  // Watch textbox changes.
  eh.listen(el, [
    goog.events.EventType.CHANGE,
    goog.events.EventType.INPUT,
    goog.events.EventType.PASTE
  ], function() {
    this.setValue(el.value);
  }, false);
};
goog.inherits(wtf.ui.SearchControl, wtf.ui.Control);


/**
 * @override
 */
wtf.ui.SearchControl.prototype.createDom = function(dom) {
  var el = dom.createElement(goog.dom.TagName.INPUT);
  el['type'] = 'text';
  goog.dom.classes.add(
      el,
      goog.getCssName('kTextField'),
      goog.getCssName('kSearchField'));
  return el;
};


/**
 * Sets whether the control is enabled.
 * @param {boolean} enabled Whether this control is enabled.
 */
wtf.ui.SearchControl.prototype.setEnabled = function(enabled) {
  var textInputElement = this.getRootElement();
  if (enabled) {
    textInputElement.disabled = false;
  } else {
    textInputElement.disabled = true;
  }
};


/**
 * Sets the placeholder text.
 * @param {string} value New value.
 */
wtf.ui.SearchControl.prototype.setPlaceholderText = function(value) {
  var el = this.getRootElement();
  el.placeholder = value;
};


/**
 * Toggles error mode on the control.
 * When true, the control will be drawn with a special error style to indicate
 * that the contents are invalid.
 * @param {boolean} value True to enable error mode.
 */
wtf.ui.SearchControl.prototype.toggleError = function(value) {
  var el = this.getRootElement();
  goog.dom.classes.enable(el, goog.getCssName('kTextFieldError'), value);
};


/**
 * Gets the search value.
 * @return {string} Current search value, may be '' if empty.
 */
wtf.ui.SearchControl.prototype.getValue = function() {
  return this.value_;
};


/**
 * Sets the search value.
 * @param {string} value New search value.
 */
wtf.ui.SearchControl.prototype.setValue = function(value) {
  if (this.value_ == value) {
    return;
  }
  var oldValue = this.value_;
  this.value_ = value;
  var el = this.getRootElement();
  if (el.value != value) {
    el.value = value;
  }
  this.emitEvent(wtf.events.EventType.INVALIDATED, value, oldValue);
};


/**
 * Clears the search filter.
 */
wtf.ui.SearchControl.prototype.clear = function() {
  this.setValue('');
};


/**
 * Focuses the search control.
 */
wtf.ui.SearchControl.prototype.focus = function() {
  var el = this.getRootElement();
  el.focus();
  el.select();
};
