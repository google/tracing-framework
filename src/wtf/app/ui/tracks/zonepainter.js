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

goog.require('wtf.analysis.Event');
goog.require('wtf.analysis.FlowEvent');
goog.require('wtf.analysis.Scope');
goog.require('wtf.analysis.ScopeEvent');
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
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @param {!wtf.analysis.db.ZoneIndex} zoneIndex Zone index.
 * @param {!wtf.app.ui.Selection} selection Selection state.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.ui.tracks.ZonePainter = function ZonePainter(canvas, db, zoneIndex,
    selection) {
  goog.base(this, canvas);
  var dom = this.getDom();

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  /**
   * Zone index.
   * @type {!wtf.analysis.db.ZoneIndex}
   * @private
   */
  this.zoneIndex_ = zoneIndex;

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
 * Y offset of an instance event from its scope, in px.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.INSTANCE_OFFSET_ =
    wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_ / 3;


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
  var maxDepth = this.zoneIndex_.getMaximumScopeDepth() + 1;
  var scopeHeight = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
  newBounds.height = maxDepth * scopeHeight;
  return newBounds;
};


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  var zoneIndex = this.zoneIndex_;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  // Search left to find the first event relating to a scope at depth 0.
  // This ensures we don't skip drawing scopes that enclose the viewport.
  var firstRootScopeEvent = zoneIndex.search(timeLeft, function(e) {
    return e instanceof wtf.analysis.ScopeEvent && !e.scope.getDepth();
  });
  var searchLeft = firstRootScopeEvent ? firstRootScopeEvent.time : timeLeft;

  // We iterate all events and splice up by type so that we can batch them all
  // and ensure proper ordering.
  // TODO(benvanik): cache lists? keep separate lists inside the zone?
  var scopeCount = 0;
  var flowCount = 0;
  var otherCount = 0;
  var scopeEvents = this.scopeEvents_ || [];
  this.scopeEvents_ = scopeEvents;
  var flowEvents = this.flowEvents_ || [];
  this.flowEvents_ = flowEvents;
  var otherEvents = this.otherEvents_ || [];
  this.otherEvents_ = otherEvents;
  zoneIndex.forEach(searchLeft, timeRight, function(e) {
    if (e instanceof wtf.analysis.ScopeEvent) {
      scopeEvents[scopeCount++] = e;
    } else if (e instanceof wtf.analysis.FlowEvent) {
      flowEvents[flowCount++] = e;
    } else {
      // Ignore leaves.
      // TODO(benvanik): ignore all builtin?
      if (!(e.eventType.flags & wtf.data.EventFlag.INTERNAL)) {
        otherEvents[otherCount++] = e;
      }
    }
  });

  // Root time tracker.
  ctx.fillStyle = 'rgb(200,200,200)';
  ctx.fillRect(bounds.left, bounds.top, bounds.width, 1);

  // Draw scopes first.
  this.drawScopes_(
      bounds, timeLeft, timeRight,
      scopeEvents, scopeCount);

  // Draw flow lines.
  // TODO(benvanik): draw flow lines/arrows/etc.

  // Draw instance events.
  this.drawInstanceEvents_(
      bounds, timeLeft, timeRight,
      otherEvents, otherCount);
};


/**
 * Draw scopes.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 * @param {!Array.<!wtf.analysis.ScopeEvent>} scopeEvents Scope events.
 * @param {number} scopeCount Total number of scopes to draw.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.drawScopes_ = function(
    bounds, timeLeft, timeRight, scopeEvents, scopeCount) {
  var palette = this.palette_;

  this.beginRenderingRanges(bounds, this.zoneIndex_.getMaximumScopeDepth());

  var selectionStart = this.selection_.getTimeStart();
  var selectionEnd = this.selection_.getTimeEnd();
  var selectionEvaluator = this.selection_.hasFilterSpecified() ?
      this.selection_.getFilterEvaluator() : null;

  // Draw all scopes.
  for (var n = 0; n < scopeCount; n++) {
    var e = scopeEvents[n];
    var scope = e.scope;
    var enter = scope.getEnterEvent();
    var leave = scope.getLeaveEvent();

    // TODO(benvanik): better handle broken scopes
    // TODO(benvanik): identify why this happens frequently
    if (!enter || !leave) {
      continue;
    }

    // Ignore if a leave and we already handled the scope.
    if (e == leave && enter.time >= timeLeft) {
      continue;
    }

    // Compute screen size.
    var left = wtf.math.remap(enter.time,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var right = wtf.math.remap(leave.time,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var screenWidth = right - left;

    // Clip with the screen.
    var screenLeft = Math.max(bounds.left, left);
    var screenRight = Math.min((bounds.left + bounds.width) - 0.999, right);
    if (screenLeft >= screenRight) {
      continue;
    }

    // Get color in the palette used for filling.
    var color = palette.getColorForString(enter.eventType.name);

    var alpha = 1;
    if (enter.time > selectionEnd || leave.time < selectionStart) {
      // Outside of range, deemphasize.
      alpha = 0.3;
    } else if (selectionEvaluator) {
      // Overlaps range and we have a filter, test the event.
      var selected = selectionEvaluator(enter);
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

    var depth = scope.getDepth();
    this.drawRange(depth, screenLeft, screenRight, color, alpha);

    if (screenWidth > 15) {
      var y = depth * wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
      var label = enter.eventType.name;
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
 * @param {!Array.<!wtf.analysis.Event>} events Instance events.
 * @param {number} eventCount Total number of instance events to draw.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.drawInstanceEvents_ = function(
    bounds, timeLeft, timeRight, events, eventCount) {
  var palette = this.palette_;

  this.beginRenderingRanges(bounds, this.zoneIndex_.getMaximumScopeDepth(),
      wtf.ui.RangePainter.DrawStyle.INSTANCE);

  var selectionStart = this.selection_.getTimeStart();
  var selectionEnd = this.selection_.getTimeEnd();
  var selectionEvaluator = this.selection_.hasFilterSpecified() ?
      this.selection_.getFilterEvaluator() : null;

  // Draw all events.
  var instanceTimeWidth = wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_;
  for (var n = 0; n < eventCount; n++) {
    var e = events[n];

    // Compute screen offset.
    var endTime = e.time + instanceTimeWidth;
    if (e.scope && e.scope.getLeaveEvent()) {
      endTime = Math.min(endTime, e.scope.getLeaveEvent().time);
    }
    var left = wtf.math.remap(e.time,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var right = wtf.math.remap(endTime,
        timeLeft, timeRight,
        bounds.left, bounds.left + bounds.width);
    var screenWidth = right - left;

    // Get color in the palette used for filling.
    var color = palette.getColorForString(e.eventType.name);

    var screenLeft = Math.max(bounds.left, left);
    var screenRight = Math.min((bounds.left + bounds.width) - 0.999, right);
    if (screenLeft >= screenRight) continue;

    var alpha = 1;
    if (e.time > selectionEnd || e.time < selectionStart) {
      // Outside of range, deemphasize.
      alpha = 0.3;
    } else if (selectionEvaluator) {
      // Overlaps range and we have a filter, test the event.
      var selected = selectionEvaluator(e);
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

    var depth = e.scope ? e.scope.getDepth() : 0;
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
  var result = this.hitTest_(x, y, bounds);
  if (!result) {
    return false;
  }

  var newFilterString = '';
  if (result instanceof wtf.analysis.Scope) {
    // Single scope clicked.
    var eventName = '/^' + result.getEnterEvent().eventType.name + '$/';
    newFilterString = eventName;
  } else if (result && result.length) {
    // Assume a list of instance events.
    if (result.length == 1) {
      newFilterString = '/^' + result[0].eventType.name + '$/';
    } else {
      newFilterString = '/';
      var matched = {};
      for (var n = 0; n < result.length; n++) {
        var e = result[n];
        if (matched[e.eventType.name]) {
          continue;
        }
        matched[e.eventType.name] = true;
        if (n) {
          newFilterString += '|';
        }
        newFilterString += '^' + e.eventType.name + '$';
      }
      newFilterString += '/';
    }
  }

  var commandManager = wtf.events.getCommandManager();
  if (modifiers & wtf.ui.ModifierKey.SHIFT) {
    // Shift-clicking a scope selects it and zooms to fit.
    if (result instanceof wtf.analysis.Scope) {
      var enterEvent = result.getEnterEvent();
      var leaveEvent = result.getLeaveEvent();
      if (!enterEvent || !leaveEvent) {
        return false;
      }
      var timeStart = enterEvent.time;
      var timeEnd = leaveEvent.time;
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
  var result = this.hitTest_(x, y, bounds);
  if (result instanceof wtf.analysis.Scope) {
    return wtf.analysis.Scope.getInfoString(result);
  } else if (result && result.length) {
    return wtf.analysis.Event.getInfoString(result);
  }
  return undefined;
};


/**
 * Finds the scope at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {wtf.analysis.Scope|Array.<!wtf.analysis.Event>} Scope, a list of
 *     instance events, or nothing.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.hitTest_ = function(
    x, y, bounds) {
  var zoneIndex = this.zoneIndex_;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  var time = wtf.math.remap(x,
      bounds.left, bounds.left + bounds.width,
      timeLeft, timeRight);

  var count = 0;
  var scope = zoneIndex.findEnclosingScope(time);

  // The scope we're looking for must be this scope or some ancestor scope of
  // this scope. Look up the parent chain until we find a parent of the correct
  // depth.
  for (; scope; scope = scope.getParent()) {
    var depth = scope.getDepth();
    var enter = scope.getEnterEvent();
    var leave = scope.getLeaveEvent();
    var scopeHeight = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
    var scopeTop = bounds.top + 1 + depth * scopeHeight;
    var scopeBottom = scopeTop + scopeHeight;
    if (enter && leave && scopeTop <= y) {
      if (leave.time >= time && y <= scopeBottom) {
        if (y >= scopeTop + wtf.app.ui.tracks.ZonePainter.INSTANCE_OFFSET_) {
          // Maybe in an instance - check.
          var startTime =
              time - wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_;
          var endTime = Math.min(
              startTime + wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_,
              leave.time);
          var instances = zoneIndex.findInstances(startTime, endTime, scope);
          if (instances && instances.length) {
            return instances;
          }
        }
        return scope;
      }
      break;
    }
  }

  return null;
};
