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

goog.require('goog.dom.classes');
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
        function() {
          if (this.selectedExperiment_ == null) {
            this.updateExperiments_();
          }
          this.requestRepaint();
        }, this);

    this.frameTimeVisualizer_.addListener(
        wtf.replay.graphics.FrameTimeVisualizer.EventType.EXPERIMENTS_UPDATED,
        function() {
          this.updateExperiments_();
          this.requestRepaint();
        }, this);
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

  /**
   * The currently selected experiment.
   * @type {?number}
   * @private
   */
  this.selectedExperiment_ = 0;
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
 * Updates experiments data.
 * @private
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.updateExperiments_ =
    function() {
  var experimentIndex = this.frameTimeVisualizer_.getCurrentExperimentIndex();
  this.selectedExperiment_ = experimentIndex;
};


/**
 * Colors used to draw frame time bars and other elements.
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
  BETWEEN_FRAMES_TIME: '#BBBBBB',

  /**
   * The control background color.
   */
  CONTROL_BACKGROUND: '#CCCCCC',

  /**
   * The control border color.
   */
  CONTROL_BORDER: '#222222',

  /**
   * The control selected color.
   */
  CONTROL_SELECTED: '#466CBF'
};


/**
 * Sizes used for the graphs.
 * @type {!Object.<number>}
 * @const
 * @private
 */
wtf.replay.graphics.ui.ReplayFramePainter.SIZES_ = {
  /**
   * Outline size. Used to draw outlined bars in the bar graph.
   */
  OUTLINE: 2,

  /**
   * Line graph stroke size.
   */
  LINE_GRAPH: 2,

  /**
   * Experiment controls x offset from the left of the canvas.
   */
  CONTROLS_X_OFFSET: 4,

  /**
   * Experiment controls y offset from the bottom of the canvas.
   */
  CONTROLS_Y_OFFSET: 4,

  /**
   * Experiment control square width.
   */
  CONTROL: 12,

  /**
   * Experiment control square border width.
   */
  CONTROL_BORDER: 2,

  /**
   * Experiment control square width.
   */
  CONTROL_SELECTED: 6,

  /**
   * Experiment control x padding between squares.
   */
  CONTROL_PADDING: 6
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
  var sizes = wtf.replay.graphics.ui.ReplayFramePainter.SIZES_;
  var i, leftX, topY, duration;

  var hoverIndex = 0;
  if (this.hoverX_) {
    hoverIndex = this.hitTest_(this.hoverX_, this.hoverY_, bounds);
  }

  // Draw background bars in alternating shades of grey.
  for (i = this.min_; i < this.max_; ++i) {
    ctx.fillStyle = i % 2 ?
        colors.ODD_ROW_BACKGROUND : colors.EVEN_ROW_BACKGROUND;
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

  // Draw the frame times for the selected experiment and standard playback.
  if (this.frameTimeVisualizer_) {
    var experiments = this.frameTimeVisualizer_.getExperiments();
    var experiment, frames, frame;

    // Draw a colored bar graph for the currently selected experiment.
    experiment = experiments[this.selectedExperiment_];
    if (experiment && experiment.getFrames()) {
      frames = experiment.getFrames();

      for (i = this.min_; i < this.max_; ++i) {
        frame = frames[i];
        if (frame) {
          duration = frame.getAverageDuration();

          topY = Math.max(bounds.height - duration * yScale, 0);

          // Draw a bar for this frame.
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
    }

    // Draw a tick at each frame for standard playback (if it is not selected).
    if (this.selectedExperiment_ != 0) {
      experiment = experiments[0];
      frames = experiment.getFrames();

      ctx.strokeStyle = colors.HOVER_BORDER;
      ctx.lineWidth = sizes.LINE_GRAPH;

      for (var j = this.min_; j < this.max_; ++j) {
        frame = frames[j];
        if (frame) {
          duration = frame.getAverageDuration();
          var lineY = bounds.height - duration * yScale;

          var startX = wtf.math.remap(j - 0.5, this.min_, this.max_,
              0, bounds.width);
          var endX = wtf.math.remap(j + 0.5, this.min_, this.max_,
              0, bounds.width);

          ctx.beginPath();
          ctx.moveTo(startX, lineY);
          ctx.lineTo(endX, lineY);
          ctx.stroke();
        }
      }
    }

    // Draw a highlight border for the frame that is hovered over.
    if (hoverIndex) {
      experiment = experiments[this.selectedExperiment_];
      frames = experiment.getFrames();
      if (frames && frames[hoverIndex]) {
        duration = frames[hoverIndex].getAverageDuration();
        topY = Math.max(bounds.height - duration * yScale, 0);

        ctx.strokeStyle = colors.HOVER_BORDER;
        this.drawBar_(ctx, bounds, hoverIndex, topY, duration * yScale, true);
      }
    }
  }

  // Draw a control box for each experiment.
  for (i = 0; i < experiments.length; ++i) {
    ctx.fillStyle = colors.CONTROL_BACKGROUND;

    leftX = sizes.CONTROLS_X_OFFSET +
        i * (sizes.CONTROL + sizes.CONTROL_PADDING);
    topY = bounds.height - (sizes.CONTROLS_Y_OFFSET + sizes.CONTROL);
    ctx.fillRect(leftX, topY, sizes.CONTROL, sizes.CONTROL);

    ctx.strokeStyle = colors.CONTROL_BORDER;
    ctx.lineWidth = sizes.CONTROL_BORDER;
    ctx.strokeRect(leftX, topY, sizes.CONTROL, sizes.CONTROL);

    // Draw a smaller square inside the control box for the selected experiment.
    if (i == this.selectedExperiment_) {
      ctx.fillStyle = colors.CONTROL_SELECTED;

      var centerX = leftX + sizes.CONTROL / 2;
      var centerY = topY + sizes.CONTROL / 2;
      leftX = centerX - sizes.CONTROL_SELECTED / 2;
      topY = centerY - sizes.CONTROL_SELECTED / 2;

      ctx.fillRect(leftX, topY, sizes.CONTROL_SELECTED, sizes.CONTROL_SELECTED);
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
  var sizes = wtf.replay.graphics.ui.ReplayFramePainter.SIZES_;
  var leftX = wtf.math.remap(frameNumber - 0.5, this.min_, this.max_, 0,
      bounds.width);
  var frameWidth = bounds.width / (this.max_ - this.min_);

  if (opt_outline) {
    var outlineSize = sizes.OUTLINE;
    ctx.lineWidth = outlineSize;

    ctx.strokeRect(leftX - outlineSize / 2, topY - outlineSize / 2,
        frameWidth + outlineSize, height + outlineSize);
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

  var controlHit = this.hitControlTest_(x, y, bounds);
  var cssName = goog.getCssName('canvasPointer');
  var canvas = this.getCanvas();
  if (controlHit !== undefined) {
    goog.dom.classes.add(canvas, cssName);
  } else {
    goog.dom.classes.remove(canvas, cssName);
  }

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
  var controlHit = this.hitControlTest_(x, y, bounds);
  if (controlHit !== undefined) {
    this.selectedExperiment_ = controlHit;

    var experiments = this.frameTimeVisualizer_.getExperiments();
    var experiment = experiments[this.selectedExperiment_];
    experiment.applyState();

    this.requestRepaint();
    return false;
  }

  var frameHit = this.hitTest_(x, y, bounds);
  if (!frameHit) {
    return false;
  }

  var commandManager = wtf.events.getCommandManager();
  if (commandManager) {
    commandManager.execute('goto_replay_frame', this, null, frameHit);
  }

  return true;
};


/**
 * @override
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.getInfoStringInternal =
    function(x, y, bounds) {

  var controlHit = this.hitControlTest_(x, y, bounds);
  if (controlHit !== undefined) {
    var experiments = this.frameTimeVisualizer_.getExperiments();
    var experiment = experiments[controlHit];

    var controlLabel = experiment.getName() + '\n';
    controlLabel += 'Average FPS: ' + experiment.getAverageFPS().toFixed(2);
    return controlLabel;
  }

  var frameHit = this.hitTest_(x, y, bounds);
  if (!frameHit) {
    return undefined;
  }

  var frameLabel = 'Frame #' + frameHit;

  if (this.frameTimeVisualizer_) {
    var tooltips = [];
    tooltips.push(frameLabel + '\n');

    var experiments = this.frameTimeVisualizer_.getExperiments();
    for (var i = 0; i < experiments.length; ++i) {
      var frames = experiments[i].getFrames();

      if (frames[frameHit] && (i == this.selectedExperiment_ || i == 0)) {
        var name = experiments[i].getName() + '\n';
        var tooltip = frames[frameHit].getTooltip();
        if (tooltip) {
          tooltips.push(name + tooltip);
        }
      }
    }

    if (tooltips.length > 0) {
      return tooltips.join('\n');
    }
  }

  return frameLabel;
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


/**
 * Finds the experiment control at the given point.
 * @param {number} x X coordinate, relative to canvas.
 * @param {number} y Y coordinate, relative to canvas.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @return {number|undefined} Experiment control at the given point
 *   Returns undefined if there is no experiment control at the point.
 * @private
 */
wtf.replay.graphics.ui.ReplayFramePainter.prototype.hitControlTest_ = function(
    x, y, bounds) {
  if (!this.frameTimeVisualizer_) {
    return undefined;
  }

  var experiments = this.frameTimeVisualizer_.getExperiments();
  var sizes = wtf.replay.graphics.ui.ReplayFramePainter.SIZES_;

  for (var i = 0; i < experiments.length; ++i) {
    var leftX = sizes.CONTROLS_X_OFFSET +
        i * (sizes.CONTROL + sizes.CONTROL_PADDING);
    var topY = bounds.height - (sizes.CONTROLS_Y_OFFSET + sizes.CONTROL);

    if (x > leftX && x < leftX + sizes.CONTROL &&
        y > topY && y < topY + sizes.CONTROL) {
      return i;
    }
  }

  return undefined;
};
