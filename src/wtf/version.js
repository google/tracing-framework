/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WTF version utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.version');

goog.require('goog.string');


/**
 * Gets the current build number as an integer value.
 * This can be used to compare two build numbers using normal integer
 * comparison. If you need a human-readable build number, use {@see #toString}.
 * @return {number} Build number, as an integer.
 */
wtf.version.getBuild = function() {
  // TODO(benvanik): get this from the current build date? or update-version.sh?
  return 1355734800000;
};


/**
 * Gets the version as a human-readable string that matches the version string
 * used elsewhere, such as {@code 2012.12.12.2}.
 * @return {string} Version string.
 */
wtf.version.toString = function() {
  var dt = new Date(wtf.version.getBuild());
  return dt.getFullYear() + '.' +
      goog.string.padNumber(dt.getMonth() + 1, 2) + '.' +
      goog.string.padNumber(dt.getDate(), 2) + '.' +
      goog.string.padNumber(dt.getHours(), 1);
};


goog.exportSymbol(
    'wtf.version.getBuild',
    wtf.version.getBuild);
goog.exportSymbol(
    'wtf.version.toString',
    wtf.version.toString);
