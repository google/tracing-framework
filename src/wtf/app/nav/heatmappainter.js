/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Heatmap painter for the framebar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.nav.HeatmapPainter');

goog.require('goog.array');
goog.require('wtf.db.Database');
goog.require('wtf.math');
goog.require('wtf.ui.TimePainter');



/**
 * Heatmap painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.db.Database} db Database.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.app.nav.HeatmapPainter = function HeatmapPainter(canvas, db) {
  goog.base(this, canvas);

  /**
   * Database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Frame event index.
   * Each event should indicate the start of a new frame.
   * Only valid once it has been created and the control readied.
   * @type {!Array.<!wtf.app.nav.HeatmapPainter.Bar_>}
   * @private
   */
  this.bars_ = [];

  // TODO(benvanik): pull from profile
  var n = 0;
  this.bars_.push(new wtf.app.nav.HeatmapPainter.Bar_(this, db, 'flows', [
    'wtf.flow#branch'
  ], wtf.app.nav.HeatmapPainter.BAR_COLORS_[n++]));
  this.bars_.push(new wtf.app.nav.HeatmapPainter.Bar_(this, db, 'GCs', [
    'javascript#gc'
  ], wtf.app.nav.HeatmapPainter.BAR_COLORS_[n++]));
  this.bars_.push(new wtf.app.nav.HeatmapPainter.Bar_(this, db, 'compiles', [
    'javascript#evalscript'
  ], wtf.app.nav.HeatmapPainter.BAR_COLORS_[n++]));
};
goog.inherits(wtf.app.nav.HeatmapPainter, wtf.ui.TimePainter);


/**
 * @override
 */
wtf.app.nav.HeatmapPainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  return newBounds;
};


/**
 * @override
 */
wtf.app.nav.HeatmapPainter.prototype.repaintInternal = function(
    ctx, bounds) {
  if (!this.isTimeRangeValid()) {
    return;
  }

  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  if (!(timeRight - timeLeft)) {
    return;
  }

  // Clip to extents.
  this.clip(bounds.left, bounds.top, bounds.width, bounds.height);

  // Background.
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);

  // Draw heatmap bars.
  var barY = 0;
  var barHeight = bounds.height / this.bars_.length;
  for (var n = 0; n < this.bars_.length; n++) {
    var bar = this.bars_[n];
    bar.draw(
        ctx, bounds, barY, barHeight, timeLeft, timeRight);

    // Border.
    ctx.fillStyle = 'rgb(200,200,200)';
    ctx.fillRect(
        bounds.left, bounds.top + barY,
        bounds.width, 1);
    ctx.fillRect(
        bounds.left, bounds.top + barY + barHeight,
        bounds.width, 1);

    barY += barHeight;
  }
};


/**
 * Palette for bar colors.
 * @type {!Array.<string>}
 * @const
 * @private
 */
wtf.app.nav.HeatmapPainter.BAR_COLORS_ = [
  // TODO(benvanik): prettier colors - these are from chrome://tracing
  'rgb(49,130,189)',
  'rgb(117,107,177)',
  'rgb(127,135,225)',
  'rgb(230,85,13)',
  'rgb(116,143,119)',
  'rgb(178,214,122)'
];



/**
 * Heatmap painter event bar.
 * @param {!wtf.ui.Painter} painter Parent painter.
 * @param {!wtf.db.Database} db Database.
 * @param {string} name Bar name, used in the overlay.
 * @param {!Array.<string>} eventTypes List of event type names.
 * @param {string} color Color.
 * @constructor
 * @private
 */
wtf.app.nav.HeatmapPainter.Bar_ = function(painter, db, name, eventTypes,
    color) {
  /**
   * Parent painter.
   * @type {!wtf.ui.Painter}
   * @private
   */
  this.painter_ = painter;

  /**
   * Database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Bar name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Event types this bar displays.
   * @type {!Array.<string>}
   * @private
   */
  this.eventTypes_ = eventTypes;

  /**
   * Loaded indicies.
   * @type {!Array.<!wtf.db.EventIndex>}
   * @private
   */
  this.indices_ = [];

  /**
   * Color used when drawing the bar.
   * @type {string}
   * @private
   */
  this.color_ = color;

  /**
   * Cached buckets, in order.
   * This is used to prevent reallocating the list every frame. Whenever the
   * number of buckets changes it must be reallocated.
   * @type {!Uint32Array}
   * @private
   */
  this.cachedBuckets_ = new Uint32Array(0);

  this.db_.addListener(wtf.db.Database.EventType.ZONES_ADDED, function(zones) {
    goog.array.forEach(zones, this.addZoneIndex_, this);
  }, this);
  goog.array.forEach(this.db_.getZones(), this.addZoneIndex_, this);
};


/**
 * Creates an event index for the given zone.
 * @param {!wtf.db.Zone} zone Zone.
 * @private
 */
wtf.app.nav.HeatmapPainter.Bar_.prototype.addZoneIndex_ = function(zone) {
  this.indices_.push(zone.getSharedIndex(this.eventTypes_));
};


/**
 * Draws the bar.
 * @param {!CanvasRenderingContext2D} ctx Target canvas context.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} y Bar Y offset, in pixels.
 * @param {number} h Bar height, in pixels.
 * @param {number} timeLeft Left-most time.
 * @param {number} timeRight Right-most time.
 */
wtf.app.nav.HeatmapPainter.Bar_.prototype.draw = function(
    ctx, bounds, y, h, timeLeft, timeRight) {
  // We use a bucket size that is an integral power of 2 in ms. So .5ms, 1ms,
  // 8ms, etc. We choose the power of 2 such that the screen size width of a
  // bucket is between 6 and 12 pixels. With this scheme we get relatively
  // smooth transitions during zoom since buckets cleanly split or join by
  // factors 2 instead having data slide between neighboring buckets (which
  // can flicker).
  var pixelsPerMs = bounds.width / (timeRight - timeLeft);
  var minBucketWidthPx = 6;
  // This is the bucket duration we would use for exactly 6px bucket
  // width.
  var unsnappedBucketDuration = minBucketWidthPx / pixelsPerMs;
  // Now snap that to a greater of equal integral power of 2.
  var log2 = Math.log(unsnappedBucketDuration) / Math.LN2;
  var bucketDuration = Math.pow(2, Math.ceil(log2));
  var bucketWidth = bucketDuration * pixelsPerMs;
  if (!bucketWidth) {
    return;
  }

  var buckets = this.cachedBuckets_;
  var bucketCount = Math.ceil(bounds.width / bucketWidth) + 1;
  if (buckets.length != bucketCount) {
    buckets = this.cachedBuckets_ = new Uint32Array(bucketCount);
  } else {
    for (var n = 0; n < buckets.length; n++) {
      buckets[n] = 0;
    }
  }

  var bucketTimeLeft = timeLeft - timeLeft % bucketDuration;
  // var bucketTimeRight = bucketTimeLeft + bucketDuration * bucketCount;

  var bucketMax = 0;
  for (var n = 0; n < this.indices_.length; n++) {
    var index = this.indices_[n];
    // TODO(benvanik): limit to bucketTimeLeft, bucketTimeRight
    var it = index.begin();
    for (; !it.done(); it.next()) {
      var bucketIndex = ((it.getTime() - bucketTimeLeft) / bucketDuration) | 0;
      var bucketValue = buckets[bucketIndex];
      bucketValue++;
      buckets[bucketIndex] = bucketValue;
      if (bucketValue > bucketMax) {
        bucketMax = bucketValue;
      }
    }
  }

  //bucketMax = 100;

  ctx.fillStyle = this.color_;
  var bucketTime = bucketTimeLeft;
  for (var n = 0; n < buckets.length; n++) {
    var value = buckets[n] / bucketMax;
    if (value) {
      var bx = wtf.math.remap(bucketTime, timeLeft, timeRight, 0, bounds.width);
      ctx.globalAlpha = value;
      ctx.fillRect(bounds.left + bx, bounds.top + y, bucketWidth, h);
    }

    bucketTime += bucketDuration;
  }

  // Draw label on the left.
  this.painter_.drawLabel(this.name_, y, h);

  ctx.globalAlpha = 1;
};
