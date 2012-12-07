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

goog.require('goog.dom.TagName');
goog.require('goog.math');
goog.require('goog.string');
goog.require('wtf.analysis.FlowEvent');
goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.app.ui.tracks.TrackPainter');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.RangeRenderer');



/**
 * Zone track painter.
 * @param {!wtf.ui.PaintContext} parentContext Parent paint context.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @param {!wtf.analysis.db.ZoneIndex} zoneIndex Zone index.
 * @param {!wtf.app.ui.Selection} selection Selection state.
 * @constructor
 * @extends {wtf.app.ui.tracks.TrackPainter}
 */
wtf.app.ui.tracks.ZonePainter = function(parentContext, db, zoneIndex,
    selection) {
  goog.base(this, parentContext, db);

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
   * Each RangeRenderer rasterizes one scope depth. Indexed by depth.
   * @type {!Array.<!wtf.ui.RangeRenderer>}
   * @private
   */
  this.rangeRenderers_ = [];
  for (var n = 0; n < 32; n++) {
    this.rangeRenderers_.push(new wtf.ui.RangeRenderer());
  }

  /**
   * Helper canvas for blitting ranges on the screen.
   * @type {HTMLCanvasElement}
   * @private
   */
  this.rangeStamper_ = /** @type {HTMLCanvasElement} */(parentContext.getDom().
      createElement(goog.dom.TagName.CANVAS));

  // Initialize range stamper to 1x1. The first time we redraw this will be
  // resized to be as wide as our draw area.
  this.rangeStamper_.width = 1;
  this.rangeStamper_.height = 1;

  /**
   * The context for rangeStamper_.
   * @type {CanvasRenderingContext2D}
   * @private
   */
  this.rangeStamperContext_ = /** @type {CanvasRenderingContext2D} */(
      this.rangeStamper_.getContext('2d'));

  /**
   * ImageData used for scribbling into rangeStamper.
   * @type {ImageData}
   * @private
   */
  this.rangeStamperImageData_ =
      this.rangeStamperContext_.createImageData(this.rangeStamper_.width, 1);
};
goog.inherits(wtf.app.ui.tracks.ZonePainter, wtf.app.ui.tracks.TrackPainter);


/**
 * Top of first scope.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.SCOPE_TOP_ = 25;


/**
 * Height of a scope (including border), in px.
 * @const
 * @type {number}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_ = 18;


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.repaintInternal = function(
    ctx, width, height) {
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
  // TODO(benvanik): cache lists
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
      otherEvents[otherCount++] = e;
    }
  });

  this.beginRepaint(ctx, width, height);

  var top = wtf.app.ui.tracks.ZonePainter.SCOPE_TOP_;

  // Draw scopes first.
  this.drawScopes_(
      ctx, width, height, top, timeLeft, timeRight,
      scopeEvents, scopeCount);

  // Draw flow lines.

  // Draw instance events.

  this.endRepaint(ctx, width, height);
};


/**
 * Resets scope drawing caches.
 * @param {number} width Width of the canvas.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.resetScopeDrawing_ = function(width) {
  for (var n = 0; n < this.rangeRenderers_.length; n++) {
    this.rangeRenderers_[n].reset(width);
  }

  if (width != this.rangeStamper_.width) {
    this.rangeStamper_.width = width;
    this.rangeStamperImageData_ = this.rangeStamperContext_.createImageData(
        this.rangeStamper_.width, 1);
  }
};


/**
 * Draw scopes.
 * @param {!CanvasRenderingContext2D} ctx Target canvas context.
 * @param {number} width Canvas backing store width.
 * @param {number} height Canvas backing store height.
 * @param {number} top Y to start drawing at.
 * @param {number} timeLeft Left-most visible time.
 * @param {number} timeRight Right-most visible time.
 * @param {!Array.<!wtf.analysis.ScopeEvent>} scopeEvents Scope events.
 * @param {number} scopeCount Total number of scopes to draw.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.drawScopes_ = function(
    ctx, width, height, top, timeLeft, timeRight, scopeEvents, scopeCount) {
  var scopeColors = wtf.app.ui.tracks.ZonePainter.SCOPE_COLORS_;

  this.resetScopeDrawing_(width);

  var selectionStart = this.selection_.getTimeStart();
  var selectionEnd = this.selection_.getTimeEnd();
  var selectionEvaluator = this.selection_.hasFilterSpecified() ?
      this.selection_.getFilterEvaluator() : null;

  // We need to draw all the rects before the labes so we keep track of the
  // labels to draw and then draw them after.
  var labelsToDraw = [];

  // Draw all scopes.
  for (var n = 0; n < scopeCount; n++) {
    var e = scopeEvents[n];
    var scope = e.scope;
    var depth = scope.getDepth();
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

    // Get color in the palette used for filling.
    var colorIndex = this.getColorIndexForScope_(scope);
    var color = scopeColors[colorIndex];

    var screenLeft = Math.max(0, left);
    var screenRight = Math.min(width - .999, right);
    if (screenLeft >= screenRight) continue;

    if (!this.rangeRenderers_[depth]) {
      this.rangeRenderers_[depth] = new wtf.ui.RangeRenderer();
    }

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

    this.rangeRenderers_[depth].drawRange(
        screenLeft, screenRight, color, alpha);

    if (screenWidth > 15) {
      // Calculate label width to determine fade.
      var label = enter.eventType.name;
      var labelWidth = ctx.measureText(label).width;
      var labelScreenWidth = screenRight - screenLeft;
      if (labelScreenWidth >= labelWidth) {
        var labelAlpha = wtf.math.smoothRemap(
            labelScreenWidth, labelWidth, labelWidth + 15 * 2, 0, 1);

        // Center the label within the box then clamp to the screen.
        var x = left + (right - left) / 2 - labelWidth / 2;
        x = goog.math.clamp(x, 0, width - labelWidth);

        var scopeTop =
            top + depth * wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
        var y = scopeTop + 12;
        labelsToDraw.push({text: label, x: x, y: y, alpha: labelAlpha});
      }
    }
  }

  // Now blit the nicely rendered ranges onto the screen.
  var y = wtf.app.ui.tracks.ZonePainter.SCOPE_TOP_;
  for (var i = 0; i < this.rangeRenderers_.length; i++) {
    this.rangeRenderers_[i].getPixels(this.rangeStamperImageData_.data);
    var h = wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
    this.rangeStamperContext_.putImageData(
        this.rangeStamperImageData_, 0, 0);
    // Draw the ranges for this depth, stretching to height h.
    ctx.drawImage(this.rangeStamper_, 0, y, width, h);
    y += h;
  }

  // And, finally, draw the designated labels on top.
  labelsToDraw.forEach(function(label) {
    ctx.globalAlpha = label.alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label.text, label.x, label.y);
  });
  ctx.globalAlpha = 1;
};


/**
 * Color palette for scopes.
 * @const
 * @type {!Array.<wtf.ui.RgbColor>}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.SCOPE_COLORS_ = [
  // TODO(benvanik): prettier colors - these are from chrome://tracing
  {r: 138, g: 113, b: 152},
  {r: 175, g: 112, b: 133},
  {r: 127, g: 135, b: 225},
  {r: 93, g: 81, b: 137},
  {r: 116, g: 143, b: 119},
  {r: 178, g: 214, b: 122},
  {r: 87, g: 109, b: 147},
  {r: 119, g: 155, b: 95},
  {r: 114, g: 180, b: 160},
  {r: 132, g: 85, b: 103},
  {r: 157, g: 210, b: 150},
  {r: 148, g: 94, b: 86},
  {r: 164, g: 108, b: 138},
  {r: 139, g: 191, b: 150},
  {r: 110, g: 99, b: 145},
  {r: 80, g: 129, b: 109},
  {r: 125, g: 140, b: 149},
  {r: 93, g: 124, b: 132},
  {r: 140, g: 85, b: 140},
  {r: 104, g: 163, b: 162},
  {r: 132, g: 141, b: 178},
  {r: 131, g: 105, b: 147},
  {r: 135, g: 183, b: 98},
  {r: 152, g: 134, b: 177},
  {r: 141, g: 188, b: 141},
  {r: 133, g: 160, b: 210},
  {r: 126, g: 186, b: 148},
  {r: 112, g: 198, b: 205},
  {r: 180, g: 122, b: 195},
  {r: 203, g: 144, b: 152}
];


/**
 * Gets a color palette index for the given scope based on selection state and
 * the scope contents.
 * @param {!wtf.analysis.Scope} scope Scope.
 * @return {number} Index into the color palette.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.getColorIndexForScope_ =
    function(scope) {
  // TODO(benvanik): highlight/search state/?

  var cachedColorIndex = scope.getRenderData();
  if (cachedColorIndex !== null) {
    return /** @type {number} */ (cachedColorIndex);
  }

  var scopeColors = wtf.app.ui.tracks.ZonePainter.SCOPE_COLORS_;
  var hash = goog.string.hashCode(scope.getEnterEvent().eventType.name);
  var colorIndex = hash % scopeColors.length;
  scope.setRenderData(colorIndex);
  return colorIndex;
};


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.onClickInternal =
    function(x, y, width, height) {
  var scope = this.hitTestScope_(x, y, width, height);
  var newFilterString;
  if (scope) {
    var eventName = scope.getEnterEvent().eventType.name;
    newFilterString = eventName;
  } else {
    newFilterString = '';
  }
  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('filter_events', this, null, newFilterString);
  return true;
};


/**
 * @override
 */
wtf.app.ui.tracks.ZonePainter.prototype.getInfoStringInternal =
    function(x, y, width, height) {
  var scope = this.hitTestScope_(x, y, width, height);
  if (scope) {
    return this.generateScopeTooltip_(scope);
  }
  return undefined;
};


/**
 * Finds the scope at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {number} width Width of the paint canvas.
 * @param {number} height Height of the paint canvas.
 * @return {wtf.analysis.Scope} Scope, if any.
 */
wtf.app.ui.tracks.ZonePainter.prototype.hitTestScope_ = function(
    x, y, width, height) {
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
    if (enter && leave && scopeTop <= y && y <= scopeBottom) {
      if (leave.time >= time) {
        return scope;
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
  var enter = scope.getEnterEvent();
  var leave = scope.getLeaveEvent();
  var elapsed = leave.time - enter.time;
  if (elapsed > 0) {
    // Round to just a few significant digits.
    // largest power of 10 <= value
    var magnitude = Math.floor(Math.log(elapsed) / Math.LN10);
    // a number which will shift elapsed (in base 10) so that
    // there are 4 digits to the left of the decimal.
    var mult = Math.pow(10, 3 - magnitude);
    elapsed = Math.round(elapsed * mult) / mult;
  }

  var eventType = enter.eventType;
  var lines = [
    elapsed + 'ms: ' + eventType.name
  ];

  // Add arguments.
  var data = scope.getData();
  for (var argName in data) {
    var argValue = data[argName];
    if (goog.isArray(argValue)) {
      argValue = '[' + argValue + ']';
    } else if (goog.isObject(argValue)) {
      argValue = goog.global.JSON.stringify(argValue);
    }
    lines.push(argName + ': ' + argValue);
  }

  return lines.join('\n');
};
