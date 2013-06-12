/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Virtualized table data source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.VirtualTableSource');

goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * Abstract data source type for the virtual table.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.ui.VirtualTableSource = function() {
  goog.base(this);

  /**
   * Row height.
   * @type {number}
   * @private
   */
  this.rowHeight_ = 19;

  /**
   * Total number of rows in the source.
   * This is used for paging and scrolling behavior and should be kept up to
   * date.
   * @type {number}
   * @private
   */
  this.rowCount_ = 0;
};
goog.inherits(wtf.ui.VirtualTableSource, wtf.events.EventEmitter);


/**
 * @enum {string}
 */
wtf.ui.VirtualTableSource.EventType = {
  /**
   * Row count changed.
   */
  INVALIDATE_ROW_COUNT: 'row_count_changed'
};


/**
 * Gets the height, in pixels, of each row.
 * @return {number} Row height.
 */
wtf.ui.VirtualTableSource.prototype.getRowHeight = function() {
  return this.rowHeight_;
};


/**
 * Sets the height, in pixels, of each row.
 * @param {number} value New row height.
 */
wtf.ui.VirtualTableSource.prototype.setRowHeight = function(value) {
  if (this.rowHeight_ != value) {
    this.rowHeight_ = value;
    this.emitEvent(wtf.ui.VirtualTableSource.EventType.INVALIDATE_ROW_COUNT);
  }
};


/**
 * Gets the total number of rows in the data source.
 * @return {number} Row count.
 */
wtf.ui.VirtualTableSource.prototype.getRowCount = function() {
  return this.rowCount_;
};


/**
 * Sets the total number of rows in the data source.
 * @param {number} value New row count.
 */
wtf.ui.VirtualTableSource.prototype.setRowCount = function(value) {
  if (this.rowCount_ != value) {
    this.rowCount_ = value;
    this.emitEvent(wtf.ui.VirtualTableSource.EventType.INVALIDATE_ROW_COUNT);
  }
};


/**
 * Requests a paint of the given row range.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {!goog.math.Rect} scrollBounds Scroll bounds. This is the top Y of
 *     the region to start painting the rows at.
 * @param {number} rowOffset Y to start drawing the first row at, in px.
 * @param {number} rowHeight Height of each row, in px.
 * @param {number} first First row index.
 * @param {number} last Last row index.
 */
wtf.ui.VirtualTableSource.prototype.paintRowRange = goog.abstractMethod;


/**
 * Handles click events on the given row.
 * @param {number} row Row.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} modifiers Modifier key bitmask from
 *     {@see wtf.ui.ModifierKey}.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {boolean|undefined} True if the event was handled.
 */
wtf.ui.VirtualTableSource.prototype.onClick = goog.nullFunction;


/**
 * Attempt to describe the given row.
 * @param {number} row Row.
 * @param {number} x X coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {string|null|undefined} Info string or undefined for none.
 */
wtf.ui.VirtualTableSource.prototype.getInfoString = goog.nullFunction;


/**
 * Invalidates the table data.
 * This should be called when the contents of any rows change.
 */
wtf.ui.VirtualTableSource.prototype.invalidate = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
