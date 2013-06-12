/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event class enumeration.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.data.formats.BinaryCalls');
goog.provide('wtf.data.formats.BinaryTrace');
goog.provide('wtf.data.formats.ChunkedFileFormat');
goog.provide('wtf.data.formats.FileFlags');
goog.provide('wtf.data.formats.JsonTrace');


/**
 * Current version of the binary file format.
 * @type {number}
 * @const
 */
wtf.data.formats.BinaryTrace.VERSION = 3;


/**
 * Current version of the JSON file format.
 * @type {number}
 * @const
 */
wtf.data.formats.JsonTrace.VERSION = 2;


/**
 * Current version of the JSON file format.
 * @type {number}
 * @const
 */
wtf.data.formats.ChunkedFileFormat.VERSION = 10;


/**
 * Current version of the calls file format.
 * @type {number}
 * @const
 */
wtf.data.formats.BinaryCalls.VERSION = 1;


/**
 * Trace file header flags bitmask values.
 * @enum {number}
 */
wtf.data.formats.FileFlags = {
  /**
   * Indicates that the times in the file are 'high resolution'.
   * This is the value of {@see wtf#hasHighResolutionTimes}.
   */
  HAS_HIGH_RESOLUTION_TIMES: (1 << 0),

  /**
   * Indicates that times in the file are actually counts.
   */
  TIMES_AS_COUNT: (1 << 1)
};


/**
 * Converts a file flags bitmask to a list of string values.
 * This can be decoded by {@see wtf.data.formats.FileFlags#fromStrings}.
 * @param {number} value Flags bitmask.
 * @return {!Array.<string>} An array of file flags strings.
 */
wtf.data.formats.FileFlags.toStrings = function(value) {
  var result = [];
  if (value & wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES) {
    result.push('has_high_resolution_times');
  }
  if (value & wtf.data.formats.FileFlags.TIMES_AS_COUNT) {
    result.push('times_as_count');
  }
  return result;
};


/**
 * Converts a list of string values into a flags bitmask.
 * @param {!Array.<string>} value List of strings values.
 * @return {number} Flags bitmask.
 */
wtf.data.formats.FileFlags.fromStrings = function(value) {
  var result = 0;
  for (var n = 0; n < value.length; n++) {
    switch (value[n]) {
      case 'has_high_resolution_times':
        result |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES;
        break;
      case 'times_as_count':
        result |= wtf.data.formats.FileFlags.TIMES_AS_COUNT;
        break;
    }
  }
  return result;
};
