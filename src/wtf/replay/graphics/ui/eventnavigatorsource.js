/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event navigator table source.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.EventNavigatorTableSource');

goog.require('wtf.ui.VirtualTableSource');



/**
 * Virtual table data source wrapping events for graphics playback.
 *
 * @param {!wtf.replay.graphics.Playback} playback The relevant playback.
 * @constructor
 * @extends {wtf.ui.VirtualTableSource}
 */
wtf.replay.graphics.ui.EventNavigatorTableSource = function(playback) {
  goog.base(this);

  /**
   * The relevant playback
   * @type {!wtf.replay.graphics.Playback}
   * @private
   */
  this.playback_ = playback;

  var currentStep = playback.getCurrentStep();
  var eventIterator = currentStep ? currentStep.getEventIterator() : null;
  var numEventsInStep = currentStep ? eventIterator.getCount() : 0;

  // Include a an additional dummy row denoting the beginning of the step.
  this.setRowCount(currentStep ? numEventsInStep + 1 : 0);
};
goog.inherits(
    wtf.replay.graphics.ui.EventNavigatorTableSource,
    wtf.ui.VirtualTableSource);


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.paintRowRange =
    function(ctx, bounds, scrollBounds, rowOffset, rowHeight, first, last) {
  var currentStep = this.playback_.getCurrentStep();
  var it = currentStep ? currentStep.getEventIterator() : null;
  if (!it) {
    return;
  }

  ctx.font = '11px monospace';
  var charWidth = ctx.measureText('0').width;
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

  // Draw row contents.
  y = rowOffset;
  var color1 = '#fafafa';
  var color2 = '#ffffff';
  var highlightedColor = '#2eccfa';
  var x = gutterWidth + charWidth;
  var rectWidth = bounds.width - gutterWidth;

  // Seek to the beginning event.
  var currentRow = this.playback_.getSubStepEventId();
  for (var i = 1; i < first; ++i) {
    it.next();
  }

  var columnTitle = '';
  for (var n = first; n <= last; n++, y += rowHeight) {
    var hideCall = false;
    if (n) {
      if (it.isScope() || it.isInstance()) {
        if (it.isHidden()) {
          // hideCall = true;
          columnTitle = '';
        } else {
          columnTitle = it.getLongString(true);
        }
        it.next();
      }
    } else {
      columnTitle = 'Beginning of step.';
    }

    // TODO(benvanik): icons to differentiate event types?
    if (!hideCall) {
      if (((currentRow === null) && (!n)) || currentRow === n - 1) {
        ctx.fillStyle = highlightedColor;
      } else {
        ctx.fillStyle = n % 2 ? color1 : color2;
      }
      ctx.fillRect(gutterWidth, y, rectWidth, rowHeight);
      ctx.fillStyle = '#000000';
      ctx.fillText(columnTitle, x, Math.floor(y + rowCenter));
    }
  }
};


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.onClick =
    function(row, x, modifiers, bounds) {
  var playback = this.playback_;

  // If this row reflects an event, go to it.
  if (row) {
    var eventId = row - 1;
    playback.seekSubStepEvent(eventId);
  } else if (playback.getCurrentStep()) { // Go the beginning of the step.
    var currentStepId = playback.getCurrentStepIndex();
    playback.seekStep(currentStepId);
  } else {
    return; // No changes to be made if no current step.
  }

  // Updated the currently highlighted row and redraw.
  this.invalidate();
  return true;
};


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.getInfoString =
    function(row, x, bounds) {
  // TODO(chizeng): Return a useful info string.
  return '';
};
