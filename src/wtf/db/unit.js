/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Measurement unit.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.Unit');

goog.require('goog.asserts');
goog.require('wtf.util');


/**
 * The unit of measure of values in the database.
 * @enum {number}
 */
wtf.db.Unit = {
  /**
   * Each unit value is 1 millisecond.
   */
  TIME_MILLISECONDS: 0,

  /**
   * Each unit value is 1000 bytes.
   */
  SIZE_KILOBYTES: 1,

  /**
   * Each unit value is a count.
   */
  COUNT: 2
};


/**
 * Gets the unit type from a string value.
 * This will fallback to returning microseconds if the value cannot be parsed,
 * as they are generally still usable.
 * @param {string?} value String value.
 * @return {wtf.db.Unit} Parsed unit value.
 */
wtf.db.Unit.parse = function(value) {
  // Default value is time.
  if (!value || !value.length) {
    return wtf.db.Unit.TIME_MILLISECONDS;
  }

  switch (value) {
    case 'microseconds':
      return wtf.db.Unit.TIME_MILLISECONDS;
    case 'bytes':
      return wtf.db.Unit.SIZE_KILOBYTES;
    case 'count':
      return wtf.db.Unit.COUNT;
  }

  // Shouldn't get here - may really be unknown.
  goog.asserts.fail('Unknown unit type: ' + value);
  return wtf.db.Unit.TIME_MILLISECONDS;
};


/**
 * Formats a value to a human-readable string.
 * @param {number} value Value.
 * @param {wtf.db.Unit} units Value units.
 * @param {boolean=} opt_small Prefer a smaller display value, if possible.
 * @return {string} Human-readable string value.
 */
wtf.db.Unit.format = function(value, units, opt_small) {
  // TODO(benvanik): more modes? LONG/MEDIUM/SMALL?
  if (units == wtf.db.Unit.TIME_MILLISECONDS) {
    return opt_small ?
        wtf.util.formatSmallTime(value) : wtf.util.formatTime(value);
  } else if (units == wtf.db.Unit.SIZE_KILOBYTES) {
    var places = opt_small ? 0 : 3;
    value = Math.round(value * 1000);
    if (value == 0) {
      return '0b';
    } else if (value < 1024) {
      return value + 'b';
    } else if (value < 1024 * 1024) {
      return (value / 1024).toFixed(places) + 'kb';
    } else {
      return (value / (1024 * 1024)).toFixed(places) + 'mb';
    }
  } else if (units == wtf.db.Unit.COUNT) {
    var places = opt_small ? 0 : 3;
    value = Math.round(value * 1000);
    if (value == 0) {
      return '0';
    } else if (value < 1000) {
      return String(value);
    } else if (value < 1000 * 1000) {
      return (value / 1000).toFixed(places) + 'k';
    } else {
      return (value / (1000 * 1000)).toFixed(places) + 'm';
    }
  }
  return String(value);
};
