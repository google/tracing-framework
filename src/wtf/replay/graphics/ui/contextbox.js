/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Control that manages a single context.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.ContextBox');

goog.require('goog.soy');
goog.require('wtf.replay.graphics.ui.contextBox');
goog.require('wtf.ui.Control');



/**
 * Encapsulates a context and its canvas element.
 *
 * @param {!WebGLRenderingContext} context The context.
 * @param {!Element} parentElement The parent element.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.ContextBox = function(
    context, parentElement, opt_domHelper) {
  goog.base(this, parentElement, opt_domHelper);
  /**
   * The context this box encapsulates.
   * @type {!WebGLRenderingContext}
   * @private
   */
  this.context_ = context;
  this.appendCanvas_();
};
goog.inherits(wtf.replay.graphics.ui.ContextBox, wtf.ui.Control);


/**
 * @override
 */
wtf.replay.graphics.ui.ContextBox.prototype.createDom = function(dom) {
  var el = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.contextBox.controller,
      undefined, undefined, dom));
  return el;
};


/**
 * Appends the context to the canvas box.
 * @private
 */
wtf.replay.graphics.ui.ContextBox.prototype.appendCanvas_ = function() {
  this.getDom().appendChild(
      this.getChildElement(goog.getCssName('replayGraphicsCanvasContainer')),
      this.context_.canvas);
};
