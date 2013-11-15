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

goog.provide('wtf.app.tracks.ZonePainter');

goog.require('wtf');
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
 * @param {!wtf.app.Selection} selection Selection state.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.tracks.ZonePainter = function ZonePainter(canvas, zone, selection) {
  goog.base(this, canvas);

  /**
   * Zone.
   * @type {!wtf.db.Zone}
   * @private
   */
  this.zone_ = zone;

  /**
   * Selection state.
   * @type {!wtf.app.Selection}
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
goog.inherits(wtf.app.tracks.ZonePainter, wtf.ui.RangePainter);


/**
 * Height of a scope (including border), in px.
 * @const
 * @type {number}
 * @private
 */
wtf.app.tracks.ZonePainter.SCOPE_HEIGHT_ = 18;


/**
 * Fake amount of time given to instance events so they show up.
 * @const
 * @type {number}
 * @private
 */
wtf.app.tracks.ZonePainter.INSTANCE_TIME_WIDTH_ = 0.001;


/**
 * @override
 */
wtf.app.tracks.ZonePainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  var eventList = this.zone_.getEventList();
  var maxDepth = eventList.getMaximumScopeDepth() + 2;
  var scopeHeight = wtf.app.tracks.ZonePainter.SCOPE_HEIGHT_;
  newBounds.height = maxDepth * scopeHeight;
  return newBounds;
};


/**
 * @override
 */
wtf.app.tracks.ZonePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  if (!this.isTimeRangeValid()) {
    return;
  }

  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  // Root time tracker.
  ctx.fillStyle = 'rgb(200,200,200)';
  ctx.fillRect(bounds.left, bounds.top, bounds.width, 1);

  var eventList = this.zone_.getEventList();
  var maxDepth = eventList.getMaximumScopeDepth();
  this.beginRenderingRanges(bounds, maxDepth + 1);

  // Draw events first.
  var it = eventList.beginTimeRange(timeLeft, timeRight, true);
  this.drawEvents_(it, bounds, timeLeft, timeRight);

  // Now blit the nicely rendered ranges onto the screen.
  var y = 1;
  var h = wtf.app.tracks.ZonePainter.SCOPE_HEIGHT_;
  this.endRenderingRanges(bounds, y, h);

  // Draw flow lines.
  // TODO(benvanik): draw flow lines/arrows/etc.
};


/**
 * Draw events to the range renderers.
 * @param {!wtf.db.EventIterator} it Event iterator.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 * @private
 */
wtf.app.tracks.ZonePainter.prototype.drawEvents_ = function(
    it, bounds, timeLeft, timeRight) {
  var palette = this.palette_;

  // Get a table of matching event types (if a filter is set).
  // This is used by the draw loop to quickly see if an event is filtered.
  var matchedEventTypes = null;
  var argumentFilter = null;
  if (this.selection_.hasFilterSpecified()) {
    var filter = this.selection_.getFilter();
    if (filter.getEventTypeFilter()) {
      matchedEventTypes = filter.getMatchedEventTypes(
          this.zone_.getDatabase().getEventTypeTable());
    }
    argumentFilter = filter.getArgumentFilter();
  }

  var selectionStart = this.selection_.getTimeStart();
  var selectionEnd = this.selection_.getTimeEnd();

  var instanceTimeWidth = wtf.app.tracks.ZonePainter.INSTANCE_TIME_WIDTH_;

  // Minimum width of a scope, in screen-space pixels, before it is shown
  // with a grey box. The smaller this value is the slower large traces will
  // render.
  var MIN_SCOPE_WIDTH = 0.09;
  var SKIP_SCOPE_WIDTH = 0.03;

  while (!it.done()) {
    // Ignore internal events.
    if (it.isHidden()) {
      it.next();
      continue;
    }

    var enterTime = it.getTime();
    var leaveTime = it.getEndTime();
    var isScope = !!leaveTime;

    if (!isScope) {
      // Snap the end time to the parent.
      leaveTime = enterTime + instanceTimeWidth;
      var parentEndTime = it.getParentEndTime();
      if (parentEndTime && parentEndTime < leaveTime) {
        leaveTime = parentEndTime;
      }
    }

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
      it.next();
      continue;
    }

    // If we are *really* small, just skip.
    if (screenWidth < SKIP_SCOPE_WIDTH) {
      it.nextSibling();
      continue;
    }

    // If we are under the draw size, draw a proxy.
    var depth = it.getDepth();
    if (isScope) {
      var maxDepth = it.getMaxDescendantDepth();
      if (depth < maxDepth && screenWidth < MIN_SCOPE_WIDTH) {
        // Draw a proxy from here down to the max depth of any descendant.
        for (var n = depth; n <= maxDepth; n++) {
          this.drawRange(n, screenLeft, screenRight, 0x999999, 0.3);
        }
        it.nextSibling();
        continue;
      }
    }

    var alpha = 1;
    if (enterTime >= selectionEnd || leaveTime <= selectionStart) {
      // Outside of range, deemphasize.
      alpha = 0.3;
    } else if (matchedEventTypes || argumentFilter) {
      // Overlaps range and we have a filter, test the event.
      var selected = true;
      if (matchedEventTypes) {
        selected = matchedEventTypes[it.getTypeId()];
      }
      if (selected && argumentFilter) {
        // Since argument filtering is more expective than event type matching
        // we try to avoid doing it unless required.
        selected = argumentFilter(it);
      }
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

    // Get color in the palette used for filling.
    // Cache this on the event so we don't have to do it each time.
    var name = undefined;
    var color = it.getTag();
    if (!color) {
      name = it.getName();
      color = palette.getColorForString(name).toValue();
      it.setTag(color);
    }

    this.drawRange(depth, screenLeft, screenRight, color, alpha);

    if (screenWidth > 15) {
      name = name || it.getName();
      if (!isScope) {
        name = '[' + name + ']';
      }
      var y = depth * wtf.app.tracks.ZonePainter.SCOPE_HEIGHT_;
      this.drawRangeLabel(
          bounds, left, right, screenLeft, screenRight, y, name);
    }

    it.next();
  }
};


wtf.preventInlining(wtf.app.tracks.ZonePainter.prototype.drawEvents_);


/**
 * @override
 */
wtf.app.tracks.ZonePainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  var it = this.hitTest_(x, y, bounds);
  if (!it) {
    return false;
  }

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
    var filterString = it.getType().name;
    commandManager.execute('filter_events', this, null, filterString, true);
  }

  return true;
};


/**
 * @override
 */
wtf.app.tracks.ZonePainter.prototype.getInfoStringInternal =
    function(x, y, bounds) {
  var it = this.hitTest_(x, y, bounds);
  return it ? it.getInfoString(this.units) : undefined;
};


/**
 * Finds the event/scope at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {wtf.db.EventIterator} Result, if any.
 * @private
 */
wtf.app.tracks.ZonePainter.prototype.hitTest_ = function(x, y, bounds) {
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
  var scopeHeight = wtf.app.tracks.ZonePainter.SCOPE_HEIGHT_;
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
  if (it.isHidden()) {
    return null;
  }

  if (it.isScope()) {
    if (it.getTime() <= time && it.getEndTime() >= time) {
      return it;
    }
  } else {
    // Snap the end time to the parent.
    var timeEnd =
        it.getTime() + wtf.app.tracks.ZonePainter.INSTANCE_TIME_WIDTH_;
    var parentEndTime = it.getParentEndTime();
    if (parentEndTime && parentEndTime < timeEnd) {
      timeEnd = parentEndTime;
    }
    if (it.getTime() <= time && timeEnd >= time) {
      return it;
    }
  }

  return null;
};
