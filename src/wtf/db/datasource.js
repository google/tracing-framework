/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Data source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.DataSource');
goog.provide('wtf.db.PresentationHint');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.db.Unit');


/**
 * Bitmask values indicating hints to the UI displaying the data.
 * The UI is free to ignore any of these.
 * @enum {number}
 */
wtf.db.PresentationHint = {
  /**
   * The data in the source should disable most (if not all) of the higher
   * level navigation structures such as frames and features like heatmaps as
   * the data doesn't contain the events needed to build such tables.
   */
  BARE: 1 << 0,

  /**
   * The data source contains no rendering data, such as frames.
   * This can be used to hide UI elements related to frames, timing, etc.
   */
  NO_RENDER_DATA: 1 << 1
};



/**
 * Abstract single-source data stream.
 * This reads buffers from a source modeling a single trace recording session.
 * Events are parsed and redirected to the given database as they arrive.
 *
 * @param {!wtf.db.Database} db Target database.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Data source info.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.db.DataSource = function(db, sourceInfo) {
  goog.base(this);

  /**
   * Target database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Data source info.
   * @type {!wtf.db.DataSourceInfo}
   * @private
   */
  this.sourceInfo_ = sourceInfo;

  /**
   * A deferred that should be called back with success/failure.
   * This will only be initialized when the source has started.
   * @type {goog.async.Deferred}
   * @private
   */
  this.deferred_ = null;

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
   * File header flags.
   * A bitmask of {@see wtf.data.formats.FileFlags} values.
   * @type {number}
   * @private
   */
  this.flags_ = 0;

  /**
   * Hints to the UI that can help it decide what kind of view to show.
   * These may be ignored. A bitmask of values of
   * {@see wtf.db.PresentationHint}.
   * @type {number}
   * @private
   */
  this.presentationHints_ = 0;

  /**
   * Units used in the database.
   * @type {wtf.db.Unit}
   * @private
   */
  this.units_ = wtf.db.Unit.TIME_MILLISECONDS;

  /**
   * File metadata.
   * @type {!Object}
   * @private
   */
  this.metadata_ = {};

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

  /**
   * Whether an error has been fired.
   * This should be used to prevent further processing.
   * @type {boolean}
   * @protected
   */
  this.hasErrored = false;
};
goog.inherits(wtf.db.DataSource, goog.Disposable);


/**
 * Gets the database.
 * @return {!wtf.db.Database} Database.
 */
wtf.db.DataSource.prototype.getDatabase = function() {
  return this.db_;
};


/**
 * Gets the source information for this data source.
 * @return {!wtf.db.DataSourceInfo} Source info.
 */
wtf.db.DataSource.prototype.getInfo = function() {
  return this.sourceInfo_;
};


/**
 * Gets a value indicating whether the source has been fully initialized.
 * This usually occurs after the header has been successfully parsed.
 * @return {boolean} True if the source has been initialized.
 */
wtf.db.DataSource.prototype.isInitialized = function() {
  return this.isInitialized_;
};


/**
 * Gets the context information, if it has been parsed.
 * @return {!wtf.data.ContextInfo} Context information.
 */
wtf.db.DataSource.prototype.getContextInfo = function() {
  goog.asserts.assert(this.isInitialized_);
  goog.asserts.assert(this.contextInfo_);
  return this.contextInfo_;
};


/**
 * Gets file header flags.
 * @return {number} A bitmask of {@see wtf.data.formats.FileFlags} values.
 */
wtf.db.DataSource.prototype.getFlags = function() {
  return this.flags_;
};


/**
 * Gets a value indicating whether times in the trace are high resolution.
 * @return {boolean} True if the times are high resolution.
 */
wtf.db.DataSource.prototype.hasHighResolutionTimes = function() {
  goog.asserts.assert(this.isInitialized_);
  return !!(this.flags_ & wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES);
};


/**
 * Gets the bitmask of {@see wtf.db.PresentationHint} values that can be used to
 * help a UI decide what to draw.
 * @return {number} Bitmask.
 */
wtf.db.DataSource.prototype.getPresentationHints = function() {
  return this.presentationHints_;
};


/**
 * Gets the unit of measurement the data is in.
 * @return {wtf.db.Unit} Unit of measurement.
 */
wtf.db.DataSource.prototype.getUnits = function() {
  return this.units_;
};


/**
 * Gets embedded file metadata.
 * @return {!Object} Metadata.
 */
wtf.db.DataSource.prototype.getMetadata = function() {
  return this.metadata_;
};


/**
 * Gets the base wall-time for all relative times in the trace.
 * @return {number} Wall-time.
 */
wtf.db.DataSource.prototype.getTimebase = function() {
  goog.asserts.assert(this.isInitialized_);
  return this.timebase_;
};


/**
 * Gets an estimated time delay between the local machine and the source.
 * @return {number} Time delay, in seconds.
 */
wtf.db.DataSource.prototype.getTimeDelay = function() {
  return this.timeDelay_;
};


/**
 * Signals that the data source should start adding data.
 * This is an async process and, in the case of streaming sources, may not
 * complete for a very long time. Use the returned deferred if interested in
 * the completion time.
 * @return {!goog.async.Deferred} A deferred fulfilled when the data source
 *     completes loading.
 */
wtf.db.DataSource.prototype.start = function() {
  goog.asserts.assert(!this.deferred_);
  this.deferred_ = new goog.async.Deferred();
  return this.deferred_;
};


/**
 * Initializes the trace source.
 * This will likely be called outside of the constructor once a header has
 * been read. It must be called before any other events are dispatched to
 * the trace source.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 * @param {number} flags A bitmask of {@see wtf.data.formats.FileFlags} values.
 * @param {number} presentationHints Bitmask of presentation hints.
 * @param {wtf.db.Unit} units Unit of measurement.
 * @param {!Object} metadata File metadata.
 * @param {number} timebase Time base for all time values read.
 * @param {number} timeDelay Estimated time delay.
 * @return {boolean} Whether the initialization was successful.
 * @protected
 */
wtf.db.DataSource.prototype.initialize = function(
    contextInfo, flags, presentationHints, units, metadata, timebase,
    timeDelay) {
  goog.asserts.assert(!this.isInitialized_);
  this.isInitialized_ = true;

  this.contextInfo_ = contextInfo;
  this.flags_ = flags;
  this.presentationHints_ = presentationHints;
  this.units_ = units;
  this.metadata_ = metadata;
  this.timebase_ = timebase;
  this.timeDelay_ = timeDelay;

  return this.db_.sourceInitialized(this);
};


/**
 * Emits an error event.
 * @param {string} message Error message.
 * @param {string=} opt_detail Detailed information.
 * @protected
 */
wtf.db.DataSource.prototype.error = function(message, opt_detail) {
  this.hasErrored = true;

  this.db_.sourceError(this, message, opt_detail);

  if (this.deferred_) {
    this.deferred_.errback(new Error(message));
    this.deferred_ = null;
  }
};


/**
 * Emits an end event.
 * @protected
 */
wtf.db.DataSource.prototype.end = function() {
  this.db_.sourceEnded(this);

  if (this.deferred_) {
    this.deferred_.callback();
    this.deferred_ = null;
  }
};


goog.exportProperty(
    wtf.db.DataSource.prototype, 'getContextInfo',
    wtf.db.DataSource.prototype.getContextInfo);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getFlags',
    wtf.db.DataSource.prototype.getFlags);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'hasHighResolutionTimes',
    wtf.db.DataSource.prototype.hasHighResolutionTimes);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getPresentationHints',
    wtf.db.DataSource.prototype.getPresentationHints);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getUnits',
    wtf.db.DataSource.prototype.getUnits);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getMetadata',
    wtf.db.DataSource.prototype.getMetadata);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getTimebase',
    wtf.db.DataSource.prototype.getTimebase);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getTimeDelay',
    wtf.db.DataSource.prototype.getTimeDelay);
