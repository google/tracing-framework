/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Generic browser platform abstraction layer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.pal.BrowserPlatform');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventType');
goog.require('goog.fs');
goog.require('wtf.pal.IPlatform');



/**
 * Chrome extension platform abstraction layer implementation.
 * @constructor
 * @implements {wtf.pal.IPlatform}
 */
wtf.pal.BrowserPlatform = function() {
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.getWorkingDirectory = function() {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.readTextFile = function(path) {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.readBinaryFile = function(path) {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.writeTextFile = function(
    path, contents, opt_mimeType) {
  var blob = new Blob([contents], {
    'type': opt_mimeType || 'text/plain'
  });
  this.downloadBlob_(path, blob);
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.writeBinaryFile = function(
    path, contents, opt_mimeType) {
  // Create blob from all parts.
  var blob = new Blob([contents], {
    'type': opt_mimeType || 'application/octet-stream'
  });

  this.downloadBlob_(path, blob);
};


/**
 * Downloads a blob.
 * @param {string} filename Blob filename.
 * @param {!Blob} blob Blob.
 * @private
 */
wtf.pal.BrowserPlatform.prototype.downloadBlob_ = function(filename, blob) {
  // IE10+
  if (goog.global.navigator['msSaveBlob']) {
    goog.global.navigator['msSaveBlob'](blob, filename);
    return;
  }

  // Download file. Wow.
  var doc = goog.dom.getDocument();
  var a = doc.createElement(goog.dom.TagName.A);
  a['download'] = filename;
  a.href = goog.fs.createObjectUrl(blob);
  var e = doc.createEvent('MouseEvents');
  e.initMouseEvent(
      goog.events.EventType.CLICK,
      true, false, goog.global, 0, 0, 0, 0, 0,
      false, false, false, false, 0, null);
  a.dispatchEvent(e);
};
