/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WTF version utilities.
 * The versions set in this file come from {@code scripts/update-version.sh} and
 * should not be set manually.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.version');


/**
 * Gets the current build number as an integer value.
 * This can be used to compare two build numbers using normal integer
 * comparison. If you need a human-readable build number, use {@see #toString}.
 * @return {number} Build number, as an integer.
 */
wtf.version.getBuild = function() {
  return 1355907600000; /* set via update-version.sh */
};


/**
 * Gets the version as a human-readable string that matches the version string
 * used elsewhere, such as {@code 2012.12.12-2}.
 * @return {string} Version string.
 */
wtf.version.toString = function() {
  return '2012.12.19-1'; /* set via update-version.sh */
};


goog.exportSymbol(
    'wtf.version.getBuild',
    wtf.version.getBuild);
goog.exportSymbol(
    'wtf.version.toString',
    wtf.version.toString);
