/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace event source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.TraceSource');

goog.require('goog.Disposable');
goog.require('goog.asserts');



/**
 * Abstract single-source trace stream.
 * This reads buffers from a source modeling a single trace recording session.
 * Events are parsed and redirected to the given trace listener as they arrive.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.TraceSource = function(traceListener) {
  goog.base(this);

  /**
   * Trace listener.
   * @type {!wtf.analysis.TraceListener}
   * @protected
   */
  this.traceListener = traceListener;

  /**
   * Whether the source has been fully initialized.
   * This usually is set after the header has been fully parsed.
   * @type {boolean}
   * @private
   */
  this.isInitialized_ = false;

  /**
   * Context information.
   * Contains information used to link repeat sessions in tools.
   * This unique ID is used to correlate multiple sessions in tools.
   * Sessions should reuse the same ID to enable UIs to consistently display
   * across reloads/snapshots.
   * Only present once the headers have been read.
   * @type {wtf.data.ContextInfo}
   * @private
   */
  this.contextInfo_ = null;

  /**
   * Whether the trace times are high resolution.
   * @type {boolean}
   * @private
   */
  this.hasHighResolutionTimes_ = false;

  /**
   * Base wall-time for all relative times in the trace.
   * @type {number}
   * @private
   */
  this.timebase_ = 0;

  /**
   * Estimated time delay between source and this instance.
   * @type {number}
   * @private
   */
  this.timeDelay_ = 0;

  // TODO(benvanik): current zone
};
goog.inherits(wtf.analysis.TraceSource, goog.Disposable);


/**
 * Gets a value indicating whether the source has been fully initialized.
 * This usually occurs after the header has been successfully parsed.
 * @return {boolean} True if the source has been initialized.
 */
wtf.analysis.TraceSource.prototype.isInitialized = function() {
  return this.isInitialized_;
};


/**
 * Gets the context information, if it has been parsed.
 * @return {!wtf.data.ContextInfo} Context information.
 */
wtf.analysis.TraceSource.prototype.getContextInfo = function() {
  goog.asserts.assert(this.isInitialized_);
  goog.asserts.assert(this.contextInfo_);
  return this.contextInfo_;
};


/**
 * Gets a value indicating whether times in the trace are high resolution.
 * @return {boolean} True if the times are high resolution.
 */
wtf.analysis.TraceSource.prototype.hasHighResolutionTimes = function() {
  goog.asserts.assert(this.isInitialized_);
  return this.hasHighResolutionTimes_;
};


/**
 * Gets the base wall-time for all relative times in the trace.
 * @return {number} Wall-time.
 */
wtf.analysis.TraceSource.prototype.getTimebase = function() {
  goog.asserts.assert(this.isInitialized_);
  return this.timebase_;
};


/**
 * Gets an estimated time delay between the local machine and the source.
 * @return {number} Time delay, in seconds.
 */
wtf.analysis.TraceSource.prototype.getTimeDelay = function() {
  goog.asserts.assert(this.isInitialized_);
  return this.timeDelay_;
};


/**
 * Initializes the trace source.
 * This will likely be called outside of the constructor once a header has
 * been read. It must be called before any other events are dispatched to
 * the trace source.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 * @param {boolean} hasHighResolutionTimes Whether times are high-resolution.
 * @param {number} timebase Time base for all time values read.
 * @param {number} timeDelay Estimated time delay.
 * @protected
 */
wtf.analysis.TraceSource.prototype.initialize = function(
    contextInfo, hasHighResolutionTimes, timebase, timeDelay) {
  goog.asserts.assert(!this.isInitialized_);
  this.isInitialized_ = true;

  this.contextInfo_ = contextInfo;
  this.hasHighResolutionTimes_ = hasHighResolutionTimes;
  this.timebase_ = timebase;
  this.timeDelay_ = timeDelay;
};
