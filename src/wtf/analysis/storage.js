/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace data storage.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.DataStream');
goog.provide('wtf.analysis.Storage');

goog.require('goog.Disposable');
goog.require('wtf.io.CopyReadStream');
goog.require('wtf.io.MemoryWriteStream');



/**
 * Trace data storage.
 * This contains copies of all data streams and can be used for quickly
 * saving the data off.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.Storage = function() {
  goog.base(this);

  /**
   * All active streams.
   * @type {!Array.<!wtf.io.WriteStream>}
   * @private
   */
  this.allStreams_ = [];
};
goog.inherits(wtf.analysis.Storage, goog.Disposable);


// TODO(benvanik): track stream type
/**
 * Captures a read stream and begins copying data into the storage container.
 * @param {!wtf.io.ReadStream} sourceStream Source read stream.
 * @return {!wtf.io.ReadStream} Wrapped read stream.
 */
wtf.analysis.Storage.prototype.captureStream = function(sourceStream) {
  // TODO(benvanik): create a filesystem-backed streams? etc
  var targetStream = new wtf.io.MemoryWriteStream([]);
  this.allStreams_.push(targetStream);

  // TODO(benvanik): track stream closure and drop from allStreams_ list.

  var copyStream = new wtf.io.CopyReadStream(sourceStream, targetStream);
  return copyStream;
};


/**
 * @typedef {{
 *   type: string,
 *   data: !Array.<!wtf.io.ByteArray>
 * }}
 */
wtf.analysis.DataStream;


/**
 * Gets a list of all stream buffers with cloned data.
 * @return {!Array.<!wtf.analysis.DataStream>} Data buffers.
 */
wtf.analysis.Storage.prototype.snapshotDataStreamBuffers = function() {
  var dataStreams = [];
  for (var n = 0; n < this.allStreams_.length; n++) {
    var writeStream = this.allStreams_[n];
    if (writeStream instanceof wtf.io.MemoryWriteStream) {
      dataStreams.push({
        type: 'application/x-extension-wtf-trace',
        data: writeStream.getData()
      });
    }
  }
  return dataStreams;
};
