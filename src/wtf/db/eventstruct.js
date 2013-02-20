/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event struct.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.EventStruct');


/**
 * Event struct offsets (in uint32s).
 * @enum {number}
 */
wtf.db.EventStruct = {
  /**
   * ID of the event in the database. This, today, is its position.
   */
  ID: 0,

  /**
   * Event type ID.
   * Retrieve the {@see wtf.db.EventType} via the {@see wtf.db.EventTypeTable}.
   */
  TYPE: 1,

  /**
   * Parent event ID or 0 if at the root.
   */
  PARENT: 2,

  /**
   * Event depth, where 0 is at the root.
   */
  DEPTH: 3,

  /**
   * Time of the event.
   * If this is a scope then this is the enter time.
   */
  TIME: 4,

  /**
   * End time.
   * Used by scopes only. If this is zero the event is an instance.
   */
  END_TIME: 5,

  /**
   * Next sibling in the parent scope or 0 if at the end.
   */
  NEXT_SIBLING: 6,

  /**
   * Arguments data ID or 0 if none.
   */
  ARGUMENTS: 7,

  /**
   * Used by the application for rendering/etc.
   */
  TAG: 8,

  /**
   * Total time in all descendants spent in system time.
   */
  SYSTEM_TIME: 9,

  /**
   * Total time of all immediate children.
   */
  CHILD_TIME: 10,

  /**
   * Event size, in uint32s.
   */
  STRUCT_SIZE: 11
};
