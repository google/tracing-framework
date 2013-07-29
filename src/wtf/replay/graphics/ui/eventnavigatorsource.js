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
goog.require('wtf.replay.graphics.ui.ArgumentsDialog');
goog.require('wtf.ui.VirtualTableSource');



/**
 * Virtual table data source wrapping events for graphics playback.
 *
 * @param {!wtf.replay.graphics.Playback} playback The relevant playback.
 * @param {!wtf.db.EventList} eventList Event list for an entire animation.
 * @param {!goog.dom.DomHelper} domHelper DOM Helper.
 * @constructor
 * @extends {wtf.ui.VirtualTableSource}
 */
wtf.replay.graphics.ui.EventNavigatorTableSource = function(
    playback, eventList, domHelper) {
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

  /**
   * A set of IDs of events whose arguments have been altered.
   * @type {!Object.<boolean>}
   * @private
   */
  this.idsOfEventsWithUpdatedArguments_ = {};

  /**
   * DOM Helper.
   * @type {!goog.dom.DomHelper} dom DOM Helper.
   * @private
   */
  this.domHelper_ = domHelper;

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
 * Contains colors used to draw the rows.
 * @type {!Object.<string>}
 * @const
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.COLOR_ = {
  /**
   * The default text color.
   */
  DEFAULT_TEXT: '#000000',

  /**
   * The background color of the gutter.
   */
  GUTTER_BACKGROUND: '#eeeeee',

  /**
   * The background color of the column of context handles.
   */
  CONTEXT_BACKGROUND: '#ffffff',

  /**
   * The default background color of odd rows.
   */
  ODD_ROW_BACKGROUND: '#ffffff',

  /**
   * The default background color of even rows.
   */
  EVEN_ROW_BACKGROUND: '#fafafa',

  /**
   * The background color of the currently selected row.
   */
  CURRENT_BACKGROUND: '#4d90fe',

  /**
   * The text color of the currently selected row.
   */
  CURRENT_TEXT: '#ffffff',

  /**
   * The text color of the button for editing arguments.
   */
  ALTER_BUTTON_TEXT: '#4d90fe',

  /**
   * The background color of rows for events with altered arguments.
   */
  ARGS_ALTERED_BACKGROUND: '#f9edbe',

  /**
   * The text color of rows for events with altered arguments.
   */
  ARGS_ALTERED_TEXT: '#000000',

  /**
   * The color of the line to the right of the column of context handles.
   */
  CONTEXT_LINE: '#000000',

  /**
   * The background color of rows that match a query.
   */
  MATCHED_BACKGROUND: '#009933',

  /**
   * The text color of rows that match a query.
   */
  MATCHED_TEXT: '#ffffff'
};


/**
 * Contains useful length constants for drawing rows.
 * @type {!Object.<number>}
 * @const
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.LENGTH_ = {
  /**
   * The width of the edit button.
   */
  EDIT_WIDTH: 28,

  /**
   * The width of the column of context handles.
   */
  CONTEXT_WIDTH: 21,

  /**
   * The width of the gutter.
   */
  GUTTER_WIDTH: 65
};


/**
 * Contains useful font information.
 * @type {!Object.<string>}
 * @const
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.FONT_ = {
  /**
   * The default font.
   */
  DEFAULT: '11px monospace',

  /**
   * The font for the edit button.
   */
  EDIT_BUTTON: '25px monospace'
};


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

  // Alias enums.
  var colors = wtf.replay.graphics.ui.EventNavigatorTableSource.COLOR_;
  var fonts = wtf.replay.graphics.ui.EventNavigatorTableSource.FONT_;
  var lengths = wtf.replay.graphics.ui.EventNavigatorTableSource.LENGTH_;

  this.setRowCount(currentStep ? it.getCount() + 1 : 0);
  ctx.font = fonts.DEFAULT;
  var charWidth = ctx.measureText('0').width;
  var rowCenter = rowHeight / 2 + 10 / 2;

  // Gutter.
  // TODO(benvanik): move into table as an option?
  var gutterWidth = lengths.GUTTER_WIDTH;
  ctx.fillStyle = colors.GUTTER_BACKGROUND;
  ctx.fillRect(0, 0, gutterWidth, bounds.height);

  // Iterate ahead to the event represented by the top row displayed.
  var currentRow = this.playback_.getSubStepEventId();
  var currentContextHandle = currentStep.getInitialCurrentContext();
  var contextChangingEvents = currentStep.getContextChangingEvents();
  for (var i = 1; i < first; ++i) {
    it.next();
  }

  var y = rowOffset;
  for (var n = first; n <= last; n++, y += rowHeight) {
    var line = String(n);
    ctx.fillStyle = colors.DEFAULT_TEXT;
    var lineNumberXPosition = gutterWidth - ((line.length + 1) * charWidth);
    var yTextPosition = Math.floor(y + rowCenter);
    ctx.fillText(line, lineNumberXPosition, yTextPosition);
  }

  // Draw row contents.
  y = rowOffset;
  var x = gutterWidth + charWidth;
  var rectWidth = bounds.width - gutterWidth;

  // Get the current entry in the list of context-changing events in the step.
  var currentContextEntry = this.getContextChange_(
      currentContextHandle, contextChangingEvents, it.getIndex());
  if (contextChangingEvents.length) {
    currentContextHandle = contextChangingEvents[currentContextEntry][1];
  }

  // Get events that change the current context.
  var createContextTypeId =
      this.eventList_.getEventTypeId('wtf.webgl#createContext');
  var setContextTypeId =
      this.eventList_.getEventTypeId('wtf.webgl#setContext');

  var columnTitle = '';
  var argumentFilter = this.filter_ ? this.filter_.getArgumentFilter() : null;
  var contextLinePosition = x + 4 * charWidth;
  var mainTitleXPosition = contextLinePosition + charWidth;
  for (var n = first; n <= last && !it.done(); n++, y += rowHeight) {
    // TODO(benvanik): icons to differentiate event types?

    // Determine the background color.
    if ((currentRow == -1 && !n) || currentRow == n - 1) {
      ctx.fillStyle = colors.CURRENT_BACKGROUND;
    } else {
      if (n && this.filter_ && this.matchedEventTypeIds_[it.getTypeId()] &&
          (!argumentFilter || argumentFilter(it))) {
        ctx.fillStyle = colors.MATCHED_BACKGROUND;
      } else if (this.idsOfEventsWithUpdatedArguments_[it.getId()]) {
        ctx.fillStyle = colors.ARGS_ALTERED_BACKGROUND;
      } else {
        ctx.fillStyle = n % 2 ?
            colors.ODD_ROW_BACKGROUND : colors.EVEN_ROW_BACKGROUND;
      }
    }
    ctx.fillRect(gutterWidth, y, rectWidth, rowHeight);

    // Determine the text color.
    if (currentRow == -1 && !n) {
      ctx.fillStyle = colors.CURRENT_TEXT;
    } else {
      ctx.fillStyle = colors.DEFAULT_TEXT;
    }

    // Determine the text content.
    if (n) {
      if (it.isScope() || it.isInstance()) {
        // Draw the edit button if arguments exist.
        if (it.getType().getArguments().length) {
          ctx.fillStyle = colors.DEFAULT_TEXT;
          ctx.font = fonts.EDIT_BUTTON;
          var oldColor = ctx.fillStyle;
          ctx.fillStyle = colors.ALTER_BUTTON_TEXT;
          ctx.fillText('\u270e', charWidth, y + rowHeight);
          ctx.fillStyle = oldColor;
          ctx.font = fonts.DEFAULT;
        }

        // Change to the next current context if necessary.
        if (currentContextEntry < contextChangingEvents.length &&
            contextChangingEvents[currentContextEntry][0] <= it.getIndex()) {
          currentContextHandle =
              contextChangingEvents[currentContextEntry][1];
          ++currentContextEntry;
        }

        // Add friendly text for context-changing events, and remove prefix.
        var typeId = it.getTypeId();
        if (typeId == createContextTypeId) {
          columnTitle = 'New context created.';
        } else if (typeId == setContextTypeId) {
          columnTitle = 'Context set as current.';
        } else {
          // Remove the 'WebGLRenderingContext#' prefix.
          columnTitle = it.getLongString(true).substring(22);
        }
        columnTitle = columnTitle;

        // Change text color under certain conditions.
        if (currentRow == n - 1) {
          // The row is the current one.
          ctx.fillStyle = colors.CURRENT_TEXT;
        } else if (this.filter_ && this.matchedEventTypeIds_[it.getTypeId()] &&
            (!argumentFilter || argumentFilter(it))) {
          // A query exists, and this row matches.
          ctx.fillStyle = colors.MATCHED_TEXT;
        } else if (this.idsOfEventsWithUpdatedArguments_[it.getId()]) {
          // The arguments for this row have been altered.
          ctx.fillStyle = colors.ARGS_ALTERED_TEXT;
        }

        // Write the current context.
        var contextHandleText = currentContextHandle != -1 ?
            '' + currentContextHandle : '-';
        ctx.fillText(contextHandleText, x, Math.floor(y + rowCenter));

        it.next();
      }
    } else {
      columnTitle = 'Beginning of step.';
    }

    ctx.fillText(columnTitle, mainTitleXPosition, Math.floor(y + rowCenter));

    // Draw line separating the context handle from the event title.
    ctx.fillStyle = colors.CONTEXT_LINE;
    ctx.fillRect(contextLinePosition - 1, 0, 1, bounds.height);
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
    var lengths = wtf.replay.graphics.ui.EventNavigatorTableSource.LENGTH_;
    if (x <= lengths.EDIT_WIDTH) {
      var it = currentStep.getEventIterator(true);
      it.seek(row - 1);

      // Only allow for clicking the edit button if arguments exist.
      if (it.getType().getArguments().length) {
        this.handleEditClick_(row);
      }
    } else {
      var soughtIndex = row - 1;
      if (soughtIndex != playback.getSubStepEventId()) {
        playback.seekSubStepEvent(soughtIndex);
      }
    }
  } else {
    // Go to the beginning of the step.
    playback.seekStep(playback.getCurrentStepIndex());
    this.invalidate();
  }

  // Redraw.
  return true;
};


/**
 * Handles clicks of the button that edits arguments.
 * @param {number} rowIndex The index of the row clicked.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.handleEditClick_ =
    function(rowIndex) {
  var currentStep = this.playback_.getCurrentStep();
  if (!currentStep) {
    throw new Error('Attempted to edit arguments with no current step.');
  }

  var it = currentStep.getEventIterator(true);
  it.seek(rowIndex - 1);
  var eventId = it.getId();
  var alterArgumentsDialog =
      new wtf.replay.graphics.ui.ArgumentsDialog(it, this.domHelper_);

  // Listen to events pertaining to arguments changing or being reset.
  alterArgumentsDialog.addListener(
      wtf.replay.graphics.ui.ArgumentsDialog.EventType.ARGUMENTS_ALTERED,
      goog.partial(this.markArgsAltered_, eventId), this);
  alterArgumentsDialog.addListener(
      wtf.replay.graphics.ui.ArgumentsDialog.EventType.ARGUMENTS_RESET,
      goog.partial(this.markArgsReset_, eventId), this);
};


/**
 * Adds an event ID to the set of IDs of events with altered arguments.
 * @param {number} eventId The ID of an event whose arguments were altered.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.markArgsAltered_ =
    function(eventId) {
  this.idsOfEventsWithUpdatedArguments_[eventId] = true;
  this.playbackToCurrent_();
  this.invalidate();
};


/**
 * Removes an event ID from the set of IDs of events with altered arguments.
 * @param {number} eventId The ID of an event whose arguments were reset.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.markArgsReset_ =
    function(eventId) {
  if (!this.idsOfEventsWithUpdatedArguments_[eventId]) {
    return;
  }

  delete this.idsOfEventsWithUpdatedArguments_[eventId];
  this.playbackToCurrent_();
  this.invalidate();
};


/**
 * Plays back up to the current event in the step.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.playbackToCurrent_ =
    function() {
  var playback = this.playback_;
  var targetIndex = playback.getSubStepEventId();
  playback.seekStep(playback.getCurrentStepIndex());
  playback.seekSubStepEvent(targetIndex);
};


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.getInfoString =
    function(row, x, bounds) {
  // The first row is a dummy row that does not represent a call.
  if (!row) {
    return '';
  }

  // If no current step, do not display a tool tip.
  var currentStep = this.playback_.getCurrentStep();
  if (!currentStep) {
    return '';
  }

  // Find the relevant event.
  var it = currentStep.getEventIterator(true);
  it.seek(row - 1);

  // If the user hovers over the edit button and event arguments exist,
  // display instructions.
  var lengths = wtf.replay.graphics.ui.EventNavigatorTableSource.LENGTH_;
  if (x <= lengths.EDIT_WIDTH && it.getType().getArguments().length) {
    return 'Edit arguments for ' + it.getName() + '.';
  }

  return it.getInfoString();
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
