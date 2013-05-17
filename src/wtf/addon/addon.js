/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Addons API.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.addon');

goog.require('wtf.addon.Registry');


/**
 * Lazy-loaded addon registry.
 * @type {wtf.addon.Registry}
 * @private
 */
wtf.addon.registry_ = null;


/**
 * Gets the addon registry singleton.
 * @return {!wtf.addon.Registry} Extension registry.
 * @private
 */
wtf.addon.getRegistry_ = function() {
  if (!wtf.addon.registry_) {
    wtf.addon.registry_ = new wtf.addon.Registry();
  }
  return wtf.addon.registry_;
};


/**
 * Registers an addon manifest.
 * A JSON object can be provided or - less-preferably - a URL to the JSON file.
 * The load will occur synchronously and throw an error if it fails due to
 * CORS/etc.
 * @param {string} url Manifest JSON URL.
 * @param {Object=} opt_json JSON contents, to avoid XHR.
 */
wtf.addon.registerAddon = function(url, opt_json) {
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

  var registry = wtf.addon.getRegistry_();
  registry.registerAddon(url, json);
};


/**
 * Gets a list of all loaded trace extensions.
 * @return {!Array.<!wtf.addon.TraceAddon>} A list of tracing extensions.
 */
wtf.addon.getTraceAddons = function() {
  var registry = wtf.addon.getRegistry_();
  return registry.getTraceAddons();
};


/**
 * Gets a list of all loaded app extensions.
 * @return {!Array.<!wtf.addon.AppAddon>} A list of app extensions.
 */
wtf.addon.getAppAddons = function() {
  var registry = wtf.addon.getRegistry_();
  return registry.getAppAddons();
};


goog.exportSymbol(
    'wtf.addon.registerAddon',
    wtf.addon.registerAddon);
goog.exportSymbol(
    'wtf.addon.getTraceAddons',
    wtf.addon.getTraceAddons);
goog.exportSymbol(
    'wtf.addon.getAppAddons',
    wtf.addon.getAppAddons);
