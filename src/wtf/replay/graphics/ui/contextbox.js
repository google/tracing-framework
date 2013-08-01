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

goog.require('goog.dom');
goog.require('goog.soy');
goog.require('wtf.replay.graphics.ui.contextBox');
goog.require('wtf.ui.Control');



/**
 * Encapsulates a context and its canvas element.
 *
 * @param {!WebGLRenderingContext} context The context.
 * @param {string} contextHandle The handle of the context.
 * @param {!Element} parentElement The parent element.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.ContextBox = function(
    context, contextHandle, parentElement, opt_domHelper) {
  goog.base(this, parentElement, opt_domHelper);

  /**
   * Label element.
   * @type {!Element}
   * @private
   */
  this.label_ = this.getChildElement(
      goog.getCssName('replayGraphicsContextBoxHandleLabel'));

  /**
   * Context handle used to identify the context to the user.
   * @type {string}
   * @private
   */
  this.contextHandle_ = contextHandle;

  /**
   * The context this box encapsulates.
   * @type {!WebGLRenderingContext}
   * @private
   */
  this.context_ = context;
  this.appendCanvas_();

  this.update();
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
      this.getChildElement(
          goog.getCssName('replayGraphicsContextBoxCanvasContainer')),
      this.context_.canvas);
};


/**
 * Handles context updates.
 * May indicate the canvas has been resized.
 */
wtf.replay.graphics.ui.ContextBox.prototype.update = function() {
  var width = this.context_.drawingBufferWidth;
  var height = this.context_.drawingBufferHeight;
  var label =
      'Context ' + this.contextHandle_ + ' (' + width + 'x' + height + ')';
  goog.dom.setTextContent(this.label_, label);
};
