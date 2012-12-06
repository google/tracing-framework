/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Canvas painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.PaintContext');

goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('wtf.timing');
goog.require('wtf.util.canvas');



/**
 * Canvas painting context.
 * Supports child contexts to enable modular nested rendering.
 *
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {wtf.ui.PaintContext=} opt_parentContext Parent paint context.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.ui.PaintContext = function(canvas, opt_parentContext) {
  goog.base(this);

  /**
   * Target DOM canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvas_ = canvas;

  /**
   * Canvas rendering context.
   * @type {!CanvasRenderingContext2D}
   * @private
   */
  this.canvasContext2d_ = wtf.util.canvas.getContext2d(canvas);

  /**
   * Parent painting context.
   * If this is null then this context is the root.
   * @type {wtf.ui.PaintContext}
   * @private
   */
  this.parentContext_ = opt_parentContext || null;

  /**
   * Child painting contexts.
   * These will be repainted after their parent is.
   * @type {!Array.<!wtf.ui.PaintContext>}
   * @private
   */
  this.childContexts_ = [];

  /**
   * Whether a repaint has been requested and is pending the next frame.
   * @type {boolean}
   * @private
   */
  this.repaintPending_ = false;

  /**
   * Whether the context is ready for painting.
   * If false, the context (and all children) will not be drawn.
   * @type {boolean}
   * @private
   */
  this.ready_ = true;

  // Add to parent.
  if (this.parentContext_) {
    this.parentContext_.childContexts_.push(this);
  }
};
goog.inherits(wtf.ui.PaintContext, goog.Disposable);


/**
 * @override
 */
wtf.ui.PaintContext.prototype.disposeInternal = function() {
  goog.disposeAll(this.childContexts_);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the target canvas.
 * @return {!HTMLCanvasElement} Target canvas.
 */
wtf.ui.PaintContext.prototype.getCanvas = function() {
  return this.canvas_;
};


/**
 * Gets the canvas rendering context.
 * @return {!CanvasRenderingContext2D} Canvas rendering context.
 */
wtf.ui.PaintContext.prototype.getCanvasContext2d = function() {
  return this.canvasContext2d_;
};


/**
 * Gets a dom helper.
 * @return {!goog.dom.DomHelper} A dom helper for the document containing
 *     this paint context's canvas.
 */
wtf.ui.PaintContext.prototype.getDom = function() {
  return goog.dom.getDomHelper(this.canvas_);
};


/**
 * Sets the ready state of the paint context.
 * @param {boolean} value New ready value.
 */
wtf.ui.PaintContext.prototype.setReady = function(value) {
  this.ready_ = value;
  if (value) {
    this.requestRepaint();
  }
};


/**
 * Requests a repaint of the control on the next rAF.
 * This should be used instead of repainting inline in JS callbacks to help
 * the browser draw things optimally. Only call repaint directly if the results
 * *must* be displayed immediately, such as in the case of a resize.
 * @protected
 */
wtf.ui.PaintContext.prototype.requestRepaint = function() {
  if (this.parentContext_) {
    this.parentContext_.requestRepaint();
  } else if (!this.repaintPending_) {
    this.repaintPending_ = true;
    wtf.timing.deferToNextFrame(this.repaintRequested_, this);
  }
};


/**
 * Handles repaint request callbacks.
 * This is called on the edge of a new rAF.
 * @private
 */
wtf.ui.PaintContext.prototype.repaintRequested_ = function() {
  if (this.parentContext_ || !this.repaintPending_) {
    return;
  }
  this.repaintPending_ = false;
  this.repaint();
};


/**
 * Immediately repaints the controls contents.
 */
wtf.ui.PaintContext.prototype.repaint = function() {
  // Ignore requests if a child.
  if (this.parentContext_) {
    return;
  }

  // Skip all drawing if not marked ready.
  if (!this.ready_) {
    return;
  }

  // Prepare canvas. This should only occur on the root paint context.
  var ctx = this.canvasContext2d_;
  var pixelRatio = wtf.util.canvas.getCanvasPixelRatio(ctx);
  var width = this.canvas_.width / pixelRatio;
  var height = this.canvas_.height / pixelRatio;
  wtf.util.canvas.reset(ctx, pixelRatio);

  // Skip all drawing if too small.
  if (height <= 1) {
    return;
  }

  ctx.save();

  // Clear contents.
  // TODO(benvanik): only if needed
  this.clear(0, 0, width, height);

  var preventChildren = this.repaintInternal(ctx, width, height);

  ctx.restore();
  if (preventChildren) {
    return;
  }

  // Repaint all children.
  for (var n = 0; n < this.childContexts_.length; n++) {
    var childContext = this.childContexts_[n];
    ctx.save();
    childContext.repaintInternal(ctx, width, height);
    ctx.restore();
  }
};


/**
 * Repaints the context contents.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {number} width Canvas width, in pixels.
 * @param {number} height Canvas height, in pixels.
 * @return {boolean|undefined} True to prevent painting of children.
 * @protected
 */
wtf.ui.PaintContext.prototype.repaintInternal = goog.nullFunction;


/**
 * Clips rendering to the given rectangular region, in pixels.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} w Width.
 * @param {number} h Height.
 * @protected
 */
wtf.ui.PaintContext.prototype.clip = function(x, y, w, h) {
  var ctx = this.canvasContext2d_;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y);
  ctx.clip();
};


/**
 * Clears the given region to the specified color.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {(string|null)=} opt_color Color or null for transparent.
 */
wtf.ui.PaintContext.prototype.clear = function(x, y, w, h, opt_color) {
  var ctx = this.canvasContext2d_;
  if (!opt_color) {
    ctx.clearRect(x, y, w, h);
  } else {
    ctx.fillStyle = opt_color;
    ctx.fillRect(x, y, w, h);
  }
};


/**
 * Handles click events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Width of the paint canvas.
 * @param {number} height Height of the paint canvas.
 * @return {boolean} True if the click was handled.
 */
wtf.ui.PaintContext.prototype.onClick = function(x, y, width, height) {
  if (this.onClickInternal(x, y, width, height)) {
    return true;
  }

  for (var n = 0; n < this.childContexts_.length; n++) {
    var childContext = this.childContexts_[n];
    if (childContext.onClickInternal(x, y, width, height)) {
      return true;
    }
  }

  return false;
};


/**
 * Handles click events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Width of the paint canvas.
 * @param {number} height Height of the paint canvas.
 * @return {boolean|undefined} True if the click was handled.
 * @protected
 */
wtf.ui.PaintContext.prototype.onClickInternal = goog.nullFunction;


/**
 * Queries the tree of painters for information about the pixel at x,y. Used to
 * populate a tooltip.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Width of the paint canvas.
 * @param {number} height Height of the paint canvas.
 * @return {string|undefined} Info string or undefined for none.
 */
wtf.ui.PaintContext.prototype.getInfoString = function(x, y, width, height) {
  var info = this.getInfoStringInternal(x, y, width, height);
  if (info) return info;

  for (var n = 0; n < this.childContexts_.length; n++) {
    var childContext = this.childContexts_[n];
    info = childContext.getInfoString(x, y, width, height);
    if (info) return info;
  }

  return undefined;
};


/**
 * Attempt to describe the pixel at x,y.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Width of the paint canvas.
 * @param {number} height Height of the paint canvas.
 * @return {string|undefined} Info string or undefined for none.
 * @protected
 */
wtf.ui.PaintContext.prototype.getInfoStringInternal = goog.nullFunction;
