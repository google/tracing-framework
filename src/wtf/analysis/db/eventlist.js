/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chunked list of events.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.EventList');

goog.require('goog.asserts');
goog.require('wtf.analysis.db.Chunk');
goog.require('wtf.analysis.db.IEventTarget');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * A chunked list of events, supporting fast insertion and iteration.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.analysis.db.IEventTarget}
 */
wtf.analysis.db.EventList = function() {
  goog.base(this);

  /**
   * Time of the first event in the list.
   * @type {number}
   * @private
   */
  this.firstEventTime_ = Number.MAX_VALUE;

  /**
   * Time of the last event in the list.
   * @type {number}
   * @private
   */
  this.lastEventTime_ = Number.MIN_VALUE;

  /**
   * Total number of events in the list.
   * @type {number}
   * @private
   */
  this.count_ = 0;

  /**
   * Whether the list is inside an insertion block.
   * @type {boolean}
   * @private
   */
  this.insertingEvents_ = false;

  /**
   * Number of events added in the current insert block so far.
   * @type {number}
   * @private
   */
  this.insertedEventCount_ = 0;

  /**
   * References to chunks that contain the actual events.
   * @type {!Array.<!wtf.analysis.db.Chunk>}
   * @private
   */
  this.chunks_ = [];

  /**
   * Whether {@see #chunks_} needs resorting.
   * @type {boolean}
   * @private
   */
  this.needsResortChunks_ = false;

  /**
   * A list of dirtied chunks that need to be written/reconciled.
   * @type {!Array.<!wtf.analysis.db.Chunk>}
   * @private
   */
  this.dirtyChunks_ = [];
};
goog.inherits(wtf.analysis.db.EventList, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.analysis.db.EventList.prototype.disposeInternal = function() {
  goog.disposeAll(this.chunks_);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the time of the first event in the list.
 * @return {number} Wall-time of the first event or 0 if no events.
 */
wtf.analysis.db.EventList.prototype.getFirstEventTime = function() {
  return this.firstEventTime_ == Number.MAX_VALUE ? 0 : this.firstEventTime_;
};


/**
 * Gets the time of the last event in the list.
 * @return {number} Wall-time of the last event or 0 if no events.
 */
wtf.analysis.db.EventList.prototype.getLastEventTime = function() {
  return this.lastEventTime_ == Number.MIN_VALUE ? 0 : this.lastEventTime_;
};


/**
 * Gets the total number of events in the list.
 * @return {number} Event count.
 */
wtf.analysis.db.EventList.prototype.getCount = function() {
  return this.count_;
};


/**
 * Finds the chunk index containing the given time or before it.
 * @param {number} time Wall-time to search for.
 * @return {number} Chunk index or -1 if not found.
 * @private
 */
wtf.analysis.db.EventList.prototype.indexOfChunkNear_ = function(time) {
  // TODO(benvanik): binary search the start point
  var chunks = this.chunks_;
  var chunksLength = chunks.length;
  for (var n = 0; n < chunksLength; n++) {
    var chunk = chunks[n];
    if (chunk.getTimeEnd() < time) {
      continue;
    }
    if (chunk.getTimeStart() > time) {
      return n ? n - 1 : -1;
    }
    return n;
  }
  return -1;
};


/**
 * Finds the event index closest to the given time (or less than).
 * @param {!wtf.analysis.db.Chunk} chunk Chunk to look in.
 * @param {number} time Wall-time to find.
 * @return {number} Index of the event if found, otherwise 0.
 * @private
 */
wtf.analysis.db.EventList.prototype.indexOfEventNear_ = function(chunk, time) {
  var events = chunk.getEvents();
  if (!events) {
    return 0;
  }
  var low = 0;
  var high = events.length - 1;
  while (low < high) {
    var mid = ((low + high) / 2) | 0;
    if (events[mid].time < time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};


/**
 * Finds the event closest to (or less than) the given time that matches the
 * given filter.
 * @param {number} time Wall-time to search for.
 * @param {function(!wtf.analysis.Event):boolean} filter Filter function
 *     that should return true to include an event as a result.
 * @return {wtf.analysis.Event} The found event, if any.
 */
wtf.analysis.db.EventList.prototype.search = function(time, filter) {
  if (this.dirtyChunks_.length) {
    this.reconcileChanges_();
  }

  var chunks = this.chunks_;
  var chunksLength = chunks.length;
  if (!chunksLength) {
    return null;
  }
  var startChunk = this.indexOfChunkNear_(time);
  if (startChunk < 0) {
    return null;
  }

  // Traverse from the given time backwards.
  for (var n = startChunk; n >= 0; n--) {
    var chunk = chunks[n];
    var events = chunk.getEvents();
    if (!events) {
      continue;
    }

    // Find the event index closest to the time. Start there.
    var m = 0;
    if (chunk.getTimeEnd() < time) {
      m = events.length - 1;
    } else {
      m = this.indexOfEventNear_(chunk, time);
    }

    // Go backwards, matching our filter.
    for (; m >= 0; m--) {
      var e = events[m];
      if (e.time <= time && filter(e)) {
        return e;
      }
    }
  }

  return null;
};


/**
 * Search filter function that finds events with full scopes.
 * @param {!wtf.analysis.Event} e Event.
 * @return {boolean} True to match filter.
 * @private
 */
wtf.analysis.db.EventList.findEventWithScope_ = function(e) {
  return !!e.scope && !!e.scope.getEnterEvent() && !!e.scope.getLeaveEvent();
};


/**
 * Finds the deepest scope that encloses the given time.
 * @param {number} time Wall-time to search for.
 * @return {wtf.analysis.Scope} Scope that contains the time, if any.
 */
wtf.analysis.db.EventList.prototype.findEnclosingScope = function(time) {
  // TODO(benvanik): replace the search with an inlined version.
  var scopeEvent = this.search(
      time, wtf.analysis.db.EventList.findEventWithScope_);
  if (!scopeEvent) {
    return null;
  }
  for (var scope = scopeEvent.scope; scope; scope = scope.getParent()) {
    var enter = scope.getEnterEvent();
    var leave = scope.getLeaveEvent();
    if (enter && enter.time <= time &&
        leave && leave.time >= time) {
      return scope;
    }
  }
  return null;
};


/**
 * Iterates over the list returning all events in the given time range.
 *
 * @param {number} timeStart Start wall-time range.
 * @param {number} timeEnd End wall-time range.
 * @param {!function(!wtf.analysis.Event):(boolean|undefined)} callback
 *     Function to call with the event nodes. Return {@code false} to cancel.
 * @param {Object=} opt_scope Scope to call the function in.
 */
wtf.analysis.db.EventList.prototype.forEach = function(
    timeStart, timeEnd, callback, opt_scope) {
  goog.asserts.assert(!this.dirtyChunks_.length);

  // TODO(benvanik): binary search the start point
  var chunks = this.chunks_;
  var chunksLength = chunks.length;
  if (!chunksLength) {
    return;
  }
  var startChunk = this.indexOfChunkNear_(timeStart);
  if (startChunk < 0) {
    startChunk = 0;
  }
  for (var n = startChunk; n < chunksLength; n++) {
    var chunk = chunks[n];
    if (chunk.getTimeStart() > timeEnd) {
      break;
    }
    var events = chunk.getEvents();
    if (!events) {
      continue;
    }

    // If this chunk starts before the view, scan it to find the event offset.
    var m = 0;
    if (chunk.getTimeStart() < timeStart) {
      for (; m < events.length; m++) {
        var e = events[m];
        if (e.time >= timeStart) {
          break;
        }
      }
    }

    // Emit events until the last event of interest is reached.
    for (; m < events.length; m++) {
      var e = events[m];
      if (e.time > timeEnd) {
        return;
      }

      if (callback.call(opt_scope, e) === false) {
        return;
      }
    }
  }
};


// TODO(benvanik): sample function: map-like function that passes a series of
//     events - for example:
// sample(start, end, 1000 /* max callback count*/, function(events) {
//   // events = [some events in the range]
//   // could scan them to generate a single data point
// })


/**
 * @override
 */
wtf.analysis.db.EventList.prototype.beginInserting = function() {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = true;
};


/**
 * @override
 */
wtf.analysis.db.EventList.prototype.insertEvent = function(e) {
  goog.asserts.assert(this.insertingEvents_);

  // Track start/end time.
  if (e.time && e.time < this.firstEventTime_) {
    this.firstEventTime_ = e.time;
  }
  if (e.time && e.time > this.lastEventTime_) {
    this.lastEventTime_ = e.time;
  }

  this.insertedEventCount_++;
  this.count_++;

  // Find chunk and add.
  // The chunk list is sorted by time, but since it's so small this just
  // performs a linear search. Note that we do it in reverse because we assume
  // that we are appending.

  // If no chunks, create one.
  if (!this.chunks_.length) {
    var chunk = new wtf.analysis.db.Chunk();
    this.chunks_.push(chunk);
    this.needsResortChunks_ = true;
    if (chunk.insertEvent(e)) {
      this.dirtyChunks_.push(chunk);
    }
    return;
  }

  // Attempt to append to end (quickly) first.
  var chunk = this.chunks_[this.chunks_.length - 1];
  if (e.time >= chunk.getTimeStart()) {
    if (chunk.isFull()) {
      // Chunk is full - create a new chunk.
      chunk = new wtf.analysis.db.Chunk();
      this.chunks_.push(chunk);
      this.needsResortChunks_ = true;
    }
    if (chunk.insertEvent(e)) {
      this.dirtyChunks_.push(chunk);
    }
    return;
  }

  // Reverse scan until we find the chunk that has the event.
  // TODO(benvanik): binary search
  for (var n = this.chunks_.length - 2; n >= 0; n--) {
    chunk = this.chunks_[n];
    if (e.time >= chunk.getTimeStart()) {
      if (chunk.insertEvent(e)) {
        this.dirtyChunks_.push(chunk);
      }
      return;
    }
  }

  // Event is inserting before any other event - insert at the head.
  chunk = this.chunks_[0];
  chunk.insertEvent(e);
  this.dirtyChunks_.push(chunk);
};


/**
 * @override
 */
wtf.analysis.db.EventList.prototype.endInserting = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = false;

  // Reconcile all chunk changes/etc.
  this.reconcileChanges_();

  // Only do expensive logic if any events were inserted.
  if (this.insertedEventCount_) {
    this.insertedEventCount_ = 0;
    this.invalidate_();
  }
};


/**
 * Reconciles all chunk changes/etc and prepares the list for searches.
 * This must be called after modifying the list and before any searches are
 * performed.
 * @private
 */
wtf.analysis.db.EventList.prototype.reconcileChanges_ = function() {
  // Reconcile chunk changes after they have been dirtied.
  for (var n = 0; n < this.dirtyChunks_.length; n++) {
    var chunk = this.dirtyChunks_[n];
    chunk.reconcileInsertion();
  }
  this.dirtyChunks_.length = 0;

  // Resort chunk refs, if required.
  if (this.needsResortChunks_) {
    this.needsResortChunks_ = false;
    this.chunks_.sort(wtf.analysis.db.Chunk.comparer);
  }
};


/**
 * Handles invalidation (new events, events loaded, etc).
 * @private
 */
wtf.analysis.db.EventList.prototype.invalidate_ = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};


goog.exportProperty(
    wtf.analysis.db.EventList.prototype, 'getFirstEventTime',
    wtf.analysis.db.EventList.prototype.getFirstEventTime);
goog.exportProperty(
    wtf.analysis.db.EventList.prototype, 'getLastEventTime',
    wtf.analysis.db.EventList.prototype.getLastEventTime);
goog.exportProperty(
    wtf.analysis.db.EventList.prototype, 'getCount',
    wtf.analysis.db.EventList.prototype.getCount);
goog.exportProperty(
    wtf.analysis.db.EventList.prototype, 'search',
    wtf.analysis.db.EventList.prototype.search);
goog.exportProperty(
    wtf.analysis.db.EventList.prototype, 'findEnclosingScope',
    wtf.analysis.db.EventList.prototype.findEnclosingScope);
goog.exportProperty(
    wtf.analysis.db.EventList.prototype, 'forEach',
    wtf.analysis.db.EventList.prototype.forEach);
