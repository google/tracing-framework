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

goog.require('wtf.ui.TimePainter');



/**
 * Base track painter.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 * @param {!wtf.analysis.db.EventDatabase} db Database.
 * @constructor
 * @extends {wtf.ui.TimePainter}
 */
wtf.app.ui.tracks.TrackPainter = function(canvas, db) {
  goog.base(this, canvas);

  /**
   * Database.
   * @type {!wtf.analysis.db.EventDatabase}
   * @protected
   */
  this.db = db;
};
goog.inherits(wtf.app.ui.tracks.TrackPainter, wtf.ui.TimePainter);


/**
 * Performs any painting required before the track painter subclass paints.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @protected
 */
wtf.app.ui.tracks.TrackPainter.prototype.beginRepaint = function(
    ctx, bounds) {
  // TODO(benvanik): compute height?

  // TODO(benvanik): clip to size
};


/**
 * Performs any painting required after the track painter subclass paints.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {!goog.math.Rect} bounds Draw bounds.
 * @protected
 */
wtf.app.ui.tracks.TrackPainter.prototype.endRepaint = function(
    ctx, bounds) {
  // TODO(benvanik): paint label
};
