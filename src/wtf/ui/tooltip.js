/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tooltip control.
 *
 * @author rsturgell@google.com (Ryan Sturgell)
 */

goog.provide('wtf.ui.Tooltip');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.style');



/**
 * Tooltip control.
 *
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.ui.Tooltip = function(dom) {
  goog.base(this);

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = dom;

  /**
   * Root control UI.
   * @type {!Element}
   * @private
   */
  this.rootElement_ = this.createDom(this.dom_);
  goog.style.setUnselectable(this.rootElement_, true);

  var body = dom.getDocument().body;
  goog.asserts.assert(body);
  this.dom_.appendChild(body, this.rootElement_);
};
goog.inherits(wtf.ui.Tooltip, goog.Disposable);


/**
 * @override
 */
wtf.ui.Tooltip.prototype.disposeInternal = function() {
  this.dom_.removeNode(this.rootElement_);
  goog.base(this, 'disposeInternal');
};


/**
 * Creates the control UI DOM.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @return {!Element} Control UI.
 * @protected
 */
wtf.ui.Tooltip.prototype.createDom = function(dom) {
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.style.showElement(el, false);
  goog.dom.classes.add(el, goog.getCssName('uiTooltip'));
  return el;
};


/**
 * Show the tooltip at the given location.
 * @param {number} x Parent-relative X, in DOM units.
 * @param {number} y Parent-relative Y, in DOM units.
 * @param {string} content Tooltip content.
 */
wtf.ui.Tooltip.prototype.show = function(x, y, content) {
  var el = this.rootElement_;
  goog.dom.setTextContent(el, content);
  goog.style.setStyle(el, {
    'left': x + 10 + 'px',
    'top': y + 10 + 'px'
  });
  goog.style.showElement(el, true);
};


/**
 * Hides the tooltip.
 */
wtf.ui.Tooltip.prototype.hide = function() {
  goog.style.showElement(this.rootElement_, false);
};
