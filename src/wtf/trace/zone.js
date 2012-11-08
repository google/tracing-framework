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

goog.provide('wtf.trace.Zone');



/**
 * Zone tracking utility.
 *
 * @param {number} zoneId Zone ID.
 * @param {number} timestamp Time the zone was created.
 * @param {string} name Zone name.
 * @param {string|wtf.data.ZoneType} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @constructor
 */
wtf.trace.Zone = function(zoneId, timestamp, name, type, location) {
  /**
   * Zone ID.
   * @type {number}
   */
  this.id = zoneId;

  /**
   * Time the zone was created.
   * @type {number}
   */
  this.timestamp = timestamp;

  /**
   * Human-readable zone name.
   * @type {string}
   */
  this.name = name;

  /**
   * Zone type.
   * May be one of {@see wtf.data.ZoneType} or a custom value.
   * @type {string|wtf.data.ZoneType}
   */
  this.type = type;

  /**
   * Zone location (such as URI of the script).
   * @type {string}
   */
  this.location = location;
};
