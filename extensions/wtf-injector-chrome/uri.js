/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview URI utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


/**
 * URI utilities.
 * @constructor
 */
var URI = function() {};


/**
 * Douglas Crockford's URL regex from JavaScript: The Good Parts (modified to
 * support ipv6 address host names).
 * @const
 * @type {RegExp}
 * @private
 */
URI.regex_ = /^(?:([A-Za-z-]+):)?(\/{0,3})([0-9.\-A-Za-z]+|\[[:0-9A-Za-z]+\])(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;


/**
 * Parses a URI into its parts.
 * @param {string} value URI value.
 * @return {!{
 *   uri: string,
 *   scheme: string,
 *   slash: string,
 *   host: string,
 *   port: string,
 *   path: string,
 *   query: string,
 *   hash: string
 * }}
 */
URI.parse = function(value) {
  var result = URI.regex_.exec(value);
  return {
    uri: result[0],
    scheme: result[1] || '',
    host: result[3] || '',
    port: result[4] || '',
    path: '/' + (result[5] || ''),
    query: result[6] || '',
    hash: result[7] || ''
  };
};


/**
 * Canonicalizes a URI by stripping ?queries and #hashes.
 * @param {string} value URI value.
 * @return {string} Canonical URI.
 */
URI.canonicalize = function(value) {
  var lastIndex;
  lastIndex = value.indexOf('?');
  if (lastIndex != -1) {
    value = value.substring(0, lastIndex);
  }
  lastIndex = value.indexOf('#');
  if (lastIndex != -1) {
    value = value.substring(0, lastIndex);
  }
  // Strip off anything after a @. This is risky, but required for maps.
  // Worst case we include too much (if you did foo.com/@abc/unique), but
  // whatever.
  lastIndex = value.indexOf('@');
  if (lastIndex != -1) {
    value = value.substring(0, lastIndex);
  }
  return value;
};
