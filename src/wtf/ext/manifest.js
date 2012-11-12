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
 * <code>
  {
    "name": "My Extension",
    "required_version": "1.0.5", // required version of WTF
    "tracing": {
      "scripts": [
        // Scripts that are inserted into the page, in order
        "some/file.js"
      ]
    },
    "app": {
      "scripts": [
        // Scripts that are inserted into the iframe, in order
        "some/file.js"
      ],
      "stylesheets": [
        // Stylesheets inserted into the iframe, in order
        "some/file.css"
      ],
      "triggers": [
        {
          "type": "event",
          "name": "my.custom.event"
        }
      ]
    }
  }
 * </code>
 * @param {!Object} json JSON object.
 * @constructor
 */
wtf.ext.Manifest = function(json) {
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
   * @type {!wtf.ext.Manifest.TracingInfo}
   */
  this.tracing_ = {
    scripts: []
  };

  var jsonTracing = json['tracing'];
  if (jsonTracing) {
    this.tracing_.scripts = jsonTracing['scripts'] || [];
  }

  /**
   * UI information.
   * @type {!wtf.ext.Manifest.AppInfo}
   */
  this.app_ = {
    scripts: [],
    stylesheets: [],
    triggers: []
  };

  var jsonApp = json['app'];
  if (jsonApp) {
    this.app_.scripts = jsonApp['scripts'] || [];
    this.app_.stylesheets = jsonApp['stylesheets'] || [];
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
 *   triggers: !Array.<{{type: string, name: string}}>
 * }}
 */
wtf.ext.Manifest.AppInfo;


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
 * Gets the tracing information section of the manifest.
 * @return {!wtf.ext.Manifest.TracingInfo} Tracing information.
 */
wtf.ext.Manifest.prototype.getTracingInfo = function() {
  return this.tracing_;
};


/**
 * Gets the application information section of the manifest.
 * @return {!wtf.ext.Manifest.AppInfo} Application information.
 */
wtf.ext.Manifest.prototype.getAppInfo = function() {
  return this.app_;
};
