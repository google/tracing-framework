/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Instantiated trace addon.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.addon.TraceAddon');

goog.require('goog.asserts');
goog.require('wtf.events.EventEmitter');



/**
 * Tracing addon.
 * @param {!wtf.addon.Manifest} manifest Addon manifest.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.addon.TraceAddon = function(manifest) {
  goog.base(this);

  var info = manifest.getTracingInfo();
  goog.asserts.assert(info);

  /**
   * Manifest.
   * @type {!wtf.addon.Manifest}
   * @private
   */
  this.manifest_ = manifest;

  /**
   * Tracing info from the manifest.
   * @type {!wtf.addon.Manifest.TracingInfo}
   * @private
   */
  this.info_ = info;
};
goog.inherits(wtf.addon.TraceAddon, wtf.events.EventEmitter);


/**
 * Gets the addon manifest.
 * @return {!wtf.addon.Manifest} Addon manifest.
 */
wtf.addon.TraceAddon.prototype.getManifest = function() {
  return this.manifest_;
};


/**
 * Gets the tracing information associated with the addon.
 * @return {!wtf.addon.Manifest.TracingInfo} Tracing information.
 */
wtf.addon.TraceAddon.prototype.getInfo = function() {
  return this.info_;
};
