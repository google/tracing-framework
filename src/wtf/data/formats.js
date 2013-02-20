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
