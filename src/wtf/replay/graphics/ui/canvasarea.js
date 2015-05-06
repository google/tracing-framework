/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Control that contains area where canvases appear.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.CanvasesArea');

goog.require('goog.object');
goog.require('goog.soy');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.ui.ContextBox');
goog.require('wtf.replay.graphics.ui.canvasArea');
goog.require('wtf.ui.Control');



/**
 * Container in which canvases can appear as they are made. Responsible for
 * listening to the creation of contexts.
 *
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @param {!Element} parentElement The parent element.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM Helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.graphics.ui.CanvasesArea = function(
    playback, parentElement, opt_domHelper) {
  goog.base(this, parentElement, opt_domHelper);

  /**
   * The set of contexts that are displayed. A mapping from contexts' handles
   * to their content boxes.
   * @type {!Object.<!wtf.replay.graphics.ui.ContextBox>}
   * @private
   */
  this.displayedContexts_ = {};

  /**
   * Whether the canvases are currently resized to fit the area.
   * @type {boolean}
   * @private
   */
  this.resizeCanvasesToFit_ = false;

  // Add contexts as they are made. Delete them as they are destroyed.
  this.trackDisplayingOfContexts_(playback);
};
goog.inherits(wtf.replay.graphics.ui.CanvasesArea, wtf.ui.Control);


/**
 * @override
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.disposeInternal = function() {
  var contextBoxes = this.displayedContexts_;
  for (var contextHandle in contextBoxes) {
    goog.dispose(contextBoxes[contextHandle]);
  }
};


/**
 * Gets whether the feature to resize canvases to fit is turned on.
 * @return {boolean}
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.getResizeCanvasesToFit =
    function() {
  return this.resizeCanvasesToFit_;
};


/**
 * Sets whether the feature to resize canvases to fit is turned on.
 * @param {boolean} resizeCanvasesToFit Whether the feature to resize canvases
 *     to fit is turned on.
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.setResizeCanvasesToFit =
    function(resizeCanvasesToFit) {
  if (resizeCanvasesToFit == this.resizeCanvasesToFit_) {
    // Nothing to do. Already set to this option.
    return;
  }

  this.resizeCanvasesToFit_ = resizeCanvasesToFit;
  if (resizeCanvasesToFit) {
    // Resize canvases so they fit.
    this.resizeToFit_();
  } else {
    this.resizeToOriginalSizes_();
  }
};


/**
 * Adds a new context and displays its canvas in the area.
 * @param {string} contextHandle The handle of the context.
 * @param {!WebGLRenderingContext} context Context of the canvas to add.
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.addContext = function(
    contextHandle, context) {
  this.displayedContexts_[contextHandle] =
      new wtf.replay.graphics.ui.ContextBox(
          context, contextHandle, this.getRootElement(), this.getDom());
};


/**
 * @override
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.canvasArea.controller,
      undefined, undefined, dom));
};


/**
 * Resizes canvases to their original sizes.
 * @private
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.resizeToOriginalSizes_ =
    function() {
  var contextBoxes = this.displayedContexts_;
  for (var contextHandle in contextBoxes) {
    contextBoxes[contextHandle].resetCanvasDimensions();
  }
};


/**
 * Resizes canvases so they fit within the area.
 * @private
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.resizeToFit_ = function() {
  var contextBoxes = this.displayedContexts_;
  if (goog.object.isEmpty(contextBoxes)) {
    // No need to resize if no canvases are displayed.
    return;
  }

  // Find the aspect ratio of the limiting container element.
  var limitingContainer = this.getDom().getElementByClass(
      goog.getCssName('graphicsReplayMainDisplay'));
  var limitingWidth = limitingContainer.clientWidth;
  var limitingHeight = limitingContainer.clientHeight;
  var limitingContainerAspectRatio = limitingWidth / limitingHeight;

  // Find the aspect ratio of the canvases.
  var canvasesHeight = 0;
  var canvasesWidth = 0;
  for (var contextHandle in contextBoxes) {
    // Include room for margins.
    canvasesHeight += contextBoxes[contextHandle].getHeight() + 12;
    var newCanvasesWidth = contextBoxes[contextHandle].getWidth() + 12;
    if (newCanvasesWidth > canvasesWidth) {
      canvasesWidth = newCanvasesWidth;
    }
  }
  var originalAspectRatio = canvasesWidth / canvasesHeight;

  if (limitingContainerAspectRatio < originalAspectRatio) {
    // The width is limiting.
    for (var contextHandle in contextBoxes) {
      var allotedWidth = Math.floor(contextBoxes[contextHandle].getWidth() *
          limitingWidth / canvasesWidth);
      var newWidth = allotedWidth - 12;

      // The width cannot be less than the minimum.
      var minWidth = wtf.replay.graphics.ui.ContextBox.MIN_WIDTH;
      if (newWidth < minWidth) {
        newWidth = minWidth;
      }

      // The new width should also not exceed the original width.
      var nativeWidth =
          contextBoxes[contextHandle].getNativeCanvasWidth();
      if (newWidth > nativeWidth) {
        newWidth = nativeWidth;
      }

      // Scale the height accordingly.
      var newHeight =
          Math.floor(contextBoxes[contextHandle].getNativeCanvasHeight() *
              newWidth / nativeWidth);

      contextBoxes[contextHandle].setCanvasDimensions(newWidth, newHeight);
    }
  } else {
    // The height is limiting.
    for (var contextHandle in contextBoxes) {
      var allotedHeight = Math.floor(contextBoxes[contextHandle].getHeight() *
          limitingHeight / canvasesHeight);

      // Take out the height of the label and margin.
      var newHeight = allotedHeight - 36;

      // The new height should not make the width less than the minimum width.
      var nativeCanvasWidth =
          contextBoxes[contextHandle].getNativeCanvasWidth();
      var nativeCanvasHeight =
          contextBoxes[contextHandle].getNativeCanvasHeight();
      var minHeight = contextBoxes[contextHandle].getMinCanvasHeight();
      if (newHeight < minHeight) {
        newHeight = minHeight;
      }

      // The new height should also not exceed the original height.
      if (newHeight > nativeCanvasHeight) {
        newHeight = nativeCanvasHeight;
      }

      // Scale the width accordingly.
      var newWidth = Math.ceil(
          nativeCanvasWidth * newHeight / nativeCanvasHeight);

      contextBoxes[contextHandle].setCanvasDimensions(newWidth, newHeight);
    }
  }
};


/**
 * Listens to the creation and destruction of canvases.
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @private
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.trackDisplayingOfContexts_ =
    function(playback) {
  // Add contexts as they are made.
  playback.addListener(wtf.replay.graphics.Playback.EventType.CONTEXT_SET,
      function(context, contextHandle) {
        if (!this.displayedContexts_[contextHandle]) {
          this.addContext(contextHandle, context);
        } else {
          var contextBox = this.displayedContexts_[contextHandle];
          contextBox.update();
        }
        if (this.resizeCanvasesToFit_) {
          this.resizeToFit_();
        }
      }, this);

  // Upon a reset, remove all contexts.
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.RESET,
      function() {
        for (var contextHandle in this.displayedContexts_) {
          this.removeContext_(contextHandle);
        }
      }, this);

  // When seeking backwards, contexts may be removed.
  playback.addListener(wtf.replay.graphics.Playback.EventType.BACKWARDS_SEEK,
      function() {
        var currentStep = playback.getCurrentStep();
        if (!currentStep) {
          return;
        }

        // Remove any canvases that should no longer be displayed.
        var initialContexts = currentStep.getInitialContexts();
        for (var contextHandle in this.displayedContexts_) {
          if (!(contextHandle in initialContexts)) {
            this.removeContext_(contextHandle);
          }
        }
      }, this);

  // Update context messages.
  playback.addListener(
      wtf.replay.graphics.Playback.EventType.CONTEXT_MESSAGE_CHANGED,
      function(contextHandle, message) {
        if (this.displayedContexts_[contextHandle]) {
          this.displayedContexts_[contextHandle].updateMessage(message);
        }
      }, this);
};


/**
 * Removes a context and its canvas from the area.
 * @param {string} contextHandle The handle of the context.
 * @private
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.removeContext_ = function(
    contextHandle) {
  var contextBox = this.displayedContexts_[contextHandle];
  this.getRootElement().removeChild(contextBox.getRootElement());
  goog.dispose(contextBox);
  delete this.displayedContexts_[contextHandle];
};


/**
 * Lays out the area where the canvases are displayed.
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.layout = function() {
  if (this.resizeCanvasesToFit_) {
    this.resizeToFit_();
  }
};
