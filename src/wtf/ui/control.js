/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Base control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.Control');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.style');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.timing');



/**
 * Base control.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.ui.Control = function(parentElement, opt_dom) {
  goog.base(this);

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = opt_dom || goog.dom.getDomHelper(parentElement);

  /**
   * Element that the control is displayed inside.
   * @type {!Element}
   * @private
   */
  this.parentElement_ = parentElement;

  /**
   * Root control UI.
   * @type {!Element}
   * @private
   */
  this.rootElement_ = this.createDom(this.dom_);
  goog.style.setUnselectable(this.rootElement_, true);

  /**
   * Event handler.
   * Lazily initialized.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eh_ = null;

  /**
   * Whether a repaint has been requested and is pending the next frame.
   * @type {boolean}
   * @private
   */
  this.repaintPending_ = false;

  // Add to page.
  this.dom_.appendChild(this.parentElement_, this.rootElement_);
};
goog.inherits(wtf.ui.Control, wtf.events.EventEmitter);


/**
 * Gets the DOM helper.
 * @return {!goog.dom.DomHelper} DOM helper.
 */
wtf.ui.Control.prototype.getDom = function() {
  return this.dom_;
};


/**
 * Gets the parent element.
 * @return {!Element} Element the control is displayed within.
 */
wtf.ui.Control.prototype.getParentElement = function() {
  return this.parentElement_;
};


/**
 * Gets the root element of the control.
 * @return {!Element} Root element of the control.
 */
wtf.ui.Control.prototype.getRootElement = function() {
  return this.rootElement_;
};


/**
 * Gets the first child element with the given class name.
 * @param {string} className CSS class name.
 * @return {!Element} Element.
 * @protected
 */
wtf.ui.Control.prototype.getChildElement = function(className) {
  var value = this.dom_.getElementByClass(className, this.rootElement_);
  goog.asserts.assert(value);
  return /** @type {!Element} */ (value);
};


/**
 * Gets the event handler targetting this control.
 * @return {!goog.events.EventHandler} Event handler.
 */
wtf.ui.Control.prototype.getHandler = function() {
  if (!this.eh_) {
    this.eh_ = new goog.events.EventHandler(this);
    this.registerDisposable(this.eh_);
  }
  return this.eh_;
};


/**
 * Creates the control UI DOM.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @return {!Element} Control UI.
 * @protected
 */
wtf.ui.Control.prototype.createDom = goog.abstractMethod;


/**
 * Toggles a button enabled or disabled.
 * @param {string} cssName CSS name of the button.
 * @param {boolean} enabled Whether the button is enabled.
 * @protected
 */
wtf.ui.Control.prototype.toggleButton = function(cssName, enabled) {
  var el = this.dom_.getElementByClass(cssName, this.getRootElement());
  if (el) {
    goog.dom.classes.enable(el, goog.getCssName('kDisabled'), !enabled);
  }
};


/**
 * Requests a repaint of the control on the next rAF.
 * This should be used instead of repainting inline in JS callbacks to help
 * the browser draw things optimally. Only call repaint directly if the results
 * *must* be displayed immediately, such as in the case of a resize.
 * @protected
 */
wtf.ui.Control.prototype.requestRepaint = function() {
  if (!this.repaintPending_) {
    this.repaintPending_ = true;
    wtf.timing.deferToNextFrame(this.repaintRequested_, this);
  }
};


/**
 * Handles repaint request callbacks.
 * This is called on the edge of a new rAF.
 * @private
 */
wtf.ui.Control.prototype.repaintRequested_ = function() {
  if (!this.repaintPending_) {
    return;
  }
  this.repaintPending_ = false;
  this.repaint();
};


/**
 * Repaints the controls contents.
 * @protected
 */
wtf.ui.Control.prototype.repaint = goog.nullFunction;
