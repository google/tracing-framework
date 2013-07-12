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
 * Adds a new context and displays its canvas in the area.
 * @param {string} contextHandle The handle of the context.
 * @param {!WebGLRenderingContext} context Context of the canvas to add.
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.addContext = function(
    contextHandle, context) {
  this.displayedContexts_[contextHandle] =
      new wtf.replay.graphics.ui.ContextBox(
          context, this.getRootElement(), this.getDom());
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
 * Listens to the creation and destruction of canvases.
 * @param {!wtf.replay.graphics.Playback} playback The playback.
 * @private
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.trackDisplayingOfContexts_ =
    function(playback) {
  // Add contexts as they are made.
  playback.addListener(wtf.replay.graphics.Playback.EventType.CONTEXT_CREATED,
      function(context, contextHandle) {
        if (!this.displayedContexts_[contextHandle]) {
          this.addContext(contextHandle, context);
        }
      }, this);

  // Upon a reset, remove all contexts.
  playback.addListener(wtf.replay.graphics.Playback.EventType.RESET,
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
};


/**
 * Removes a context and its canvas from the area.
 * @param {string} handle The handle of the context.
 * @private
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.removeContext_ = function(
    handle) {
  var contextBox = this.displayedContexts_[handle];
  this.getRootElement().removeChild(contextBox.getRootElement());
  goog.dispose(contextBox);
  delete this.displayedContexts_[handle];
};
