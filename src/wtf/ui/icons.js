/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Icon utilities.
 * The helper methods in this namespace can be used to setup DOM elements
 * with standard icons from the icon set. It allows for spriting and other
 * features, as well as the embedding of icon data into the javascript.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.icons');

goog.require('goog.string');


/**
 * Icon data cache, by URI.
 * @type {!Object.<string>}
 * @private
 */
wtf.ui.icons.cache_ = {};


/**
 * Gets icon data from the cache, if it exists.
 * @param {string} uri Icon URI.
 * @return {?string} Icon data, if found.
 */
wtf.ui.icons.getIconData = function(uri) {
  return wtf.ui.icons.cache_[uri] || null;
};


/**
 * Sets the icon data cache value for the given URI.
 * @param {string} uri Icon URI.
 * @param {string} value Icon data.
 */
wtf.ui.icons.setIconData = function(uri, value) {
  wtf.ui.icons.cache_[uri] = value;
};


/**
 * Makes the given DOM element an icon with the data from the given URI.
 * The URI can be a URL, in which case it should be root path relative
 * (no '..'s, canonical form, or a data: URI.
 *
 * @param {!HTMLImageElement} img HTML image element to make into an icon.
 * @param {string} uri Icon URI.
 */
wtf.ui.icons.makeIcon = function(img, uri) {
  var value = uri;
  if (!goog.string.startsWith(uri, 'data:')) {
    var data = wtf.ui.icons.getIconData(uri);
    if (data) {
      value = data;
    }
  }
  img.src = value;
};


goog.exportSymbol(
    'wtf.ui.icons.setIconData',
    wtf.ui.icons.setIconData);
