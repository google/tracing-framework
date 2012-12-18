/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extension registry.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ext.Registry');

goog.require('goog.Disposable');
goog.require('wtf.ext.AppExtension');
goog.require('wtf.ext.Manifest');
goog.require('wtf.ext.TraceExtension');



/**
 * Extension registry.
 * Creates and manages the lifetimes of extension instances.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.ext.Registry = function() {
  goog.base(this);

  /**
   * All manifests that have been registered.
   * @type {!Array.<!{
   *   manifest: !wtf.ext.Manifest,
   *   traceExtension: wtf.ext.TraceExtension,
   *   appExtension: wtf.ext.AppExtension
   * }>}
   * @private
   */
  this.entries_ = [];
};
goog.inherits(wtf.ext.Registry, goog.Disposable);


/**
 * Registers an extension manifest and creates any required extension instances.
 * @param {string} url Manifest URL.
 * @param {!Object} json Manifest JSON.
 */
wtf.ext.Registry.prototype.registerExtension = function(url, json) {
  // Create/parse manifest.
  var manifest = new wtf.ext.Manifest(url, json);

  // Create trace extension, if needed.
  var traceExtension = null;
  if (manifest.getTracingInfo()) {
    traceExtension = new wtf.ext.TraceExtension(manifest);
    this.registerDisposable(traceExtension);
  }

  // Create app extension, if needed.
  var appExtension = null;
  if (manifest.getAppInfo()) {
    appExtension = new wtf.ext.AppExtension(manifest);
    this.registerDisposable(appExtension);
  }

  this.entries_.push({
    manifest: manifest,
    traceExtension: traceExtension,
    appExtension: appExtension
  });
};


/**
 * Gets a list of all registered trace extensions.
 * @return {!Array.<!wtf.ext.TraceExtension>} A list of trace extensions.
 */
wtf.ext.Registry.prototype.getTraceExtensions = function() {
  var result = [];
  for (var n = 0; n < this.entries_.length; n++) {
    var traceExtension = this.entries_[n].traceExtension;
    if (traceExtension) {
      result.push(traceExtension);
    }
  }
  return result;
};


/**
 * Gets a list of all registered app extensions.
 * @return {!Array.<!wtf.ext.AppExtension>} A list of app extensions.
 */
wtf.ext.Registry.prototype.getAppExtensions = function() {
  var result = [];
  for (var n = 0; n < this.entries_.length; n++) {
    var appExtension = this.entries_[n].appExtension;
    if (appExtension) {
      result.push(appExtension);
    }
  }
  return result;
};
