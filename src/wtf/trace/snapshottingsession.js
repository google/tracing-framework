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

goog.provide('wtf.trace.SnapshottingSession');

goog.require('goog.asserts');
goog.require('wtf.io.Buffer');
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
wtf.trace.SnapshottingSession = function(traceManager, options) {
  goog.base(this, traceManager, options,
      wtf.trace.SnapshottingSession.DEFAULT_BUFFER_SIZE_);

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
   * A list of buffers in the queue.
   * This list is static and allocated at startup, and then index by the 'next'
   * buffer to use.
   * @type {!Array.<!wtf.io.Buffer>}
   * @private
   */
  this.buffers_ = new Array(bufferCount);

  /**
   * A 1:1 mapping to the {@see #buffers_} array indicating which buffers are
   * dirtied.
   * @type {!Array.<boolean>}
   * @private
   */
  this.dirtyBuffers_ = new Array(bufferCount);

  // Allocate the buffers.
  for (var n = 0; n < bufferCount; n++) {
    this.buffers_[n] = new wtf.io.Buffer(this.bufferSize);
    this.dirtyBuffers_[n] = false;
  }

  /**
   * An index to the next buffer to use in the buffer list.
   * @type {number}
   * @private
   */
  this.nextBufferIndex_ = 0;

  /**
   * Count of pending buffer writes.
   * If any buffers are outstanding (asynchronously writing to a stream) no
   * recording should take place. This prevents a bunch of bookkeeping logic
   * for out-of-order write completions. It'd be nice if it worked, though...
   * @type {number}
   * @private
   */
  this.pendingWrites_ = 0;

  // Reset buffer dirty states.
  // Note that we are not resetting pending writes here, as they may still be
  // pending and be using the buffers. I'm sure there are bugs here.
  for (var n = 0; n < this.dirtyBuffers_.length; n++) {
    this.dirtyBuffers_[n] = false;
  }

  // Start session.
  this.startInternal();
};
goog.inherits(wtf.trace.SnapshottingSession, wtf.trace.Session);


/**
 * Default size for individual buffers.
 * @const
 * @type {number}
 * @private
 */
wtf.trace.SnapshottingSession.DEFAULT_BUFFER_SIZE_ = 1024 * 1024;


/**
 * Writes a snapshot of the current state.
 * @param {!function():!wtf.io.WriteStream} streamCreator Factory function for
 *     streams. This is only called if a snapshot is going to be created. After
 *     the snapshot is written the stream is disposed.
 * @param {Object=} opt_scope Scope for the creation function.
 */
wtf.trace.SnapshottingSession.prototype.snapshot = function(
    streamCreator, opt_scope) {
  // TODO(benvanik): something smarter when there are overlapping writes?
  if (this.pendingWrites_) {
    return;
  }

  // TODO(benvanik): write a snapshot event?

  // Retire the current buffer to ensure all data is ready for writing.
  var originalBuffer = this.currentBuffer;
  if (this.currentBuffer) {
    this.retireBuffer(this.currentBuffer);
    this.currentBuffer = null;
  }

  // The stream is created on demand.
  var stream = null;

  // Write each dirtied buffer in order and reset them.
  // Start at the buffer immediately after the last one returned for writing and
  // walk until all the way around only writing buffers marked dirty.
  for (var n = 0; n < this.buffers_.length; n++) {
    var index = (this.nextBufferIndex_ + n) % this.buffers_.length;
    var buffer = this.buffers_[index];

    // Ignore buffer if it is not dirty or empty.
    var dirty = this.dirtyBuffers_[index];
    if (this.resetOnSnapshot_) {
      this.dirtyBuffers_[index] = false;
    }
    if (!dirty || !buffer.offset) {
      continue;
    }

    // Create stream on-demand if needed.
    if (!stream) {
      stream = streamCreator.call(opt_scope);
      this.setupStream_(stream);
    }

    // Begin write.
    var immediate = stream.write(buffer, this.returnBufferCallback_, this);
    if (!immediate) {
      // Lock until the buffer is returned.
      this.pendingWrites_++;
    }
  }

  // Flush the stream.
  // TODO(benvanik): allow caller to do it?
  goog.dispose(stream);

  // Allocate a new buffer.
  // If possible (no pending writes) re-acquire the original buffer at its
  // location - this is a bit tricky but prevents scrolling buffers each
  // snapshot by wasting the remaining buffer space.
  if (!this.pendingWrites_) {
    this.currentBuffer = originalBuffer;
  } else {
    // Pending writes - normal acquire path.
    this.currentBuffer = this.nextBuffer();
  }
};


/**
 * Initializes a write stream with the trace header.
 * @param {!wtf.io.WriteStream} stream Target stream.
 * @private
 */
wtf.trace.SnapshottingSession.prototype.setupStream_ = function(stream) {
  // Create a temporary buffer for the trace header.
  // This is nasty, but snapshots should be infrequent.
  var buffer = new wtf.io.Buffer(this.bufferSize);

  // Write trace header.
  this.writeTraceHeader(buffer);

  // Write discontinuity event.
  //wtf.trace.BuiltinEvents.discontinuity(wtf.timebase(), buffer);

  // Write header buffer.
  var immediate = stream.write(buffer, this.returnBufferCallback_, this);
  if (!immediate) {
    // Lock until the buffer is returned.
    this.pendingWrites_++;
  }
};


/**
 * Handles buffer returns from stream writers.
 * @param {!wtf.io.Buffer} buffer Buffer to return.
 * @private
 */
wtf.trace.SnapshottingSession.prototype.returnBufferCallback_ =
    function(buffer) {
  goog.asserts.assert(this.pendingWrites_ > 0);
  this.pendingWrites_--;
};


/**
 * @override
 */
wtf.trace.SnapshottingSession.prototype.nextBuffer = function() {
  // Skip events while there are pending writes.
  if (this.pendingWrites_) {
    return null;
  }

  // Grab the next buffer.
  var buffer = this.buffers_[this.nextBufferIndex_];

  // Mark it as undirty and reset, as it's being reused.
  this.dirtyBuffers_[this.nextBufferIndex_] = false;
  buffer.offset = 0;

  this.nextBufferIndex_ = (this.nextBufferIndex_ + 1) % this.buffers_.length;
  return buffer;
};


/**
 * @override
 */
wtf.trace.SnapshottingSession.prototype.retireBuffer = function(buffer) {
  // Mark the buffer as used. Guess based on normal flow.
  var bufferIndex = this.nextBufferIndex_ - 1;
  if (bufferIndex < 0) {
    bufferIndex = this.buffers_.length + bufferIndex;
  }
  this.dirtyBuffers_[bufferIndex] = true;
};
