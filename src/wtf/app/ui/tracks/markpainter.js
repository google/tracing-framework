/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace marker painting context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.tracks.MarkPainter');

goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.math');
goog.require('wtf.ui.ModifierKey');
goog.require('wtf.ui.RangePainter');
goog.require('wtf.ui.color.Palette');
goog.require('wtf.util');



/**
 * Paints a ruler into the view.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @constructor
 * @extends {wtf.ui.RangePainter}
 */
wtf.app.ui.tracks.MarkPainter = function(canvas, db) {
  goog.base(this, canvas);

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @private
   */
  this.db_ = db;

  /**
   * Y offset, in pixels.
   * @type {number}
   * @private
   */
  this.y_ = 16;

  // TODO(benvanik): a better palette.
  /**
   * Color palette used for drawing marks.
   * @type {!wtf.ui.color.Palette}
   * @private
   */
  this.palette_ = new wtf.ui.color.Palette(
      wtf.app.ui.tracks.MarkPainter.MARK_COLORS_);

  /**
   * Mark event index.
   * Only valid once it has been created and the control readied.
   * @type {wtf.analysis.db.EventIndex}
   * @private
   */
  this.markIndex_ = null;

  var deferreds = [];
  deferreds.push(this.db_.createEventIndex('wtf.trace#mark'));

  this.setReady(false);
  new goog.async.DeferredList(deferreds).addCallbacks(
      function() {
        // Grab indicies.
        var markIndex = this.db_.getEventIndex('wtf.trace#mark');
        goog.asserts.assert(markIndex);
        this.markIndex_ = markIndex;
        this.markIndex_.addListener(wtf.events.EventType.INVALIDATED,
            this.markIndexInvalidated_, this);
        this.markIndexInvalidated_();

        // Ready and redraw.
        this.setReady(true);
      },
      function(arg) {
        // Failued to create indices.
      }, this);
};
goog.inherits(wtf.app.ui.tracks.MarkPainter, wtf.ui.RangePainter);


/**
 * Colors used for drawing marks.
 * @type {!Array.<string>}
 * @private
 * @const
 */
wtf.app.ui.tracks.MarkPainter.MARK_COLORS_ = [
  'rgb(200,200,200)',
  'rgb(189,189,189)',
  'rgb(150,150,150)',
  'rgb(130,130,130)',
  'rgb(115,115,115)',
  'rgb(100,100,100)',
  'rgb(82,82,82)'
];


/**
 * Handles invalidations of the mark index.
 * @private
 */
wtf.app.ui.tracks.MarkPainter.prototype.markIndexInvalidated_ = function() {
  // Iterate and fixup all mark events.
  // TODO(benvanik): move to a dedicated mark navigation structure
  var previousMark = null;
  this.markIndex_.forEach(Number.MIN_VALUE, Number.MAX_VALUE, function(e) {
    if (previousMark) {
      previousMark.args['duration'] = e.time - previousMark.time;
    }
    previousMark = e;
  });
  if (previousMark) {
    previousMark.args['duration'] =
        this.db_.getLastEventTime() - previousMark.time;
  }

  this.requestRepaint();
};


/**
 * Height of the mark region, in pixels.
 * @type {number}
 * @const
 */
wtf.app.ui.tracks.MarkPainter.HEIGHT = 16;


/**
 * @override
 */
wtf.app.ui.tracks.MarkPainter.prototype.repaintInternal = function(
    ctx, bounds) {
  var palette = this.palette_;

  // HACK(benvanik): remove once layout is implemented.
  bounds.top = this.y_;
  bounds.height = wtf.app.ui.tracks.MarkPainter.HEIGHT;

  var width = bounds.width;
  var height = bounds.height;

  // Clip to extents.
  this.clip(bounds.left, bounds.top, bounds.width, bounds.height);

  // Clear gutter.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, bounds.top, bounds.width, bounds.height);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, bounds.top + bounds.height - 1, bounds.width, 1);

  this.beginRenderingRanges(bounds, 1);

  var markIndex = this.markIndex_;
  var timeLeft = this.timeLeft;
  var timeRight = this.timeRight;

  // Search left to find the mark active at the start of the visible range.
  var firstMarkEvent = markIndex.search(timeLeft, function(e) {
    return true;
  });
  var searchLeft = firstMarkEvent ? firstMarkEvent.time : timeLeft;

  // Draw all visible marks.
  markIndex.forEach(searchLeft, timeRight, function(e) {
    // Compute screen size.
    var startTime = e.time;
    var endTime = e.time + e.args['duration'];
    var left = wtf.math.remap(startTime, timeLeft, timeRight, 0, width);
    var right = wtf.math.remap(endTime, timeLeft, timeRight, 0, width);
    var screenWidth = right - left;

    // Clip with the screen.
    var screenLeft = Math.max(0, left);
    var screenRight = Math.min(width - 0.999, right);
    if (screenLeft >= screenRight) {
      return;
    }

    // Pick a random color.
    if (!e.tag) {
      e.tag = palette.getRandomColor();
    }
    var color = e.tag;

    // Draw bar.
    this.drawRange(0, screenLeft, screenRight, color, 1);

    if (screenWidth > 15) {
      this.drawRangeLabel(
          bounds, left, right, screenLeft, screenRight, -1, e.args['name']);
    }
  }, this);

  // Now blit the nicely rendered ranges onto the screen.
  var y = 0;
  var h = wtf.app.ui.tracks.MarkPainter.HEIGHT - 1;
  this.endRenderingRanges(bounds, y, h);
};


/**
 * @override
 */
wtf.app.ui.tracks.MarkPainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  var e = this.hitTest_(x, y, bounds);
  if (e) {
    var commandManager = wtf.events.getCommandManager();
    commandManager.execute('goto_mark', this, null, e);
    if (modifiers & wtf.ui.ModifierKey.SHIFT) {
      commandManager.execute('select_range', this, null,
          e.time, e.time + e.args['duration']);
    }
  }
  return true;
};


/**
 * @override
 */
wtf.app.ui.tracks.MarkPainter.prototype.getInfoStringInternal =
    function(x, y, bounds) {
  var e = this.hitTest_(x, y, bounds);
  if (e) {
    var lines = [
      wtf.util.formatTime(e.args['duration']) + ': ' + e.args['name']
    ];
    wtf.util.addArgumentLines(lines, {
      'value': e.args['value'] !== null ? e.args['value'] : undefined
    });
    return lines.join('\n');
  }
  return undefined;
};


/**
 * Finds the mark at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {wtf.analysis.Event} Mark or nothing.
 * @private
 */
wtf.app.ui.tracks.MarkPainter.prototype.hitTest_ = function(
    x, y, bounds) {
  var width = bounds.width;
  var height = bounds.height;
  if (y < this.y_ || y > this.y_ + wtf.app.ui.tracks.MarkPainter.HEIGHT) {
    return null;
  }

  var time = wtf.math.remap(x, 0, width, this.timeLeft, this.timeRight);
  return this.markIndex_.search(time, function(e) {
    return e.time <= time && time <= e.time + e.args['duration'];
  });
};
