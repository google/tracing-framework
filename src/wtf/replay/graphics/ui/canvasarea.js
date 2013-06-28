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
   * A set of hashes for pre-existing contexts. Used to prevent duplicate
   * contexts.
   * @type {!Object.<boolean>}
   * @private
   */
  this.includedContexts_ = {};

  /**
   * A list of boxes representing current contexts.
   * @type {!Array.<!wtf.replay.graphics.ui.ContextBox>}
   * @private
   */
  this.contextBoxes_ = [];
  this.trackContextCreation_(playback); // Add contexts as they are made.
};
goog.inherits(wtf.replay.graphics.ui.CanvasesArea, wtf.ui.Control);


/**
 * Adds a new context to the area.
 * @param {!WebGLRenderingContext} context Context of the canvas to add.
 */
wtf.replay.graphics.ui.CanvasesArea.prototype.addContext = function(
    context) {
  this.contextBoxes_.push(new wtf.replay.graphics.ui.ContextBox(
      context, this.getRootElement(), this.getDom()));
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
wtf.replay.graphics.ui.CanvasesArea.prototype.trackContextCreation_ =
    function(playback) {
  playback.addListener(wtf.replay.graphics.Playback.EventType.CONTEXT_CREATED,
      function(context) {
        var contextHash = goog.getUid(context);
        if (!this.includedContexts_[contextHash]) {
          this.addContext(context);
          this.includedContexts_[contextHash] = true;
        }
      }, this);
  playback.addListener(wtf.replay.graphics.Playback.EventType.RESET,
      function() {
        var rootElement = this.getRootElement();
        for (var i = 0; i < this.contextBoxes_.length; ++i) {
          rootElement.removeChild(this.contextBoxes_[i].getRootElement());
        }
        this.contextBoxes_.length = 0;
        this.includedContexts_ = {};
      }, this);
};
