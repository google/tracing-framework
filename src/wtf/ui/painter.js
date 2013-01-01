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

goog.provide('wtf.ui.Painter');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('wtf.timing');
goog.require('wtf.util.canvas');



/**
 * Canvas painting context.
 * Supports child contexts to enable modular nested rendering.
 *
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.ui.Painter = function(canvas) {
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
   * Canvas pixel ratio.
   * @type {number}
   * @private
   */
  this.pixelRatio_ = wtf.util.canvas.getCanvasPixelRatio(this.canvasContext2d_);

  /**
   * Parent painter.
   * If this is null then this painter is the root.
   * @type {wtf.ui.Painter}
   * @private
   */
  this.parentPainter_ = null;

  /**
   * Child painters.
   * These will be repainted after their parent is.
   * @type {!Array.<!wtf.ui.Painter>}
   * @private
   */
  this.childPainters_ = [];

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
};
goog.inherits(wtf.ui.Painter, goog.Disposable);


/**
 * @override
 */
wtf.ui.Painter.prototype.disposeInternal = function() {
  goog.disposeAll(this.childPainters_);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the target canvas.
 * @return {!HTMLCanvasElement} Target canvas.
 */
wtf.ui.Painter.prototype.getCanvas = function() {
  return this.canvas_;
};


/**
 * Gets the canvas rendering context.
 * @return {!CanvasRenderingContext2D} Canvas rendering context.
 */
wtf.ui.Painter.prototype.getCanvasContext2d = function() {
  return this.canvasContext2d_;
};


/**
 * Gets the scaled canvas width in CSS pixels.
 * @return {number} Canvas width.
 */
wtf.ui.Painter.prototype.getScaledCanvasWidth = function() {
  return this.canvas_.width / this.pixelRatio_;
};


/**
 * Gets the scaled canvas height in CSS pixels.
 * @return {number} Canvas height.
 */
wtf.ui.Painter.prototype.getScaledCanvasHeight = function() {
  return this.canvas_.height / this.pixelRatio_;
};


/**
 * Gets a dom helper.
 * @return {!goog.dom.DomHelper} A dom helper for the document containing
 *     this paint context's canvas.
 */
wtf.ui.Painter.prototype.getDom = function() {
  return goog.dom.getDomHelper(this.canvas_);
};


/**
 * Gets the parent painter, if any.
 * @return {wtf.ui.Painter} Parent painter or null if this is the
 *     root.
 */
wtf.ui.Painter.prototype.getParentPainter = function() {
  return this.parentPainter_;
};


/**
 * Adds a child painter.
 * @param {!wtf.ui.Painter} value Child painter.
 * @param {wtf.ui.Painter=} opt_before Painter to insert before.
 */
wtf.ui.Painter.prototype.addChildPainter = function(value, opt_before) {
  goog.asserts.assert(!value.parentPainter_);
  goog.asserts.assert(!goog.array.contains(this.childPainters_, value));
  value.parentPainter_ = this;
  if (opt_before) {
    goog.array.insertBefore(this.childPainters_, value, opt_before);
  } else {
    this.childPainters_.push(value);
  }
};


/**
 * Sets the ready state of the paint context.
 * @param {boolean} value New ready value.
 */
wtf.ui.Painter.prototype.setReady = function(value) {
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
wtf.ui.Painter.prototype.requestRepaint = function() {
  if (this.parentPainter_) {
    this.parentPainter_.requestRepaint();
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
wtf.ui.Painter.prototype.repaintRequested_ = function() {
  if (this.parentPainter_ || !this.repaintPending_) {
    return;
  }
  this.repaintPending_ = false;
  this.repaint();
};


/**
 * Immediately repaints the controls contents.
 */
wtf.ui.Painter.prototype.repaint = function() {
  // Ignore requests if a child.
  if (this.parentPainter_) {
    return;
  }

  // Skip all drawing if not marked ready.
  if (!this.ready_) {
    return;
  }

  // Prepare canvas. This should only occur on the root paint context.
  var ctx = this.canvasContext2d_;
  wtf.util.canvas.reset(ctx, this.pixelRatio_);

  // Skip all drawing if too small.
  var width = this.getScaledCanvasWidth();
  var height = this.getScaledCanvasHeight();
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
  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
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
wtf.ui.Painter.prototype.repaintInternal = goog.nullFunction;


/**
 * Clips rendering to the given rectangular region, in pixels.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} w Width.
 * @param {number} h Height.
 * @protected
 */
wtf.ui.Painter.prototype.clip = function(x, y, w, h) {
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
wtf.ui.Painter.prototype.clear = function(x, y, w, h, opt_color) {
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
 * @return {boolean} True if the event was handled.
 */
wtf.ui.Painter.prototype.onClick = function(x, y) {
  var width = this.getScaledCanvasWidth();
  var height = this.getScaledCanvasHeight();
  if (this.onClickInternal(x, y, width, height)) {
    return true;
  }
  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    if (childContext.onClick(x, y)) {
      return true;
    }
  }
  return false;
};


/**
 * Handles click events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Canvas width, in pixels.
 * @param {number} height Canvas height, in pixels.
 * @return {boolean|undefined} True if the event was handled.
 * @protected
 */
wtf.ui.Painter.prototype.onClickInternal = goog.nullFunction;


/**
 * Handles mouse move events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @return {boolean} True if the event was handled.
 */
wtf.ui.Painter.prototype.onMouseMove = function(x, y) {
  var width = this.getScaledCanvasWidth();
  var height = this.getScaledCanvasHeight();
  if (this.onMouseMoveInternal(x, y, width, height)) {
    return true;
  }
  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    if (childContext.onMouseMove(x, y)) {
      return true;
    }
  }
  return false;
};


/**
 * Handles mouse move events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Canvas width, in pixels.
 * @param {number} height Canvas height, in pixels.
 * @return {boolean|undefined} True if the event was handled.
 * @protected
 */
wtf.ui.Painter.prototype.onMouseMoveInternal = goog.nullFunction;


/**
 * Handles mouse leave events at the given pixel.
 * @return {boolean} True if the event was handled.
 */
wtf.ui.Painter.prototype.onMouseOut = function() {
  if (this.onMouseOutInternal()) {
    return true;
  }
  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    if (childContext.onMouseOut()) {
      return true;
    }
  }
  return false;
};


/**
 * Handles mouse leave events at the given pixel.
 * @return {boolean|undefined} True if the event was handled.
 * @protected
 */
wtf.ui.Painter.prototype.onMouseOutInternal = goog.nullFunction;


/**
 * Queries the tree of painters for information about the pixel at x,y. Used to
 * populate a tooltip.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @return {string|undefined} Info string or undefined for none.
 */
wtf.ui.Painter.prototype.getInfoString = function(x, y) {
  var width = this.getScaledCanvasWidth();
  var height = this.getScaledCanvasHeight();

  var info = this.getInfoStringInternal(x, y, width, height);
  if (info) return info;

  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    info = childContext.getInfoString(x, y);
    if (info) return info;
  }

  return undefined;
};


/**
 * Attempt to describe the pixel at x,y.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Canvas width, in pixels.
 * @param {number} height Canvas height, in pixels.
 * @return {string|undefined} Info string or undefined for none.
 * @protected
 */
wtf.ui.Painter.prototype.getInfoStringInternal = goog.nullFunction;
