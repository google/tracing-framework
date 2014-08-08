/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Widget for seeking within a range of a playback's steps.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.RangeSeeker');

goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('goog.string');
goog.require('wtf.events');
goog.require('wtf.replay.graphics.ui.ReplayFramePainter');
goog.require('wtf.replay.graphics.ui.graphicsRangeSeeker');
goog.require('wtf.timing');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.Tooltip');



/**
 * Used for efficiently seeking within a range. Disabled by default.
 *
 * @param {number} min The smallest value for the range.
 * @param {number} max The largest value for the range.
 * @param {!Element} parentElement The parent element.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @param {wtf.replay.graphics.FrameTimeVisualizer=} opt_frameTimeVis The
 *     frame time visualizer that collects replay time data.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.RangeSeeker =
    function(min, max, parentElement, opt_domHelper, opt_frameTimeVis) {
  goog.base(this, parentElement, opt_domHelper);

  /**
   * The minimum of the range.
   * @type {number}
   * @private
   */
  this.min_ = min;

  /**
   * The maximum of the range.
   * @type {number}
   * @private
   */
  this.max_ = max;

  /**
   * The viewport size monitor.
   * @type {!goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.viewportSizeMonitor_ = wtf.events.acquireViewportSizeMonitor();

  var tooltip = new wtf.ui.Tooltip(this.getDom());
  this.registerDisposable(tooltip);
  this.setTooltip(tooltip);

  /**
   * A widget that displays the value.
   * @type {!Element}
   * @private
   */
  this.valueDisplayer_ = this.createValueDisplayer_();
  this.getChildElement(goog.getCssName('graphicsReplayRangeSeekerDisplayer'))
      .appendChild(this.valueDisplayer_);

  /**
   * The frame time visualizer.
   * @type {?wtf.replay.graphics.FrameTimeVisualizer}
   * @private
   */
  this.frameTimeVisualizer_ = opt_frameTimeVis || null;

  /**
   * The range seeker canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.seekerCanvas_ = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('canvas')));

  /**
   * The frame painter with seeking controls.
   * @type {!wtf.replay.graphics.ui.ReplayFramePainter}
   * @private
   */
  this.framePainter_ = this.createFramePainter_();
  this.registerDisposable(this.framePainter_);
  this.setValue(min);

  /**
   * Whether the range seeker is enabled.
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;
  this.setEnabled(false);

  // Relayout as required.
  this.getHandler().listen(
      this.viewportSizeMonitor_,
      goog.events.EventType.RESIZE,
      this.layout, false);

  wtf.timing.setImmediate(this.layout, this);
  this.requestRepaint();
};
goog.inherits(wtf.replay.graphics.ui.RangeSeeker, wtf.ui.Control);


/**
 * @override
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  if (commandManager) {
    commandManager.unregisterCommand('goto_replay_frame');
  }

  wtf.events.releaseViewportSizeMonitor(this.viewportSizeMonitor_);

  goog.base(this, 'disposeInternal');
};


/**
 * Events related to playing.
 * @enum {string}
 */
wtf.replay.graphics.ui.RangeSeeker.EventType = {
  /**
   * The value of the seeker changed. The change was not caused by
   * {@see setValue}.
   */
  VALUE_CHANGED: goog.events.getUniqueId('value_changed')
};


/**
 * @override
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.graphicsRangeSeeker.controller,
      undefined, undefined, dom));
};


/**
 * Creates the frame painter with seeking controls.
 * @return {!wtf.replay.graphics.ui.ReplayFramePainter} The frame painter.
 * @private
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.createFramePainter_ = function() {
  var replayFramePainter = new wtf.replay.graphics.ui.ReplayFramePainter(
      this.seekerCanvas_, this.min_, this.max_,
      this.frameTimeVisualizer_);
  this.setPaintContext(replayFramePainter);

  var commandManager = wtf.events.getCommandManager();
  if (commandManager) {
    commandManager.registerSimpleCommand(
        'goto_replay_frame', function(source, target, frame) {
          this.setValue(frame);
          this.emitEvent(
              wtf.replay.graphics.ui.RangeSeeker.EventType.VALUE_CHANGED);
        }, this);
  }

  return replayFramePainter;
};


/**
 * Creates the value displayer.
 * @return {!Element} A widget that displays the current value.
 * @private
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.createValueDisplayer_ =
    function() {
  var valueDisplayer = this.getDom().createElement(goog.dom.TagName.INPUT);
  goog.dom.classes.add(valueDisplayer, goog.getCssName('kTextField'));
  valueDisplayer.type = 'text';

  // Update the seeker if displayer changes.
  this.getHandler().listen(valueDisplayer,
      goog.events.EventType.CHANGE, function() {
        var newValue = goog.string.parseInt(valueDisplayer.value);

        // Clamp the value.
        if (newValue < 0) {
          newValue = 0;
        } else if (newValue > this.max_) {
          newValue = this.max_;
        }

        this.setValue(newValue);
        this.emitEvent(
            wtf.replay.graphics.ui.RangeSeeker.EventType.VALUE_CHANGED);
      }, undefined, this);
  return valueDisplayer;
};


/**
 * Determines if this range seeker is enabled.
 * @return {boolean} True if and only if this seeker is enabled.
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.isEnabled = function() {
  return this.enabled_;
};


/**
 * Sets whether this range seeker is enabled.
 * @param {boolean} enabled The true/false enabled state of the range seeker.
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.setEnabled = function(enabled) {
  if (enabled) {
    // Enable.
    this.valueDisplayer_.removeAttribute('disabled');
  } else {
    // Disable.
    this.valueDisplayer_.disabled = 'disabled';
  }
  this.enabled_ = enabled;
};


/**
 * Gets the value.
 * @return {number} The current value.
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.getValue = function() {
  return this.framePainter_.getCurrentFrame();
};


/**
 * Sets the value. Does not emit a value changed event.
 * @param {number} value The new value.
 */
wtf.replay.graphics.ui.RangeSeeker.prototype.setValue = function(value) {
  this.framePainter_.setCurrentFrame(value);
  this.valueDisplayer_.value = value;
};
