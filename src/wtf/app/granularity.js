/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Granularity utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.Granularity');


/**
 * Useful time granularities, in ms.
 * @enum {number}
 */
wtf.app.Granularity = {
  /** s */
  SECOND: 1000,
  /** ds */
  DECISECOND: 100,
  /** cs */
  CENTISECOND: 10,
  /** ms */
  MILLISECOND: 1,

  // TODO(benvanik): make this a setting on the summary index instead?
  /**
   * The finest granularity to work with.
   */
  FINEST: 100
};
