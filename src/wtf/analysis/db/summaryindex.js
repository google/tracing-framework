/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time-based index.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.SummaryIndex');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.string');
goog.require('wtf.analysis.db.Granularity');
goog.require('wtf.analysis.db.IEventTarget');
goog.require('wtf.analysis.db.SummaryData');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');



/**
 * A time-based index into the event stream.
 * Provides summary data for ranges of time (and efficient queries into them).
 *
 * Time indices are organized into a skip-list like data structure, leveled by
 * time granularities (such as 1s, 0.1s, etc) and divided at regular intervals.
 * <code>
 *      s +---------------+---------------+---------------+---------------+
 *        |               |               |               |               |
 *     ms +-------+-------+-------+-------+-------+-------+-------+-------+
 *        |       |       |       |       |       |       |       |       |
 *     us +-------+---+---+-------+-------+-------+---+---+---+---+-------+
 * </code>
 *
 * The goal of this structure is to provide efficient iteration of summarized
 * event data based on fixed intervals of time and automatic summarization of
 * arbitrary time ranges.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.analysis.db.IEventTarget}
 */
wtf.analysis.db.SummaryIndex = function() {
  goog.base(this);

  /**
   * A list of registered summary generators that are used to generate custom
   * summary data.
   * @type {!Array.<!wtf.analysis.db.SummaryGenerator>}
   * @private
   */
  this.summaryGenerators_ = [];

  /**
   * Root node in the time index.
   * Note that this may change under insertion if the index must grow up.
   * @type {wtf.analysis.db.SummaryIndexNode_}
   * @private
   */
  this.rootNode_ = null;

  /**
   * Time of the first event in the index.
   * @type {number}
   * @private
   */
  this.firstEventTime_ = Number.MAX_VALUE;

  /**
   * Time of the last event in the index.
   * @type {number}
   * @private
   */
  this.lastEventTime_ = Number.MIN_VALUE;

  /**
   * Whether the index is inside an insertion block.
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
};
goog.inherits(wtf.analysis.db.SummaryIndex, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.analysis.db.SummaryIndex.prototype.disposeInternal = function() {
  goog.disposeAll(this.summaryGenerators_);
  goog.base(this, 'disposeInternal');
};


/**
 * Dumps the time index data to the console.
 */
wtf.analysis.db.SummaryIndex.prototype.dump = function() {
  if (this.rootNode_) {
    this.rootNode_.dump();
  }
};


/**
 * Registers a summary generator.
 * The generator will be disposed when the index is disposed.
 * @param {!wtf.analysis.db.SummaryGenerator} generator Summary generator.
 */
wtf.analysis.db.SummaryIndex.prototype.addSummaryGenerator = function(
    generator) {
  goog.asserts.assert(!goog.array.contains(this.summaryGenerators_, generator));
  this.summaryGenerators_.push(generator);

  // TODO(benvanik): if data already exists, run on all nodes
  goog.asserts.assert(!this.rootNode_);
};


/**
 * Gets the time of the first event in the index.
 * @return {number} Wall-time of the first event or 0 if no events.
 */
wtf.analysis.db.SummaryIndex.prototype.getFirstEventTime = function() {
  return this.rootNode_ ? this.firstEventTime_ : 0;
};


/**
 * Gets the time of the last event in the index.
 * @return {number} Wall-time of the last event or 0 if no events.
 */
wtf.analysis.db.SummaryIndex.prototype.getLastEventTime = function() {
  return this.rootNode_ ? this.lastEventTime_ : 0;
};


/**
 * Grows the tree root to include the given time.
 * @param {number} time Time to include.
 * @private
 */
wtf.analysis.db.SummaryIndex.prototype.growToInclude_ = function(time) {
  var rootNode = this.rootNode_;
  while (time < rootNode.timeStart_ || time >= rootNode.timeEnd_) {
    var granularity = rootNode.granularity_ * 10;
    var startTime = rootNode.timeStart_ - (rootNode.timeStart_ % granularity);
    if (startTime == rootNode.timeStart_) {
      // Special case for 0.
      startTime -= granularity;
    }
    var newRoot = new wtf.analysis.db.SummaryIndexNode_(
        null, startTime, startTime + granularity);
    newRoot.growFrom(rootNode);
    rootNode = newRoot;
  }
  this.rootNode_ = rootNode;
};


/**
 * @override
 */
wtf.analysis.db.SummaryIndex.prototype.beginInserting = function() {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = true;
};


/**
 * @override
 */
wtf.analysis.db.SummaryIndex.prototype.insertEvent = function(e) {
  goog.asserts.assert(this.insertingEvents_);

  // Create root node, if required.
  // We wait until we have at least one event so we have the time right.
  if (!this.rootNode_) {
    var granularity = wtf.analysis.db.Granularity.SECOND;
    var startTime = e.time - (e.time % granularity);
    this.rootNode_ = new wtf.analysis.db.SummaryIndexNode_(
        null, startTime, startTime + granularity);
  }

  // Grow tree, if required.
  if (e.time < this.rootNode_.timeStart_ || e.time >= this.rootNode_.timeEnd_) {
    this.growToInclude_(e.time);
  }

  // Track start/end time.
  if (e.time && e.time < this.firstEventTime_) {
    this.firstEventTime_ = e.time;
  }
  if (e.time && e.time > this.lastEventTime_) {
    this.lastEventTime_ = e.time;
  }

  // Recursively add to index.
  this.rootNode_.insertEvent(e);
  this.insertedEventCount_++;
};


/**
 * @override
 */
wtf.analysis.db.SummaryIndex.prototype.endInserting = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = false;

  // Only do expensive logic if any events were inserted.
  if (this.insertedEventCount_) {
    this.insertedEventCount_ = 0;
    this.invalidate_();
  }
};


/**
 * Iterates over the given time range returning summaries at the given
 * granularity. The time range will be extended to fit at the requested
 * granularity. The summary nodes returned may be of a coarser granularity than
 * requested, if there is no data for that time period.
 *
 * @param {number} timeStart Start wall-time range.
 * @param {number} timeEnd End wall-time range.
 * @param {number|wtf.analysis.db.Granularity} granularity Summary granularity.
 * @param {!function(!wtf.analysis.db.SummaryData)} callback Function to call
 *     with the summary datas.
 * @param {Object=} opt_scope Scope to call the function in.
 */
wtf.analysis.db.SummaryIndex.prototype.forEach = function(
    timeStart, timeEnd, granularity, callback, opt_scope) {
  // TODO(benvanik): fix granularity
  // TODO(benvanik): expand time range
  // TODO(benvanik): walk nodes at level
};


/**
 * Queries summary data for the given time range.
 * @param {number} timeStart Start wall-time range.
 * @param {number} timeEnd End wall-time range.
 * @return {!wtf.analysis.db.SummaryData} Summary data for the given time range.
 */
wtf.analysis.db.SummaryIndex.prototype.querySummary = function(
    timeStart, timeEnd) {
  var summaryData = new wtf.analysis.db.SummaryData(
      Number.MAX_VALUE, Number.MIN_VALUE);
  if (this.rootNode_) {
    this.rootNode_.walkShallowRange(timeStart, timeEnd, function(node) {
      if (node.timeStart_ < summaryData.timeStart) {
        summaryData.timeStart = node.timeStart_;
      }
      if (node.timeEnd_ > summaryData.timeEnd) {
        summaryData.timeEnd = node.timeEnd_;
      }

      // Merge summary data.
      // TODO(benvanik): merge node data in
      summaryData.totalEventCount += node.data.totalEventCount;
    });
  }
  if (summaryData.timeStart == Number.MAX_VALUE) {
    summaryData.timeStart = summaryData.timeEnd = 0;
  }
  return summaryData;
};


/**
 * Handles view invalidation (new events, events loaded, etc).
 * @private
 */
wtf.analysis.db.SummaryIndex.prototype.invalidate_ = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};



/**
 * A node in the time index.
 * Each node contains summary information about the events contained within it.
 * Nodes may optionally contain children, and if they do always contain 10.
 *
 * @param {wtf.analysis.db.SummaryIndexNode_} parent Parent node, if any.
 * @param {number} timeStart Wall-time this node starts at.
 * @param {number} timeEnd Wall-time this node ends at.
 * @constructor
 * @private
 */
wtf.analysis.db.SummaryIndexNode_ = function(parent, timeStart, timeEnd) {
  /**
   * Wall-time this node starts at.
   * @type {number}
   * @private
   */
  this.timeStart_ = timeStart;

  /**
   * Wall-time this node ends at.
   * @type {number}
   * @private
   */
  this.timeEnd_ = timeEnd;

  /**
   * Granularity of this node's level.
   * @type {number}
   * @private
   */
  this.granularity_ = timeEnd - timeStart;

  /**
   * Child nodes, if this is not a leaf.
   * @type {Array.<!wtf.analysis.db.SummaryIndexNode_>}
   * @private
   */
  this.children_ = null;

  /**
   * Summary data.
   * @type {!wtf.analysis.db.SummaryData}
   */
  this.data = new wtf.analysis.db.SummaryData(timeStart, this.granularity_);
};


/**
 * Grows the time index from the given child node.
 * @param {!wtf.analysis.db.SummaryIndexNode_} node Child node.
 */
wtf.analysis.db.SummaryIndexNode_.prototype.growFrom = function(node) {
  // TODO(benvanik): change API to prevent double creation of the given child.
  this.expand_();

  // Swap child.
  var timeOffset =
      (node.timeStart_ - this.timeStart_) / this.granularity_ * 10;
  this.children_[timeOffset | 0] = node;
  node.parent_ = this;
};


/**
 * Expands the index node, assigning it children.
 * @private
 */
wtf.analysis.db.SummaryIndexNode_.prototype.expand_ = function() {
  if (this.children_) {
    return;
  }

  var duration = this.timeEnd_ - this.timeStart_;
  if (duration <= wtf.analysis.db.Granularity.FINEST) {
    return;
  }

  duration /= 10;
  this.children_ = [];
  for (var n = 0, time = this.timeStart_; n < 10; n++, time += duration) {
    this.children_.push(new wtf.analysis.db.SummaryIndexNode_(
        this, time, time + duration));
  }
};


/**
 * Inserts an event into the tree.
 * This will add the event to this and all child nodes.
 * @param {!wtf.analysis.Event} e New event.
 */
wtf.analysis.db.SummaryIndexNode_.prototype.insertEvent = function(e) {
  // Add to summary.
  this.data.totalEventCount++;
  // TODO(benvanik): more data

  // Expand if needed.
  if (!this.children_ &&
      this.granularity_ > wtf.analysis.db.Granularity.FINEST) {
    this.expand_();
  }

  if (this.children_) {
    // Find child and recurse.
    var timeOffset = (e.time - this.timeStart_) / this.granularity_ * 10;
    var child = this.children_[timeOffset | 0];
    child.insertEvent(e);
  }
};


/**
 * Dumps a text representation to the console.
 * @param {number=} opt_indent Indent level.
 */
wtf.analysis.db.SummaryIndexNode_.prototype.dump = function(opt_indent) {
  var indent = opt_indent || 0;

  var indentText = goog.string.repeat('  ', indent);
  window.console.log(indentText +
      this.timeStart_ + '-' + this.timeEnd_ + '/' + this.granularity_ + ' ' +
      this.data.totalEventCount);

  if (this.children_) {
    for (var n = 0; n < this.children_.length; n++) {
      this.children_[n].dump(indent + 1);
    }
  }
};


/**
 * Recursively walks the shallowest range of the tree.
 *
 * @param {number} timeStart Start wall-time range.
 * @param {number} timeEnd End wall-time range.
 * @param {!function(!wtf.analysis.db.SummaryIndexNode_)} callback Callback.
 * @param {Object=} opt_scope Callback scope.
 */
wtf.analysis.db.SummaryIndexNode_.prototype.walkShallowRange = function(
    timeStart, timeEnd, callback, opt_scope) {
  // Skip if out of range.
  if (timeStart > this.timeEnd_ || timeEnd < this.timeStart_) {
    return;
  }

  // Clamp time ranges to make things easier to work with.
  if (timeStart < this.timeStart_) {
    timeStart = this.timeStart_;
  }
  if (timeEnd > this.timeEnd_) {
    timeEnd = this.timeEnd_;
  }

  // If the range is the entire node, or we are a leaf, callback.
  if (!this.children_ ||
      (timeStart == this.timeStart_ && timeEnd == this.timeEnd_)) {
    callback.call(opt_scope, this);
    return;
  }

  // Select children.
  var startChild = ((timeStart - this.timeStart_) / this.granularity_ * 10) | 0;
  var endChild = ((timeEnd - this.timeStart_) / this.granularity_ * 10) | 0;
  if (endChild >= this.children_.length) {
    endChild = this.children_.length - 1;
  }
  for (var n = startChild; n <= endChild; n++) {
    this.children_[n].walkShallowRange(timeStart, timeEnd, callback, opt_scope);
  }
};
