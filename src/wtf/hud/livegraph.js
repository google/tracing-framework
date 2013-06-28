/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HUD live updating graph.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.hud.LiveGraph');

goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.Painter');
goog.require('wtf.util.canvas');



/**
 * HUD overlay control UI.
 *
 * @param {!wtf.trace.Session} session Current tracing session.
 * @param {!Object} options Options.
 * @param {!Element} parentElement Parent element.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.hud.LiveGraph = function(session, options, parentElement) {
  goog.base(this, parentElement);

  /**
   * Enabled state.
   * The graph will track state but not redraw when disabled.
   * @type {boolean}
   * @private
   */
  this.enabled_ = true;

  this.getHandler().listen(this.getRootElement(),
      goog.events.EventType.CLICK, this.graphClicked_, false);

  this.setupPainter_();
};
goog.inherits(wtf.hud.LiveGraph, wtf.ui.Control);


/**
 * @override
 */
wtf.hud.LiveGraph.prototype.createDom = function(dom) {
  return dom.createElement(goog.dom.TagName.CANVAS);
};


/**
 * Sets up the graph painter.
 * @private
 */
wtf.hud.LiveGraph.prototype.setupPainter_ = function() {
  if (!wtf.util.canvas.isSupported()) {
    this.enabled_ = false;
    // TODO(benvanik): show 'canvas disabled' message.
    return;
  }

  var canvas = /** @type {!HTMLCanvasElement} */ (this.getRootElement());
  goog.dom.classes.add(canvas, goog.getCssName('hudGraphCanvas'));
  canvas.width = 1;
  canvas.height = 1;

  this.setPaintContext(new wtf.ui.Painter(canvas));
};


/**
 * Sets the enabled state of the graph.
 * When disabled the graph will not draw.
 * @param {boolean} value Enabled value.
 */
wtf.hud.LiveGraph.prototype.setEnabled = function(value) {
  this.enabled_ = value;
  if (value) {
    this.requestRepaint();
  }
};


/**
 * Handles clicks on the graph.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.hud.LiveGraph.prototype.graphClicked_ = function(e) {
  // TODO(benvanik): embiggen graph? config dialog?
};


/**
 * Advances the HUD time.
 * @param {number=} opt_time New time. Prefer using {@see wtf#now}.
 */
wtf.hud.LiveGraph.prototype.advance = function(opt_time) {
  // TODO(benvanik): advance time, update the overlay
  // var time = opt_time || wtf.now();

  // Redraw after update.
  if (this.enabled_) {
    this.requestRepaint();
  }
};
