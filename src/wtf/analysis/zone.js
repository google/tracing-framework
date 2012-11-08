/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Zone tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.Zone');



/**
 * Zone tracking utility.
 *
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @constructor
 */
wtf.analysis.Zone = function(name, type, location) {
  /**
   * Human-readable zone name.
   * @type {string}
   */
  this.name = name;

  /**
   * Zone type.
   * May be one of {@see wtf.data.ZoneType} or a custom value.
   * @type {string}
   */
  this.type = type;

  /**
   * Zone location (such as URI of the script).
   * @type {string}
   */
  this.location = location;
};


/**
 * Gets a string representation of the zone.
 * @return {string} String representation of the zone.
 */
wtf.analysis.Zone.prototype.toString = function() {
  return this.name;
};
