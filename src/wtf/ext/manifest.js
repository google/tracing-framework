/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extension manifest files.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ext.Manifest');



/**
 * Parsed extension manifest file.
 * For information on the format see `docs/extensions.md`.
 * @param {string} url Manifest URL.
 * @param {!Object} json JSON object.
 * @constructor
 */
wtf.ext.Manifest = function(url, json) {
  /**
   * The URL of the manifest.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * Extension name as shown in UIs.
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
   * @type {wtf.ext.Manifest.TracingInfo?}
   * @private
   */
  this.tracing_ = null;

  var jsonTracing = json['tracing'];
  if (jsonTracing) {
    this.tracing_ = {
      scripts: jsonTracing['scripts'] || []
    };
  }

  /**
   * UI information.
   * @type {wtf.ext.Manifest.AppInfo?}
   * @private
   */
  this.app_ = null;

  var jsonApp = json['app'];
  if (jsonApp) {
    this.app_ = {
      scripts: jsonApp['scripts'] || [],
      stylesheets: jsonApp['stylesheets'] || [],
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
 *   scripts: !Array.<string>
 * }}
 */
wtf.ext.Manifest.TracingInfo;


/**
 * @typedef {{
 *   scripts: !Array.<string>,
 *   stylesheets: !Array.<string>,
 *   triggers: !Array.<{type: string, name: string}>
 * }}
 */
wtf.ext.Manifest.AppInfo;


/**
 * Gets the URL the manifest was loaded from.
 * @return {string} Extension manifest URL.
 */
wtf.ext.Manifest.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Gets the human-readable extension name.
 * @return {string} Extension name.
 */
wtf.ext.Manifest.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets the required WTF version.
 * @return {string} Version as '1.0.5'.
 */
wtf.ext.Manifest.prototype.getRequiredVersion = function() {
  return this.requiredVersion_;
};


/**
 * Gets the tracing information section of the manifest, if defined.
 * @return {wtf.ext.Manifest.TracingInfo?} Tracing information.
 */
wtf.ext.Manifest.prototype.getTracingInfo = function() {
  return this.tracing_;
};


/**
 * Gets the application information section of the manifest, if defined.
 * @return {wtf.ext.Manifest.AppInfo?} Application information.
 */
wtf.ext.Manifest.prototype.getAppInfo = function() {
  return this.app_;
};
