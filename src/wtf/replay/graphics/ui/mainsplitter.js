/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview The splitter between browsing events within a step and the
 * current canvases/main content for graphics replay.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.MainSplitter');

goog.require('goog.style');
goog.require('wtf.ui.ResizableControl');



/**
 * Divides the event navigation container from the main display for graphics
 * replay.
 *
 * @param {!Element} parentElement The parent element.
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.ResizableControl}
 */
wtf.replay.graphics.ui.MainSplitter = function(
    parentElement, playback, opt_domHelper) {
  goog.base(this,
      wtf.ui.ResizableControl.Orientation.VERTICAL,
      goog.getCssName('graphicsReplayMainSplitter'),
      parentElement,
      opt_domHelper);
  this.setSplitterLimits(
      wtf.replay.graphics.ui.MainSplitter.MIN_WIDTH, undefined);

  /**
   * The element wrapping the right hand side.
   * @type {!Element}
   * @private
   */
  this.rightHandSide_ = this.getChildElement(
      goog.getCssName('graphicsReplayMainDisplay'));

  // Resize the right as we alter the splitter.
  this.changeWidthAsResize_();
};
goog.inherits(wtf.replay.graphics.ui.MainSplitter, wtf.ui.ResizableControl);


/**
 * Min width for the main display.
 * @type {number}
 * @const
 */
wtf.replay.graphics.ui.MainSplitter.MIN_WIDTH = 500;


/**
 * Changes widths as resizing occurs.
 * @private
 */
wtf.replay.graphics.ui.MainSplitter.prototype.changeWidthAsResize_ =
    function() {
  this.addListener(
      wtf.ui.ResizableControl.EventType.SIZE_CHANGED,
      function() {
        goog.style.setStyle(
            this.rightHandSide_,
            goog.getCssName('graphicsReplayStepEventNavigation'),
            this.getSplitterSize() + 'px');
      }, this);
};
