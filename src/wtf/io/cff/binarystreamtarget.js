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
goog.require('wtf.io.Blob');
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
  var header = new Uint32Array(3);
  header[0] = 0xDEADBEEF;
  header[1] = wtf.version.getValue();
  header[2] = wtf.data.formats.ChunkedFileFormat.VERSION;
  transport.write(header);
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
    } else if (wtf.io.Blob.isBlob(blobData)) {
      partLength = blobData.getSize();
    } else if (goog.global['Blob'] && blobData instanceof Blob) {
      partLength = blobData.size;
    } else if (typeof blobData == 'string') {
      // Get the size by packing into a blob.
      blobData = wtf.io.Blob.create([blobData]);
      partLength = blobData.getSize();
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
  var header = new Uint32Array(headerByteLength / 4);
  var o = 0;
  header[o++] = chunk.getId();
  header[o++] = wtf.io.cff.ChunkType.toInteger(chunk.getType());
  header[o++] = headerByteLength + totalLength;
  header[o++] = chunk.getStartTime();
  header[o++] = chunk.getEndTime();
  header[o++] = parts.length;
  for (var n = 0; n < parts.length; n++) {
    var part = parts[n];
    header[o++] = wtf.io.cff.PartType.toInteger(part.getType());
    header[o++] = partOffsets[n];
    header[o++] = partLengths[n];
  }
  blobParts.unshift(header.buffer);
  totalLength += headerByteLength;

  // If the chunk length is not 4b aligned, pad it.
  if (totalLength % 4) {
    var padLength = 4 - (totalLength % 4);
    blobParts.push(new Uint8Array(padLength));
    totalLength += padLength;
  }

  // Concat all the parts together.
  var blob = wtf.io.Blob.create(blobParts);
  transport.write(blob);
};


/**
 * @override
 */
wtf.io.cff.BinaryStreamTarget.prototype.end = function() {
  // TODO(benvanik): add a footer here? May be nice to have total chunk count
  //     or a chunk table/etc to help loaders.
};
