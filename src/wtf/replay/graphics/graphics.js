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

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('wtf.db');
goog.require('wtf.db.Database');
goog.require('wtf.events.CommandManager');
goog.require('wtf.replay.graphics.Session');


/**
 * Sets up a graphics playback UI in the given DOM element.
 * @param {!wtf.db.Database} db Loaded database.
 * @param {!Element} parentElement The parent element for the UI to be
 *     placed into.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @return {!wtf.replay.graphics.Session} New replay session.
 */
wtf.replay.graphics.setup = function(db, parentElement, opt_dom) {
  var dom = opt_dom || goog.dom.getDomHelper(parentElement);
  return new wtf.replay.graphics.Session(db, parentElement, dom);
};


/**
 * Sets up a graphics playback UI in a standalone HTML page.
 * @param {string} url The URL of the trace.
 * @param {!Element} parentElement The parent element for this standalone
 *     widget.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @param {(function(!(wtf.replay.graphics.Session|Error)))=} opt_callback
 *     A function called when the session has loaded. Takes the session as
 *     an argument or an Error object if the load failed.
 */
wtf.replay.graphics.setupWithUrl = function(
    url, parentElement, opt_dom, opt_callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);

  xhr.onload = function() {
    if (xhr.status != 200) {
      var e = new Error('Failed: ' + xhr.status + ', ' + xhr.statusText);
      if (opt_callback) {
        opt_callback(e);
      } else {
        throw e;
      }
    }

    var traceData = new Uint8Array(
        /** @type {ArrayBuffer} */(xhr.response));
    wtf.db.load(traceData, function(db) {
      if (!db || (db instanceof Error)) {
        var e = new Error('Database failed to load.');
        if (opt_callback) {
          opt_callback(e);
        } else {
          throw e;
        }
      }

      goog.asserts.assert(db instanceof wtf.db.Database);

      var commandManager = new wtf.events.CommandManager();
      wtf.events.CommandManager.setShared(commandManager);

      var session = wtf.replay.graphics.setup(db, parentElement, opt_dom);
      if (opt_callback) {
        opt_callback(session);
      }
    });
  };

  xhr.responseType = 'arraybuffer';
  xhr.send();
};


goog.exportSymbol(
    'wtf.replay.graphics.setup',
    wtf.replay.graphics.setup);
goog.exportSymbol(
    'wtf.replay.graphics.setupWithUrl',
    wtf.replay.graphics.setupWithUrl);
