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

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.fx.Dragger');
goog.require('goog.math');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('goog.userAgent');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.timing');
goog.require('wtf.timing.RunMode');
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
   * Scrollbar thumb.
   * @type {!Element}
   * @private
   */
  this.scrollThumbEl_ = this.getChildElement(goog.getCssName('scrollThumb'));

  /**
   * Scrollbar track.
   * @type {!Element}
   * @private
   */
  this.scrollTrackEl_ = this.getChildElement(goog.getCssName('scrollTrack'));

  /**
   * Current scroll top Y (out of {@see scrollHeight_}), in CSS pixels.
   * @type {number}
   * @private
   */
  this.scrollTop_ = 0;

  /**
   * Height of the scrollable area, in CSS pixels.
   * @type {number}
   * @private
   */
  this.scrollHeight_ = 0;

  /**
   * Height of the scroll thumb, in CSS pixels.
   * @type {number}
   * @private
   */
  this.scrollThumbHeight_ = 0;

  /**
   * Canvas height, in CSS units.
   * Updated on resize.
   * @type {number}
   * @private
   */
  this.canvasHeight_ = 0;

  /**
   * A timer interval used for repeatable actions, such as holding the mouse
   * down on the scrollbar.
   * @type {wtf.timing.Handle}
   * @private
   */
  this.repeatInterval_ = null;

  /**
   * Whether the user is currently scrolling via animation or dragging.
   * @type {boolean}
   * @private
   */
  this.scrolling_ = false;

  var el = this.getRootElement();
  var dom = this.getDom();
  var eh = this.getHandler();

  var tooltip = new wtf.ui.Tooltip(dom);
  this.registerDisposable(tooltip);
  this.setTooltip(tooltip);

  var paintContext = new wtf.ui.VirtualTable.Painter_(this.canvas_, this);
  this.setPaintContext(paintContext);

  // Setup scrollbar logic.
  this.setupScrolling_();

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
 * Repeat interval for scrolling, in ms.
 * @type {number}
 * @const
 * @private
 */
wtf.ui.VirtualTable.SCROLL_REPEAT_DELAY_ = 200;


/**
 * Constants denoting how the target row should be aligned after scrolling.
 * @enum {number}
 */
wtf.ui.VirtualTable.Alignment = {
  BOTTOM: 1,
  MIDDLE: 2,
  TOP: 3
};


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
        this.updateScrollBounds_, this);
  }

  this.source_ = source;
  if (this.source_) {
    // Listen events.
    this.source_.addListener(
        wtf.events.EventType.INVALIDATED, this.requestRepaint, this);
    this.source_.addListener(
        wtf.ui.VirtualTableSource.EventType.INVALIDATE_ROW_COUNT,
        this.updateScrollBounds_, this);
  }
  this.updateScrollBounds_();
};


/**
 * @override
 */
wtf.ui.VirtualTable.prototype.layoutInternal = function() {
  this.updateScrollBounds_();
};


/**
 * Sets up the scrollbar.
 * @private
 */
wtf.ui.VirtualTable.prototype.setupScrolling_ = function() {
  var eh = this.getHandler();

  // Scroll thumb dragging.
  eh.listen(this.scrollThumbEl_, goog.events.EventType.MOUSEDOWN, function(e) {
    e.stopPropagation();
    e.preventDefault();

    var scrollStart = this.scrollTop_;
    this.scrolling_ = true;

    // Create dragger on demand.
    var dragger = new goog.fx.Dragger(this.scrollThumbEl_, null);
    dragger.defaultAction = goog.nullFunction;
    dragger.startDrag(e);
    var startClientY = e.clientY;

    // Scroll with the dragging.
    goog.events.listen(
        dragger, goog.fx.Dragger.EventType.DRAG, function(e) {
          // Calculate new scroll top.
          var deltaY = e.clientY - startClientY;
          var deltaPx = deltaY * this.scrollHeight_ / this.canvasHeight_;
          this.updateScrollThumb_(scrollStart + deltaPx);
        }, false, this);

    // Cleanup dragger when dragging ends.
    goog.events.listenOnce(
        dragger, goog.fx.Dragger.EventType.END, function(e) {
          this.scrolling_ = false;
          goog.dispose(dragger);
        }, false, this);
  });

  // Scrollbar track scrolling by page.
  eh.listen(this.scrollTrackEl_, goog.events.EventType.MOUSEDOWN, function(e) {
    if (e.target != this.scrollTrackEl_ ||
        e.button != 0) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    // Get direction based on whether the click is above or below thumb.
    var thumbPos = goog.style.getClientPosition(this.scrollThumbEl_);
    var direction = thumbPos.y < e.clientY ? 1 : -1;
    this.scrollByPages_(direction);

    // Start repeat interval.
    this.repeatInterval_ = wtf.timing.setInterval(
        wtf.timing.RunMode.DEFAULT,
        wtf.ui.VirtualTable.SCROLL_REPEAT_DELAY_,
        function() {
          this.scrollByPages_(direction * 3 / 4);
        }, this);
  });
  eh.listen(this.scrollTrackEl_, goog.events.EventType.MOUSEUP, function(e) {
    wtf.timing.clearInterval(this.repeatInterval_);
  });
  eh.listen(this.scrollTrackEl_, goog.events.EventType.MOUSEOUT, function(e) {
    wtf.timing.clearInterval(this.repeatInterval_);
  });

  // Mouse wheel support. This could use tweaking on OSX where scroll
  // direction is reversed.
  var wheelEventType = goog.userAgent.GECKO ? 'DOMMouseScroll' : 'mousewheel';
  eh.listen(this.canvas_, wheelEventType, function(e) {
    e.stopPropagation();
    e.preventDefault();

    var z = 0;
    var browserEvent = e.getBrowserEvent();
    if (goog.isDef(browserEvent.wheelDelta)) {
      z = browserEvent.wheelDelta / 120;
      if (goog.userAgent.OPERA) {
        z = -z;
      }
    } else if (goog.isDef(browserEvent.detail)) {
      z = -browserEvent.detail / 3;
    }
    if (z) {
      this.scrollByRows_(-z * 3);
    }
  });

  // Prevent selection on the thumb and track.
  // Even with the CSS disable Chrome will still change the mouse cursor while
  // dragging.
  eh.listen(this.scrollThumbEl_, goog.events.EventType.SELECTSTART,
      function(e) {
        e.preventDefault();
      });
  eh.listen(this.scrollTrackEl_, goog.events.EventType.SELECTSTART,
      function(e) {
        e.preventDefault();
      });
};


/**
 * Gets the scroll top of the control.
 * @return {number} Current scroll top.
 */
wtf.ui.VirtualTable.prototype.getScrollTop = function() {
  return this.scrollTop_;
};


/**
 * Updates the scrollbar and repaints the display.
 * @private
 */
wtf.ui.VirtualTable.prototype.updateScrollBounds_ = function() {
  this.scrollThumbHeight_ = goog.style.getSize(this.scrollThumbEl_).height;
  this.canvasHeight_ = goog.style.getSize(this.canvas_).height;

  var height = 0;
  if (this.source_) {
    height = this.source_.getRowCount() * this.source_.getRowHeight();
  }
  this.scrollHeight_ = height;
  this.scrollTop_ = 0;
  goog.style.setStyle(this.scrollThumbEl_, 'marginTop', '0px');

  this.requestRepaint();
  this.updateTooltip();
};


/**
 * Scrolls the virtual table to a certain row.
 * @param {number} rowTarget The 0-based index of the row to scroll to.
 * @param {!wtf.ui.VirtualTable.Alignment} alignment How the target row is
 *     aligned after scrolling.
 */
wtf.ui.VirtualTable.prototype.scrollToRow = function(rowTarget, alignment) {
  if (!this.source_) {
    throw new Error('Attempted to scroll to a row with no table source set.');
  }

  var rowHeight = this.source_.getRowHeight();
  var scrollAmount = this.scrollTop_;
  var totalHeightOfRows = rowHeight * rowTarget;

  switch (alignment) {
    case wtf.ui.VirtualTable.Alignment.TOP:
      scrollAmount = totalHeightOfRows;
      break;
    case wtf.ui.VirtualTable.Alignment.MIDDLE:
      scrollAmount = totalHeightOfRows - this.canvasHeight_ / 2 + rowHeight;
      break;
    case wtf.ui.VirtualTable.Alignment.BOTTOM:
      scrollAmount = totalHeightOfRows - this.canvasHeight_ + rowHeight;
      break;
  }

  this.updateScrollThumb_(scrollAmount);
};


/**
 * Updates the scrollbar thumb position.
 * @param {number} scrollTop New scroll top.
 * @private
 */
wtf.ui.VirtualTable.prototype.updateScrollThumb_ = function(scrollTop) {
  this.scrollTop_ = goog.math.clamp(scrollTop, 0, this.scrollHeight_);

  // Offset the thumb to the new position.
  var y = wtf.math.remap(
      this.scrollTop_,
      0, this.scrollHeight_,
      0, this.canvasHeight_ - this.scrollThumbHeight_);
  goog.style.setStyle(this.scrollThumbEl_, 'marginTop', y + 'px');

  // We do the repaint async - it's possible for the thumb to move out of sync.
  this.requestRepaint();
  this.updateTooltip();
};


/**
 * Scrolls by pages.
 * @param {number} delta Number of pages to scroll. May be fractional.
 * @private
 */
wtf.ui.VirtualTable.prototype.scrollByPages_ = function(delta) {
  var pageScrollDy = delta * this.canvasHeight_;
  this.updateScrollThumb_(this.scrollTop_ + pageScrollDy);
};


/**
 * Scrolls by rows.
 * @param {number} delta Number of rows to scroll. May be fractional.
 * @private
 */
wtf.ui.VirtualTable.prototype.scrollByRows_ = function(delta) {
  var rowScrollDy = delta;
  if (this.source_) {
    rowScrollDy *= this.source_.getRowHeight();
  }
  this.updateScrollThumb_(this.scrollTop_ + rowScrollDy);
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
  var rowHeight = source.getRowHeight();
  var rowCount = source.getRowCount();
  var scrollHeight = rowHeight * rowCount;
  var scrollTop = this.table_.getScrollTop();

  // Create scrolled bounding region.
  var scrollBounds = bounds.clone();
  scrollBounds.top += scrollTop;

  // Clamp bounds to height of the control.
  scrollBounds.height = Math.min(
      scrollHeight - scrollBounds.top, scrollBounds.height);

  // Calculate visible rows.
  var first = scrollBounds.top / rowHeight;
  var last = (scrollBounds.top + scrollBounds.height) / rowHeight;
  first = Math.floor(first);
  last = Math.min(rowCount - 1, Math.floor(last));
  var rowOffset = (first * rowHeight) - scrollBounds.top;

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
  if (this.table_.scrolling_) {
    return false;
  }

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
  if (this.table_.scrolling_) {
    return undefined;
  }

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
  var rowHeight = source.getRowHeight();
  var rowCount = source.getRowCount();
  var scrollTop = this.table_.getScrollTop();

  if (!rowCount) {
    return undefined;
  }

  var row = Math.floor((y + scrollTop) / rowHeight);
  if (row >= rowCount) {
    return undefined;
  }

  return row;
};
