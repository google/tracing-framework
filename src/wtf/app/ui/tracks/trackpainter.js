/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview A single track painter in the tracks panel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.tracks.TrackPainter');

goog.require('wtf.ui.TimeRangePainter');



/**
 * Base track painter.
 * @param {!wtf.ui.PaintContext} parentContext Parent paint context.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @constructor
 * @extends {wtf.ui.TimeRangePainter}
 */
wtf.app.ui.tracks.TrackPainter = function(parentContext, db) {
  goog.base(this, parentContext);

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @protected
   */
  this.db = db;
};
goog.inherits(wtf.app.ui.tracks.TrackPainter, wtf.ui.TimeRangePainter);


/**
 * Performs any painting required before the track painter subclass paints.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {number} width Canvas width, in pixels.
 * @param {number} height Canvas height, in pixels.
 * @protected
 */
wtf.app.ui.tracks.TrackPainter.prototype.beginRepaint = function(
    ctx, width, height) {
  // TODO(benvanik): compute height?

  // TODO(benvanik): clip to size
};


/**
 * Performs any painting required after the track painter subclass paints.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {number} width Canvas width, in pixels.
 * @param {number} height Canvas height, in pixels.
 * @protected
 */
wtf.app.ui.tracks.TrackPainter.prototype.endRepaint = function(
    ctx, width, height) {
  // TODO(benvanik): paint label
};
