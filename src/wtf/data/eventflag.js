/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event flag enumeration.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.data.EventFlag');


/**
 * Event behavior flag bitmask.
 * Values can be ORed together to indicate different behaviors an event has.
 *
 * NOTE: the database currently stores this as a 16bit value. Don't use more!
 *
 * @enum {number}
 */
wtf.data.EventFlag = {
  /**
   * Event is expected to occur at a very high frequency.
   * High frequency events will be optimized for size more than other event
   * types. Event arguments may also receive more preprocessing when being
   * recorded, such as string interning/etc.
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
   * If an event has this flag then it will never be shown in the UI and most
   * parts of the system will ignore it. For some special events they will be
   * handled at load-time and never even delivered to the database.
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
   * Only events defined by the tracing framework should set this bit. User
   * events should not have this flag set and may be ignored if they do.
   */
  BUILTIN: (1 << 5),

  /**
   * Event arguments will be appended to the given flow's data, overwritting
   * any with the same name. The first argument must be a flow ID named
   * 'id' like 'flowId id'.
   *
   * If this is combined with the INTERNAL flag then the event is assumed to
   * be a built-in system append event and will have special handling.
   */
  APPEND_FLOW_DATA: (1 << 6)
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
goog.exportProperty(
    wtf.data.EventFlag, 'APPEND_FLOW_DATA',
    wtf.data.EventFlag.APPEND_FLOW_DATA);
