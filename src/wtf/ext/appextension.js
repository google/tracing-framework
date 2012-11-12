/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Instantiated app UI extension.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ext.AppExtension');

goog.require('goog.result.SimpleResult');
goog.require('wtf.events.EventEmitter');



/**
 * Abstract instantiated app UI extension.
 * This is a proxy for the actual extension, which is created inside of an
 * iframe.
 * @param {!wtf.ext.Manifest} manifest Extension manifest.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.ext.AppExtension = function(manifest) {
  goog.base(this);

  /**
   * Manifest.
   * @type {!wtf.ext.Manifest}
   * @private
   */
  this.manifest_ = manifest;
};
goog.inherits(wtf.ext.AppExtension, wtf.events.EventEmitter);


/**
 * Gets the extension manifest.
 * @return {!wtf.ext.Manifest} Extension manifest.
 */
wtf.ext.AppExtension.prototype.getManifest = function() {
  return this.manifest_;
};


/**
 * Begins asynchronously setting up the extension by loading all required
 * resources.
 * @return {!goog.result.Result} Setup result.
 * @private
 */
wtf.ext.AppExtension.prototype.setup_ = function() {
  var result = new goog.result.SimpleResult();
  result.setValue(true);
  return result;
};


/**
 * Begins loading the extension and setting it up.
 * @param {[type]} manifestUrl [description].
 * @return {[type]} [description].
 */
wtf.ext.AppExtension.load = function(manifestUrl) {
  // TODO(benvanik): XHR load manifestUrl
  // TODO(benvanik): create wtf.ext.Manifest from the result
  // TODO(benvanik): create AppExtension
  // TODO(benvanik): setup and return result
  var result = new goog.result.SimpleResult();
  result.setValue(true);
  return result;
};
