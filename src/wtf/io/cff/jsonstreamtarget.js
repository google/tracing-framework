/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview JSON stream target.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.JsonStreamTarget');

goog.require('goog.asserts');
goog.require('wtf.data.formats.ChunkedFileFormat');
goog.require('wtf.io.cff.Chunk');
goog.require('wtf.io.cff.StreamTarget');
goog.require('wtf.version');



/**
 * JSON stream target.
 * @param {!wtf.io.WriteTransport} transport Write transport.
 * @param {wtf.io.cff.JsonStreamTarget.Mode=} opt_mode Serialization mode.
 *     Defaults to {@see wtf.io.cff.JsonStreamTarget.Mode.COMPLETE}.
 * @constructor
 * @extends {wtf.io.cff.StreamTarget}
 */
wtf.io.cff.JsonStreamTarget = function(transport, opt_mode) {
  goog.base(this, transport);

  /**
   * JSON serialization mode.
   * Determines if we are writing a complete JSON document or partial bits.
   * @type {wtf.io.cff.JsonStreamTarget.Mode}
   * @private
   */
  this.mode_ = goog.isDef(opt_mode) ?
      opt_mode : wtf.io.cff.JsonStreamTarget.Mode.COMPLETE;

  /**
   * Whether any chunks have been written yet.
   * @type {boolean}
   * @private
   */
  this.hasWrittenAny_ = false;

  // Write out the header.
  var headerFields = [
    '"wtfVersion": ' + wtf.version.getValue(),
    '"formatVersion": ' + wtf.data.formats.ChunkedFileFormat.VERSION
  ].join(',\n  ');
  var jsonHeader;
  switch (this.mode_) {
    case wtf.io.cff.JsonStreamTarget.Mode.COMPLETE:
      jsonHeader = '{\n  ' + headerFields + ',\n  "chunks": [';
      break;
    case wtf.io.cff.JsonStreamTarget.Mode.PARTIAL:
      jsonHeader = '{\n  ' + headerFields + '\n}\n';
      break;
  }
  goog.asserts.assert(jsonHeader);
  transport.write(jsonHeader);
};
goog.inherits(wtf.io.cff.JsonStreamTarget, wtf.io.cff.StreamTarget);


/**
 * JSON formatting mode.
 * @enum {string}
 */
wtf.io.cff.JsonStreamTarget.Mode = {
  /**
   * A JSON string will be built over each chunk write and appended to the
   * transport. The resulting JSON will not be well-formed (no terminator) until
   * the target is ended with {@see wtf.io.cff.JsonStreamTarget#end}.
   *
   * <code>
   * {
   *   "wtf_version": wtf.version.getValue(),
   *   "format_version": wtf.data.formats.ChunkedFileFormat.VERSION,
   *   "chunks": [
   *     { chunk 0 },
   *     { chunk 1 },
   *     { chunk N }
   *   ]
   * }
   * </code>
   */
  COMPLETE: 'complete',

  /**
   * Each chunk is written as a standalone JSON string that can be loaded on
   * its own.
   *
   * <code>
   * // File header write:
   * {
   *   "wtf_version": wtf.version.getValue(),
   *   "format_version": wtf.data.formats.ChunkedFileFormat.VERSION,
   * }
   *
   * // For each subsequent chunk write:
   * { single chunk data }
   * </code>
   */
  PARTIAL: 'partial'
};


/**
 * @override
 */
wtf.io.cff.JsonStreamTarget.prototype.writeChunk = function(chunk) {
  var transport = this.getTransport();

  // Setup chunk header.
  var chunkObject = {
    'id': chunk.getId(),
    'type': chunk.getType()
  };
  if (chunk.getStartTime() != wtf.io.cff.Chunk.INVALID_TIME) {
    chunkObject['startTime'] = chunk.getStartTime() | 0;
  }
  if (chunk.getEndTime() != wtf.io.cff.Chunk.INVALID_TIME) {
    chunkObject['endTime'] = chunk.getEndTime() | 0;
  }

  // Add parts.
  var parts = chunk.getParts();
  var partObjects = new Array(parts.length);
  for (var n = 0; n < parts.length; n++) {
    partObjects[n] = parts[n].toJsonObject();
  }
  chunkObject['parts'] = partObjects;

  var result = goog.global.JSON.stringify(chunkObject);
  switch (this.mode_) {
    case wtf.io.cff.JsonStreamTarget.Mode.COMPLETE:
      // Write with a leading comma if we need to.
      transport.write(
          (this.hasWrittenAny_ ? ',\n    ' : '\n    ') + result);
      break;
    case wtf.io.cff.JsonStreamTarget.Mode.PARTIAL:
      // Write entire result - with just a newline to prevent editors from
      // crashing on load.
      transport.write('{"chunks": [' + result + ']}\n');
      break;
  }
  this.hasWrittenAny_ = true;
};


/**
 * @override
 */
wtf.io.cff.JsonStreamTarget.prototype.end = function() {
  var transport = this.getTransport();

  // No-op if partial, otherwise we have to terminate the JSON array/object.
  switch (this.mode_) {
    case wtf.io.cff.JsonStreamTarget.Mode.COMPLETE:
      transport.write('\n  ]\n}');
      break;
  }
};
