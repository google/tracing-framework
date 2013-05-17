/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Instantiated app UI addon.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.addon.AppAddon');

goog.require('goog.asserts');
goog.require('wtf.events.EventEmitter');



/**
 * Abstract instantiated app UI addon.
 * This is a proxy for the actual addon, which is created inside of an iframe.
 * @param {!wtf.addon.Manifest} manifest Addon manifest.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.addon.AppAddon = function(manifest) {
  goog.base(this);

  var info = manifest.getAppInfo();
  goog.asserts.assert(info);

  /**
   * Manifest.
   * @type {!wtf.addon.Manifest}
   * @private
   */
  this.manifest_ = manifest;

  /**
   * App info from the manifest.
   * @type {!wtf.addon.Manifest.AppInfo}
   * @private
   */
  this.info_ = info;
};
goog.inherits(wtf.addon.AppAddon, wtf.events.EventEmitter);


/**
 * Gets the addon manifest.
 * @return {!wtf.addon.Manifest} Addon manifest.
 */
wtf.addon.AppAddon.prototype.getManifest = function() {
  return this.manifest_;
};


/**
 * Gets the app information associated with the addon.
 * @return {!wtf.addon.Manifest.AppInfo} App information.
 */
wtf.addon.AppAddon.prototype.getInfo = function() {
  return this.info_;
};
