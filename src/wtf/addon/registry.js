/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Addon registry.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.addon.Registry');

goog.require('goog.Disposable');
goog.require('wtf.addon.AppAddon');
goog.require('wtf.addon.Manifest');
goog.require('wtf.addon.TraceAddon');



/**
 * Addon registry.
 * Creates and manages the lifetimes of addon instances.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.addon.Registry = function() {
  goog.base(this);

  /**
   * All manifests that have been registered.
   * @type {!Array.<!{
   *   manifest: !wtf.addon.Manifest,
   *   traceAddon: wtf.addon.TraceAddon,
   *   appAddon: wtf.addon.AppAddon
   * }>}
   * @private
   */
  this.entries_ = [];
};
goog.inherits(wtf.addon.Registry, goog.Disposable);


/**
 * Registers an addon manifest and creates any required addon instances.
 * @param {string} url Manifest URL.
 * @param {!Object} json Manifest JSON.
 */
wtf.addon.Registry.prototype.registerAddon = function(url, json) {
  // Create/parse manifest.
  var manifest = new wtf.addon.Manifest(url, json);

  // Create trace addon, if needed.
  var traceAddon = null;
  if (manifest.getTracingInfo()) {
    traceAddon = new wtf.addon.TraceAddon(manifest);
    this.registerDisposable(traceAddon);
  }

  // Create app addon, if needed.
  var appAddon = null;
  if (manifest.getAppInfo()) {
    appAddon = new wtf.addon.AppAddon(manifest);
    this.registerDisposable(appAddon);
  }

  this.entries_.push({
    manifest: manifest,
    traceAddon: traceAddon,
    appAddon: appAddon
  });
};


/**
 * Gets a list of all registered trace addons.
 * @return {!Array.<!wtf.addon.TraceAddon>} A list of trace addons.
 */
wtf.addon.Registry.prototype.getTraceAddons = function() {
  var result = [];
  for (var n = 0; n < this.entries_.length; n++) {
    var traceAddon = this.entries_[n].traceAddon;
    if (traceAddon) {
      result.push(traceAddon);
    }
  }
  return result;
};


/**
 * Gets a list of all registered app addons.
 * @return {!Array.<!wtf.addon.AppAddon>} A list of app addons.
 */
wtf.addon.Registry.prototype.getAppAddons = function() {
  var result = [];
  for (var n = 0; n < this.entries_.length; n++) {
    var appAddon = this.entries_[n].appAddon;
    if (appAddon) {
      result.push(appAddon);
    }
  }
  return result;
};
