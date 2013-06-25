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

goog.provide('wtf.db.ArgumentData');
goog.provide('wtf.db.EventStruct');


/**
 * Argument data storage.
 * A simple key-value map with argument names and values.
 * @typedef {Object}
 */
wtf.db.ArgumentData;


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
   * Event type ID and type flags.
   * Retrieve the {@see wtf.db.EventType} via the {@see wtf.db.EventTypeTable}.
   * The flags are in the upper 16bits, the ID is in the lower.
   * <code>
   * var typeId = data[TYPE] & 0xFFFF;
   * var flags = data[TYPE] >>> 16;
   * </code>
   */
  TYPE: 1,

  /**
   * Parent event ID or 0 if at the root.
   */
  PARENT: 2,

  /**
   * Event depth, where 0 is at the root, and a max descendant depth.
   * The depth is in the lower 16 bits and the max descendant depth is in the
   * upper.
   * <code>
   * var depth = data[DEPTH] & 0xFFFF;
   * var descendantDepth = data[DEPTH] >>> 16;
   * </code>
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
