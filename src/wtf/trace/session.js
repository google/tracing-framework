/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Recording session instance.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.Session');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.json');
goog.require('goog.math.Long');
goog.require('wtf');
goog.require('wtf.data.formats.BinaryTrace');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.trace.BuiltinEvents');
goog.require('wtf.trace.Scope');
goog.require('wtf.version');



/**
 * An active recording session.
 * Sessions manage recording control and act as channels for events to reach
 * their target(s). Generally there will be one session per application with
 * events from all sources flowing through it.
 *
 * @param {!wtf.trace.TraceManager} traceManager Trace manager.
 * @param {!wtf.util.Options} options Options.
 * @param {number} defaultBufferSize Default buffer size.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.trace.Session = function(traceManager, options, defaultBufferSize) {
  goog.base(this);

  /**
   * Trace manager singleton.
   * @type {!wtf.trace.TraceManager}
   * @private
   */
  this.traceManager_ = traceManager;

  /**
   * Options object.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * Metadata to be written with the session.
   * @type {!Object}
   * @private
   */
  this.metadata_ = {};

  /**
   * Maximum memory usage, in bytes.
   * Queues should never allocate more than this unless absolutely required.
   * For example, if this size is less than the size of a single buffer, it can
   * be exceeded.
   * @type {number}
   * @protected
   */
  this.maximumMemoryUsage = this.options_.getNumber(
      'wtf.trace.session.maximumMemoryUsage',
      wtf.trace.Session.DEFAULT_MAX_MEMORY_USAGE_);

  /**
   * Buffer size, in bytes.
   * The size of an individual data buffer. The larger the size the less
   * overhead there will be when writing events, but the larger the latency
   * in writing them to the network.
   * @type {number}
   * @protected
   */
  this.bufferSize = this.options_.getNumber(
      'wtf.trace.session.bufferSize',
      defaultBufferSize);

  /**
   * Current write buffer.
   * This may be null if a buffer has not yet been allocated.
   * @type {wtf.io.Buffer}
   * @protected
   */
  this.currentBuffer = null;

  /**
   * Whether the event stream has a discontinuity.
   * Discontinuities arise when buffer space is unavailable for a period of
   * time and events are dropped.
   * @type {boolean}
   * @private
   */
  this.hasDiscontinuity_ = false;
};
goog.inherits(wtf.trace.Session, goog.Disposable);


/**
 * Default maximum memory usage.
 * @const
 * @type {number}
 * @private
 */
wtf.trace.Session.DEFAULT_MAX_MEMORY_USAGE_ =
    16 * 1024 * 1024;


/**
 * @override
 */
wtf.trace.Session.prototype.disposeInternal = function() {
  // Retire the current buffer but do not allocate a new one.
  if (this.currentBuffer) {
    this.retireBuffer(this.currentBuffer);
    this.currentBuffer = null;
  }

  goog.base(this, 'disposeInternal');
};


/**
 * Gets the options object.
 * The return value should not be modified.
 * @return {!wtf.util.Options} Options object.
 */
wtf.trace.Session.prototype.getOptions = function() {
  return this.options_;
};


/**
 * Gets a modifiable metadata object.
 * Any properties set on the returned object will be serialized in the trace
 * file header.
 * @return {!Object} Metadata.
 */
wtf.trace.Session.prototype.getMetadata = function() {
  return this.metadata_;
};


/**
 * Starts a recording session.
 * Events will start recording and be directed through to the targets (depending
 * on the active mode).
 * @protected
 */
wtf.trace.Session.prototype.startInternal = function() {
  // Allocate a new buffer.
  goog.asserts.assert(!this.currentBuffer);
  this.currentBuffer = this.nextBuffer();
};


/**
 * Writes out information about the trace useful for loading and parsing it.
 * This includes event information and wire ID mappings.
 *
 * This can be used either at the start of a trace session or at any time during
 * it to ensure that even truncated streams have the decoder ring.
 *
 * @param {!wtf.io.Buffer} buffer Target buffer.
 * @return {boolean} True if the header was written successfully.
 * @protected
 */
wtf.trace.Session.prototype.writeTraceHeader = function(buffer) {
  // Write magic number.
  buffer.writeUint32(0xDEADBEEF);

  // Write version information.
  buffer.writeUint32(wtf.version.getBuild());
  buffer.writeUint32(wtf.data.formats.BinaryTrace.VERSION);

  // Write context information.
  var contextInfo = this.traceManager_.detectContextInfo();
  if (!contextInfo.write(buffer)) {
    return false;
  }

  // Write time information.
  var flags = 0;
  if (wtf.hasHighResolutionTimes) {
    flags |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES;
  }
  buffer.writeUint32(flags);
  var timebase = wtf.timebase();
  var longTimebase = goog.math.Long.fromNumber(timebase);
  buffer.writeUint32(longTimebase.getLowBits());
  buffer.writeUint32(longTimebase.getHighBits());

  // Write metadata.
  var metadataString = goog.json.serialize(this.metadata_);
  buffer.writeUtf8String(metadataString);

  // Write event info.
  if (!this.traceManager_.writeEventHeader(buffer)) {
    return false;
  }

  // Write all zones.
  this.traceManager_.appendAllZones(buffer);

  return true;
};


/**
 * Allocates a new buffer.
 * The buffer may contain random data but will be seeked to the beginning.
 * If the buffer cannot be allocated (system out of memory/etc), none will be
 * returned. Callers should keep trying until one can be allocated.
 * @return {wtf.io.Buffer} A new, empty buffer.
 * @protected
 */
wtf.trace.Session.prototype.nextBuffer = goog.abstractMethod;


/**
 * Retires a used buffer.
 * @param {!wtf.io.Buffer} buffer A used buffer. May contain valid data or be
 *     empty.
 * @protected
 */
wtf.trace.Session.prototype.retireBuffer = goog.abstractMethod;


/**
 * Acquires the next buffer with the requested amount of space available.
 * If it's impossible to meet the request no buffer will be returned. Callers
 * should keep trying in the future until one is available.
 *
 * This method should only be used by internal code. Do not directly append
 * data to the buffer.
 *
 * @param {number} time Current time.
 * @param {number} size Size, in bytes, that will be written.
 * @return {wtf.io.Buffer} A buffer with the requested size available.
 */
wtf.trace.Session.prototype.acquireBuffer = function(time, size) {
  // If the current buffer has space return it for reuse.
  var buffer = this.currentBuffer;
  if (buffer) {
    if (buffer.capacity - buffer.offset >= size) {
      return buffer;
    }
  }

  // Ignore entirely if the size is greater than the buffer size (we won't be
  // able to allocate a new buffer anyway).
  if (size > this.bufferSize) {
    return null;
  }

  // Retire the old (full) buffer.
  if (buffer) {
    this.retireBuffer(buffer);
  }

  // Attempt to allocate a new buffer.
  this.currentBuffer = this.nextBuffer();
  buffer = this.currentBuffer;

  // If no buffer could be allocated, flag a discontinuity.
  if (!buffer) {
    this.hasDiscontinuity_ = true;
  } else if (this.hasDiscontinuity_) {
    // Handle resuming from discontinuities.
    // Note: this must occur after currentBuffer has been set, as append is
    // re-entrant to this function.
    this.hasDiscontinuity_ = false;
    wtf.trace.BuiltinEvents.discontinuity(time, buffer);
  }

  if (buffer) {
    // Write current zone. This can be a bit redundant, but ensures that all
    // buffers (even if snapshotted) have the correct zone and prevents a bunch
    // of nasty state tracking.
    var zone = this.traceManager_.getCurrentZone();
    if (zone) {
      wtf.trace.BuiltinEvents.setZone(zone.id, time, buffer);
    }

    // Ignore if size can't fit in the buffer.
    if (size > buffer.capacity - buffer.offset) {
      return null;
    }
  }

  return buffer;
};


// TODO(benvanik): append blob fn - this takes an arbitrary object (JS obj,
//     typed array, string, etc) and attempts to write it to the buffer.
//     It returns a BlobID that can be used as an argument to an event.
// appendBlob(data) -> blobId
// wtf.trace.Session.prototype.appendBlob = function() {
// };


/**
 * An alias to the {@see wtf.trace.Scope#enterTyped} static method.
 * This is here to enable easy access from generated code.
 * @type {!Function}
 */
wtf.trace.Session.prototype.enterTypedScope = wtf.trace.Scope.enterTyped;


// Always export names used in generated code.
goog.exportProperty(
    wtf.trace.Session.prototype,
    'acquireBuffer',
    wtf.trace.Session.prototype.acquireBuffer);
goog.exportProperty(
    wtf.trace.Session.prototype,
    'enterTypedScope',
    wtf.trace.Session.prototype.enterTypedScope);
