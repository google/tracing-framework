/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Instantiated trace extension.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ext.TraceExtension');

goog.require('goog.asserts');
goog.require('wtf.events.EventEmitter');



/**
 * Tracing extension.
 * @param {!wtf.ext.Manifest} manifest Extension manifest.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.ext.TraceExtension = function(manifest) {
  goog.base(this);

  var info = manifest.getTracingInfo();
  goog.asserts.assert(info);

  /**
   * Manifest.
   * @type {!wtf.ext.Manifest}
   * @private
   */
  this.manifest_ = manifest;

  /**
   * Tracing info from the manifest.
   * @type {!wtf.ext.Manifest.TracingInfo}
   * @private
   */
  this.info_ = info;
};
goog.inherits(wtf.ext.TraceExtension, wtf.events.EventEmitter);


/**
 * Gets the extension manifest.
 * @return {!wtf.ext.Manifest} Extension manifest.
 */
wtf.ext.TraceExtension.prototype.getManifest = function() {
  return this.manifest_;
};


/**
 * Gets the tracing information associated with the extension.
 * @return {!wtf.ext.Manifest.TracingInfo} Tracing information.
 */
wtf.ext.TraceExtension.prototype.getInfo = function() {
  return this.info_;
};
