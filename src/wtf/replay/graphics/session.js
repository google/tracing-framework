/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Session. Represents a single session of graphics replay.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.Session');

goog.require('goog.asserts');
goog.require('goog.dom.DomHelper');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.replay.graphics.ContextPool');
goog.require('wtf.replay.graphics.Highlight');
goog.require('wtf.replay.graphics.Overdraw');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.replay.graphics.ui.GraphicsPanel');



/**
 * A session of graphics replay.
 *
 * @param {!wtf.db.Database} db A database.
 * @param {!Element} parentElement The parent element.
 * @param {goog.dom.DomHelper=} opt_domHelper A DOM Helper.
 *     step draws one.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.replay.graphics.Session = function(db, parentElement, opt_domHelper) {
  goog.base(this);

  var zone = db.getDefaultZone();
  goog.asserts.assert(zone);

  /**
   * DOM Helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.domHelper_ = opt_domHelper || new goog.dom.DomHelper();

  /**
   * A context pool.
   * @type {!wtf.replay.graphics.ContextPool}
   * @private
   */
  this.contextPool_ = new wtf.replay.graphics.ContextPool(this.domHelper_);
  this.registerDisposable(this.contextPool_);

  /**
   * A playback instance.
   * @type {!wtf.replay.graphics.Playback}
   * @private
   */
  this.playback_ = new wtf.replay.graphics.Playback(
      zone.getEventList(), zone.getFrameList(), this.contextPool_);
  this.registerDisposable(this.playback_);

  // TODO(benvanik): move this out of here - right now since the UI is hardcoded
  //     into this it's fine, but other uses of the session may not want this.
  this.playback_.setContextAttributeOverrides({
    'preserveDrawingBuffer': true
  });

  // Add visualizers to the playback.
  var highlightVisualizer = new wtf.replay.graphics.Highlight(this.playback_);
  this.playback_.addVisualizer(highlightVisualizer, 'highlight');
  this.registerDisposable(highlightVisualizer);

  var overdrawVisualizer = new wtf.replay.graphics.Overdraw(this.playback_);
  this.playback_.addVisualizer(overdrawVisualizer, 'overdraw');
  this.registerDisposable(overdrawVisualizer);

  /**
   * A panel for controlling graphics replay.
   * @type {!wtf.replay.graphics.ui.GraphicsPanel}
   * @private
   */
  this.panel_ = new wtf.replay.graphics.ui.GraphicsPanel(
      this.playback_, zone.getEventList(), parentElement, this.domHelper_);
  this.registerDisposable(this.panel_);
};
goog.inherits(wtf.replay.graphics.Session, wtf.events.EventEmitter);


/**
 * Lays out all child UI.
 */
wtf.replay.graphics.Session.prototype.layout = function() {
  this.panel_.layout();
};
