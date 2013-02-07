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

goog.require('goog.asserts');
goog.require('wtf.analysis.Event');
goog.require('wtf.analysis.Scope');
goog.require('wtf.analysis.Zone');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.analysis.db.ZoneIndex');
goog.require('wtf.ui.VirtualTableSource');
goog.require('wtf.util');



/**
 * Virtual table data source wrapping the query results.
 *
 * @param {!Array.<string|number|boolean|wgxpath.Node>} rows Query result rows.
 * @constructor
 * @extends {wtf.ui.VirtualTableSource}
 */
wtf.app.ui.query.QueryTableSource = function(rows) {
  goog.base(this);

  /**
   * All rows.
   * @type {!Array.<string|number|boolean|wgxpath.Node>}
   * @private
   */
  this.rows_ = rows;
  this.setRowCount(this.rows_.length);
};
goog.inherits(wtf.app.ui.query.QueryTableSource, wtf.ui.VirtualTableSource);


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
  for (var n = first; n <= last; n++, y += rowHeight) {
    ctx.fillStyle = n % 2 ? '#fafafa' : '#ffffff';
    ctx.fillRect(gutterWidth, y, bounds.width - gutterWidth, rowHeight);

    // TODO(benvanik): icons to differentiate event types?

    var columnTime = -1;
    var columnTitle = null;

    ctx.fillStyle = 'black';
    var value = this.rows_[n];
    if (typeof value == 'boolean' ||
        typeof value == 'number' ||
        typeof value == 'string') {
      // Primitive.
      columnTitle = String(value);
    } else {
      // Some node.
      if (value instanceof wtf.analysis.Scope) {
        columnTime = value.getEnterTime();
        columnTitle = value.getName();
      } else if (value instanceof wtf.analysis.Event) {
        columnTime = value.getTime();
        columnTitle = value.getEventType().getName();
      } else if (value instanceof wgxpath.Attr) {
        var parentNode = value.getParentNode();
        if (parentNode instanceof wtf.analysis.Scope) {
          columnTime = parentNode.getEnterTime();
        } else if (parentNode instanceof wtf.analysis.Event) {
          columnTime = parentNode.getTime();
        } else {
          columnTime = 0;
        }
        var attrkey = value.getNodeName();
        var attrvalue = value.getNodeValue();
        columnTitle = attrkey + ': ' + attrvalue;
      } else {
        columnTime = 0;
        columnTitle = value.toString();
      }
    }

    var x = gutterWidth + charWidth;
    if (columnTime >= 0) {
      var columnTimeText = wtf.util.formatTime(columnTime);
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
wtf.app.ui.query.QueryTableSource.prototype.getInfoString = function(
    row, x, bounds) {
  var value = this.rows_[row];
  if (typeof value == 'boolean' ||
      typeof value == 'number' ||
      typeof value == 'string') {
    // Primitive.
    // We don't have any additional information.
    return undefined;
  } else {
    // Attributes all use their parent.
    if (value instanceof wgxpath.Attr) {
      var parentNode = value.getParentNode();
      goog.asserts.assert(value);
      value = parentNode;
    }

    if (value instanceof wtf.analysis.Scope) {
      return wtf.analysis.Scope.getInfoString(value);
    } else if (value instanceof wtf.analysis.Event) {
      return wtf.analysis.Event.getInfoString(value);
    } else if (value instanceof wtf.analysis.db.ZoneIndex) {
      return wtf.analysis.Zone.getInfoString(value.getZone());
    } else if (value instanceof wtf.analysis.db.EventDatabase) {
      return undefined;
    }
  }
};

// TODO(benvanik): if attr value is a URL, add an 'open' link
// TODO(benvanik): onclick handler sends to event in timeline
// TODO(benvanik): onhover sets indicator on navbar
