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
goog.require('wtf.ui.TimeRangePainter');



/**
 * Heatmap painter.
 * @param {!wtf.ui.PaintContext} parentContext Parent paint context.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @constructor
 * @extends {wtf.ui.TimeRangePainter}
 */
wtf.app.ui.nav.HeatmapPainter = function(parentContext, db) {
  goog.base(this, parentContext);

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
  this.bars_.push(new wtf.app.ui.nav.HeatmapPainter.Bar_(db, 'scopes', [
    'wtf.scope.leave'
  ]));
  this.bars_.push(new wtf.app.ui.nav.HeatmapPainter.Bar_(db, 'branches', [
    'wtf.flow.branch'
  ]));

  var deferreds = [];
  for (var n = 0; n < this.bars_.length; n++) {
    var color = wtf.app.ui.nav.HeatmapPainter.BAR_COLORS_[n];
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
goog.inherits(wtf.app.ui.nav.HeatmapPainter, wtf.ui.TimeRangePainter);


/**
 * @override
 */
wtf.app.ui.nav.HeatmapPainter.prototype.repaintInternal = function(
    ctx, width, height) {
  var timeOffset = this.timeOffset;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;
  if (!(timeRight - timeLeft)) {
    return;
  }

  var h = Math.floor(0.5 * (height - 16));
  var y = 16 + h;

  // Background.
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, y, width, h);

  // Draw heatmap bars.
  var barY = y;
  var barHeight = h / this.bars_.length;
  for (var n = 0; n < this.bars_.length; n++) {
    var bar = this.bars_[n];
    bar.draw(
        ctx, width, height, barY, barHeight,
        timeOffset, timeLeft, timeRight);
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
  'rgb(138,113,152)',
  'rgb(175,112,133)',
  'rgb(127,135,225)',
  'rgb(93,81,137)',
  'rgb(116,143,119)',
  'rgb(178,214,122)'
];



/**
 * Heatmap painter event bar.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @param {string} name Bar name, used in the overlay.
 * @param {!Array.<string>} eventTypes List of event type names.
 * @constructor
 * @private
 */
wtf.app.ui.nav.HeatmapPainter.Bar_ = function(db, name, eventTypes) {
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
 * @param {number} width Canvas width, in pixels.
 * @param {number} height Canvas height, in pixels.
 * @param {number} y Bar Y offset, in pixels.
 * @param {number} h Bar height, in pixels.
 * @param {number} timeOffset Time offset.
 * @param {number} timeLeft Left-most time.
 * @param {number} timeRight Right-most time.
 */
wtf.app.ui.nav.HeatmapPainter.Bar_.prototype.draw = function(
    ctx, width, height, y, h, timeOffset, timeLeft, timeRight) {
  var bucketWidth = 10;
  var buckets = this.cachedBuckets_;
  var bucketCount = Math.ceil(width / bucketWidth) + 1;
  if (buckets.length != bucketCount) {
    buckets = this.cachedBuckets_ = new Uint32Array(bucketCount);
  } else {
    for (var n = 0; n < buckets.length; n++) {
      buckets[n] = 0;
    }
  }

  // TODO(benvanik): fix precision issues, somehow...
  timeLeft -= timeOffset;
  timeRight -= timeOffset;

  var duration = timeRight - timeLeft;
  var bucketDuration = duration / (bucketCount - 1);
  var bucketTimeLeft = timeLeft - timeLeft % bucketDuration;
  var bucketTimeRight = bucketTimeLeft + bucketDuration * bucketCount;
  var bucketLeft = wtf.math.remap(
      bucketTimeLeft, timeLeft, timeRight, 0, width);
  var bucketMax = 0;

  timeLeft += timeOffset;
  timeRight += timeOffset;
  bucketTimeLeft += timeOffset;
  bucketTimeRight += timeOffset;

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
      var bx = wtf.math.remap(bucketTime, timeLeft, timeRight, 0, width);
      bx = Math.ceil(bx);
      ctx.globalAlpha = value;
      ctx.fillRect(bx, y, bucketWidth, h);
    }

    bucketTime += bucketDuration;
  }

  var nameHeight = 16;
  if (h > nameHeight + 4) {
    ctx.globalAlpha = 0.4;
    ctx.font = nameHeight + 'px bold verdana, sans-serif';
    var textSize = ctx.measureText(this.name_);
    ctx.fillStyle = '#000000';
    ctx.fillText(this.name_, 4, y + h - 4);
  }

  ctx.globalAlpha = 1;
};
