/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extensions API.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ext');

goog.require('wtf.ext.Registry');


/**
 * Lazy-loaded extension registry.
 * @type {wtf.ext.Registry}
 * @private
 */
wtf.ext.registry_ = null;


/**
 * Gets the extension registry singleton.
 * @return {!wtf.ext.Registry} Extension registry.
 * @private
 */
wtf.ext.getRegistry_ = function() {
  if (!wtf.ext.registry_) {
    wtf.ext.registry_ = new wtf.ext.Registry();
  }
  return wtf.ext.registry_;
};


/**
 * Registers an extension manifest.
 * A JSON object can be provided or - less-preferably - a URL to the JSON file.
 * The load will occur synchronously and throw an error if it fails due to
 * CORS/etc.
 * @param {string} url Manifest JSON URL.
 * @param {Object=} opt_json JSON contents, to avoid XHR.
 */
wtf.ext.registerExtension = function(url, opt_json) {
  // Load, if required.
  var json = opt_json || null;
  if (!opt_json) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send('');
    var rawText = xhr.responseText;
    json = goog.global.JSON.parse(rawText);
  }
  if (!json || !goog.isObject(json)) {
    throw 'Invalid manifest: ' + rawText;
  }

  var registry = wtf.ext.getRegistry_();
  registry.registerExtension(url, json);
};


/**
 * Gets a list of all loaded trace extensions.
 * @return {!Array.<!wtf.ext.TraceExtension>} A list of tracing extensions.
 */
wtf.ext.getTraceExtensions = function() {
  var registry = wtf.ext.getRegistry_();
  return registry.getTraceExtensions();
};


/**
 * Gets a list of all loaded app extensions.
 * @return {!Array.<!wtf.ext.AppExtension>} A list of app extensions.
 */
wtf.ext.getAppExtensions = function() {
  var registry = wtf.ext.getRegistry_();
  return registry.getAppExtensions();
};


goog.exportSymbol(
    'wtf.ext.registerExtension',
    wtf.ext.registerExtension);
goog.exportSymbol(
    'wtf.ext.getTraceExtensions',
    wtf.ext.getTraceExtensions);
goog.exportSymbol(
    'wtf.ext.getAppExtensions',
    wtf.ext.getAppExtensions);
