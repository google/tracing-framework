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
goog.require('wtf.events.Keyboard');
goog.require('wtf.ui.Control');



/**
 * Search textbox control.
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
  var keyboard = wtf.events.Keyboard.getWindowKeyboard(dom.getWindow());
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
 * Search control event types.
 * @type {!Object.<string>}
 */
wtf.ui.SearchControl.EventType = {
  /**
   * Search query changed.
   * Arguments: [newValue, oldValue].
   */
  CHANGE: goog.events.getUniqueId('change')
};


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
  this.emitEvent(wtf.ui.SearchControl.EventType.CHANGE, value, oldValue);
};


/**
 * Clears the search filter.
 */
wtf.ui.SearchControl.prototype.clear = function() {
  this.setValue('');
};
