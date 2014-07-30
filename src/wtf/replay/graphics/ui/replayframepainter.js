/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Supports navigation and plots replay frame time.
 *
 * @author scotttodd@google.com (Scott Todd)
 */

goog.provide('wtf.replay.graphics.ui.ReplayFramePainter');

goog.require('wtf.events');
goog.require('wtf.math');
goog.require('wtf.replay.graphics.FrameTimeVisualizer');
goog.require('wtf.ui.Painter');



/**
 * Frame painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {number} min The smallest frame number.
 * @param {number} max The largest frame number.
 * @param {wtf.replay.graphics.FrameTimeVisualizer=} opt_visualizer Frame time
 *     visualizer that collects replay frame time data.
 * @constructor
 * @extends {wtf.ui.Painter}
 */
wtf.replay.graphics.ui.ReplayFramePainter = function(canvas, min, max,
    opt_visualizer) {
  goog.base(this, canvas);

  /**
   * The minimum frame number.
   * @type {number}
   * @private
   */
  this.min_ = min;

  /**
   * The maximum frame number.
   * @type {number}
   * @private
   */
  this.max_ = max;

  /**
   * The current frame number.
   * @type {number}
   * @private
   */
  this.currentFrame_ = -1;

  /**
   * The frame time visualizer.
   * @type {?wtf.replay.graphics.FrameTimeVisualizer}
   * @private
   */
  this.frameTimeVisualizer_ = opt_visualizer || null;

  if (this.frameTimeVisualizer_) {
    this.frameTimeVisualizer_.addListener(
        wtf.replay.graphics.FrameTimeVisualizer.EventType.FRAMES_UPDATED,
        this.requestRepaint, this);
  }

  /**
   * Current X of the mouse, if it is hovering over the context.
   * If this is zero then the mouse is not hovering.
   * @type {number}
   * @private
   */
  this.hoverX_ = 0;

  /**
   * Current Y of the mouse, if it is hovering over the context.
   * If this is zero then the mouse is not hovering.
   * @type {number}
   * @private
   */
  this.hoverY_ = 0;
};
goog.inherits(wtf.replay.graphics.ui.ReplayFramePainter, wtf.ui.Painter);


/**
 * Gets the current frame number.
 * @return {number} The current frame number.
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.getCurrentFrame =
    function() {
  return this.currentFrame_;
};


/**
 * Sets the current frame number.
 * @param {number} frameNumber The current frame number.
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.setCurrentFrame = function(
    frameNumber) {
  this.currentFrame_ = frameNumber;
  this.requestRepaint();
};


/**
 * Contains colors used to draw frame time bars and other elements.
 * @type {!Object.<string>}
 * @const
 * @private
 */
wtf.replay.graphics.ui.ReplayFramePainter.COLORS_ = {
  /**
   * The default background color of odd rows.
   */
  ODD_ROW_BACKGROUND: '#FFFFFF',

  /**
   * The default background color of even rows.
   */
  EVEN_ROW_BACKGROUND: '#FAFAFA',

  /**
   * The background color of the currently selected frame.
   */
  CURRENT_BACKGROUND: '#466CBF',

  /**
   * The background color of the currently selected frame.
   */
  HOVER_BACKGROUND: '#777777',

  /**
   * The color for lines at the 17ms and 33ms heights.
   */
  TIME_MARKERS: '#DDDDDD',

  /**
   * The border color of the currently hovered over frame.
   */
  HOVER_BORDER: '#222222',

  /**
   * The color for frames whose average duration is less than 17ms.
   */
  FRAME_TIME_17: '#4C993F',

  /**
   * The color for frames whose average duration is between 17ms and 33ms.
   */
  FRAME_TIME_33: '#ED9128',

  /**
   * The color for frames whose average duration is between 33ms and 50ms.
   */
  FRAME_TIME_50: '#F23838',

  /**
   * The color for frames whose average duration is greater than 50ms.
   */
  FRAME_TIME_50_PLUS: '#991E1E',

  /**
   * The color for the time between frames.
   */
  BETWEEN_FRAMES_TIME: '#BBBBBB'
};


/**
 * Outline size in pixels. Used to draw outlined bars in the bar graph.
 * @type {number}
 * @const
 */
wtf.replay.graphics.ui.ReplayFramePainter.OUTLINE_SIZE = 2;


/**
 * @override
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.repaintInternal = function(
    ctx, bounds) {
  // The x-axis is frame number, the y-axis is frame duration.
  var yScale = 1 / wtf.math.remap(45, 0, bounds.height, 0, 1);

  var colors = wtf.replay.graphics.ui.ReplayFramePainter.COLORS_;
  var topY, duration;

  var hoverIndex = 0;
  if (this.hoverX_) {
    hoverIndex = this.hitTest_(this.hoverX_, this.hoverY_, bounds);
  }

  // Draw background bars in alternating shades of grey.
  for (var i = this.min_; i < this.max_; ++i) {
    if (i % 2 == 0) {
      ctx.fillStyle = colors.EVEN_ROW_BACKGROUND;
    } else {
      ctx.fillStyle = colors.ODD_ROW_BACKGROUND;
    }
    this.drawBar_(ctx, bounds, i, 0, bounds.height);
  }

  // Draw lines at 17ms and 33ms.
  ctx.fillStyle = colors.TIME_MARKERS;
  ctx.fillRect(bounds.left, bounds.height - 17 * yScale, bounds.width, 1);
  ctx.fillRect(bounds.left, bounds.height - 33 * yScale, bounds.width, 1);

  // Draw current and hover bars above the lines and background bars.
  ctx.fillStyle = colors.CURRENT_BACKGROUND;
  this.drawBar_(ctx, bounds, this.currentFrame_, 0, bounds.height);
  if (hoverIndex) {
    ctx.fillStyle = colors.HOVER_BACKGROUND;
    this.drawBar_(ctx, bounds, hoverIndex, 0, bounds.height);
  }

  // Draw the frame times in a colored bar graph.
  if (this.frameTimeVisualizer_) {
    var frames = this.frameTimeVisualizer_.getFrames();

    for (var i = this.min_; i < this.max_; ++i) {
      var frame = frames[i];
      if (frame) {
        duration = frame.getAverageDuration();
        topY = Math.max(bounds.height - duration * yScale, 0);

        // Draw a bar for this frame's duration.
        if (duration < 17) {
          ctx.fillStyle = colors.FRAME_TIME_17;
        } else if (duration < 33) {
          ctx.fillStyle = colors.FRAME_TIME_33;
        } else if (duration < 50) {
          ctx.fillStyle = colors.FRAME_TIME_50;
        } else {
          ctx.fillStyle = colors.FRAME_TIME_50_PLUS;
        }
        this.drawBar_(ctx, bounds, i, topY, duration * yScale);

        // Draw a stacked bar for the time between this frame and the next.
        var timeBetween = frame.getAverageBetween();
        topY = bounds.height - (duration + timeBetween) * yScale;
        ctx.fillStyle = colors.BETWEEN_FRAMES_TIME;
        this.drawBar_(ctx, bounds, i, topY, timeBetween * yScale);
      }
    }

    // Draw a highlight border for the frame that is hovered over.
    if (hoverIndex) {
      var hoverFrame = frames[hoverIndex];
      if (hoverFrame) {
        duration = hoverFrame.getAverageDuration();
        topY = Math.max(bounds.height - duration * yScale, 0);

        ctx.strokeStyle = colors.HOVER_BORDER;
        this.drawBar_(ctx, bounds, hoverIndex, topY, duration * yScale, true);
      }
    }
  }
};


/**
 * Draws a bar on the canvas for a frame, handles computing the frame width.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @param {number} frameNumber The frame number, used for the x location.
 * @param {number} topY The highest point on the canvas to draw at (top is 0).
 * @param {number} height The height of the bar to draw.
 * @param {boolean=} opt_outline If true, draw only an outline.
 * @private
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.drawBar_ = function(
    ctx, bounds, frameNumber, topY, height, opt_outline) {
  var leftX = wtf.math.remap(frameNumber - 0.5, this.min_, this.max_, 0,
      bounds.width);
  var frameWidth = bounds.width / (this.max_ - this.min_);

  if (opt_outline) {
    var borderSize = wtf.replay.graphics.ui.ReplayFramePainter.OUTLINE_SIZE;
    ctx.lineWidth = wtf.replay.graphics.ui.ReplayFramePainter.OUTLINE_SIZE;

    ctx.strokeRect(leftX - borderSize / 2, topY - borderSize / 2,
        frameWidth + borderSize, height + borderSize);
  } else {
    ctx.fillRect(leftX, topY, frameWidth, height);
  }
};


/**
 * @override
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.onMouseMoveInternal =
    function(x, y, modifiers, bounds) {
  this.hoverX_ = x;
  this.hoverY_ = y;
  this.requestRepaint();
};


/**
 * @override
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.onMouseOutInternal =
    function() {
  this.hoverX_ = 0;
  this.hoverY_ = 0;
  this.requestRepaint();
};


/**
 * @override
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.onClickInternal =
    function(x, y, modifiers, bounds) {
  var frameHit = this.hitTest_(x, y, bounds);
  if (!frameHit) {
    return false;
  }

  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('goto_replay_frame', this, null, frameHit);

  return true;
};


/**
 * @override
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.getInfoStringInternal =
    function(x, y, bounds) {
  var frameHit = this.hitTest_(x, y, bounds);
  if (!frameHit) {
    return undefined;
  }

  if (this.frameTimeVisualizer_) {
    var frame = this.frameTimeVisualizer_.getFrame(frameHit);
    if (frame) {
      return frame.getTooltip();
    }
  }

  return 'Frame #' + frameHit;
};


/**
 * Finds the frame at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {number} Frame number at the given point.
 * @private
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.hitTest_ = function(
    x, y, bounds) {
  return Math.round(wtf.math.remap(x, bounds.left, bounds.left + bounds.width,
      this.min_, this.max_));
};
