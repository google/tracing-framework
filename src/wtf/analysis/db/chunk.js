/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event data chunk.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.Chunk');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('wtf.analysis.Event');



/**
 * A chunk of event data.
 * Chunks are designed to contain a certain number of events but have flexible
 * limits (allowing for out-of-order adds). All events within a chunk are stored
 * in order such that iteration always yields events with increasing time. When
 * events are added that have the same time they are sorted in the order they
 * were added.
 *
 * The event objects within a chunk persist so long as the chunk is loaded. Any
 * application data added to the events will not be serialized and be dropped
 * when the chunk is swapped out.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.db.Chunk = function() {
  goog.base(this);

  /**
   * Current reference count of the chunk.
   * This value is managed by the {@see #acquire}/{@see #release} methods and
   * controls the cache management.
   * @type {number}
   * @private
   */
  this.referenceCount_ = 0;

  /**
   * The total number of events currently within the chunk.
   * @type {number}
   * @private
   */
  this.eventCount_ = 0;

  /**
   * Wall-time the first event in the chunk occurs at.
   * @type {number}
   * @private
   */
  this.timeStart_ = Number.MAX_VALUE;

  /**
   * Wall-time the last event in the chunk occurs at.
   * @type {number}
   * @private
   */
  this.timeEnd_ = Number.MIN_VALUE;

  /**
   * Event data, sorted by time (and by insertion order).
   * This array is only present if the chunk is loaded - otherwise it will be
   * set to {@code null}.
   * @type {Array.<!wtf.analysis.Event>}
   * @private
   */
  this.events_ = [];

  /**
   * Number of events added in the current insert block so far.
   * @type {number}
   * @private
   */
  this.insertedEventCount_ = 0;

  /**
   * Set to true when any insert occurs out of order.
   * This indicates that a sort is required.
   * @type {boolean}
   * @private
   */
  this.insertionOutOfOrder_ = false;
};
goog.inherits(wtf.analysis.db.Chunk, goog.Disposable);


/**
 * Soft maximum on the number of events in a chunk.
 * @type {number}
 * @const
 * @private
 */
wtf.analysis.db.Chunk.SOFT_MAX_EVENTS_ = 500;


/**
 * Begins acquiring a new chunk for use, incrementing the reference count.
 * If a chunk is not loaded yet a deferred will be returned that is fired when
 * the chunk is loaded. If the chunk is already loaded then {@code null} is
 * returned.
 * @return {goog.async.Deferred} If a load is required a deferred fulfilled
 *     when the chunk is loaded.
 */
wtf.analysis.db.Chunk.prototype.acquire = function() {
  this.referenceCount_++;
  return null;
};


/**
 * Releases the chunk, decrementing the reference count.
 * When a chunk has no remaining references it is unloaded.
 */
wtf.analysis.db.Chunk.prototype.release = function() {
  goog.asserts.assert(this.referenceCount_);
  this.referenceCount_--;
};


/**
 * Gets the time of the first event in the chunk.
 * @return {number} Wall-time of the first event in the chunk.
 */
wtf.analysis.db.Chunk.prototype.getTimeStart = function() {
  return this.timeStart_ == Number.MAX_VALUE ? 0 : this.timeStart_;
};


/**
 * Gets the time of the last event in the chunk.
 * @return {number} Wall-time of the last event in the chunk.
 */
wtf.analysis.db.Chunk.prototype.getTimeEnd = function() {
  return this.timeEnd_ == Number.MIN_VALUE ? 0 : this.timeEnd_;
};


/**
 * Gets the event data.
 * This array is only available if the chunk is loaded and should not be
 * modified or retained as it may be changed at any time.
 * @return {Array.<!wtf.analysis.Event>} Event data, if loaded.
 */
wtf.analysis.db.Chunk.prototype.getEvents = function() {
  return this.events_;
};


/**
 * Gets a value indicating whether the chunk is full.
 * Full chunks should not have any more events added (unless they are out of
 * order events).
 * @return {boolean} True if the chunk is full.
 */
wtf.analysis.db.Chunk.prototype.isFull = function() {
  return this.eventCount_ >= wtf.analysis.db.Chunk.SOFT_MAX_EVENTS_;
};


/**
 * Inserts an event into the chunk.
 * This marks the chunk as dirty. At some point in the future
 * {@see #reconcileInsertion} will be called to clean things up.
 * @param {!wtf.analysis.Event} e Event.
 * @return {boolean} True if this insert has set the dirty flag on the chunk.
 */
wtf.analysis.db.Chunk.prototype.insertEvent = function(e) {
  var dirtied = !this.insertedEventCount_;

  // Add to the list.
  this.events_.push(e);
  this.eventCount_++;
  this.insertedEventCount_++;

  this.timeStart_ = Math.min(this.timeStart_, e.time);
  this.timeEnd_ = Math.max(this.timeEnd_, e.time);

  // Detect if a sort is required.
  if (!this.insertionOutOfOrder_ &&
      this.events_.length > 1 &&
      this.events_[this.events_.length - 2].time > e.time) {
    this.insertionOutOfOrder_ = true;
  }

  return dirtied;
};


/**
 * Reconciles chunk changes after it has been dirtied.
 * The chunk cache will call this at the end of a batch insertion if this chunk
 * has had any insertions.
 */
wtf.analysis.db.Chunk.prototype.reconcileInsertion = function() {
  // Only do expensive logic if any events were inserted.
  if (this.insertedEventCount_) {
    if (this.insertionOutOfOrder_) {
      this.events_.sort(wtf.analysis.Event.comparer);
    }
    this.timeStart_ = this.events_[0].time;
    this.timeEnd_ = this.events_[this.events_.length - 1].time;
    this.insertionOutOfOrder_ = false;
    this.insertedEventCount_ = 0;
  }
};


/**
 * Compares two chunks for sorting based on time.
 * @param {!wtf.analysis.db.Chunk} a First chunk.
 * @param {!wtf.analysis.db.Chunk} b Second chunk.
 * @return {number} Sort value.
 */
wtf.analysis.db.Chunk.comparer = function(a, b) {
  return a.timeStart_ - b.timeStart_;
};
