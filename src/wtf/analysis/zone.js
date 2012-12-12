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
   * @private
   */
  this.name_ = name;

  /**
   * Zone type.
   * May be one of {@see wtf.data.ZoneType} or a custom value.
   * @type {string}
   * @private
   */
  this.type_ = type;

  /**
   * Zone location (such as URI of the script).
   * @type {string}
   * @private
   */
  this.location_ = location;
};


/**
 * Gets a string representation of the zone.
 * @return {string} String representation of the zone.
 */
wtf.analysis.Zone.prototype.toString = function() {
  return this.name_;
};


/**
 * Gets the name of the zone.
 * @return {string} Human-readable zone name.
 */
wtf.analysis.Zone.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets the type of the zone.
 * @return {string} One of {@see wtf.data.ZoneType} or a custom value.
 */
wtf.analysis.Zone.prototype.getType = function() {
  return this.type_;
};


/**
 * Gets the zone location (such as URI of the script).
 * @return {string} Zone location.
 */
wtf.analysis.Zone.prototype.getLocation = function() {
  return this.location_;
};


goog.exportSymbol(
    'wtf.analysis.Zone',
    wtf.analysis.Zone);
goog.exportProperty(
    wtf.analysis.Zone.prototype, 'toString',
    wtf.analysis.Zone.prototype.toString);
goog.exportProperty(
    wtf.analysis.Zone.prototype, 'getName',
    wtf.analysis.Zone.prototype.getName);
goog.exportProperty(
    wtf.analysis.Zone.prototype, 'getType',
    wtf.analysis.Zone.prototype.getType);
goog.exportProperty(
    wtf.analysis.Zone.prototype, 'getLocation',
    wtf.analysis.Zone.prototype.getLocation);
