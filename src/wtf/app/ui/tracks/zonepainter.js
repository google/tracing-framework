/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Paints a zone in the tracks panel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.tracks.ZonePainter');

goog.require('wtf.data.EventFlag');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.ModifierKey');
goog.require('wtf.ui.RangePainter');
goog.require('wtf.ui.color.Palette');



/**
 * Zone track painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.db.Zone} zone Zone.
 * @param {!wtf.app.ui.Selection} selection Selection state.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.ui.tracks.ZonePainter = function ZonePainter(canvas, zone, selection) {
  goog.base(this, canvas);
  var dom = this.getDom();

  /**
   * Zone.
   * @type {!wtf.db.Zone}
   * @private
   */
  this.zone_ = zone;

  /**
   * Selection state.
   * @type {!wtf.app.ui.Selection}
   * @private
   */
  this.selection_ = selection;
  this.selection_.addListener(
      wtf.events.EventType.INVALIDATED, this.requestRepaint, this);

  /**
   * Color palette used for drawing scopes/instances.
   * @type {!wtf.ui.color.Palette}
   * @private
   */
  this.palette_ = new wtf.ui.color.Palette(
      wtf.ui.color.Palette.SCOPE_COLORS);
};
goog.inherits(wtf.app.ui.tracks.ZonePainter, wtf.ui.RangePainter);


/**
 * Height of a scope (including border), in px.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_ = 18;


/**
 * Height of an instance event, in pixels.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.INSTANCE_HEIGHT_ =
    wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_ * 2 / 3;


/**
 * Fake amount of time given to instance events so they show up.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_ = 0.001;


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  var eventList = this.zone_.getEventList();
  var maxDepth = eventList.getMaximumScopeDepth() + 1;
  var scopeHeight = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
  newBounds.height = maxDepth * scopeHeight;
  return newBounds;
};


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  var repaintStartTime = wtf.now();

  // Get a table of matching event types (if a filter is set).
  // This is used by the draw routines to quickly see if an event is filtered.
  var matchedEventTypes = null;
  if (this.selection_.hasFilterSpecified()) {
    var filter = this.selection_.getFilter();
    matchedEventTypes = filter.getMatchedEventTypes(
        this.zone_.getDatabase().getEventTypeTable());
  }

  // Root time tracker.
  ctx.fillStyle = 'rgb(200,200,200)';
  ctx.fillRect(bounds.left, bounds.top, bounds.width, 1);

  // Draw scopes first.
  this.drawScopes_(bounds, timeLeft, timeRight, matchedEventTypes);

  // Draw flow lines.
  // TODO(benvanik): draw flow lines/arrows/etc.

  // Draw instance events.
  this.drawInstanceEvents_(bounds, timeLeft, timeRight, matchedEventTypes);

  var repaintDuration = wtf.now() - repaintStartTime;
  //goog.global.console.log('zone paint', repaintDuration);
};


/**
 * Draw scopes.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 * @param {Object.<number, boolean>} matchedEventTypes Filtered event types.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.drawScopes_ = function(
    bounds, timeLeft, timeRight, matchedEventTypes) {
  var palette = this.palette_;

  var eventList = this.zone_.getEventList();

  this.beginRenderingRanges(bounds, eventList.getMaximumScopeDepth());

  var selectionStart = this.selection_.getTimeStart();
  var selectionEnd = this.selection_.getTimeEnd();

  // Draw all scopes.
  var it = eventList.beginTimeRange(timeLeft, timeRight, true);
  for (; !it.done(); it.nextScope()) {
    var enterTime = it.getTime();
    var leaveTime = it.getEndTime();

    // Compute screen size.
    var left = wtf.math.remap(enterTime,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var right = wtf.math.remap(leaveTime,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var screenWidth = right - left;

    // Clip with the screen.
    // Math.max(bounds.left, left)
    var screenLeft = bounds.left;
    if (screenLeft < left) {
      screenLeft = left;
    }
    // Math.min((bounds.left + bounds.width) - 0.999, right)
    var screenRight = (bounds.left + bounds.width) - 0.999;
    if (screenRight > right) {
      screenRight = right;
    }
    if (screenLeft >= screenRight) {
      continue;
    }

    // Get color in the palette used for filling.
    // Cache this on the event so we don't have to do it each time.
    var name = it.getName();
    var color = it.getTag();
    if (!color) {
      color = palette.getColorForString(name).toValue();
      it.setTag(color);
    }

    var alpha = 1;
    if (enterTime >= selectionEnd || leaveTime <= selectionStart) {
      // Outside of range, deemphasize.
      alpha = 0.3;
    } else if (matchedEventTypes) {
      // Overlaps range and we have a filter, test the event.
      var selected = matchedEventTypes[it.getTypeId()];
      if (!selected) {
        alpha = 0.3;
      } else if (screenRight - screenLeft < 1) {
        // Provide an alpha bump to tiny selected zones. By making these
        // ranges more than 100% alpha they will remain fully opaque even
        // with the antialiasing done in RangeRenderer.
        alpha = 1 / (screenRight - screenLeft);
      } else {
        alpha = 1;
      }
    }

    var depth = it.getDepth();
    this.drawRange(depth, screenLeft, screenRight, color, alpha);

    if (screenWidth > 15) {
      var y = depth * wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
      var label = name;
      this.drawRangeLabel(
          bounds, left, right, screenLeft, screenRight, y, label);
    }
  }

  // Now blit the nicely rendered ranges onto the screen.
  var y = 1;
  var h = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
  this.endRenderingRanges(bounds, y, h);
};


/**
 * Draw instance events.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 * @param {Object.<number, boolean>} matchedEventTypes Filtered event types.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.drawInstanceEvents_ = function(
    bounds, timeLeft, timeRight, matchedEventTypes) {
  var palette = this.palette_;

  var eventList = this.zone_.getEventList();

  this.beginRenderingRanges(bounds, eventList.getMaximumScopeDepth(),
      wtf.ui.RangePainter.DrawStyle.INSTANCE);

  var selectionStart = this.selection_.getTimeStart();
  var selectionEnd = this.selection_.getTimeEnd();

  var instanceTimeWidth = wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_;

  // Draw all events.
  var it = eventList.beginTimeRange(timeLeft, timeRight, true);
  for (; !it.done(); it.nextInstance()) {
    // Ignore internal events.
    if (it.getTypeFlags() & wtf.data.EventFlag.INTERNAL) {
      continue;
    }

    // Snap the end time to the parent.
    // TODO(benvanik): speed this up so that a parent iterator is not required.
    var time = it.getTime();
    var depth = it.getDepth();
    var endTime = time + instanceTimeWidth;
    if (depth) {
      var parentIt = it.getParent(true);
      endTime = Math.min(endTime, parentIt.getEndTime());
    }

    // Compute screen offset.
    var left = wtf.math.remap(time,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var right = wtf.math.remap(endTime,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var screenWidth = right - left;

    // Cache this on the event so we don't have to do it each time.
    var name = it.getName();
    var color = /** @type {!wtf.ui.color.RgbColorValue} */ (it.getTag());
    if (!color) {
      color = palette.getColorForString(name).toValue();
      it.setTag(color);
    }

    var screenLeft = Math.max(bounds.left, left);
    var screenRight = Math.min((bounds.left + bounds.width) - 0.999, right);
    if (screenLeft >= screenRight) {
      continue;
    }

    var alpha = 1;
    if (time > selectionEnd || time < selectionStart) {
      // Outside of range, deemphasize.
      alpha = 0.3;
    } else if (matchedEventTypes) {
      // Overlaps range and we have a filter, test the event.
      var selected = matchedEventTypes[it.getTypeId()];
      if (!selected) {
        alpha = 0.3;
      } else if (screenRight - screenLeft < 1) {
        // Provide an alpha bump to tiny selected zones. By making these
        // ranges more than 100% alpha they will remain fully opaque even
        // with the antialiasing done in RangeRenderer.
        alpha = 1 / (screenRight - screenLeft);
      } else {
        alpha = 1;
      }
    }

    this.drawRange(depth, screenLeft, screenRight, color, alpha);
  }

  // Now blit the nicely rendered ranges onto the screen.
  var y = 1;
  var h = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
  this.endRenderingRanges(bounds, y, h);
};


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  var it = this.hitTest_(x, y, bounds);
  if (!it) {
    return false;
  }

  // TODO(benvanik): escape other characters?
  var newFilterString = '/^' +
      it.getType().name.replace(/([\.\$\-\*\+])/g, '\\$1') +
      '$/';

  var commandManager = wtf.events.getCommandManager();
  if (modifiers & wtf.ui.ModifierKey.SHIFT) {
    // Shift-clicking a scope selects it and zooms to fit.
    if (it.isScope()) {
      var timeStart = it.getTime();
      var timeEnd = it.getEndTime();
      commandManager.execute('goto_range', this, null, timeStart, timeEnd);
      commandManager.execute('select_range', this, null, timeStart, timeEnd);
    }
  } else {
    commandManager.execute('filter_events', this, null, newFilterString);
  }

  return true;
};


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.getInfoStringInternal =
    function(x, y, bounds) {
  var it = this.hitTest_(x, y, bounds);
  return it ? it.getInfoString() : undefined;
};


/**
 * Finds the event/scope at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {wtf.db.EventIterator} Result, if any.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.hitTest_ = function(x, y, bounds) {
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  var time = wtf.math.remap(x,
      bounds.left, bounds.left + bounds.width,
      timeLeft, timeRight);

  var eventList = this.zone_.getEventList();
  var it = eventList.getEventNearTime(time);
  if (!it || it.done()) {
    return null;
  }

  // If the event is shallower than we expect, definitely not interested.
  // Otherwise, move up until it matches our depth.
  var scopeHeight = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
  var expectedDepth = Math.floor((y - bounds.top) / scopeHeight);
  if (it.getDepth() < expectedDepth) {
    return null;
  }
  while (!it.done() && it.getDepth() > expectedDepth) {
    it.moveToParent();
  }
  if (it.done()) {
    return null;
  }

  if (it.isScope()) {
    if (it.getTime() <= time && it.getEndTime() >= time) {
      return it;
    }
  } else {
    var parentIt = it.getParent();
    var timeEnd =
        it.getTime() + wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_;
    if (parentIt && timeEnd > parentIt.getEndTime()) {
      timeEnd = parentIt.getEndTime();
    }
    if (it.getTime() <= time && timeEnd >= time) {
      return it;
    }
  }

  return null;
};
