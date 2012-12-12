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


goog.exportSymbol(
    'wtf.data.EventClass',
    wtf.data.EventClass);
goog.exportProperty(
    wtf.data.EventClass, 'INSTANCE',
    wtf.data.EventClass.INSTANCE);
goog.exportProperty(
    wtf.data.EventClass, 'SCOPE',
    wtf.data.EventClass.SCOPE);


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
  HIGH_FREQUENCY: (1 << 1),

  /**
   * Event represents some system event that should not be counted towards user
   * code. This can include things such as runtime events (GCs/etc) and tracing
   * framework time (buffer swaps/etc).
   */
  SYSTEM_TIME: (1 << 2),

  /**
   * Event represents some internal system event such as flow control events.
   * These should not be shown in the UI.
   */
  INTERNAL: (1 << 3),

  /**
   * Event arguments will be appended to the containing scope's arguments,
   * overwritting any with the same name.
   *
   * If this is combined with the INTERNAL flag then the event is assumed to
   * be a built-in system append event and will have special handling.
   */
  APPEND_SCOPE_DATA: (1 << 4),

  /**
   * Event is a builtin event.
   * These may receive special handling and enable optimizations. User events
   * should not have this flag set.
   */
  BUILTIN: (1 << 5)
};


goog.exportSymbol(
    'wtf.data.EventFlag',
    wtf.data.EventFlag);
goog.exportProperty(
    wtf.data.EventFlag, 'HIGH_FREQUENCY',
    wtf.data.EventFlag.HIGH_FREQUENCY);
goog.exportProperty(
    wtf.data.EventFlag, 'SYSTEM_TIME',
    wtf.data.EventFlag.SYSTEM_TIME);
goog.exportProperty(
    wtf.data.EventFlag, 'INTERNAL',
    wtf.data.EventFlag.INTERNAL);
goog.exportProperty(
    wtf.data.EventFlag, 'APPEND_SCOPE_DATA',
    wtf.data.EventFlag.APPEND_SCOPE_DATA);
goog.exportProperty(
    wtf.data.EventFlag, 'BUILTIN',
    wtf.data.EventFlag.BUILTIN);
