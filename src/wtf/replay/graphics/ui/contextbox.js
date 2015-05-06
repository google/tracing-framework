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
goog.require('goog.style');
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
   * Message element.
   * @type {!Element}
   * @private
   */
  this.messageArea_ = this.getChildElement(
      goog.getCssName('replayGraphicsContextBoxMessage'));

  /**
   * Context handle used to identify the context to the user.
   * @type {string}
   * @private
   */
  this.contextHandle_ = contextHandle;

  /**
   * The native width of the canvas.
   * @type {number}
   * @private
   */
  this.nativeWidth_ = context.drawingBufferWidth;

  /**
   * The native height of the canvas.
   * @type {number}
   * @private
   */
  this.nativeHeight_ = context.drawingBufferHeight;

  /**
   * The minimum height that the canvas can take on. This takes into account
   * the minimum width, so a canvas that has a height that is greater than or
   * equal to the minimum height also has a width that is greater than or equal
   * to the minimum width.
   * @type {number}
   * @private
   */
  this.minimumHeight_ = this.calculateMinCanvasHeight_();

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
 * The minimum width of a canvas within a content box in pixels.
 * @type {number}
 * @const
 */
wtf.replay.graphics.ui.ContextBox.MIN_WIDTH = 210;


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
  this.nativeWidth_ = width;
  this.nativeHeight_ = height;

  // Update the minimum height that this canvas can take on.
  this.minimumHeight_ = this.calculateMinCanvasHeight_();
  this.updateLabel_();
};


/**
 * Updates the label of the context.
 * @private
 */
wtf.replay.graphics.ui.ContextBox.prototype.updateLabel_ = function() {
  var canvasDisplaySize = goog.style.getSize(this.context_.canvas);
  var shrinkPercent =
      Math.floor(canvasDisplaySize.width * 100 / this.nativeWidth_);

  var label =
      'Context ' + this.contextHandle_ + ' (' + this.nativeWidth_ + 'x' +
          this.nativeHeight_ + '): ' + shrinkPercent + '%';
  goog.dom.setTextContent(this.label_, label);
};


/**
 * Updates the message of the context.
 * @param {string} message The new message.
 */
wtf.replay.graphics.ui.ContextBox.prototype.updateMessage = function(message) {
  message = message || ' ';
  goog.dom.setTextContent(this.messageArea_, message);
};


/**
 * Returns the total height of the canvas box.
 * @return {number} Total height of canvas box.
 */
wtf.replay.graphics.ui.ContextBox.prototype.getHeight = function() {
  return this.getRootElement().clientHeight;
};


/**
 * Returns the total width of the canvas box.
 * @return {number} Total width of canvas box.
 */
wtf.replay.graphics.ui.ContextBox.prototype.getWidth = function() {
  return this.getRootElement().clientWidth;
};


/**
 * Returns the native height of the canvas.
 * @return {number} Native height of canvas.
 */
wtf.replay.graphics.ui.ContextBox.prototype.getNativeCanvasHeight =
    function() {
  return this.nativeHeight_;
};


/**
 * Returns the native width of the canvas.
 * @return {number} Native width of canvas.
 */
wtf.replay.graphics.ui.ContextBox.prototype.getNativeCanvasWidth =
    function() {
  return this.nativeWidth_;
};


/**
 * Calculates the minimum display height that the canvas can take on without
 * having a width that is less than the minimum width.
 * @return {number} The minimum height that the canvas can take on.
 * @private
 */
wtf.replay.graphics.ui.ContextBox.prototype.calculateMinCanvasHeight_ =
    function() {
  return Math.ceil(wtf.replay.graphics.ui.ContextBox.MIN_WIDTH *
      this.nativeHeight_ / this.nativeWidth_);
};


/**
 * Returns the minimum height that the canvas can take on.
 * @return {number} The minimum height that the canvas can take on.
 */
wtf.replay.graphics.ui.ContextBox.prototype.getMinCanvasHeight = function() {
  return this.minimumHeight_;
};


/**
 * Sets the dimensions of the actual canvas element displayed.
 * @param {number} width The width of the canvas.
 * @param {number} height The height of the canvas.
 */
wtf.replay.graphics.ui.ContextBox.prototype.setCanvasDimensions = function(
    width, height) {
  var context = this.context_;
  var canvas = context.canvas;

  goog.style.setWidth(canvas, width);
  goog.style.setHeight(canvas, height);
  this.updateLabel_();
};


/**
 * Resets the CSS sizes of the canvases to their native sizes.
 */
wtf.replay.graphics.ui.ContextBox.prototype.resetCanvasDimensions = function() {
  var context = this.context_;
  var canvas = context.canvas;

  goog.style.setWidth(canvas, 'auto');
  goog.style.setHeight(canvas, 'auto');
  this.updateLabel_();
};
