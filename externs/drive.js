/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Google Drive/GAPI externs.
 *
 * @author benvanik@google.com (Ben Vanik)
 * @externs
 */


var gapi;

gapi.auth;

/**
 * @param {Function} callback
 */
gapi.auth.init = function(callback) {};

/**
 * @param {!Object} config
 * @param {Function} callback
 */
gapi.auth.authorize = function(config, callback) {};

/**
 * @return {gapi.auth.Token}
 */
gapi.auth.getToken = function() {};

/**
 * @constructor
 */
gapi.auth.Token = function() {};

/**
 * @type {string}
 */
gapi.auth.Token.prototype.access_token;

gapi.client;

/**
 * @param {string} apiKey
 */
gapi.client.setApiKey = function(apiKey) {};

/**
 * @param {string} name
 * @param {string} version
 * @param {Function} callback
 */
gapi.client.load = function(name, version, callback) {};



var google;

/**
 * @param {string} name
 * @param {string} version
 * @param {!Object} options
 */
google.load = function(name, version, options) {};

google.picker;

/**
 * @param {string} name
 * @constructor
 * @noalias
 */
google.picker.View = function(name) {};

google.picker.View.prototype.setMimeTypes = function(value) {};

/**
 * @constructor
 * @noalias
 */
google.picker.PickerBuilder = function() {};
/**
 * @param {string} value
 */
google.picker.PickerBuilder.prototype.setTitle = function(value) {};
/**
 * @param {string} name
 */
google.picker.PickerBuilder.prototype.enableFeature = function(name) {};
/**
 * @param {string} value
 */
google.picker.PickerBuilder.prototype.setAppId = function(value) {};
/**
 * @param {string} value
 */
google.picker.PickerBuilder.prototype.setSelectableMimeTypes =
    function(value) {};
/**
 * @param {Function} value
 */
google.picker.PickerBuilder.prototype.setCallback = function(value) {};
/**
 * @param {!google.picker.View} view
 */
google.picker.PickerBuilder.prototype.addView = function(view) {};
google.picker.PickerBuilder.prototype.build = function() {};

/**
 * @constructor
 */
google.picker.Picker = function() {};

/**
 * @param {boolean} value
 */
google.picker.Picker.prototype.setVisible = function(value) {};
