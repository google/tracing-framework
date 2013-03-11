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
goog.provide('wtf.db.DataSourceInfo');
goog.provide('wtf.db.PresentationHint');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('wtf.data.formats.FileFlags');



/**
 * Source information about a data source.
 * @param {string} filename Filename or URL.
 * @param {string} contentType MIME type.
 * @constructor
 */
wtf.db.DataSourceInfo = function(filename, contentType) {
  /**
   * @type {string}
   */
  this.filename = filename;

  /**
   * @type {string}
   */
  this.contentType = contentType;
};


/**
 * Gets a value indicating whether the source data is binary (vs. text).
 * @return {boolean} True if binary, false if text.
 */
wtf.db.DataSourceInfo.prototype.isBinary = function() {
  // Guess the response type from the content type.
  switch (this.contentType) {
    default:
    case 'application/x-extension-wtf-trace':
    case 'application/x-extension-wtf-calls':
      return true;
    case 'application/x-extension-wtf-json':
      return false;
  }
};


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
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.db.DataSource = function(db) {
  goog.base(this);

  /**
   * Target database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

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
   */
  this.presentationHints_ = 0;

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
 */
wtf.db.DataSource.prototype.start = goog.nullFunction;


/**
 * Initializes the trace source.
 * This will likely be called outside of the constructor once a header has
 * been read. It must be called before any other events are dispatched to
 * the trace source.
 * @param {!wtf.data.ContextInfo} contextInfo Context information.
 * @param {number} flags A bitmask of {@see wtf.data.formats.FileFlags} values.
 * @param {number} presentationHints Bitmask of presentation hints.
 * @param {!Object} metadata File metadata.
 * @param {number} timebase Time base for all time values read.
 * @param {number} timeDelay Estimated time delay.
 * @protected
 */
wtf.db.DataSource.prototype.initialize = function(
    contextInfo, flags, presentationHints, metadata, timebase, timeDelay) {
  goog.asserts.assert(!this.isInitialized_);
  this.isInitialized_ = true;

  this.contextInfo_ = contextInfo;
  this.flags_ = flags;
  this.presentationHints_ = presentationHints;
  this.metadata_ = metadata;
  this.timebase_ = timebase;
  this.timeDelay_ = timeDelay;
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
    wtf.db.DataSource.prototype, 'getMetadata',
    wtf.db.DataSource.prototype.getMetadata);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getTimebase',
    wtf.db.DataSource.prototype.getTimebase);
goog.exportProperty(
    wtf.db.DataSource.prototype, 'getTimeDelay',
    wtf.db.DataSource.prototype.getTimeDelay);
