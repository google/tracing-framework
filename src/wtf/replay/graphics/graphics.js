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

goog.require('goog.dom.DomHelper');
goog.require('wtf.db');
goog.require('wtf.replay.graphics.Session');


/**
 * Sets up a graphics playback in a standalone HTML page.
 * @param {string} traceUrl The URL of the trace.
 * @param {!Element} parentElement The parent element for this standalone
 *     widget.
 * @param {!function(!wtf.replay.graphics.Session)=} opt_callback A function
 * called when the session has loaded. Takes the session as an argument.
 */
wtf.replay.graphics.setupStandalone = function(
    traceUrl, parentElement, opt_callback) {
  var callback = opt_callback || goog.nullFunction;
  var domHelper = new goog.dom.DomHelper(parentElement.ownerDocument);

  var xhr = new XMLHttpRequest();
  xhr.responseType = 'arraybuffer';
  xhr.onload = function() {
    if (xhr.status != 200) {
      throw new Error('Failed: ' + xhr.status + ', ' + xhr.statusText);
    }

    var traceData = new Uint8Array(
        /** @type {ArrayBuffer} */(xhr.response));
    wtf.db.load(traceData, function(db) {
      if (!db || (db instanceof Error)) {
        throw new Error('Database failed to load.');
      }

      var session = new wtf.replay.graphics.Session(
          /** @type {!wtf.db.Database} */ (db),
          parentElement, domHelper);
      callback.apply(null, session);
    });
  };

  xhr.open('GET', traceUrl, true);
  xhr.send();
};


goog.exportSymbol(
    'wtf.replay.graphics.setupStandalone',
    wtf.replay.graphics.setupStandalone);
