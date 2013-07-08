/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Base resiable control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.ResizableControl');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.fx.Dragger');
goog.require('goog.math');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('wtf.timing');
goog.require('wtf.ui.Control');



/**
 * Base resizable control.
 *
 * @param {wtf.ui.ResizableControl.Orientation} orientation Control orientation.
 * @param {string} splitterClassName CSS name of the splitter div.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.ui.ResizableControl = function(orientation, splitterClassName,
    parentElement, opt_dom) {
  goog.base(this, parentElement, opt_dom);
  var dom = this.getDom();

  /**
   * Orientation.
   * @type {wtf.ui.ResizableControl.Orientation}
   * @private
   */
  this.orientation_ = orientation;

  /**
   * Direction the control sizes from.
   * @type {wtf.ui.ResizableControl.SizeFrom}
   * @private
   */
  this.sizeFrom_ = wtf.ui.ResizableControl.SizeFrom.TOP_LEFT;

  /**
   * Current size in the orientation-defined dimension.
   * @type {number}
   * @private
   */
  this.currentSize_ = -1;
  wtf.timing.setImmediate(function() {
    var currentSize = goog.style.getSize(this.getRootElement());
    switch (orientation) {
      case wtf.ui.ResizableControl.Orientation.HORIZONTAL:
        this.currentSize_ = currentSize.height;
        break;
      case wtf.ui.ResizableControl.Orientation.VERTICAL:
        this.currentSize_ = currentSize.width;
        break;
    }
  }, this);

  /**
   * Minimum size value. If undefined the minimum size is not limited.
   * @type {number|undefined}
   * @private
   */
  this.minimumSize_ = undefined;

  /**
   * Maxmium size value. If undefined the maximum size is not limited.
   * @type {number|undefined}
   * @private
   */
  this.maximumSize_ = undefined;

  /**
   * Splitter <div> element.
   * @type {!Element}
   * @private
   */
  this.splitterDiv_ = /** @type {!Element} */ (dom.getElementByClass(
      splitterClassName, this.getRootElement()));
  goog.asserts.assert(this.splitterDiv_);

  // Styles are set in code so that no GSS is required.
  goog.style.setStyle(this.splitterDiv_, {
    'position': 'absolute'
  });
  switch (this.orientation_) {
    case wtf.ui.ResizableControl.Orientation.HORIZONTAL:
      goog.style.setStyle(this.splitterDiv_, {
        'height': '8px',
        'left': 0,
        'right': 0,
        'cursor': 'ns-resize'
      });
      break;
    case wtf.ui.ResizableControl.Orientation.VERTICAL:
      goog.style.setStyle(this.splitterDiv_, {
        'width': '8px',
        'top': 0,
        'bottom': 0,
        'cursor': 'ew-resize'
      });
      break;
  }
  this.setSizeFrom(wtf.ui.ResizableControl.SizeFrom.TOP_LEFT);

  /**
   * Splitter dragger controller.
   * @type {!goog.fx.Dragger}
   * @private
   */
  this.splitterDragger_ = new goog.fx.Dragger(this.splitterDiv_);
  this.registerDisposable(this.splitterDragger_);
  this.getHandler().listen(this.splitterDragger_,
      goog.fx.Dragger.EventType.START, this.splitterDragStart_, false);
  this.getHandler().listen(this.splitterDragger_,
      goog.fx.Dragger.EventType.BEFOREDRAG, this.splitterDragMove_, false);
  this.getHandler().listen(this.splitterDragger_,
      goog.fx.Dragger.EventType.END, this.splitterDragEnd_, false);

  /**
   * Size of the control when the drag started.
   * @type {number}
   * @private
   */
  this.startSize_ = 0;

  /**
   * Document body cursor at the start of a drag, if any.
   * @type {string|undefined}
   * @private
   */
  this.previousDragCursor_ = undefined;

  // Always trigger a resize once style is available.
  wtf.timing.setImmediate(function() {
    if (this.isDisposed()) {
      return;
    }
    this.sizeChanged();
  }, this);
};
goog.inherits(wtf.ui.ResizableControl, wtf.ui.Control);


/**
 * Events for resizable controls.
 * @enum {string}
 */
wtf.ui.ResizableControl.EventType = {
  SIZE_CHANGED: goog.events.getUniqueId('size_changed')
};


/**
 * Control orientation.
 * @enum {number}
 */
wtf.ui.ResizableControl.Orientation = {
  HORIZONTAL: 0,
  VERTICAL: 1
};


/**
 * Control direction.
 * @enum {number}
 */
wtf.ui.ResizableControl.SizeFrom = {
  TOP_LEFT: 0,
  BOTTOM_RIGHT: 1
};


/**
 * @override
 */
wtf.ui.ResizableControl.prototype.createDom = function(dom) {
  // This function si only here to allow us to be used as a non-subclassed
  // control.
  return this.getParentElement();
};


/**
 * Sets the direction the control sizes from.
 * @param {wtf.ui.ResizableControl.SizeFrom} value New value.
 */
wtf.ui.ResizableControl.prototype.setSizeFrom = function(value) {
  this.sizeFrom_ = value;

  switch (this.orientation_) {
    case wtf.ui.ResizableControl.Orientation.HORIZONTAL:
      switch (this.sizeFrom_) {
        case wtf.ui.ResizableControl.SizeFrom.TOP_LEFT:
          goog.style.setStyle(this.splitterDiv_, {
            'bottom': 0,
            'top': undefined,
            'margin-bottom': '-3px'
          });
          break;
        case wtf.ui.ResizableControl.SizeFrom.BOTTOM_RIGHT:
          goog.style.setStyle(this.splitterDiv_, {
            'top': 0,
            'bottom': undefined,
            'margin-top': '-3px'
          });
          break;
      }
      break;
    case wtf.ui.ResizableControl.Orientation.VERTICAL:
      switch (this.sizeFrom_) {
        case wtf.ui.ResizableControl.SizeFrom.TOP_LEFT:
          goog.style.setStyle(this.splitterDiv_, {
            'left': undefined,
            'right': 0,
            'margin-right': '-3px'
          });
          break;
        case wtf.ui.ResizableControl.SizeFrom.BOTTOM_RIGHT:
          goog.style.setStyle(this.splitterDiv_, {
            'left': 0,
            'right': undefined,
            'margin-left': '-3px'
          });
          break;
      }
      break;
  }
};


/**
 * Gets the minimum size of the control.
 * @return {number|undefined} Minimum size or undefined if none specified.
 */
wtf.ui.ResizableControl.prototype.getMinimumSize = function() {
  return this.minimumSize_;
};


/**
 * Gets the maximum size of the control.
 * @return {number|undefined} Maximum size or undefined if none specified.
 */
wtf.ui.ResizableControl.prototype.getMaximumSize = function() {
  return this.maximumSize_;
};


/**
 * Sets the splitter limits.
 * @param {number|undefined} min Minimum value.
 * @param {number|undefined} max Maximum value.
 */
wtf.ui.ResizableControl.prototype.setSplitterLimits = function(min, max) {
  this.minimumSize_ = min;
  this.maximumSize_ = max;
};


/**
 * Gets the current size of the splitter, in px.
 * @return {number} Splitter size.
 */
wtf.ui.ResizableControl.prototype.getSplitterSize = function() {
  return this.currentSize_;
};


/**
 * Sets the splitter size, in px.
 * @param {number} value New splitter size, in px.
 */
wtf.ui.ResizableControl.prototype.setSplitterSize = function(value) {
  // Snap to min/max.
  value = goog.math.clamp(
      value, this.minimumSize_ || 0, this.maximumSize_ || 10000);
  if (this.currentSize_ == value) {
    this.sizeChanged();
    return;
  }
  this.currentSize_ = value;

  // Resize control.
  switch (this.orientation_) {
    case wtf.ui.ResizableControl.Orientation.HORIZONTAL:
      goog.style.setHeight(this.getRootElement(), value);
      break;
    case wtf.ui.ResizableControl.Orientation.VERTICAL:
      goog.style.setWidth(this.getRootElement(), value);
      break;
  }

  this.sizeChanged();
};


/**
 * Handles splitter drag start events.
 * @param {!goog.fx.DragEvent} e Event.
 * @private
 */
wtf.ui.ResizableControl.prototype.splitterDragStart_ = function(e) {
  // Set dragger limits.
  var limits = new goog.math.Rect(-5000, -5000, 2 * 5000, 2 * 5000);
  switch (this.orientation_) {
    case wtf.ui.ResizableControl.Orientation.HORIZONTAL:
      limits.left = 0;
      limits.width = this.maximumSize_ || 5000;
      break;
    case wtf.ui.ResizableControl.Orientation.VERTICAL:
      limits.top = 0;
      limits.height = this.maximumSize_ || 5000;
      break;
  }
  // -this.maximumSize_,
  // this.maximumSize_ + (this.currentSize_ - this.minimumSize_),
  this.splitterDragger_.setLimits(limits);

  // Reset document cursor to resize so it doesn't flicker.
  var cursorName;
  switch (this.orientation_) {
    case wtf.ui.ResizableControl.Orientation.HORIZONTAL:
      cursorName = 'ns-resize';
      break;
    case wtf.ui.ResizableControl.Orientation.VERTICAL:
      cursorName = 'ew-resize';
      break;
  }
  var body = this.getDom().getDocument().body;
  this.previousDragCursor_ = goog.style.getStyle(body, 'cursor');
  goog.style.setStyle(body, 'cursor', cursorName);

  this.startSize_ = this.currentSize_;
};


/**
 * Handles splitter drag move events.
 * @param {!goog.fx.DragEvent} e Event.
 * @return {boolean} False to prevent default behavior.
 * @private
 */
wtf.ui.ResizableControl.prototype.splitterDragMove_ = function(e) {
  e.browserEvent.preventDefault();

  // Calculate new size and resize.
  var newSize = 0;
  var scalar = 1;
  switch (this.sizeFrom_) {
    case wtf.ui.ResizableControl.SizeFrom.TOP_LEFT:
      newSize = 4;
      break;
    case wtf.ui.ResizableControl.SizeFrom.BOTTOM_RIGHT:
      newSize = this.startSize_;
      scalar = -1;
      break;
  }
  switch (this.orientation_) {
    default:
    case wtf.ui.ResizableControl.Orientation.HORIZONTAL:
      newSize += e.top * scalar;
      break;
    case wtf.ui.ResizableControl.Orientation.VERTICAL:
      newSize += e.left * scalar;
      break;
  }
  this.setSplitterSize(newSize);
  return false;
};


/**
 * Handles splitter drag end events.
 * @param {!goog.fx.DragEvent} e Event.
 * @private
 */
wtf.ui.ResizableControl.prototype.splitterDragEnd_ = function(e) {
  // Restore document cursor.
  var body = this.getDom().getDocument().body;
  goog.style.setStyle(body, 'cursor', this.previousDragCursor_ || '');
};


/**
 * Handles size changes.
 * @protected
 */
wtf.ui.ResizableControl.prototype.sizeChanged = function() {
  this.layout();
  this.emitEvent(wtf.ui.ResizableControl.EventType.SIZE_CHANGED);
};
