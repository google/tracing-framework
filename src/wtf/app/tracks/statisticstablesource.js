/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Track info bar virtualized table source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.tracks.StatisticsTableSource');

goog.require('wtf.data.EventFlag');
goog.require('wtf.db.InstanceEventDataEntry');
goog.require('wtf.db.ScopeEventDataEntry');
goog.require('wtf.db.SortMode');
goog.require('wtf.db.Unit');
goog.require('wtf.events');
goog.require('wtf.ui.ModifierKey');
goog.require('wtf.ui.VirtualTableSource');



/**
 * Virtual table data source showing event statistics.
 *
 * @constructor
 * @extends {wtf.ui.VirtualTableSource}
 */
wtf.app.tracks.StatisticsTableSource = function() {
  goog.base(this);

  /**
   * All rows, by current sort order.
   * This is reset each time the {@see #update} method is used.
   * @type {!Array.<!wtf.db.EventDataEntry>}
   * @private
   */
  this.rows_ = [];
  this.setRowCount(0);
  this.setRowHeight(35);

  /**
   * Current sort mode.
   * @type {wtf.db.SortMode}
   * @private
   */
  this.sortMode_ = wtf.db.SortMode.TOTAL_TIME;

  /**
   * Display units.
   * @type {wtf.db.Unit}
   * @private
   */
  this.units_ = wtf.db.Unit.TIME_MILLISECONDS;
};
goog.inherits(
    wtf.app.tracks.StatisticsTableSource, wtf.ui.VirtualTableSource);


/**
 * Sets the display units.
 * @param {wtf.db.Unit} value Display units.
 */
wtf.app.tracks.StatisticsTableSource.prototype.setUnits = function(value) {
  this.units_ = value;
};


/**
 * Updates the source with the given event statistics table.
 * @param {!wtf.db.EventStatistics.Table} table Event statistics table.
 * @param {wtf.db.SortMode} sortMode Table sort mode.
 */
wtf.app.tracks.StatisticsTableSource.prototype.update = function(
    table, sortMode) {
  this.sortMode_ = sortMode;

  var allRows = [];
  table.forEach(function(entry) {
    // Ignore system events.
    var eventType = entry.getEventType();
    if (eventType.flags & wtf.data.EventFlag.INTERNAL) {
      return;
    }

    allRows.push(entry);
  }, undefined, sortMode);
  this.rows_ = allRows;
  this.setRowCount(allRows.length);

  this.invalidate();
};


/**
 * @override
 */
wtf.app.tracks.StatisticsTableSource.prototype.paintRowRange = function(
    ctx, bounds, scrollBounds, rowOffset, rowHeight, first, last) {
  ctx.font = '11px monospace';
  var charWidth = ctx.measureText('0').width;
  var charHeight = 11;
  var lineHeight = 19;
  var rowCenter = lineHeight / 2 + 10 / 2;

  // Gutter.
  // TODO(benvanik): move into table as an option?
  var gutterWidth = 70;
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, gutterWidth, bounds.height);
  var y = rowOffset;
  for (var n = first; n <= last; n++, y += rowHeight) {
    var entry = this.rows_[n];
    var eventType = entry.getEventType();

    var totalTime = null;
    var userTime = null;
    var meanTime = null;
    var ownTime = null;
    var content = '';
    if (entry instanceof wtf.db.ScopeEventDataEntry) {
      totalTime = wtf.db.Unit.format(entry.getTotalTime(), this.units_, true);
      userTime = wtf.db.Unit.format(entry.getUserTime(), this.units_, true);
      meanTime = wtf.db.Unit.format(entry.getMeanTime(), this.units_, true);
      ownTime = wtf.db.Unit.format(entry.getOwnTime(), this.units_, true);
      content =
          entry.getCount() + ', ' +
          totalTime + ' t, ' +
          userTime + ' u, ' +
          meanTime + ' a';
    } else if (entry instanceof wtf.db.InstanceEventDataEntry) {
      content = String(entry.getCount());
    }

    // Gutter text.
    ctx.font = 'bold 11px monospace';
    var gutterValue = '';
    switch (this.sortMode_) {
      case wtf.db.SortMode.COUNT:
        gutterValue = String(entry.getCount());
        break;
      case wtf.db.SortMode.TOTAL_TIME:
        gutterValue = totalTime || '';
        break;
      case wtf.db.SortMode.MEAN_TIME:
        gutterValue = meanTime || '';
        break;
      case wtf.db.SortMode.OWN_TIME:
        gutterValue = ownTime || '';
        break;
    }
    ctx.fillStyle = 'black';
    ctx.fillText(
        gutterValue,
        gutterWidth - (gutterValue.length * charWidth) - charWidth,
        Math.floor(y + rowCenter));

    // Name.
    ctx.font = '11px monospace';
    var name = eventType.getName();
    ctx.fillText(
        name,
        gutterWidth + charWidth,
        Math.floor(y + rowCenter));

    // Stats.
    ctx.font = '10px monospace';
    ctx.fillStyle = '#909090';
    ctx.fillText(
        content,
        gutterWidth + charWidth,
        Math.floor(y + rowCenter + charHeight + 4));

    // Histogram.
    // TODO(benvanik): get the distribution and draw a little bar chart.
    // Or perhaps just the curve, like a spark-graph.

    // Bottom border.
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(0, y + rowHeight - 1, bounds.width, 1);
  }
  ctx.fillStyle = '#dddddd';
  ctx.fillRect(gutterWidth - 1, 0, 1, bounds.height);
};


/**
 * @override
 */
wtf.app.tracks.StatisticsTableSource.prototype.onClick = function(
    row, x, modifiers, bounds) {
  var entry = this.rows_[row];
  if (!entry) {
    return false;
  }
  var eventType = entry.getEventType();

  var commandManager = wtf.events.getCommandManager();
  var filterString = eventType.getName();
  var only = !!(modifiers & wtf.ui.ModifierKey.SHIFT);
  commandManager.execute('filter_events', this, null, filterString, only);
  return true;
};


/**
 * @override
 */
wtf.app.tracks.StatisticsTableSource.prototype.getInfoString = function(
    row, x, bounds) {
  var entry = this.rows_[row];
  if (!entry) {
    return null;
  }
  var eventType = entry.getEventType();

  // TODO(benvanik): fancy statistics using HTML tables/etc
  var lines = [];
  lines.push(eventType.getName());
  lines.push('Count: ' + entry.getCount());
  if (entry instanceof wtf.db.ScopeEventDataEntry) {
    var unitName;
    switch (this.units_) {
      default:
      case wtf.db.Unit.TIME_MILLISECONDS:
        unitName = 'time';
        break;
      case wtf.db.Unit.SIZE_KILOBYTES:
        unitName = 'size';
        break;
      case wtf.db.Unit.COUNT:
        unitName = 'value';
        break;
    }
    lines.push('Total ' + unitName + ': ' +
        wtf.db.Unit.format(entry.getTotalTime(), this.units_));
    lines.push('Own ' + unitName + ': ' +
        wtf.db.Unit.format(entry.getOwnTime(), this.units_));
    lines.push('User ' + unitName + ': ' +
        wtf.db.Unit.format(entry.getUserTime(), this.units_));
    lines.push('Mean ' + unitName + ': ' +
        wtf.db.Unit.format(entry.getMeanTime(), this.units_));
  }

  return lines.join('\n');
};
