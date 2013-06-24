/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Snapshotting recording session instance.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.sessions.SnapshottingSession');

goog.require('wtf.io.BufferView');
goog.require('wtf.io.cff.chunks.EventDataChunk');
goog.require('wtf.io.cff.chunks.FileHeaderChunk');
goog.require('wtf.trace.Session');



/**
 * Snapshotting session implementation.
 * Stores data in a ring-buffer to enable snapshots.
 * Buffers are overwritten until a snapshot request is received and each buffer
 * is written in chronological order.
 *
 * In order to keep things sane for now if a snapshot is writing then no new
 * events are recorded.
 * TODO(benvanik): allow for event writes while snapshotting (for frequent
 *     snapshots without discontinuities)
 *
 * @param {!wtf.trace.TraceManager} traceManager Trace manager.
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Session}
 */
wtf.trace.sessions.SnapshottingSession = function(traceManager, options) {
  goog.base(this, traceManager, options,
      wtf.trace.sessions.SnapshottingSession.DEFAULT_BUFFER_SIZE_);

  // Determine the number of buffers to use.
  // Never go over the maximum memory usage.
  var bufferCount = Math.max(1, Math.floor(
      this.maximumMemoryUsage / this.bufferSize));

  /**
   * Whether to reset the buffers when a snapshot is taken.
   * @type {boolean}
   * @private
   */
  this.resetOnSnapshot_ = options.getBoolean(
      'wtf.trace.snapshotting.resetOnSnapshot', false);

  /**
   * Primary buffer storage chunks.
   * Each chunk is initialized on demand up to the maximum number of buffers
   * set by the user. We use chunks as the primary unit of storage to make it
   * easier to track resources, buffer start/end time, etc.
   * When we save snapshots we use these chunks directly in the CFF to produce
   * the final output.
   * @type {!Array.<wtf.io.cff.chunks.EventDataChunk>}
   * @private
   */
  this.chunks_ = new Array(bufferCount);

  /**
   * A 1:1 mapping to the {@see #chunks_} array indicating which chunks are
   * dirtied.
   * @type {!Array.<boolean>}
   * @private
   */
  this.dirtyChunks_ = new Array(bufferCount);

  // Prep the storage arrays.
  // Note that we allocate on demand, so this doesn't create actual chunks.
  for (var n = 0; n < bufferCount; n++) {
    this.chunks_[n] = null;
    this.dirtyChunks_[n] = false;
  }

  /**
   * An index to the next buffer to use in the buffer list.
   * @type {number}
   * @private
   */
  this.nextChunkIndex_ = 0;

  // Start session.
  this.startInternal();
};
goog.inherits(wtf.trace.sessions.SnapshottingSession, wtf.trace.Session);


/**
 * @override
 */
wtf.trace.sessions.SnapshottingSession.prototype.disposeInternal = function() {
  // Try to free the chunks ASAP.
  this.chunks_ = [];

  goog.base(this, 'disposeInternal');
};


/**
 * Default size for individual buffers.
 * @const
 * @type {number}
 * @private
 */
wtf.trace.sessions.SnapshottingSession.DEFAULT_BUFFER_SIZE_ = 1024 * 1024;


/**
 * Size of the snapshot initialization data buffer.
 * @const
 * @type {number}
 * @private
 */
wtf.trace.sessions.SnapshottingSession.SNAPSHOT_INIT_BUFFER_SIZE_ = 512 * 1024;


/**
 * Resets the session buffers to clear them.
 * Calls to this are ignored if there are pending writes.
 */
wtf.trace.sessions.SnapshottingSession.prototype.reset = function() {
  for (var n = 0; n < this.chunks_.length; n++) {
    if (this.chunks_[n]) {
      this.chunks_[n].reset();
    }
    this.dirtyChunks_[n] = false;
  }
};


/**
 * Writes a snapshot of the current state.
 * @param {!wtf.io.cff.StreamTarget} streamTarget Stream target.
 * @return {boolean} True if a snapshot was written.
 * @template T
 */
wtf.trace.sessions.SnapshottingSession.prototype.snapshot =
    function(streamTarget) {
  // TODO(benvanik): write a snapshot event?

  // Retire the current buffer to ensure all data is ready for writing.
  var originalChunk = this.currentChunk;
  if (this.currentChunk) {
    this.retireChunk(this.currentChunk);
    this.currentChunk = null;
  }

  // Begin the stream by writing headers/init data.
  this.beginWriteSnapshot_(streamTarget);

  // Write all dirtied buffers.
  this.writeEventData_(streamTarget);

  // End the stream.
  this.endWriteSnapshot_(streamTarget);

  // Re-acquire the original buffer at its location - this is a bit tricky but
  // prevents scrolling buffers each snapshot by wasting the remaining buffer
  // space.
  this.currentChunk = originalChunk;

  return true;
};


/**
 * Begins writing snapshot data to the given stream target.
 * @param {!wtf.io.cff.StreamTarget} streamTarget Stream target.
 * @private
 */
wtf.trace.sessions.SnapshottingSession.prototype.beginWriteSnapshot_ =
    function(streamTarget) {
  // Write out the file header (context info/metadata/etc).
  var fileHeaderChunk = new wtf.io.cff.chunks.FileHeaderChunk();
  fileHeaderChunk.init();
  streamTarget.writeChunk(fileHeaderChunk);

  // Create a temporary chunk for the zones/event definitions/etc.
  // This is nasty, but snapshots should be infrequent.
  // TODO(benvanik): just use the next buffer? May mess up reuse.
  var snapshotDataChunk = new wtf.io.cff.chunks.EventDataChunk();
  snapshotDataChunk.init(
      wtf.trace.sessions.SnapshottingSession.SNAPSHOT_INIT_BUFFER_SIZE_);

  // Log out zones and event definitions.
  var traceManager = this.getTraceManager();
  traceManager.writeEventHeader(
      snapshotDataChunk.getBinaryBuffer(), false);
  traceManager.appendAllZones(
      snapshotDataChunk.getBinaryBuffer());

  // Log out discontinuity event.
  // TODO(benvnaik): figure out the correct time to use here.
  //wtf.trace.BuiltinEvents.discontinuity(wtf.timebase(), buffer);

  streamTarget.writeChunk(snapshotDataChunk);
};


/**
 * Writes all diritied buffers to the stream target and resets their state.
 * @param {!wtf.io.cff.StreamTarget} streamTarget Stream target.
 * @private
 */
wtf.trace.sessions.SnapshottingSession.prototype.writeEventData_ =
    function(streamTarget) {
  // Write each dirtied buffer in order and reset them.
  // Start at the buffer immediately after the last one returned for writing and
  // walk until all the way around only writing buffers marked dirty.
  for (var n = 0; n < this.chunks_.length; n++) {
    var index = (this.nextChunkIndex_ + n) % this.chunks_.length;
    var chunk = this.chunks_[index];
    if (!chunk) {
      continue;
    }
    var bufferView = chunk.getBinaryBuffer();

    // Ignore buffer if it is not dirty or empty.
    var dirty = this.dirtyChunks_[index];
    if (this.resetOnSnapshot_) {
      this.dirtyChunks_[index] = false;
    }
    if (!dirty || !bufferView.offset) {
      continue;
    }

    streamTarget.writeChunk(chunk);
  }
};


/**
 * Completes writing the snapshot data.
 * @param {!wtf.io.cff.StreamTarget} streamTarget Stream target.
 * @private
 */
wtf.trace.sessions.SnapshottingSession.prototype.endWriteSnapshot_ =
    function(streamTarget) {
  streamTarget.end();
};


/**
 * @override
 */
wtf.trace.sessions.SnapshottingSession.prototype.nextChunk = function() {
  // Grab the next buffer.
  // Note that we allocate on demand, so it may not be created yet.
  var chunk = this.chunks_[this.nextChunkIndex_];
  if (!chunk) {
    chunk = new wtf.io.cff.chunks.EventDataChunk();
    chunk.init(this.bufferSize);
    this.chunks_[this.nextChunkIndex_] = chunk;
  }
  var bufferView = chunk.getBinaryBuffer();

  // Mark it as undirty and reset, as it's being reused.
  this.dirtyChunks_[this.nextChunkIndex_] = false;
  wtf.io.BufferView.reset(bufferView);

  this.nextChunkIndex_ = (this.nextChunkIndex_ + 1) % this.chunks_.length;
  return chunk;
};


/**
 * @override
 */
wtf.trace.sessions.SnapshottingSession.prototype.retireChunk = function(chunk) {
  // Mark the buffer as used. Guess based on normal flow.
  var chunkIndex = this.nextChunkIndex_ - 1;
  if (chunkIndex < 0) {
    chunkIndex = this.chunks_.length + chunkIndex;
  }
  this.dirtyChunks_[chunkIndex] = true;
};
