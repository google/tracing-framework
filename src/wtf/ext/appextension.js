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

goog.require('goog.asserts');
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

  var info = manifest.getAppInfo();
  goog.asserts.assert(info);

  /**
   * Manifest.
   * @type {!wtf.ext.Manifest}
   * @private
   */
  this.manifest_ = manifest;

  /**
   * App info from the manifest.
   * @type {!wtf.ext.Manifest.AppInfo}
   * @private
   */
  this.info_ = info;
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
 * Gets the app information associated with the extension.
 * @return {!wtf.ext.Manifest.AppInfo} App information.
 */
wtf.ext.AppExtension.prototype.getInfo = function() {
  return this.info_;
};
