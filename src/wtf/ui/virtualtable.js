/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Virtualized table control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.VirtualTable');

goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.Painter');
goog.require('wtf.ui.Tooltip');
goog.require('wtf.ui.VirtualTableSource');
goog.require('wtf.ui.virtualtable');



/**
 * Virtualized table control.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.ui.VirtualTable = function(parentElement, opt_dom) {
  goog.base(this, parentElement, opt_dom);

  /**
   * Table data source.
   * @type {wtf.ui.VirtualTableSource}
   * @private
   */
  this.source_ = null;

  /**
   * Display canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('canvas')));

  /**
   * Scrollbar outer element.
   * Listen for onscroll events on this.
   * @type {!Element}
   * @private
   */
  this.scrollbarOuterEl_ = this.getChildElement(
      goog.getCssName('scrollbarOuter'));

  /**
   * Scrollbar inner height padding element.
   * Set the height of this to the total height to get a system scrollbar
   * on .scrollbarOuter.
   * @type {!Element}
   * @private
   */
  this.scrollbarInnerEl_ = this.getChildElement(
      goog.getCssName('scrollbarInner'));

  var el = this.getRootElement();
  var dom = this.getDom();
  var eh = this.getHandler();

  var tooltip = new wtf.ui.Tooltip(dom);
  this.registerDisposable(tooltip);
  this.setTooltip(tooltip);

  var paintContext = new wtf.ui.VirtualTable.Painter_(this.canvas_, this);
  this.setPaintContext(paintContext);

  // Repaint on scroll.
  eh.listen(this.scrollbarOuterEl_, goog.events.EventType.SCROLL, function() {
    // Update the offset of the canvas.
    // This is required because CSS sucks.
    goog.style.setPosition(this.canvas_, 0, this.getScrollTop());

    // Repaint immediately to prevent (some) flicker.
    this.repaint();
  }, false);

  // Manage keyboard bindings.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardSuspended = false;
  eh.listen(el, goog.events.EventType.FOCUS, function() {
    if (keyboardSuspended) {
      return;
    }
    keyboardSuspended = true;
    keyboard.suspend();
  }, false);
  eh.listen(el, goog.events.EventType.BLUR, function() {
    if (keyboardSuspended) {
      keyboard.resume();
      keyboardSuspended = false;
    }
  }, false);
};
goog.inherits(wtf.ui.VirtualTable, wtf.ui.Control);


/**
 * @override
 */
wtf.ui.VirtualTable.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.virtualtable.control, {
      }, undefined, dom));
};


/**
 * Focuses the virtual table.
 */
wtf.ui.VirtualTable.prototype.focus = function() {
  var el = this.getRootElement();
  el.focus();
  el.select();
};


/**
 * Gets the current data source, if any.
 * @return {wtf.ui.VirtualTableSource} Source, if any.
 */
wtf.ui.VirtualTable.prototype.getSource = function() {
  return this.source_;
};


/**
 * Sets the data source.
 * @param {wtf.ui.VirtualTableSource} source New source, if any.
 */
wtf.ui.VirtualTable.prototype.setSource = function(source) {
  if (this.source_ == source) {
    return;
  }
  if (this.source_) {
    // Unlisten events.
    this.source_.removeListener(
        wtf.events.EventType.INVALIDATED, this.requestRepaint, this);
    this.source_.removeListener(
        wtf.ui.VirtualTableSource.EventType.INVALIDATE_ROW_COUNT,
        this.updateScrollbar_, this);
  }

  this.source_ = source;
  if (this.source_) {
    // Listen events.
    this.source_.addListener(
        wtf.events.EventType.INVALIDATED, this.requestRepaint, this);
    this.source_.addListener(
        wtf.ui.VirtualTableSource.EventType.INVALIDATE_ROW_COUNT,
        this.updateScrollbar_, this);
  }
  this.updateScrollbar_();
};


/**
 * Gets the scroll top of the control.
 * @return {number} Current scroll top.
 */
wtf.ui.VirtualTable.prototype.getScrollTop = function() {
  return this.scrollbarOuterEl_.scrollTop;
};


/**
 * Updates the scrollbar and repaints the display.
 * @private
 */
wtf.ui.VirtualTable.prototype.updateScrollbar_ = function() {
  var height = 0;
  if (this.source_) {
    height = this.source_.getRowCount() * this.source_.getRowHeight();
  }
  goog.style.setHeight(this.scrollbarInnerEl_, height);
  this.scrollbarOuterEl_.scrollTop = 0;

  this.requestRepaint();
};



/**
 * Table painter.
 * This draws the table contents by deferring row painting to the table source.
 * It handles the calculation of visible rows based on the current scroll offset
 * and other details.
 *
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.ui.VirtualTable} table Virtual table that owns this painter.
 * @constructor
 * @extends {wtf.ui.Painter}
 * @private
 */
wtf.ui.VirtualTable.Painter_ = function(canvas, table) {
  goog.base(this, canvas);

  /**
   * Owning table.
   * @type {!wtf.ui.VirtualTable}
   * @private
   */
  this.table_ = table;
};
goog.inherits(wtf.ui.VirtualTable.Painter_, wtf.ui.Painter);


/**
 * @override
 */
wtf.ui.VirtualTable.Painter_.prototype.repaintInternal = function(ctx, bounds) {
  var source = this.table_.getSource();
  if (!source) {
    return false;
  }
  var scaleRatio = this.getScaleRatio();
  var rowHeight = source.getRowHeight();
  var rowCount = source.getRowCount();
  var scrollHeight = rowHeight * rowCount / scaleRatio;
  var scrollTop = this.table_.getScrollTop();

  // Create scrolled bounding region.
  var scrollBounds = bounds.clone();
  scrollBounds.top += scrollTop / scaleRatio;

  // Clamp bounds to height of the control.
  scrollBounds.height = Math.min(
      scrollHeight - scrollBounds.top, scrollBounds.height);

  // Calculate visible rows.
  var first = scrollBounds.top * scaleRatio / rowHeight;
  var last = (scrollBounds.top + scrollBounds.height) * scaleRatio / rowHeight;
  first = Math.floor(first);
  last = Math.min(rowCount - 1, Math.floor(last));
  var rowOffset = (first * rowHeight) * scaleRatio - scrollBounds.top;

  // Paint using the source.
  source.paintRowRange(
      ctx, bounds, scrollBounds, rowOffset, rowHeight, first, last);

  return false;
};


/**
 * @override
 */
wtf.ui.VirtualTable.Painter_.prototype.onClickInternal = function(
    x, y, modifiers, bounds) {
  var source = this.table_.getSource();
  if (!source) {
    return undefined;
  }

  var row = this.hitTest_(x, y, bounds);
  if (row === undefined) {
    return false;
  }

  // TODO(benvanik): handle selection logic based on modifiers?

  return source.onClick(row, x, modifiers, bounds);
};


/**
 * @override
 */
wtf.ui.VirtualTable.Painter_.prototype.getInfoStringInternal = function(
    x, y, bounds) {
  var source = this.table_.getSource();
  if (!source) {
    return undefined;
  }

  var row = this.hitTest_(x, y, bounds);
  if (row === undefined) {
    return undefined;
  }

  return source.getInfoString(row, x, bounds);
};


/**
 * Gets the row at the given point on the table canvas.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {number|undefined} Row index or undefined if invalid.
 * @private
 */
wtf.ui.VirtualTable.Painter_.prototype.hitTest_ = function(x, y, bounds) {
  var source = this.table_.getSource();
  if (!source) {
    return undefined;
  }
  var scaleRatio = this.getScaleRatio();
  var rowHeight = source.getRowHeight();
  var rowCount = source.getRowCount();
  var scrollTop = this.table_.getScrollTop();

  if (!rowCount) {
    return undefined;
  }

  var row = Math.floor((y + scrollTop / scaleRatio) / rowHeight);
  if (row >= rowCount) {
    return undefined;
  }

  return row;
};
