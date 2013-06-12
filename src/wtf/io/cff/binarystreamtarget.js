/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Binary stream target.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.BinaryStreamTarget');

goog.require('wtf.data.formats.ChunkedFileFormat');
goog.require('wtf.io.Buffer');
goog.require('wtf.io.cff.ChunkType');
goog.require('wtf.io.cff.PartType');
goog.require('wtf.io.cff.StreamTarget');
goog.require('wtf.version');



/**
 * Binary stream target.
 * Writes chunks in an efficient binary format to the given write transport.
 *
 * @param {!wtf.io.WriteTransport} transport Write transport.
 * @constructor
 * @extends {wtf.io.cff.StreamTarget}
 */
wtf.io.cff.BinaryStreamTarget = function(transport) {
  goog.base(this, transport);

  // Write magic header.
  var header = new wtf.io.Buffer(3 * 4);
  header.writeUint32(0xDEADBEEF);
  header.writeUint32(wtf.version.getValue());
  header.writeUint32(wtf.data.formats.ChunkedFileFormat.VERSION);
  transport.write(header.data);
};
goog.inherits(wtf.io.cff.BinaryStreamTarget, wtf.io.cff.StreamTarget);


/**
 * @override
 */
wtf.io.cff.BinaryStreamTarget.prototype.writeChunk = function(chunk) {
  var transport = this.getTransport();

  // Gather all the different blob parts together before concating at the end.
  var blobParts = [];

  // Get all part data and setup offsets/etc.
  var totalLength = 0;
  var parts = chunk.getParts();
  var partOffsets = new Array(parts.length);
  var partLengths = new Array(parts.length);
  for (var n = 0; n < parts.length; n++) {
    var blobData = parts[n].toBlobData();
    var partLength;
    if (blobData instanceof ArrayBuffer ||
        blobData.buffer instanceof ArrayBuffer) {
      partLength = blobData.byteLength;
    } else if (blobData instanceof Blob) {
      partLength = blobData.size;
    } else if (typeof blobData == 'string') {
      // Get the size by packing into a blob.
      blobData = new Blob([blobData]);
      partLength = blobData.size;
    } else {
      throw new Error('Invalid blob data type: ' + (typeof blobData));
    }
    blobParts.push(blobData);
    partOffsets[n] = totalLength;
    partLengths[n] = partLength;
    totalLength += partLength;

    // If the part length is not 4b aligned, pad it.
    if (partLength % 4) {
      var padLength = 4 - (partLength % 4);
      blobParts.push(new Uint8Array(padLength));
      totalLength += padLength;
    }
  }

  // Build the header (now that we have all the lengths/etc).
  var headerByteLength = (6 + (3 * parts.length)) * 4;
  var header = new wtf.io.Buffer(headerByteLength);
  header.writeUint32(chunk.getId());
  header.writeUint32(wtf.io.cff.ChunkType.toInteger(chunk.getType()));
  header.writeUint32(headerByteLength + totalLength);
  header.writeUint32(chunk.getStartTime());
  header.writeUint32(chunk.getEndTime());
  header.writeUint32(parts.length);
  for (var n = 0; n < parts.length; n++) {
    var part = parts[n];
    header.writeUint32(wtf.io.cff.PartType.toInteger(part.getType()));
    header.writeUint32(partOffsets[n]);
    header.writeUint32(partLengths[n]);
  }
  blobParts.unshift(header.data);
  totalLength += headerByteLength;

  // If the chunk length is not 4b aligned, pad it.
  if (totalLength % 4) {
    var padLength = 4 - (totalLength % 4);
    blobParts.push(new Uint8Array(padLength));
    totalLength += padLength;
  }

  // Concat all the parts together.
  var blob = new Blob(blobParts);
  transport.write(blob);
};


/**
 * @override
 */
wtf.io.cff.BinaryStreamTarget.prototype.end = function() {
  var transport = this.getTransport();

  // TODO(benvanik): add a footer here? May be nice to have total chunk count
  //     or a chunk table/etc to help loaders.
};
