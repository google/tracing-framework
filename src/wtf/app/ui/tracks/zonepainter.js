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

goog.require('goog.math');
goog.require('goog.string');
goog.require('wtf.analysis.FlowEvent');
goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.app.ui.tracks.TrackPainter');
goog.require('wtf.math');



/**
 * Zone track painter.
 * @param {!wtf.ui.PaintContext} parentContext Parent paint context.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @param {!wtf.analysis.db.ZoneIndex} zoneIndex Zone index.
 * @constructor
 * @extends {wtf.app.ui.tracks.TrackPainter}
 */
wtf.app.ui.tracks.ZonePainter = function(parentContext, db, zoneIndex) {
  goog.base(this, parentContext, db);

  /**
   * Zone index.
   * @type {!wtf.analysis.db.ZoneIndex}
   * @private
   */
  this.zoneIndex_ = zoneIndex;

  /**
   * Scope depth levels.
   * Tracks the current coalescing state for each scope level.
   * @type {!Array.<{
   *   active: boolean,
   *   left: number,
   *   right: number,
   *   colorIndex: number
   * }>}
   * @private
   */
  this.coalescingLevels_ = [];

  // Pre-initialize common levels.
  for (var n = 0; n < 32; n++) {
    this.coalescingLevels_[n] = {
      active: false,
      left: 0,
      right: 0,
      colorIndex: 0
    };
  }
};
goog.inherits(wtf.app.ui.tracks.ZonePainter, wtf.app.ui.tracks.TrackPainter);


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

  var top = 25;

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
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.resetScopeDrawing_ = function() {
  for (var n = 0; n < this.coalescingLevels_.length; n++) {
    var level = this.coalescingLevels_[n];
    level.active = false;
    level.left = 0;
    level.right = 0;
    level.colorIndex = 0;
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

  this.resetScopeDrawing_();

  // Draw all scopes.
  // TODO(benvanik): split between a rect pass and a label pass?
  for (var n = 0; n < scopeCount; n++) {
    var e = scopeEvents[n];
    var scope = e.scope;
    var depth = scope.getDepth();
    var enter = scope.getEnterEvent();
    var leave = scope.getLeaveEvent();

    // Ignore if a leave and we already handled the scope.
    if (e == leave && enter.time >= timeLeft) {
      continue;
    }

    // Compute screen size.
    var left = wtf.math.remap(enter.time, timeLeft, timeRight, 0, width);
    var right = wtf.math.remap(leave.time, timeLeft, timeRight, 0, width);
    var screenWidth = right - left;

    // Ensure visible and unshimmery.
    left = Math.round(left) + 0.5;
    right = Math.round(right) + 0.5;
    if (left == right) {
      // TODO(benvanik): draw bigger? logarithmic scaling near max zoom?
      right = left + 1;
    }

    // Get color in the palette used for filling.
    var colorIndex = this.getColorIndexForScope_(scope);

    // Check coalescing. If we can combine with the accumulated scopes do so,
    // otherwise flush and try again.
    var coalesceLevel = this.coalescingLevels_[depth];
    if (!coalesceLevel && screenWidth <= 1) {
      continue;
    }
    if (coalesceLevel && coalesceLevel.active &&
        (right - coalesceLevel.right >= 1 ||
        right - coalesceLevel.left >= 15)) {
      this.flushScopes_(ctx, top, depth);
    }
    if (screenWidth <= 1) {
      // Coalesce.
      if (!coalesceLevel.active) {
        // Begin a coalescing block.
        coalesceLevel.active = true;
        coalesceLevel.left = left;
        coalesceLevel.right = right;
        coalesceLevel.colorIndex = colorIndex;
      } else {
        // Accumulate.
        // The color is the max of the color index (prevents shimmering).
        coalesceLevel.right = right;
        if (coalesceLevel.colorIndex < colorIndex) {
          coalesceLevel.colorIndex = colorIndex;
        }
      }
      continue;
    }

    // Draw the scope rect.
    var scopeTop = top + depth * wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_;
    ctx.fillStyle = scopeColors[colorIndex];
    ctx.fillRect(
        left, scopeTop,
        right - left, wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_);

    // Draw label on top.
    // Fast check to see if we should bother.
    // TODO(benvanik): move to a second pass?
    if (screenWidth > 15) {
      // Calculate label width to determine fade.
      var label = enter.eventType.name;
      var labelWidth = ctx.measureText(label).width;
      var screenLeft = Math.max(0, left);
      var screenRight = Math.min(width, right);
      var labelScreenWidth = screenRight - screenLeft;
      if (labelScreenWidth >= labelWidth) {
        var alpha = wtf.math.smoothRemap(
            labelScreenWidth, labelWidth, labelWidth + 15 * 2, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFFFFF';

        // Center the label within the box then clamp to the screen.
        var x = left + (right - left) / 2 - labelWidth / 2;
        x = goog.math.clamp(x, 0, width - labelWidth);

        var y = scopeTop + 12;
        ctx.fillText(label, x, y);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Flush any pending levels.
  this.flushScopes_(ctx, top, 0);
};


/**
 * Flushes any accumulating levels from the given depth onwards.
 * @param {!CanvasRenderingContext2D} ctx Target canvas context.
 * @param {number} top Y to start drawing at.
 * @param {number} depth Starting depth to begin flushing from.
 * @private
 */
wtf.app.ui.tracks.ZonePainter.prototype.flushScopes_ = function(
    ctx, top, depth) {
  var scopeColors = wtf.app.ui.tracks.ZonePainter.SCOPE_COLORS_;

  for (var n = depth; n < this.coalescingLevels_.length; n++) {
    var coalesceLevel = this.coalescingLevels_[n];
    if (!coalesceLevel.active) {
      continue;
    }

    ctx.fillStyle = scopeColors[coalesceLevel.colorIndex];
    var levelLeft = Math.round(coalesceLevel.left) + 0.5;
    var levelRight = Math.round(coalesceLevel.right) + 0.5;
    ctx.fillRect(
        levelLeft,
        top + n * wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_,
        levelRight - levelLeft,
        wtf.app.ui.tracks.ZonePainter.SCOPE_HEIGHT_);
    coalesceLevel.active = false;
  }
};


/**
 * Color palette for scopes.
 * @const
 * @type {!Array.<string>}
 * @private
 */
wtf.app.ui.tracks.ZonePainter.SCOPE_COLORS_ = [
  // TODO(benvanik): prettier colors - these are from chrome://tracing
  'rgb(138,113,152)',
  'rgb(175,112,133)',
  'rgb(127,135,225)',
  'rgb(93,81,137)',
  'rgb(116,143,119)',
  'rgb(178,214,122)',
  'rgb(87,109,147)',
  'rgb(119,155,95)',
  'rgb(114,180,160)',
  'rgb(132,85,103)',
  'rgb(157,210,150)',
  'rgb(148,94,86)',
  'rgb(164,108,138)',
  'rgb(139,191,150)',
  'rgb(110,99,145)',
  'rgb(80,129,109)',
  'rgb(125,140,149)',
  'rgb(93,124,132)',
  'rgb(140,85,140)',
  'rgb(104,163,162)',
  'rgb(132,141,178)',
  'rgb(131,105,147)',
  'rgb(135,183,98)',
  'rgb(152,134,177)',
  'rgb(141,188,141)',
  'rgb(133,160,210)',
  'rgb(126,186,148)',
  'rgb(112,198,205)',
  'rgb(180,122,195)',
  'rgb(203,144,152)'
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
  hash += scope.getDepth();
  var colorIndex = hash % scopeColors.length;
  scope.setRenderData(colorIndex);
  return colorIndex;
};
