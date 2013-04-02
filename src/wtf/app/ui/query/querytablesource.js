/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Query virtualized table source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.query.QueryTableSource');

goog.require('wtf.db.Unit');
goog.require('wtf.events');
goog.require('wtf.ui.VirtualTableSource');



/**
 * Virtual table data source wrapping the query results.
 *
 * @param {!wtf.db.EventIterator} result Query result.
 * @constructor
 * @extends {wtf.ui.VirtualTableSource}
 */
wtf.app.ui.query.QueryTableSource = function(result) {
  goog.base(this);

  /**
   * Display units.
   * @type {wtf.db.Unit}
   * @private
   */
  this.units_ = wtf.db.Unit.TIME_MILLISECONDS;

  /**
   * All rows.
   * @type {!wtf.db.EventIterator}
   * @private
   */
  this.result_ = result;
  this.setRowCount(result.getCount());
};
goog.inherits(wtf.app.ui.query.QueryTableSource, wtf.ui.VirtualTableSource);


/**
 * Sets the display units.
 * @param {wtf.db.Unit} value Display units.
 */
wtf.app.ui.query.QueryTableSource.prototype.setUnits = function(value) {
  this.units_ = value;
};


/**
 * @override
 */
wtf.app.ui.query.QueryTableSource.prototype.paintRowRange = function(
    ctx, bounds, scrollBounds, rowOffset, rowHeight, first, last) {
  ctx.font = '11px monospace';
  var charWidth = ctx.measureText('0').width;
  var charHeight = 11;
  var rowCenter = rowHeight / 2 + 10 / 2;

  // Gutter.
  // TODO(benvanik): move into table as an option?
  var gutterWidth = 60;
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, gutterWidth, bounds.height);
  var y = rowOffset;
  for (var n = first; n <= last; n++, y += rowHeight) {
    var line = String(n);
    ctx.fillStyle = 'black';
    ctx.fillText(
        line,
        gutterWidth - ((line.length + 1) * charWidth),
        Math.floor(y + rowCenter));
  }
  ctx.fillStyle = '#dddddd';
  ctx.fillRect(gutterWidth - 1, 0, 1, bounds.height);

  var drewColumnTime = false;
  var columnTimeWidth = 13 * charWidth;

  // Draw row contents.
  y = rowOffset;
  var it = this.result_;
  for (var n = first; n <= last; n++, y += rowHeight) {
    ctx.fillStyle = n % 2 ? '#fafafa' : '#ffffff';
    ctx.fillRect(gutterWidth, y, bounds.width - gutterWidth, rowHeight);

    // TODO(benvanik): icons to differentiate event types?

    var columnTime = -1;
    var columnTitle = '';

    ctx.fillStyle = 'black';

    it.seek(n);
    if (it.isScope()) {
      columnTime = it.getTime();
      columnTitle = it.getName();
    } else if (it.isInstance()) {
      columnTime = it.getTime();
      columnTitle = it.getName();
    }
    // TODO(benvanik): arguments/etc?

    var x = gutterWidth + charWidth;
    if (columnTime >= 0) {
      var columnTimeText = wtf.db.Unit.format(columnTime, this.units_);
      ctx.fillText(
          columnTimeText,
          x + columnTimeWidth - (columnTimeText.length * charWidth),
          Math.floor(y + rowCenter));
      x += columnTimeWidth + 2 * charWidth;
      drewColumnTime = true;
    }

    ctx.fillText(
        columnTitle,
        x,
        Math.floor(y + rowCenter));
  }

  if (drewColumnTime) {
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(
        gutterWidth + charWidth + columnTimeWidth + charWidth,
        0, 1, bounds.height);
  }
};


/**
 * @override
 */
wtf.app.ui.query.QueryTableSource.prototype.onClick = function(
    row, x, modifiers, bounds) {
  var it = this.result_;
  it.seek(row);

  var startTime = it.getTime();
  var endTime = 0;
  if (it.isScope()) {
    endTime = it.getEndTime();
  } else if (it.isInstance()) {
    endTime = startTime;
  }

  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('filter_events', this, null, '');
  if (startTime == endTime) {
    commandManager.execute('select_all', this, null);
    commandManager.execute('goto_range', this, null,
        startTime - 0.01, endTime + 0.01, true);
  } else {
    commandManager.execute('select_range', this, null, startTime, endTime);
    commandManager.execute('goto_range', this, null, startTime, endTime, true);
  }
  commandManager.execute('navigate', this, null, 'tracks');
  return true;
};


/**
 * @override
 */
wtf.app.ui.query.QueryTableSource.prototype.getInfoString = function(
    row, x, bounds) {
  var it = this.result_;
  it.seek(row);
  return it.getInfoString(this.units_);
};


// TODO(benvanik): if attr value is a URL, add an 'open' link
// TODO(benvanik): onhover sets indicator on navbar
