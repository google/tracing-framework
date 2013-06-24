/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chunk part type IDs.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.PartType');

goog.require('goog.asserts');


/**
 * Chunk part type ID.
 * Must be kept in sync with {@see wtf.io.cff.IntegerPartType_}.
 * @enum {string}
 */
wtf.io.cff.PartType = {
  /** {@see wtf.io.cff.parts.FileHeaderPart} */
  FILE_HEADER: 'file_header',
  /** {@see wtf.io.cff.parts.JsonEventBufferPart} */
  JSON_EVENT_BUFFER: 'json_event_buffer',
  /** {@see wtf.io.cff.parts.LegacyEventBufferPart} */
  LEGACY_EVENT_BUFFER: 'legacy_event_buffer',
  /** {@see wtf.io.cff.parts.BinaryEventBufferPart} */
  BINARY_EVENT_BUFFER: 'binary_event_buffer',
  /** {@see wtf.io.cff.parts.StringTablePart} */
  STRING_TABLE: 'string_table',
  /** {@see wtf.io.cff.parts.BinaryResourcePart} */
  BINARY_RESOURCE: 'binary_resource',
  /** {@see wtf.io.cff.parts.StringResourcePart} */
  STRING_RESOURCE: 'string_resource',

  UNKNOWN: 'unknown_type'
};


/**
 * Checks whether the given part type is valid/known.
 * @param {string|wtf.io.cff.PartType} value Part type value.
 * @return {boolean} True if the type is valid.
 */
wtf.io.cff.PartType.isValid = function(value) {
  switch (value) {
    case wtf.io.cff.PartType.FILE_HEADER:
    case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
    case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
    case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
    case wtf.io.cff.PartType.STRING_TABLE:
    case wtf.io.cff.PartType.BINARY_RESOURCE:
    case wtf.io.cff.PartType.STRING_RESOURCE:
      return true;
  }
  return false;
};


/**
 * Chunk part type ID values in numeric form.
 * Must be kept in sync with {@see wtf.io.cff.PartType}.
 * @enum {number}
 * @private
 */
wtf.io.cff.IntegerPartType_ = {
  FILE_HEADER: 0x10000,
  JSON_EVENT_BUFFER: 0x20000,
  LEGACY_EVENT_BUFFER: 0x20001,
  BINARY_EVENT_BUFFER: 0x20002,
  STRING_TABLE: 0x30000,
  BINARY_RESOURCE: 0x40000,
  STRING_RESOURCE: 0x40001,

  UNKNOWN: -1
};


/**
 * Converts a chunk type enum value to an integer value.
 * @param {wtf.io.cff.PartType} value Part type enum value.
 * @return {number} Integer value.
 */
wtf.io.cff.PartType.toInteger = function(value) {
  switch (value) {
    case wtf.io.cff.PartType.FILE_HEADER:
      return wtf.io.cff.IntegerPartType_.FILE_HEADER;
    case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
      return wtf.io.cff.IntegerPartType_.JSON_EVENT_BUFFER;
    case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
      return wtf.io.cff.IntegerPartType_.LEGACY_EVENT_BUFFER;
    case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
      return wtf.io.cff.IntegerPartType_.BINARY_EVENT_BUFFER;
    case wtf.io.cff.PartType.STRING_TABLE:
      return wtf.io.cff.IntegerPartType_.STRING_TABLE;
    case wtf.io.cff.PartType.BINARY_RESOURCE:
      return wtf.io.cff.IntegerPartType_.BINARY_RESOURCE;
    case wtf.io.cff.PartType.STRING_RESOURCE:
      return wtf.io.cff.IntegerPartType_.STRING_RESOURCE;
    default:
      goog.asserts.fail('Unknown part type: ' + value);
      return wtf.io.cff.IntegerPartType_.UNKNOWN;
  }
};


/**
 * Converts a part type integer to an enum value.
 * @param {number} value Part type integer value.
 * @return {wtf.io.cff.PartType} Enum value.
 */
wtf.io.cff.PartType.fromInteger = function(value) {
  switch (value) {
    case wtf.io.cff.IntegerPartType_.FILE_HEADER:
      return wtf.io.cff.PartType.FILE_HEADER;
    case wtf.io.cff.IntegerPartType_.JSON_EVENT_BUFFER:
      return wtf.io.cff.PartType.JSON_EVENT_BUFFER;
    case wtf.io.cff.IntegerPartType_.LEGACY_EVENT_BUFFER:
      return wtf.io.cff.PartType.LEGACY_EVENT_BUFFER;
    case wtf.io.cff.IntegerPartType_.BINARY_EVENT_BUFFER:
      return wtf.io.cff.PartType.BINARY_EVENT_BUFFER;
    case wtf.io.cff.IntegerPartType_.STRING_TABLE:
      return wtf.io.cff.PartType.STRING_TABLE;
    case wtf.io.cff.IntegerPartType_.BINARY_RESOURCE:
      return wtf.io.cff.PartType.BINARY_RESOURCE;
    case wtf.io.cff.IntegerPartType_.STRING_RESOURCE:
      return wtf.io.cff.PartType.STRING_RESOURCE;
    default:
      goog.asserts.fail('Unknown part type: ' + value);
      return wtf.io.cff.PartType.UNKNOWN;
  }
};
