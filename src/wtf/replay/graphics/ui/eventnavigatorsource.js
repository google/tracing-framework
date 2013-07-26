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

goog.require('wtf.db.Filter');
goog.require('wtf.ui.VirtualTableSource');



/**
 * Virtual table data source wrapping events for graphics playback.
 *
 * @param {!wtf.replay.graphics.Playback} playback The relevant playback.
 * @param {!wtf.db.EventList} eventList Event list for an entire animation.
 * @constructor
 * @extends {wtf.ui.VirtualTableSource}
 */
wtf.replay.graphics.ui.EventNavigatorTableSource = function(
    playback, eventList) {
  goog.base(this);

  /**
   * The relevant playback
   * @type {!wtf.replay.graphics.Playback}
   * @private
   */
  this.playback_ = playback;

  /**
   * Event list for an entire animation.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = eventList;

  /**
   * Current search filter, if any.
   * @type {wtf.db.Filter}
   * @private
   */
  this.filter_ = null;

  /**
   * A set of IDs matched event types.
   * @type {!Object.<number, boolean>}
   * @private
   */
  this.matchedEventTypeIds_ = {};

  var currentStep = playback.getCurrentStep();
  var eventIterator = currentStep ? currentStep.getEventIterator(true) : null;
  var numEventsInStep = currentStep ? eventIterator.getCount() : 0;

  // Include an additional dummy row denoting the beginning of the step.
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
  var it = currentStep ? currentStep.getEventIterator(true) : null;
  if (!it) {
    return;
  }

  this.setRowCount(currentStep ? it.getCount() + 1 : 0);
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
  var matchedEventColor = '#ffa500';
  var x = gutterWidth + charWidth;
  var rectWidth = bounds.width - gutterWidth;

  // Iterate ahead to the event represented by the top row displayed.
  var currentRow = this.playback_.getSubStepEventId();
  var currentContextHandle = currentStep.getInitialCurrentContext();
  var contextChangingEvents = currentStep.getContextChangingEvents();
  for (var i = 1; i < first; ++i) {
    it.next();
  }

  // Get the current entry in the list of context-changing events in the step.
  var currentContextEntry = this.getContextChange_(
      currentContextHandle, contextChangingEvents, it.getIndex());

  // Get events that change the current context.
  var createContextTypeId =
      this.eventList_.getEventTypeId('wtf.webgl#createContext');
  var setContextTypeId =
      this.eventList_.getEventTypeId('wtf.webgl#setContext');

  var columnTitle = '';
  var argumentFilter = this.filter_ ? this.filter_.getArgumentFilter() : null;
  for (var n = first; n <= last && !it.done(); n++, y += rowHeight) {
    // TODO(benvanik): icons to differentiate event types?

    // Determine the background color.
    if ((currentRow == -1 && !n) || currentRow == n - 1) {
      ctx.fillStyle = highlightedColor;
    } else {
      if (n && this.filter_ && this.matchedEventTypeIds_[it.getTypeId()] &&
          (!argumentFilter || argumentFilter(it))) {
        ctx.fillStyle = matchedEventColor;
      } else {
        ctx.fillStyle = n % 2 ? color1 : color2;
      }
    }

    // Determine the text content.
    if (n) {
      if (it.isScope() || it.isInstance()) {
        // Change to the next current context if necessary.
        if (currentContextEntry < contextChangingEvents.length &&
            contextChangingEvents[currentContextEntry][0] <= it.getIndex()) {
          currentContextHandle =
              contextChangingEvents[currentContextEntry][1];
          ++currentContextEntry;
        }

        var typeId = it.getTypeId();
        if (typeId == createContextTypeId) {
          columnTitle =
              'Context with handle ' + it.getArgument('handle') + ' created.';
        } else if (typeId == setContextTypeId) {
          columnTitle =
              'Context with handle ' + it.getArgument('handle') +
                  ' set as current.';
        } else {
          var contextHandleText = (currentContextHandle != -1) ?
              currentContextHandle : 'None';
          columnTitle = it.getLongString(true) +
              ' (context handle  ' + contextHandleText + ')';
        }

        it.next();
      }
    } else {
      columnTitle = 'Beginning of step.';
    }

    ctx.fillRect(gutterWidth, y, rectWidth, rowHeight);
    ctx.fillStyle = '#000000';
    ctx.fillText(columnTitle, x, Math.floor(y + rowCenter));
  }
};


/**
 * Gets the current entry within the table of events that change the context
 * within a step based on the index of the current event.
 * @param {number} initialContextHandle The handle of the current context at
 *     the beginning of this step.
 * @param {!Array.<!Array.<number>>} contextChangingEvents A list of 2-tuples.
 *     Each 2-tuple contains the ID of a context-changing event and the new
 *     context handle.
 * @param {number} eventIndex The index of the current event.
 * @return {number} The index within the table of events.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.getContextChange_ =
    function(initialContextHandle, contextChangingEvents, eventIndex) {
  // Find out which context the first displayed event pertains to.
  var lowContextEntry = 0;
  var highContextEntry = contextChangingEvents.length;
  var midContextEntry = 0;
  while (lowContextEntry < highContextEntry) {
    midContextEntry = lowContextEntry +
        Math.floor((highContextEntry - lowContextEntry) / 2);
    if (contextChangingEvents[midContextEntry][0] == eventIndex) {
      break;
    } else if (contextChangingEvents[midContextEntry][0] < eventIndex) {
      lowContextEntry = midContextEntry + 1;
    } else {
      highContextEntry = midContextEntry - 1;
    }
  }

  return midContextEntry;
};


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.onClick =
    function(row, x, modifiers, bounds) {
  var playback = this.playback_;
  var currentStep = playback.getCurrentStep();
  if (!currentStep) {
    return;
  }

  // If this row reflects an event, go to it.
  if (row) {
    playback.seekSubStepEvent(row - 1);
  } else {
    // Go to the beginning of the step.
    playback.seekStep(playback.getCurrentStepIndex());
    this.invalidate();
  }

  // Redraw.
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


/**
 * Updates the token used to search for events.
 * @param {string} value The new value.
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.setSearchValue =
    function(value) {
  if (!value || !value.length) {
    this.filter_ = null;
    this.matchedEventTypeIds_ = {};
  } else {
    this.filter_ = new wtf.db.Filter(value);
    this.matchedEventTypeIds_ =
        this.filter_.getMatchedEventTypes(this.eventList_.eventTypeTable);
  }

  this.invalidate();
};
