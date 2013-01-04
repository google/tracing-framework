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
goog.require('wtf.util');



/**
 * Zone track painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @param {!wtf.analysis.db.ZoneIndex} zoneIndex Zone index.
 * @param {!wtf.app.ui.Selection} selection Selection state.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.ui.tracks.ZonePainter = function(canvas, db, zoneIndex,
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
 * Top of first scope.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.SCOPE_TOP_ = 17 + 25;


/**
 * Height of a scope (including border), in px.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_ = 18;


/**
 * Height of an instance event (including border), in px.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.INSTANCE_HEIGHT_ = 9;


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
wtf.app.ui.tracks.ZonePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  var width = bounds.width;
  var height = bounds.height;

  // HACK(benvanik): remove once layout is implemented.
  bounds.top = wtf.app.ui.tracks.ZonePainter.SCOPE_TOP_;

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

  // Draw time ranges.
  // TODO(benvanik): draw time ranges

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
  var width = bounds.width;
  var height = bounds.height;

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
    var left = wtf.math.remap(enter.time, timeLeft, timeRight, 0, width);
    var right = wtf.math.remap(leave.time, timeLeft, timeRight, 0, width);
    var screenWidth = right - left;

    // Clip with the screen.
    var screenLeft = Math.max(0, left);
    var screenRight = Math.min(width - 0.999, right);
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
  var y = 0;
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
  var width = bounds.width;
  var height = bounds.height;

  this.beginRenderingRanges(bounds, this.zoneIndex_.getMaximumScopeDepth());

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
    var left = wtf.math.remap(e.time, timeLeft, timeRight, 0, width);
    var right = wtf.math.remap(endTime, timeLeft, timeRight, 0, width);

    // Get color in the palette used for filling.
    var color = palette.getColorForString(e.eventType.name);

    var screenLeft = Math.max(0, left);
    var screenRight = Math.min(width - .999, right);
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
  var y = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
  var h = wtf.app.ui.tracks.ZonePainter.INSTANCE_HEIGHT_;
  this.endRenderingRanges(bounds, y, h);
};


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  if (y < wtf.app.ui.tracks.ZonePainter.SCOPE_TOP_) {
    return false;
  }

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
    return this.generateScopeTooltip_(result);
  } else if (result && result.length) {
    return this.generateInstancesTooltip_(result);
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
  var width = bounds.width;
  var height = bounds.height;
  var zoneIndex = this.zoneIndex_;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  var time = wtf.math.remap(x, 0, width, timeLeft, timeRight);

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
    var scopeTop = wtf.app.ui.tracks.ZonePainter.SCOPE_TOP_ +
        depth * scopeHeight;
    var scopeBottom = scopeTop + scopeHeight;
    if (enter && leave && scopeTop <= y) {
      if (leave.time >= time) {
        if (y <= scopeBottom) {
          // Fully within the scope.
          return scope;
        } else {
          // Underneath the scope. Check instances.
          if (y <= scopeBottom +
              wtf.app.ui.tracks.ZonePainter.INSTANCE_HEIGHT_) {
            time -= wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_;
            var endTime = Math.min(
                time + wtf.app.ui.tracks.ZonePainter.INSTANCE_TIME_WIDTH_,
                leave.time);
            return zoneIndex.findInstances(time, endTime, scope);
          }
        }
      }
      break;
    }
  }

  return null;
};


/**
 * Generates a tooltip string from the given scope.
 * @param {!wtf.analysis.Scope} scope Scope.
 * @return {string} Tooltip string.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.generateScopeTooltip_ = function(
    scope) {
  var totalTime = wtf.util.formatTime(scope.getTotalDuration());
  var times = totalTime;
  if (scope.getTotalDuration() - scope.getOwnDuration()) {
    var ownTime = wtf.util.formatTime(scope.getOwnDuration());
    times += ' (' + ownTime + ')';
  }

  var enter = scope.getEnterEvent();
  var eventType = enter.eventType;
  var lines = [
    times + ': ' + eventType.name
  ];

  wtf.util.addArgumentLines(lines, scope.getData());

  return lines.join('\n');
};


/**
 * Generates a tooltip string from a list of instance events.
 * @param {!Array.<wtf.analysis.Event>} events Event list.
 * @return {string} Tooltip string.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.generateInstancesTooltip_ = function(
    events) {
  var lines = [
  ];

  for (var n = 0; n < events.length; n++) {
    if (n) {
      lines.push('\n');
    }
    var e = events[n];
    var eventType = e.eventType;
    lines.push(eventType.name);
    wtf.util.addArgumentLines(lines, e.getArguments());
  }

  return lines.join('\n');
};
