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

goog.provide('wtf.data.EventClass');
goog.provide('wtf.data.EventFlag');


/**
 * Event class.
 * Each event in the stream is typed. Events may have additional flags that
 * describe their behavior.
 * @enum {number}
 */
wtf.data.EventClass = {
  /**
   * Event indicating a single instance of something.
   */
  INSTANCE: 0,

  /**
   * Event marks scope entrace.
   * This allows for specialized events to indicate both the occurance of
   * an event and enter a scope cleanly.
   */
  SCOPE: 1
};


/**
 * Event behavior flag bitmask.
 * Values can be ORed together to indicate different behaviors an event has.
 * @enum {number}
 */
wtf.data.EventFlag = {
  /**
   * Event is expected to occur at a very high frequency.
   * High frequency events will be optimized for size more than other event
   * types.
   */
  HIGH_FREQUENCY: (1 << 1)
};
