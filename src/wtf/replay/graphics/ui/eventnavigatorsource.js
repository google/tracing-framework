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
goog.require('wtf.events');
goog.require('wtf.replay.graphics.Playback');
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

  /**
   * Width of '0' character.
   * Updated each paint.
   * @type {number}
   * @private
   */
  this.charWidth_ = 0;

  var currentStep = playback.getCurrentStep();
  var eventIterator = currentStep ? currentStep.getEventIterator(true) : null;
  var numEventsInStep = currentStep ? eventIterator.getCount() : 0;

  // Include an additional dummy row denoting the beginning of the step.
  this.setRowCount(currentStep ? numEventsInStep + 1 : 0);

  // Listen to events that may update the event navigator.
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.VISUALIZER_STATE_CHANGED,
      this.invalidate, this);
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
   * Right-hand border color of the gutter.
   */
  GUTTER_BORDER: '#dddddd',

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
  SKIPPED_BACKGROUND: '#cccccc',

  /**
   * The background color of the currently selected row.
   */
  CURRENT_BACKGROUND: '#4d90fe',

  /**
   * The text color of the currently selected row.
   */
  CURRENT_TEXT: '#ffffff',

  /**
   * The text color of font buttons.
   */
  FONT_BUTTON_TEXT: '#aaaaaa',

  /**
   * The background color of rows for events with altered arguments.
   */
  ARGS_ALTERED_BACKGROUND: '#f9edbe',

  /**
   * The text color of rows for events with altered arguments.
   */
  ARGS_ALTERED_TEXT: '#000000',

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
   * The left side of the edit button.
   */
  EDIT_LEFT: 0,

  /**
   * The width of the edit button.
   */
  EDIT_WIDTH: 28,

  /**
   * The left side of the highlight draw call button.
   */
  HIGHLIGHT_LEFT: 28,

  /**
   * The width of the highlight draw call button.
   */
  HIGHLIGHT_WIDTH: 18,

  /**
   * The left side of the skip draw call button.
   */
  SKIP_LEFT: 46,

  /**
   * The width of the SKIP draw call button.
   */
  SKIP_WIDTH: 18,

  /**
   * The left side of the goto button.
   */
  GOTO_LEFT: 64,

  /**
   * The width of the goto button.
   */
  GOTO_WIDTH: 28,

  /**
   * The width of the gutter.
   */
  GUTTER_WIDTH: 116
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
   * The font for buttons.
   */
  BUTTON: '25px monospace'
};


/**
 * @override
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.paintRowRange =
    function(ctx, bounds, scrollBounds, rowOffset, rowHeight, first, last) {
  var playback = this.playback_;
  // Alias enums.
  var colors = wtf.replay.graphics.ui.EventNavigatorTableSource.COLOR_;
  var fonts = wtf.replay.graphics.ui.EventNavigatorTableSource.FONT_;
  var lengths = wtf.replay.graphics.ui.EventNavigatorTableSource.LENGTH_;

  // Gutter.
  // TODO(benvanik): move into table as an option?
  var gutterWidth = lengths.GUTTER_WIDTH;
  ctx.fillStyle = colors.GUTTER_BACKGROUND;
  ctx.fillRect(0, 0, gutterWidth, bounds.height);
  ctx.fillStyle = colors.GUTTER_BORDER;
  ctx.fillRect(gutterWidth - 1, 0, 1, bounds.height);

  // Grab the step and see if we have anything to draw.
  var currentStep = this.playback_.getCurrentStep();
  var it = currentStep ? currentStep.getEventIterator(true) : null;
  if (!it) {
    return;
  }
  this.setRowCount(currentStep ? it.getCount() + 1 : 0);

  ctx.font = fonts.DEFAULT;
  var charWidth = ctx.measureText('0').width;
  this.charWidth_ = charWidth;
  var rowCenter = rowHeight / 2 + 10 / 2;

  // Iterate ahead to the event represented by the top row displayed.
  var currentRow = playback.getSubStepEventIndex();
  var contextChangingEvents = currentStep.getContextChangingEvents();
  for (var i = 1; i < first; ++i) {
    it.next();
  }

  // Draw line numbers.
  var y = rowOffset;
  ctx.fillStyle = colors.DEFAULT_TEXT;
  for (var n = first; n <= last; n++, y += rowHeight) {
    var line = String(n);
    var lineNumberXPosition = gutterWidth - ((line.length + 1) * charWidth);
    var yTextPosition = Math.floor(y + rowCenter);
    ctx.fillText(line, lineNumberXPosition, yTextPosition);
  }

  // Draw goto buttons.
  if (wtf.events.getCommandManager()) {
    y = rowOffset;
    ctx.font = fonts.BUTTON;
    ctx.fillStyle = colors.FONT_BUTTON_TEXT;
    for (var n = first; n <= last; n++, y += rowHeight) {
      if (n != 0) {
        ctx.fillText('\u2299', lengths.GOTO_LEFT, y + rowHeight);
      }
    }
  }

  // Draw row contents.
  y = rowOffset;
  ctx.font = fonts.DEFAULT;
  ctx.fillStyle = colors.DEFAULT_TEXT;
  var x = gutterWidth + charWidth;
  var rectWidth = bounds.width - gutterWidth;

  // Get the current entry in the list of context-changing events in the step.
  var currentContextEntry = this.getContextChange_(
      contextChangingEvents, it.getIndex());
  var currentContextHandle;
  if (currentContextEntry == -1) {
    // Use initial context handle.
    currentContextHandle = currentStep.getInitialCurrentContext();
  } else {
    currentContextHandle = contextChangingEvents[currentContextEntry][1];
  }

  // Get events that change the current context.
  var createContextTypeId =
      this.eventList_.getEventTypeId('wtf.webgl#createContext');
  var setContextTypeId =
      this.eventList_.getEventTypeId('wtf.webgl#setContext');

  // Grab filter, if it's valid.
  var filter = this.filter_ && !this.filter_.getError() ? this.filter_ : null;
  var argumentFilter = filter ? filter.getArgumentFilter() : null;

  var columnTitle = '';
  var contextLinePosition = x + 4 * charWidth;
  var mainTitleXPosition = contextLinePosition + charWidth;
  for (var n = first; n <= last && !it.done(); n++, y += rowHeight) {
    // TODO(benvanik): icons to differentiate event types?

    var skipCalls = playback.getVisualizer('skipCalls');

    // Determine the background color.
    if ((currentRow == -1 && !n) || currentRow == n - 1) {
      ctx.fillStyle = colors.CURRENT_BACKGROUND;
    } else {
      if (n && filter && this.matchedEventTypeIds_[it.getTypeId()] &&
          (!argumentFilter || argumentFilter(it))) {
        ctx.fillStyle = colors.MATCHED_BACKGROUND;
      } else if (this.idsOfEventsWithUpdatedArguments_[it.getId()]) {
        ctx.fillStyle = colors.ARGS_ALTERED_BACKGROUND;
      } else if (playback.isDrawCall(it) &&
          skipCalls && skipCalls.isEventSkipped(it)) {
        ctx.fillStyle = colors.SKIPPED_BACKGROUND;
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
          ctx.font = fonts.BUTTON;
          var oldColor = ctx.fillStyle;
          ctx.fillStyle = colors.FONT_BUTTON_TEXT;
          // Use the unicode lower right pencil character as the edit button.
          ctx.fillText('\u270e', charWidth, y + rowHeight);
          ctx.fillStyle = oldColor;
          ctx.font = fonts.DEFAULT;
        }

        // Draw draw call exclusive buttons.
        if (playback.isDrawCall(it)) {
          var oldColor = ctx.fillStyle;
          ctx.font = fonts.BUTTON;
          ctx.fillStyle = colors.FONT_BUTTON_TEXT;

          // Draw the highlight button using the unicode 'position indicator'.
          ctx.fillText('\u2316', lengths.HIGHLIGHT_LEFT, y + rowHeight);

          // Draw the skip button using the unicode 'x in a box' character.
          ctx.fillText('\u2327', lengths.SKIP_LEFT, y + rowHeight);

          ctx.font = fonts.DEFAULT;
          ctx.fillStyle = oldColor;
        }

        // Add friendly text for context-changing events, and remove prefix.
        var typeId = it.getTypeId();
        if (typeId == createContextTypeId) {
          columnTitle = '(new context created)';
        } else if (typeId == setContextTypeId) {
          columnTitle = '(context set as current)';
        } else {
          // Remove the 'WebGLRenderingContext#' prefix.
          columnTitle = it.getLongString(true);
          var hashIndex = columnTitle.indexOf('#');
          if (hashIndex != -1) {
            columnTitle = columnTitle.substring(hashIndex + 1);
          }
        }

        // Change text color under certain conditions.
        if (currentRow == n - 1) {
          // The row is the current one.
          ctx.fillStyle = colors.CURRENT_TEXT;
        } else if (filter && this.matchedEventTypeIds_[it.getTypeId()] &&
            (!argumentFilter || argumentFilter(it))) {
          // A query exists, and this row matches.
          ctx.fillStyle = colors.MATCHED_TEXT;
        } else if (this.idsOfEventsWithUpdatedArguments_[it.getId()]) {
          // The arguments for this row have been altered.
          ctx.fillStyle = colors.ARGS_ALTERED_TEXT;
        }

        // Determine the next context.
        if (contextChangingEvents.length) {
          var nextEntry = currentContextEntry + 1;
          if (nextEntry < contextChangingEvents.length &&
              contextChangingEvents[nextEntry][0] <= it.getIndex()) {
            currentContextEntry = nextEntry;
            currentContextHandle =
                contextChangingEvents[currentContextEntry][1];
          }
        }

        // Write the current context.
        var contextHandleText = currentContextHandle != -1 ?
            '' + currentContextHandle : '-';
        ctx.fillText(contextHandleText, x, Math.floor(y + rowCenter));

        it.next();
      }
    } else {
      // TODO(benvanik): get frame from step or intra-frame range.
      columnTitle = '(beginning of step)';
    }

    ctx.fillText(columnTitle, mainTitleXPosition, Math.floor(y + rowCenter));

    // Draw line separating the context handle from the event title.
    ctx.fillStyle = colors.GUTTER_BORDER;
    ctx.fillRect(contextLinePosition - 1, 0, 1, bounds.height);
  }
};


/**
 * Gets the current entry within the table of events that change the context
 * within a step based on the index of the current event. Or -1 if the initial
 * context handle should be used.
 * @param {!Array.<!Array.<number>>} contextChangingEvents A list of 2-tuples.
 *     Each 2-tuple contains the ID of a context-changing event and the new
 *     context handle.
 * @param {number} eventIndex The index of the current event.
 * @return {number} The index within the table of events. Or -1 if the initial
 *     context handle should be used.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.getContextChange_ =
    function(contextChangingEvents, eventIndex) {
  // If event index precedes all context-changing events, use initial context.
  if (!contextChangingEvents.length ||
      eventIndex < contextChangingEvents[0][0]) {
    return -1;
  }

  // Binary search for the lower-bounding context-changing event.
  var low = 0;
  var high = contextChangingEvents.length;

  while (low < high) {
    var mid = low + Math.floor((high - low) / 2);
    if (contextChangingEvents[mid][0] < eventIndex) {
      // Look on the right side.
      low = mid + 1;
    } else if (contextChangingEvents[mid][0] > eventIndex) {
      // Look on the left side.
      high = mid;
    } else {
      // If the event IDs match, event with @eventIndex changes the context.
      return mid;
    }
  }

  // We seek 1 less than the lower bound since the event falls before.
  return low - 1;
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

  // TODO(benvanik): move to a metrics calculation object.
  var lengths = wtf.replay.graphics.ui.EventNavigatorTableSource.LENGTH_;
  var editLeft = lengths.EDIT_LEFT;
  var editRight = editLeft + lengths.EDIT_WIDTH;
  var highlightLeft = lengths.HIGHLIGHT_LEFT;
  var highlightRight = highlightLeft + lengths.HIGHLIGHT_WIDTH;
  var skipLeft = lengths.SKIP_LEFT;
  var skipRight = skipLeft + lengths.SKIP_WIDTH;
  var gotoLeft = lengths.GOTO_LEFT;
  var gotoRight = lengths.GUTTER_WIDTH;
  var contextLeft = lengths.GUTTER_WIDTH;
  var contextRight = contextLeft + 5 * this.charWidth_;

  // If this row reflects an event, go to it.
  if (row) {
    var it = currentStep.getEventIterator(true);
    it.seek(row - 1);

    if (x > editLeft && x <= editRight) {
      // Edit button.
      if (it.getType().getArguments().length) {
        this.handleEditClick_(row);
      }
    } else if (x > highlightLeft && x <= highlightRight) {
      if (playback.isDrawCall(it)) {
        playback.visualizeSubStep('highlight', it.getIndex());
      }
    } else if (x > skipLeft && x <= skipRight) {
      if (playback.isDrawCall(it)) {
        playback.visualizeSubStep('skipCalls', it.getIndex());
        this.invalidate();
      }
    } else if (x > gotoLeft && x <= gotoRight) {
      // Goto button.
      var commandManager = wtf.events.getCommandManager();
      if (commandManager) {
        var startTime = it.getTime();
        var endTime = it.isScope() ? it.getEndTime() : startTime;
        if (startTime == endTime) {
          endTime += 1;
        }
        commandManager.execute('navigate', this, null, 'tracks');
        commandManager.execute('goto_range', this, null,
            startTime, endTime, true);
      }
    } else if (x > contextLeft && x <= contextRight) {
      // Only allow for clicking the edit button if arguments exist.
      // TODO(benvanik): context click?
    } else {
      var soughtIndex = row - 1;
      if (soughtIndex != playback.getSubStepEventIndex()) {
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
  this.playback_.clearProgramsCache();
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
  this.playback_.clearProgramsCache();
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
  var targetIndex = playback.getSubStepEventIndex();
  playback.seekStep(playback.getCurrentStepIndex());
  playback.seekSubStepEvent(targetIndex);
};


/**
 * Gets the context handle of the given event.
 * This is slow and should be used sparingly.
 * @param {!wtf.db.EventIterator} it Iterator.
 * @return {string?} Context handle, if any.
 * @private
 */
wtf.replay.graphics.ui.EventNavigatorTableSource.prototype.getContextOfEvent_ =
    function(it) {
  var currentStep = this.playback_.getCurrentStep();
  var contextChangingEvents = currentStep.getContextChangingEvents();
  var currentContextEntry = this.getContextChange_(
      contextChangingEvents, it.getIndex());

  var currentContextHandle;
  if (currentContextEntry == -1) {
    // Use initial context.
    currentContextHandle = currentStep.getInitialCurrentContext();
  } else {
    currentContextHandle = contextChangingEvents[currentContextEntry][1];
  }

  return String(currentContextHandle);
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

  // TODO(benvanik): move to a metrics calculation object.
  var lengths = wtf.replay.graphics.ui.EventNavigatorTableSource.LENGTH_;
  var editLeft = lengths.EDIT_LEFT;
  var editRight = editLeft + lengths.EDIT_WIDTH;
  var highlightLeft = lengths.HIGHLIGHT_LEFT;
  var highlightRight = highlightLeft + lengths.HIGHLIGHT_WIDTH;
  var skipLeft = lengths.SKIP_LEFT;
  var skipRight = skipLeft + lengths.SKIP_WIDTH;
  var gotoLeft = lengths.GOTO_LEFT;
  var gotoRight = lengths.GUTTER_WIDTH;
  var contextLeft = lengths.GUTTER_WIDTH;
  var contextRight = contextLeft + 5 * this.charWidth_;

  if (x > editLeft && x <= editRight) {
    // Edit button.
    if (it.getType().getArguments().length) {
      return 'Edit arguments for ' + it.getName();
    }
    return null;
  } else if (x > highlightLeft && x <= highlightRight) {
    if (this.playback_.isDrawCall(it)) {
      return 'Highlight this draw call';
    } else {
      // Otherwise, show what the goto area shows.
      return it.getScopeStackString();
    }
  } else if (x > skipLeft && x <= skipRight) {
    if (this.playback_.isDrawCall(it)) {
      return 'Skip draws with the shader program used here';
    } else {
      // Otherwise, show what the goto area shows.
      return it.getScopeStackString();
    }
  } else if (x > gotoLeft && x <= gotoRight) {
    // Goto button.
    return it.getScopeStackString();
  } else if (x > contextLeft && x <= contextRight) {
    // Context handle column.
    var contextHandle = this.getContextOfEvent_(it);
    if (!contextHandle) {
      return null;
    }
    var lines = [];
    lines.push('Context ' + contextHandle);
    var context = this.playback_.getContext(contextHandle);
    if (context) {
      lines.push('width: ' + context.drawingBufferWidth);
      lines.push('height: ' + context.drawingBufferHeight);
      var attributes = this.playback_.getContextAttributes(contextHandle);
      lines.push('attributes:');
      for (var key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          lines.push('  ' + key + ': ' + attributes[key]);
        }
      }
    }
    return lines.join('\n');
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
