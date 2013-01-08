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

goog.provide('wtf.app.ui.nav.HeatmapPainter');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('wtf.math');
goog.require('wtf.ui.TimePainter');



/**
 * Heatmap painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.app.ui.nav.HeatmapPainter = function HeatmapPainter(canvas, db) {
  goog.base(this, canvas);

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  /**
   * Frame event index.
   * Each event should indicate the start of a new frame.
   * Only valid once it has been created and the control readied.
   * @type {!Array.<!wtf.app.ui.nav.HeatmapPainter.Bar_>}
   * @private
   */
  this.bars_ = [];

  // TODO(benvanik): pull from profile
  this.bars_.push(new wtf.app.ui.nav.HeatmapPainter.Bar_(this, db, 'flows', [
    'wtf.flow#branch'
  ]));
  this.bars_.push(new wtf.app.ui.nav.HeatmapPainter.Bar_(this, db, 'GCs', [
    'javascript#gc'
  ]));
  this.bars_.push(new wtf.app.ui.nav.HeatmapPainter.Bar_(this, db, 'compiles', [
    'javascript#evalscript'
  ]));

  var deferreds = [];
  for (var n = 0; n < this.bars_.length; n++) {
    var color = wtf.app.ui.nav.HeatmapPainter.BAR_COLORS_[
        n % wtf.app.ui.nav.HeatmapPainter.BAR_COLORS_.length];
    deferreds.push(this.bars_[n].prepare(color));
  }

  this.setReady(false);
  new goog.async.DeferredList(deferreds).addCallbacks(
      function() {
        // Ready and redraw.
        this.setReady(true);
      },
      function(arg) {
        // Failued to create indices.
      }, this);
};
goog.inherits(wtf.app.ui.nav.HeatmapPainter, wtf.ui.TimePainter);


/**
 * @override
 */
wtf.app.ui.nav.HeatmapPainter.prototype.layoutInternal = function(
    availableBounds) {
  var newBounds = availableBounds.clone();
  return newBounds;
};


/**
 * @override
 */
wtf.app.ui.nav.HeatmapPainter.prototype.repaintInternal = function(
    ctx, bounds) {
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
wtf.app.ui.nav.HeatmapPainter.BAR_COLORS_ = [
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
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @param {string} name Bar name, used in the overlay.
 * @param {!Array.<string>} eventTypes List of event type names.
 * @constructor
 * @private
 */
wtf.app.ui.nav.HeatmapPainter.Bar_ = function(painter, db, name, eventTypes) {
  /**
   * Parent painter.
   * @type {!wtf.ui.Painter}
   * @private
   */
  this.painter_ = painter;

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
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
   * @type {!Array.<!wtf.analysis.db.EventIndex>}
   * @private
   */
  this.indicies_ = [];

  /**
   * Color used when drawing the bar.
   * @type {string}
   * @private
   */
  this.color_ = 'rgb(0,0,0)';

  /**
   * Cached buckets, in order.
   * This is used to prevent reallocating the list every frame. Whenever the
   * number of buckets changes it must be reallocated.
   * @type {!Uint32Array}
   * @private
   */
  this.cachedBuckets_ = new Uint32Array(0);
};


/**
 * Prepares the bar for use.
 * @param {string} color Color used to draw the bar.
 * @return {!goog.async.Deferred} A deferred fulfilled when the bar is ready
 *     to draw.
 */
wtf.app.ui.nav.HeatmapPainter.Bar_.prototype.prepare = function(color) {
  this.color_ = color;

  var deferreds = [];
  for (var n = 0; n < this.eventTypes_.length; n++) {
    deferreds.push(this.db_.createEventIndex(this.eventTypes_[n]));
  }

  var readyDeferred = new goog.async.Deferred();
  new goog.async.DeferredList(deferreds).addCallbacks(
      function() {
        for (var n = 0; n < this.eventTypes_.length; n++) {
          var index = this.db_.getEventIndex(this.eventTypes_[n]);
          goog.asserts.assert(index);
          this.indicies_.push(index);
        }
        readyDeferred.callback(null);
      },
      function(arg) {
        readyDeferred.errback(arg);
      }, this);
  return readyDeferred;
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
wtf.app.ui.nav.HeatmapPainter.Bar_.prototype.draw = function(
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
  var bucketTimeRight = bucketTimeLeft + bucketDuration * bucketCount;
  var bucketLeft = wtf.math.remap(
      bucketTimeLeft, timeLeft, timeRight, 0, bounds.width);
  var bucketMax = 0;

  for (var n = 0; n < this.indicies_.length; n++) {
    var index = this.indicies_[n];
    index.forEach(bucketTimeLeft, bucketTimeRight, function(e) {
      var bucketIndex = Math.floor((e.time - bucketTimeLeft) / bucketDuration);
      var bucketValue = buckets[bucketIndex];
      bucketValue++;
      buckets[bucketIndex] = bucketValue;
      if (bucketValue > bucketMax) {
        bucketMax = bucketValue;
      }
    }, this);
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
