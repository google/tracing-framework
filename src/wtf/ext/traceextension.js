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

goog.require('wtf.events.EventEmitter');



/**
 * Tracing extension.
 * @param {!wtf.ext.Manifest} manifest Extension manifest.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.ext.TraceExtension = function(manifest) {
  goog.base(this);

  /**
   * Manifest.
   * @type {!wtf.ext.Manifest}
   * @private
   */
  this.manifest_ = manifest;
};
goog.inherits(wtf.ext.TraceExtension, wtf.events.EventEmitter);


/**
 * Gets the extension manifest.
 * @return {!wtf.ext.Manifest} Extension manifest.
 */
wtf.ext.TraceExtension.prototype.getManifest = function() {
  return this.manifest_;
};
