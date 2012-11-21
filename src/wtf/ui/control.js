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
goog.require('wtf.util.canvas');



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
   * Root paint context, if created.
   * @type {wtf.ui.PaintContext}
   * @private
   */
  this.paintContext_ = null;

  // Add to page.
  this.enterDocument(this.parentElement_);
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
 * Adds the DOM tree into the document.
 * @param {!Element} parentElement Parent DOM element.
 * @protected
 */
wtf.ui.Control.prototype.enterDocument = function(parentElement) {
  this.dom_.appendChild(this.parentElement_, this.rootElement_);
};


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
 * Gets the root paint context, if any.
 * @return {wtf.ui.PaintContext} Paint context, if any.
 */
wtf.ui.Control.prototype.getPaintContext = function() {
  return this.paintContext_;
};


/**
 * Sets the root paint context.
 * This can only be called once.
 * @param {!wtf.ui.PaintContext} value New paint context.
 */
wtf.ui.Control.prototype.setPaintContext = function(value) {
  goog.asserts.assert(!this.paintContext_);
  if (this.paintContext_) {
    return;
  }
  this.paintContext_ = value;
  this.registerDisposable(this.paintContext_);
  this.requestRepaint();
};


/**
 * Requests a repaint of the control on the next rAF.
 * This should be used instead of repainting inline in JS callbacks to help
 * the browser draw things optimally. Only call repaint directly if the results
 * *must* be displayed immediately, such as in the case of a resize.
 * @protected
 */
wtf.ui.Control.prototype.requestRepaint = function() {
  if (this.paintContext_) {
    this.paintContext_.requestRepaint();
  }
};


/**
 * Repaints the control contents.
 */
wtf.ui.Control.prototype.repaint = function() {
  if (this.paintContext_) {
    this.paintContext_.repaint();
  }
};


/**
 * Updates the layout of the control.
 */
wtf.ui.Control.prototype.layout = function() {
  // Reshape the canvas.
  if (this.paintContext_) {
    var canvas = this.paintContext_.getCanvas();
    var ctx = this.paintContext_.getCanvasContext2d();
    var currentSize = goog.style.getSize(goog.dom.getParentElement(canvas));
    wtf.util.canvas.reshape(
        canvas, ctx, currentSize.width, currentSize.height);
  }

  // Custom layout logic.
  this.layoutInternal();

  // Repaint immediately to prevent flicker.
  this.repaint();
};


/**
 * Updates custom layout of the control.
 * @protected
 */
wtf.ui.Control.prototype.layoutInternal = goog.nullFunction;


/**
 * @protected
 */
wtf.ui.Control.prototype.setupCanvasTooltipEvents = function(canvas, tooltip) {
  this.getHandler().listen(
      canvas,
      goog.events.EventType.MOUSEMOVE,
      function(e) {
        var width = canvas.width;
        var height = canvas.height;
        var infoString = this.getPaintContext().getInfoString(
            e.offsetX, e.offsetY, width, height);
        if (infoString) {
          tooltip.show(e.clientX, e.clientY, infoString);
        } else {
          tooltip.hide();
        }
      }, false, this);
  this.getHandler().listen(
      canvas,
      goog.events.EventType.MOUSEOUT,
      function(e) {
        tooltip.hide();
      }, false, this);


};
