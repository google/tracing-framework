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

goog.require('goog.asserts');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('wtf.ui.Control');
goog.require('wtf.util.canvas');



/**
 * Tooltip control.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
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


/**
 * Sets up the input events for showing/hiding the given tooltip on a control.
 * The control must have an initialized paint context.
 * @param {!wtf.ui.Control} control Target control.
 */
wtf.ui.Tooltip.prototype.bindEvents = function(control) {
  var paintContext = control.getPaintContext();
  goog.asserts.assert(paintContext);
  var canvas = paintContext.getCanvas();
  var ctx = paintContext.getCanvasContext2d();
  var scale = wtf.util.canvas.getCanvasPixelRatio(ctx);

  this.getHandler().listen(
      canvas,
      goog.events.EventType.MOUSEMOVE,
      function(e) {
        var width = canvas.width / scale;
        var height = canvas.height / scale;
        var infoString = paintContext.getInfoString(
            e.offsetX, e.offsetY, width, height);
        if (infoString) {
          this.show(e.clientX, e.clientY, infoString);
        } else {
          this.hide();
        }
      });

  this.getHandler().listen(
      canvas,
      goog.events.EventType.MOUSEOUT,
      function(e) {
        this.hide();
      });
};


/**
 * Show the tooltip at the given location.
 * @param {number} x Parent-relative X, in DOM units.
 * @param {number} y Parent-relative Y, in DOM units.
 * @param {string} content Tooltip content.
 */
wtf.ui.Tooltip.prototype.show = function(x, y, content) {
  var elem = this.getRootElement();
  // TODO(benvanik): don't use innerHTML - need a more structured way.
  elem.innerHTML = content;
  goog.style.setStyle(elem, {
    'left': x + 10 + 'px',
    'top': y + 10 + 'px'
  });
  goog.style.showElement(this.getRootElement(), true);
};


/**
 * Hides the tooltip.
 */
wtf.ui.Tooltip.prototype.hide = function() {
  goog.style.showElement(this.getRootElement(), false);
};
