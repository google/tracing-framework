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

goog.provide('wtf.ui.LayoutMode');
goog.provide('wtf.ui.ModifierKey');
goog.provide('wtf.ui.Painter');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.debug');
goog.require('goog.dom');
goog.require('goog.math.Rect');
goog.require('goog.math.Size');
goog.require('wtf.timing');
goog.require('wtf.util.canvas');


/**
 * Bitmask values for input modifier keys.
 * @enum {number}
 */
wtf.ui.ModifierKey = {
  CTRL: 1 << 1,
  ALT: 1 << 2,
  SHIFT: 1 << 3,
  META: 1 << 4
};


/**
 * Layout mode.
 * @enum {number}
 */
wtf.ui.LayoutMode = {
  /**
   * No layout.
   * All children get the full parent bounding region.
   */
  NONE: 0,

  /**
   * Horizontal layout.
   * Children are stacked horizontally.
   */
  HORIZONTAL: 1,

  /**
   * Vertical layout.
   * Children are stacked vertically.
   */
  VERTICAL: 2
};



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
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = goog.dom.getDomHelper(canvas);

  /**
   * Target DOM canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvas_ = canvas;

  wtf.util.canvas.enableLayer(canvas);

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
   * Layout mode.
   * @type {wtf.ui.LayoutMode}
   * @private
   */
  this.layoutMode_ = wtf.ui.LayoutMode.NONE;

  /**
   * Whether a layout pass is required.
   * @type {boolean}
   * @private
   */
  this.layoutNeeded_ = true;

  /**
   * Cached bounds from the previous layout.
   * @type {!goog.math.Rect}
   * @private
   */
  this.bounds_ = new goog.math.Rect(0, 0, 0, 0);

  /**
   * Cached draw bounds (same as bounds but with padding included).
   * @type {!goog.math.Rect}
   * @private
   */
  this.drawBounds_ = new goog.math.Rect(0, 0, 0, 0);

  /**
   * The desired size of the painter, if it were given infinite space.
   * @type {!goog.math.Size}
   * @private
   */
  this.desiredSize_ = new goog.math.Size(0, 0);

  /**
   * Padding for layout.
   * This value is added to the computed layout bounds.
   * @type {!goog.math.Rect}
   * @private
   */
  this.padding_ = new goog.math.Rect(0, 0, 0, 0);

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
   * A click handler used if {@see #onClickInternal} is not overridden.
   * @type {(function(number, number, number, !goog.math.Rect):
   *     (boolean|undefined))?}
   * @private
   */
  this.defaultClickHandler_ = null;

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
 * Whether to draw debug information.
 * @type {boolean}
 * @const
 * @private
 */
wtf.ui.Painter.DEBUG_ = false;


/**
 * Gets a dom helper.
 * @return {!goog.dom.DomHelper} A dom helper for the document containing
 *     this paint context's canvas.
 */
wtf.ui.Painter.prototype.getDom = function() {
  return this.dom_;
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
 * Gets the pixel scaling ratio used to transform logical pixels to
 * canvas pixels.
 * <code>
 * </code>
 * @return {number} Scale.
 */
wtf.ui.Painter.prototype.getScaleRatio = function() {
  return this.pixelRatio_;
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
 * Gets the layout mode of the painter.
 * @return {wtf.ui.LayoutMode} Current layout mode.
 */
wtf.ui.Painter.prototype.getLayoutMode = function() {
  return this.layoutMode_;
};


/**
 * Sets the layout mode of the painter.
 * @param {wtf.ui.LayoutMode} value New layout mode.
 */
wtf.ui.Painter.prototype.setLayoutMode = function(value) {
  this.layoutMode_ = value;
};


/**
 * Gets the layout padding.
 * @return {!goog.math.Rect} Padding.
 */
wtf.ui.Painter.prototype.getPadding = function() {
  return this.padding_;
};


/**
 * Sets the layout padding.
 * @param {!goog.math.Rect} value New padding.
 */
wtf.ui.Painter.prototype.setPadding = function(value) {
  this.padding_.left = value.left;
  this.padding_.top = value.top;
  this.padding_.width = value.width;
  this.padding_.height = value.height;
};


/**
 * Gets the painter bounds.
 * @return {!goog.math.Rect} Painting bounds, in pixels.
 */
wtf.ui.Painter.prototype.getBounds = function() {
  return this.bounds_;
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
  this.requestLayout();
};


/**
 * Gets the desired size of the painter and children.
 * @return {!goog.math.Size} Desired size.
 */
wtf.ui.Painter.prototype.getDesiredSize = function() {
  return this.desiredSize_.clone();
};


/**
 * Sets the ready state of the paint context.
 * @param {boolean} value New ready value.
 */
wtf.ui.Painter.prototype.setReady = function(value) {
  this.ready_ = value;
  if (value) {
    this.requestLayout();
  }
};


/**
 * Requests a layout (and repaint) of the control on the next rAF.
 * This should be used instead of laying out inline in JS callbacks to ensure
 * no redundant layouts occur.
 * @protected
 */
wtf.ui.Painter.prototype.requestLayout = function() {
  this.layoutNeeded_ = true;
  this.requestRepaint();
};


/**
 * Performs layout on the painter and all children.
 * This is called on the root with the dimensions of the root canvas. Each
 * child then gets called with the available space in its parent, adjusted
 * based on the layout mode.
 *
 * For example if a painter has two children and a layout mode of HORIZONTAL
 * the first child will get the entire bounds and the second will get a bounds
 * with the space the first child used subtracted out.
 *
 * @param {!goog.math.Rect} availableBounds Current available bounds in the
 *     parent.
 * @param {goog.math.Size=} opt_extents An object that will receive the maximum
 *     size of any child painter. This should be initialized to 0,0.
 * @return {!goog.math.Rect} The new bounds of this painter.
 * @protected
 */
wtf.ui.Painter.prototype.layout = function(availableBounds, opt_extents) {
  // Compute the desired bounds, if needed.
  var INFINITE_SIZE = 100000;
  var desiredBounds;
  if (opt_extents) {
    var infiniteBounds = new goog.math.Rect(
        availableBounds.left, availableBounds.top,
        INFINITE_SIZE, INFINITE_SIZE);
    desiredBounds = this.layoutInternal(infiniteBounds);
  }

  // Compute self layout.
  var newBounds = this.layoutInternal(availableBounds);

  // Remaining bounds is available minus self.
  var remainingBounds = newBounds.clone();
  remainingBounds.width =
      Math.max(0, availableBounds.width - newBounds.left);
  remainingBounds.height =
      Math.max(0, availableBounds.height - newBounds.top);

  // Layout children.
  for (var n = 0; n < this.childPainters_.length; n++) {
    var childPainter = this.childPainters_[n];
    var childPadding = childPainter.padding_;
    var childBounds = childPainter.layout(remainingBounds, opt_extents);
    if (!childBounds.width || !childBounds.height) {
      // Skip layout computation for empty painters.
      continue;
    }
    switch (this.layoutMode_) {
      default:
      case wtf.ui.LayoutMode.NONE:
        // No-op.
        break;
      case wtf.ui.LayoutMode.HORIZONTAL:
        // Stack horizontally.
        newBounds.width += childBounds.width + childPadding.width;
        remainingBounds.left += childBounds.width + childPadding.width;
        remainingBounds.width -= childBounds.width - childPadding.width;
        break;
      case wtf.ui.LayoutMode.VERTICAL:
        // Stack vertically.
        newBounds.height += childBounds.height + childPadding.height;
        remainingBounds.top += childBounds.height + childPadding.height;
        remainingBounds.height -= childBounds.height - childPadding.height;
        break;
    }
  }

  this.bounds_ = newBounds;
  var drawBounds = newBounds.clone();
  if (newBounds.width && newBounds.height) {
    drawBounds.left += this.padding_.left;
    drawBounds.top += this.padding_.top;
    drawBounds.width -= this.padding_.left + this.padding_.width;
    drawBounds.height -= this.padding_.top + this.padding_.height;
  }
  this.drawBounds_ = drawBounds;

  if (opt_extents) {
    if (desiredBounds.width != INFINITE_SIZE) {
      opt_extents.width = Math.max(
          opt_extents.width, desiredBounds.left + desiredBounds.width);
    }
    if (desiredBounds.height != INFINITE_SIZE) {
      opt_extents.height = Math.max(
          opt_extents.height, desiredBounds.top + desiredBounds.height);
    }
  }

  return newBounds.clone();
};


/**
 * Performs custom layout of the painter.
 * This will be called with the available bounds in the parent. Subclasses
 * should override this if they want custom layout logic, such as specifying
 * a fixed or variable width/height.
 *
 * @param {!goog.math.Rect} availableBounds Current available bounds in the
 *     parent.
 * @return {!goog.math.Rect} New bounds.
 * @protected
 */
wtf.ui.Painter.prototype.layoutInternal = function(availableBounds) {
  var newBounds = availableBounds.clone();
  switch (this.layoutMode_) {
    default:
    case wtf.ui.LayoutMode.NONE:
      // Use entire extents.
      break;
    case wtf.ui.LayoutMode.HORIZONTAL:
      // Stack horizontally, accumulate width.
      newBounds.width = 0;
      break;
    case wtf.ui.LayoutMode.VERTICAL:
      // Stack vertically, accumulate height.
      newBounds.height = 0;
      break;
  }
  return newBounds;
};


/**
 * Requests a repaint of the control on the next rAF.
 * This should be used instead of repainting inline in JS callbacks to help
 * the browser draw things optimally. Only call repaint directly if the results
 * *must* be displayed immediately, such as in the case of a resize.
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
  var canvasWidth = this.getScaledCanvasWidth();
  var canvasHeight = this.getScaledCanvasHeight();

  // TODO(benvanik): set flag if actually resized
  // TODO(benvanik): don't relayout each paint
  this.layoutNeeded_ = true;

  // Layout, if needed.
  var bounds = this.getBounds();
  if (this.layoutNeeded_) {
    this.layoutNeeded_ = false;
    var availableBounds = new goog.math.Rect(0, 0, canvasWidth, canvasHeight);
    this.desiredSize_.width = 0;
    this.desiredSize_.height = 0;
    bounds = this.layout(availableBounds, this.desiredSize_);
  }

  // Skip all drawing if too small.
  if (bounds.height <= 1) {
    return;
  }

  // Clear contents.
  // TODO(benvanik): only if needed
  this.clear(0, 0, canvasWidth, canvasHeight);

  // Recursively repaint.
  this.recursiveRepaint_();
};


/**
 * Repaints the painter and its children during a repaint phase.
 * @private
 */
wtf.ui.Painter.prototype.recursiveRepaint_ = function() {
  var ctx = this.canvasContext2d_;

  // Skip if too small.
  if (this.drawBounds_.width <= 0 ||
      this.drawBounds_.height <= 0) {
    return;
  }

  // Paint self.
  ctx.save();
  var preventChildren = this.repaintInternal(ctx, this.drawBounds_);
  if (wtf.ui.Painter.DEBUG_) {
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(
        this.bounds_.left, this.bounds_.top,
        this.bounds_.width, this.bounds_.height);
    ctx.fillStyle = '#00ff00';
    ctx.fillText(
        goog.debug.getFunctionName(this.constructor),
        this.bounds_.left, this.bounds_.top + 8);
  }
  ctx.restore();
  if (preventChildren) {
    return;
  }

  // Repaint all children.
  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    childContext.recursiveRepaint_();
  }
};


/**
 * Repaints the context contents.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {!goog.math.Rect} bounds Draw bounds.
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
 * Draws a standard label to the given region.
 * @param {string} label Label.
 * @param {number=} opt_y Inset into the painter bounds.
 * @param {number=} opt_height Height override for the painter bounds.
 */
wtf.ui.Painter.prototype.drawLabel = function(label, opt_y, opt_height) {
  var ctx = this.canvasContext2d_;

  var bounds = this.bounds_;
  var y = goog.isDef(opt_y) ? opt_y : 0;
  var height = goog.isDef(opt_height) ? opt_height : bounds.height;

  var nameHeight = 12;
  if (height > nameHeight) {
    ctx.font = nameHeight + 'px bold verdana, sans-serif';
    var textSize = ctx.measureText(label);

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(
        bounds.left, bounds.top + y + (height + nameHeight) / 2 - nameHeight,
        textSize.width + 8, nameHeight + 2);

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#000000';
    ctx.fillText(
        label,
        bounds.left + 4, bounds.top + y + (height + nameHeight) / 2 - 1);
  }
  ctx.globalAlpha = 1;
};


/**
 * Detects whether the given point is within the bounds of the painter.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @return {boolean} True if the point is within the bounds.
 */
wtf.ui.Painter.prototype.pointInBounds = function(x, y) {
  var bounds = this.drawBounds_;
  return x >= bounds.left &&
      x <= bounds.left + bounds.width &&
      y >= bounds.top &&
      y <= bounds.top + bounds.height;
};


/**
 * Handles click events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} modifiers Modifier key bitmask from
 *     {@see wtf.ui.ModifierKey}.
 * @return {boolean} True if the event was handled.
 */
wtf.ui.Painter.prototype.onClick = function(x, y, modifiers) {
  // Skip if too small.
  if (this.drawBounds_.width <= 0 ||
      this.drawBounds_.height <= 0) {
    return false;
  }

  // Ensure point is inside region.
  if (!this.pointInBounds(x, y)) {
    return false;
  }

  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    if (childContext.onClick(x, y, modifiers)) {
      return true;
    }
  }

  if (this.onClickInternal(x, y, modifiers, this.drawBounds_)) {
    return true;
  }

  return false;
};


/**
 * Handles click events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} modifiers Modifier key bitmask from
 *     {@see wtf.ui.ModifierKey}.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {boolean|undefined} True if the event was handled.
 * @protected
 */
wtf.ui.Painter.prototype.onClickInternal = function(x, y, modifiers, bounds) {
  return this.defaultClickHandler_ ?
      this.defaultClickHandler_(x, y, modifiers, bounds) : undefined;
};


/**
 * Sets the default click handler used when {@see #onClickInternal} is not
 * overridden.
 * @param {!function(this:T, number, number, number, !goog.math.Rect):
 *     (boolean|undefined)} callback Callback function.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.ui.Painter.prototype.setDefaultClickHandler = function(
    callback, opt_scope) {
  this.defaultClickHandler_ = goog.bind(callback, opt_scope);
};


/**
 * Handles mouse move events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} modifiers Modifier key bitmask from
 *     {@see wtf.ui.ModifierKey}.
 * @return {boolean} True if the event was handled.
 */
wtf.ui.Painter.prototype.onMouseMove = function(x, y, modifiers) {
  // Skip if too small.
  if (this.drawBounds_.width <= 0 ||
      this.drawBounds_.height <= 0) {
    return false;
  }

  // TODO(benvanik): some toggle for this behavior? ruler needs to sniff all
  // if (!this.pointInBounds(x, y)) {
  //   return false;
  // }

  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    if (childContext.onMouseMove(x, y, modifiers)) {
      return true;
    }
  }

  if (this.onMouseMoveInternal(x, y, modifiers, this.drawBounds_)) {
    return true;
  }

  return false;
};


/**
 * Handles mouse move events at the given pixel.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} modifiers Modifier key bitmask from
 *     {@see wtf.ui.ModifierKey}.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {boolean|undefined} True if the event was handled.
 * @protected
 */
wtf.ui.Painter.prototype.onMouseMoveInternal = goog.nullFunction;


/**
 * Handles mouse leave events at the given pixel.
 */
wtf.ui.Painter.prototype.onMouseOut = function() {
  this.onMouseOutInternal();
  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    childContext.onMouseOut();
  }
};


/**
 * Handles mouse leave events at the given pixel.
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
  // Skip if too small.
  if (this.drawBounds_.width <= 0 ||
      this.drawBounds_.height <= 0) {
    return undefined;
  }

  // Ensure point is inside region.
  if (!this.pointInBounds(x, y)) {
    return undefined;
  }

  // Get info string.
  var info = this.getInfoStringInternal(x, y, this.drawBounds_);
  if (info) {
    return info;
  }

  for (var n = 0; n < this.childPainters_.length; n++) {
    var childContext = this.childPainters_[n];
    info = childContext.getInfoString(x, y);
    if (info) {
      return info;
    }
  }

  return undefined;
};


/**
 * Attempt to describe the pixel at x,y.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {string|null|undefined} Info string or undefined for none.
 * @protected
 */
wtf.ui.Painter.prototype.getInfoStringInternal = goog.nullFunction;
