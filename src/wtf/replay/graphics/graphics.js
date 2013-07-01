/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Graphics replay main namespace.
 *
 * Allows replaying of WebGL frames.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics');


/**
 * Current playback, if any.
 * @type {wtf.replay.graphics.Playback}
 * @private
 */
wtf.replay.graphics.playback_ = null;


/**
 * Sets up a graphics playback in a standalone HTML page.
 *
 * @param {!wtf.db.Database} db A database.
 */
wtf.replay.graphics.setupStandalone = function(db) {
  var zone = db.getDefaultZone();
  if (!zone) {
    return;
  }
  // TODO(chizeng): Set up playing.
  // var playback = wtf.replay.graphics.playback_ ||
  //     new wtf.replay.graphics.Playback(zone.getEventList(),
  //         zone.getFrameList(), new wtf.replay.graphics.ContextPool());
};


goog.exportSymbol(
    'wtf.replay.graphics.setupStandalone',
    wtf.replay.graphics.setupStandalone);
