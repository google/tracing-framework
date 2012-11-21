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

goog.require('wtf.ui.Control');



/**
 * Tooltip control.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.ui.Tooltip = function(parentElement, opt_dom) {
  goog.base(this, parentElement, opt_dom);
};
goog.inherits(wtf.ui.Tooltip, wtf.ui.Control);


/**
 * @override
 */
wtf.ui.Tooltip.prototype.createDom = function(dom) {
  var dom = this.getDom();
  var elem = dom.createElement(goog.dom.TagName.DIV);
  goog.style.showElement(elem, false);
  goog.style.setStyle(elem, {
    'position': 'absolute',
    'color': 'white',
    'backgroundColor': 'rgba(0,0,0,.7)',
    'padding': '5px'
  });
  return elem;
};


wtf.ui.Tooltip.prototype.show = function(x, y, content) {
  var elem = this.getRootElement();
  goog.dom.setTextContent(elem, content);
  goog.style.setStyle(elem, {
    'left': x + 10 + 'px',
    'top': y + 10 + 'px'
  });
  goog.style.showElement(this.getRootElement(), true);
};


wtf.ui.Tooltip.prototype.hide = function() {
  goog.style.showElement(this.getRootElement(), false);
};
