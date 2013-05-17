/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Addon manifest files.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.addon.Manifest');



/**
 * Parsed addon manifest file.
 * For information on the format see `docs/addons.md`.
 * @param {string} url Manifest URL.
 * @param {!Object} json JSON object.
 * @constructor
 */
wtf.addon.Manifest = function(url, json) {
  /**
   * The URL of the manifest.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * Addon name as shown in UIs.
   * @type {string}
   * @private
   */
  this.name_ = json['name'];

  /**
   * Required WTF version string (e.g., '1.0.5').
   * @type {string}
   * @private
   */
  this.requiredVersion_ = json['required_version'];

  /**
   * Tracing information.
   * @type {wtf.addon.Manifest.TracingInfo?}
   * @private
   */
  this.tracing_ = null;

  var jsonTracing = json['tracing'];
  if (jsonTracing) {
    this.tracing_ = {
      scripts: jsonTracing['scripts'] || [],
      options: jsonTracing['options'] || []
    };
  }

  /**
   * UI information.
   * @type {wtf.addon.Manifest.AppInfo?}
   * @private
   */
  this.app_ = null;

  var jsonApp = json['app'];
  if (jsonApp) {
    this.app_ = {
      scripts: jsonApp['scripts'] || [],
      options: jsonApp['options'] || [],
      triggers: []
    };
    var jsonTriggers = jsonApp['triggers'];
    if (jsonTriggers) {
      for (var n = 0; n < jsonTriggers.length; n++) {
        var jsonTrigger = jsonTriggers[n];
        this.app_.triggers.push({
          type: jsonTrigger['type'],
          name: jsonTrigger['name']
        });
      }
    }
  }
};


/**
 * @typedef {{
 *   scripts: !Array.<string>,
 *   options: !Array
 * }}
 */
wtf.addon.Manifest.TracingInfo;


/**
 * @typedef {{
 *   scripts: !Array.<string>,
 *   options: !Array,
 *   triggers: !Array.<{type: string, name: string}>
 * }}
 */
wtf.addon.Manifest.AppInfo;


/**
 * Gets the URL the manifest was loaded from.
 * @return {string} Addon manifest URL.
 */
wtf.addon.Manifest.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Gets the human-readable addon name.
 * @return {string} Addon name.
 */
wtf.addon.Manifest.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets the required WTF version.
 * @return {string} Version as '1.0.5'.
 */
wtf.addon.Manifest.prototype.getRequiredVersion = function() {
  return this.requiredVersion_;
};


/**
 * Gets the tracing information section of the manifest, if defined.
 * @return {wtf.addon.Manifest.TracingInfo?} Tracing information.
 */
wtf.addon.Manifest.prototype.getTracingInfo = function() {
  return this.tracing_;
};


/**
 * Gets the application information section of the manifest, if defined.
 * @return {wtf.addon.Manifest.AppInfo?} Application information.
 */
wtf.addon.Manifest.prototype.getAppInfo = function() {
  return this.app_;
};
