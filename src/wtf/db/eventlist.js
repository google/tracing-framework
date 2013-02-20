/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event list.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.EventList');
goog.provide('wtf.db.IAncillaryList');

goog.require('goog.array');
goog.require('wtf');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.EventFlag');
goog.require('wtf.db.ArgumentData');
goog.require('wtf.db.EventIterator');
goog.require('wtf.db.EventStruct');
goog.require('wtf.db.EventType');
goog.require('wtf.util');



/**
 * @interface
 */
wtf.db.IAncillaryList = function() {};


/**
 * Begins a rebuild operation.
 * The list of returned event types is used to decide what events are dispatched
 * to the handler routine.
 * @param {!wtf.db.EventTypeTable} eventTypeTable Event type table.
 * @return {!Array.<!wtf.db.EventType>} Event types to handle.
 */
wtf.db.IAncillaryList.prototype.beginRebuild = goog.nullFunction;


/**
 * Handles an event that had its type registered.
 * @param {number} eventTypeIndex Index into the event type list returned from
 *     {@see #beginRebuild}.
 * @param {!wtf.db.EventType} eventType Event type.
 * @param {!wtf.db.EventIterator} it Event iterator.
 */
wtf.db.IAncillaryList.prototype.handleEvent = goog.nullFunction;


/**
 * Ends the current rebuild operation.
 */
wtf.db.IAncillaryList.prototype.endRebuild = goog.nullFunction;



/**
 * Event data list.
 *
 * @param {!wtf.db.EventTypeTable} eventTypeTable Event type table.
 * @constructor
 */
wtf.db.EventList = function(eventTypeTable) {
  /**
   * Event type table.
   * @type {!wtf.db.EventTypeTable}
   */
  this.eventTypeTable = eventTypeTable;

  /**
   * Ancillary lists, in the order they were registered.
   * @type {!Array.<!wtf.db.IAncillaryList>}
   * @private
   */
  this.ancillaryLists_ = [];

  /**
   * Total number of events stored in the backing buffer.
   * @type {number}
   */
  this.count = 0;

  /**
   * Current capacity of the event data backing buffer.
   * @type {number}
   * @private
   */
  this.capacity_ = 0;

  /**
   * Event data.
   * This will be recreated many times, so do not hang on to references outside
   * of function scopes.
   * @type {!Uint32Array}
   */
  this.eventData = new Uint32Array(0);

  /**
   * Argument data hash.
   * Index 0 is reserved.
   * @type {!Array.<wtf.db.ArgumentData>}
   */
  this.argumentData_ = [null];

  /**
   * The next ID to assign to inserted argument data.
   * @type {number}
   * @private
   */
  this.nextArgumentDataId_ = 1;

  /**
   * First event time, if any.
   * @type {number}
   * @private
   */
  this.firstEventTime_ = 0;

  /**
   * Last event time, if any.
   * @type {number}
   * @private
   */
  this.lastEventTime_ = 0;

  /**
   * The number of events hidden in the UI.
   * @type {number}
   * @private
   */
  this.hiddenCount_ = 0;

  /**
   * Maximum scope depth.
   * @type {number}
   * @private
   */
  this.maximumScopeDepth_ = 0;

  /**
   * Time of the last event inserted.
   * This is used to detect when a sort is needed.
   * @type {number}
   * @private
   */
  this.lastInsertTime_ = 0;

  /**
   * Whether a resort is needed on the next rebuild.
   * @type {boolean}
   * @private
   */
  this.resortNeeded_ = false;
};


/**
 * Registers an ancillary list that will be updated after event batches.
 * This does not take ownership of the list and it must be disposed elsewhere.
 * @param {!wtf.db.IAncillaryList} value Ancillary list.
 */
wtf.db.EventList.prototype.registerAncillaryList = function(value) {
  this.ancillaryLists_.push(value);
  if (this.count) {
    // NOTE: this is inefficient but will only trigger if there's already data
    // in the database.
    this.rebuildAncillaryLists_([value]);
  }
};


/**
 * Unregisters an ancillary list that will be updated after event batches.
 * @param {!wtf.db.IAncillaryList} value Ancillary list.
 */
wtf.db.EventList.prototype.unregisterAncillaryList = function(value) {
  goog.array.remove(this.ancillaryLists_, value);
};


/**
 * Gets the total number of events in the list.
 * @return {number} Event count.
 */
wtf.db.EventList.prototype.getCount = function() {
  return this.count;
};


/**
 * Gets the time of the first event in the list.
 * @return {number} Time of the first event or 0 if no events.
 */
wtf.db.EventList.prototype.getFirstEventTime = function() {
  return this.firstEventTime_;
};


/**
 * Gets the time of the last event in the list.
 * @return {number} Time of the last event or 0 if no events.
 */
wtf.db.EventList.prototype.getLastEventTime = function() {
  return this.lastEventTime_;
};


/**
 * Gets the total number of 'real' events in the list.
 * This excludes scope leaves and other misc events hidden in the UI.
 * @return {number} Event count.
 */
wtf.db.EventList.prototype.getTotalEventCount = function() {
  return this.count - this.hiddenCount_;
};


/**
 * Gets the maximum depth of any scope in the list.
 * @return {number} Scope depth.
 */
wtf.db.EventList.prototype.getMaximumScopeDepth = function() {
  return this.maximumScopeDepth_;
};


/**
 * Inserts an event into the list.
 * @param {!wtf.db.EventType} eventType Event type.
 * @param {number} time Time, in microseconds.
 * @param {wtf.db.ArgumentData=} opt_argData Argument data.
 */
wtf.db.EventList.prototype.insert = function(eventType, time, opt_argData) {
  // Grow the event data store, if required.
  if (this.count + 1 >= this.capacity_) {
    // TODO(benvanik): better growth characteristics.
    this.capacity_ = Math.max(this.capacity_ * 2, 1024);
    var newSize = this.capacity_ * wtf.db.EventStruct.STRUCT_SIZE;
    var newData = new Uint32Array(newSize);
    var oldData = this.eventData;
    for (var n = 0; n < this.count * wtf.db.EventStruct.STRUCT_SIZE; n++) {
      newData[n] = oldData[n];
    }
    this.eventData = newData;
  }

  // Prep the event and return.
  var eventData = this.eventData;
  var o = this.count * wtf.db.EventStruct.STRUCT_SIZE;
  eventData[o + wtf.db.EventStruct.ID] = this.count;
  eventData[o + wtf.db.EventStruct.TYPE] = eventType.id;
  eventData[o + wtf.db.EventStruct.PARENT] = -1;
  eventData[o + wtf.db.EventStruct.TIME] = time;

  // If we were provided argument data, set here.
  if (opt_argData) {
    var args = opt_argData;
    args.id = this.nextArgumentDataId_++;
    this.argumentData_[args.id] = args;
    eventData[o + wtf.db.EventStruct.ARGUMENTS] = args.id;
  }

  this.count++;

  // Detect if a resort is needed.
  if (time < this.lastInsertTime_) {
    this.resortNeeded_ = true;
  }
  this.lastInsertTime_ = time;
};


/**
 * Rebuilds the internal event list data after a batch insertion.
 */
wtf.db.EventList.prototype.rebuild = function() {
  // Sort all events by time|id.
  var t0 = wtf.now();
  if (this.resortNeeded_) {
    this.resortEvents_();
    this.resortNeeded_ = false;
  }
  var t1 = wtf.now();

  // Reset stats.
  this.firstEventTime_ = 0;
  this.lastEventTime_ = 0;
  if (this.count) {
    var it = new wtf.db.EventIterator(this, 0, this.count - 1, 0);
    this.firstEventTime_ = it.getTime();
    it.seek(this.count - 1);
    this.lastEventTime_ = it.isScope() ? it.getEndTime() : it.getTime();
  }

  // Setup all scopes.
  // This builds parenting relationships and computes times.
  // It must occur after renumbering so that references are valid.
  var t2 = wtf.now();
  this.rescopeEvents_();
  var t3 = wtf.now();

  // Rebuild all ancillary lists.
  var t4 = wtf.now();
  this.rebuildAncillaryLists_(this.ancillaryLists_);
  var t5 = wtf.now();

  // goog.global.console.log('db resort', t1 - t0);
  // goog.global.console.log('db rescope', t3 - t2);
  // goog.global.console.log('db ancillary', t5 - t4);
};


/**
 * Resorts all event data in the backing buffer to be in time|id order.
 * @private
 */
wtf.db.EventList.prototype.resortEvents_ = function() {
  var eventData = this.eventData;

  // Build the sort index, used for sorting.
  // This allows us to run the sort and just shift around indices instead of
  // shifting around the real event data.
  var sortIndex = new Array(this.count);
  for (var n = 0; n < sortIndex.length; n++) {
    sortIndex[n] = n;
  }

  // Sort.
  sortIndex.sort(function(ai, bi) {
    var ao = ai * wtf.db.EventStruct.STRUCT_SIZE;
    var bo = bi * wtf.db.EventStruct.STRUCT_SIZE;
    var atime = eventData[ao + wtf.db.EventStruct.TIME];
    var btime = eventData[bo + wtf.db.EventStruct.TIME];
    if (atime == btime) {
      return eventData[ao + wtf.db.EventStruct.ID] -
          eventData[bo + wtf.db.EventStruct.ID];
    }
    return atime - btime;
  });

  // Rearrange the event data by the new sort index.
  // TODO(benvanik): do this in-place without the duplication.
  var newData = new Uint32Array(eventData.length);
  for (var n = 0; n < sortIndex.length; n++) {
    var oldOffset = sortIndex[n] * wtf.db.EventStruct.STRUCT_SIZE;
    var newOffset = n * wtf.db.EventStruct.STRUCT_SIZE;
    for (var si = oldOffset, di = newOffset;
        si < oldOffset + wtf.db.EventStruct.STRUCT_SIZE; si++, di++) {
      newData[di] = eventData[si];
    }
  }

  // Renumber all events to match their current order.
  for (var n = 0, o = 0; n < this.count; n++) {
    newData[o + wtf.db.EventStruct.ID] = n;
    o += wtf.db.EventStruct.STRUCT_SIZE;
  }

  this.eventData = newData;
};


/**
 * Rebuilds the scoping data of events.
 * @private
 */
wtf.db.EventList.prototype.rescopeEvents_ = function() {
  // All events used are already declared.
  var scopeEnter = this.eventTypeTable.getByName('wtf.scope#enter');
  var scopeEnterId = scopeEnter ? scopeEnter.id : -1;
  var scopeLeave = this.eventTypeTable.getByName('wtf.scope#leave');
  var scopeLeaveId = scopeLeave ? scopeLeave.id : -1;
  var appendScopeData = this.eventTypeTable.getByName('wtf.scope#appendData');
  var appendScopeDataId = appendScopeData ? appendScopeData.id : -1;
  var timeStamp = this.eventTypeTable.getByName('wtf.trace#timeStamp');
  var timeStampId = timeStamp ? timeStamp.id : -1;

  // This stack is used to track the currently active scopes while scanning
  // forward.
  var MAX_CALLSTACK_SIZE = 1024;
  var stack = new Uint32Array(MAX_CALLSTACK_SIZE);
  var typeStack = new Array(MAX_CALLSTACK_SIZE);
  var childTimeStack = new Uint32Array(MAX_CALLSTACK_SIZE);
  var systemTimeStack = new Uint32Array(MAX_CALLSTACK_SIZE);
  var stackTop = 0;
  var stackMax = 0;
  stack[0] = -1;
  typeStack[0] = null;

  var hiddenCount = 0;

  // Directly poke into the event data array for speed.
  var eventData = this.eventData;
  for (var n = 0, o = 0; n < this.count;
      n++, o += wtf.db.EventStruct.STRUCT_SIZE) {
    var parentId = stack[stackTop];
    eventData[o + wtf.db.EventStruct.PARENT] = parentId;
    eventData[o + wtf.db.EventStruct.DEPTH] = stackTop;

    // Set the next sibling to the next event.
    // If this is an scope enter then the leave will fix it up.
    var nextEventId = 0;
    if (n < this.count - 1) {
      nextEventId =
          eventData[o + wtf.db.EventStruct.STRUCT_SIZE + wtf.db.EventStruct.ID];
    }
    eventData[o + wtf.db.EventStruct.NEXT_SIBLING] = nextEventId;

    var typeId = eventData[o + wtf.db.EventStruct.TYPE];
    var deleteArgs = false;
    if (typeId == scopeEnterId) {
      // Generic scope enter.
      // We replace this with an on-demand event type.
      var args =
          this.argumentData_[eventData[o + wtf.db.EventStruct.ARGUMENTS]];
      var name = /** @type {string} */ (args.get('name'));
      var newEventType = this.eventTypeTable.getByName(name);
      if (!newEventType) {
        newEventType = this.eventTypeTable.defineType(
            wtf.db.EventType.createScope(name));
      }
      typeId = newEventType.id;
      eventData[o + wtf.db.EventStruct.TYPE] = newEventType.id;
      stack[++stackTop] = eventData[o + wtf.db.EventStruct.ID];
      typeStack[stackTop] = newEventType;
      stackMax = Math.max(stackMax, stackTop);
      deleteArgs = true;
    } else if (typeId == scopeLeaveId) {
      // Scope leave.
      eventData[o + wtf.db.EventStruct.NEXT_SIBLING] = 0;
      if (stackTop) {
        stackTop--;

        var scopeOffset = parentId * wtf.db.EventStruct.STRUCT_SIZE;
        eventData[scopeOffset + wtf.db.EventStruct.NEXT_SIBLING] = nextEventId;
        var time = eventData[o + wtf.db.EventStruct.TIME];
        var duration = time - eventData[scopeOffset + wtf.db.EventStruct.TIME];
        eventData[scopeOffset + wtf.db.EventStruct.END_TIME] = time;

        // Accumulate timing data.
        // Computed on the stack so we don't have to rewalk events.
        // We roll the system time up into the parent level so that system times
        // are attributed all the way up.
        var childTime = childTimeStack[stackTop];
        var systemTime = systemTimeStack[stackTop];
        eventData[scopeOffset + wtf.db.EventStruct.CHILD_TIME] = childTime;
        eventData[scopeOffset + wtf.db.EventStruct.SYSTEM_TIME] = systemTime;
        childTimeStack[stackTop] = 0;
        systemTimeStack[stackTop] = 0;
        if (stackTop) {
          childTimeStack[stackTop - 1] += duration;
          if (typeStack[stackTop].flags & wtf.data.EventFlag.SYSTEM_TIME) {
            systemTimeStack[stackTop - 1] += duration;
          }
        }
      }
      hiddenCount++;
    } else if (typeId == appendScopeDataId) {
      // appendScopeData.
      this.appendScopeData_(
          stack[stackTop], eventData[o + wtf.db.EventStruct.ARGUMENTS]);
      hiddenCount++;
      deleteArgs = true;
    } else if (typeId == timeStampId) {
      // Generic timestamp.
      // Replace with an on-demand event type.
      var args =
          this.argumentData_[eventData[o + wtf.db.EventStruct.ARGUMENTS]];
      var name = /** @type {string} */ (args.get('name'));
      var newEventType = this.eventTypeTable.getByName(name);
      if (!newEventType) {
        newEventType = this.eventTypeTable.defineType(
            wtf.db.EventType.createInstance(name));
      }
      typeId = newEventType.id;
      eventData[o + wtf.db.EventStruct.TYPE] = newEventType.id;
      deleteArgs = true;
    } else {
      // Remaining event types.
      var type = this.eventTypeTable.getById(typeId);
      if (type.eventClass == wtf.data.EventClass.SCOPE) {
        // Scope enter.
        stack[++stackTop] = eventData[o + wtf.db.EventStruct.ID];
        typeStack[stackTop] = type;
        if (stackTop > stackMax) {
          stackMax = stackTop;
        }
      }
      if (type.flags &
          (wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.BUILTIN)) {
        hiddenCount++;
      }
    }

    if (deleteArgs) {
      var argsId = eventData[o + wtf.db.EventStruct.ARGUMENTS];
      this.argumentData_[argsId] = null;
      eventData[o + wtf.db.EventStruct.ARGUMENTS] = 0;
    }

    if (stackTop >= MAX_CALLSTACK_SIZE) {
      goog.global.console.log('Max scope depth exceeded, aborting!');
      break;
    }
  }

  this.hiddenCount_ = hiddenCount;
  this.maximumScopeDepth_ = stackMax;
};


/**
 * Handles an append scope data event by merging the arguments into the given
 * parent scope.
 * @param {number} scopeId Scope event ID.
 * @param {number} argsId Argument data ID to append.
 * @private
 */
wtf.db.EventList.prototype.appendScopeData_ = function(scopeId, argsId) {
  var eventData = this.eventData;
  var o = scopeId * wtf.db.EventStruct.STRUCT_SIZE;
  var scopeArgsId = eventData[o + wtf.db.EventStruct.ARGUMENTS];
  var scopeArgs = null;
  if (scopeArgsId) {
    // Grab args.
    scopeArgs = this.argumentData_[scopeArgsId];
  } else {
    // Scope had no args, so create.
    scopeArgs = new wtf.db.ArgumentData();
    scopeArgs.id = this.nextArgumentDataId_++;
    this.argumentData_[scopeArgs.id] = scopeArgs;
    eventData[o + wtf.db.EventStruct.ARGUMENTS] = scopeArgs.id;
  }

  var srcArgs = this.argumentData_[argsId];
  scopeArgs.set(
      /** @type {string} */ (srcArgs.get('name')),
      srcArgs.get('value'));
};


/**
 * Rebuilds dependent ancillary lists.
 * @param {!Array.<!wtf.db.IAncillaryList>} lists Lists.
 * @private
 */
wtf.db.EventList.prototype.rebuildAncillaryLists_ = function(lists) {
  if (!lists.length) {
    return;
  }

  // Map of type ids -> list of ancillary lists and the types they registered.
  var typeMap = {};

  // Begin rebuild on all lists to gather types that we need.
  for (var n = 0; n < lists.length; n++) {
    var list = lists[n];
    var desiredTypes = list.beginRebuild(this.eventTypeTable);
    for (var m = 0; m < desiredTypes.length; m++) {
      var desiredType = desiredTypes[m];
      if (!desiredType) {
        continue;
      }
      var handlers = typeMap[desiredType.id];
      if (!handlers) {
        typeMap[desiredType.id] = handlers = [];
      }
      handlers.push({
        list: list,
        eventTypeIndex: m,
        eventType: desiredType
      });
    }
  }

  // Run through all events and dispatch to their handlers.
  var eventData = this.eventData;
  var it = new wtf.db.EventIterator(this, 0, this.count - 1, 0);
  for (var n = 0, o = 0; n < this.count; n++) {
    var typeId = eventData[o + wtf.db.EventStruct.TYPE];
    var handlers = typeMap[typeId];
    if (handlers) {
      for (var m = 0; m < handlers.length; m++) {
        // Reset the iterator each handler in case the handler messes with it.
        it.seek(n);
        var handler = handlers[m];
        handler.list.handleEvent(handler.eventTypeIndex, handler.eventType, it);
      }
    }
    o += wtf.db.EventStruct.STRUCT_SIZE;
  }

  // Call end rebuild so the lists can clean up.
  for (var n = 0; n < lists.length; n++) {
    var list = lists[n];
    list.endRebuild();
  }
};


/**
 * Gets the argument data with the given ID.
 * @param {number} argsId Key into the argument data table.
 * @return {wtf.db.ArgumentData} Argument data, if any.
 */
wtf.db.EventList.prototype.getArgumentData = function(argsId) {
  return this.argumentData_[argsId] || null;
};


/**
 * Dumps the event list to the console for debugging.
 */
wtf.db.EventList.prototype.dump = function() {
  var it = new wtf.db.EventIterator(this, 0, this.count - 1, 0);
  for (; !it.done(); it.next()) {
    var s = '';
    var d = it.getDepth();
    while (d--) {
      s += '  ';
    }
    s += wtf.util.formatTime(it.getTime() / 1000);
    s += ' ';
    s += it.getType().getName();
    goog.global.console.log(s);
  }
};


/**
 * Begins iterating the entire event list.
 * @return {!wtf.db.EventIterator} Iterator.
 */
wtf.db.EventList.prototype.begin = function() {
  return new wtf.db.EventIterator(
      this, 0, this.count - 1, 0);
};


/**
 * Begins iterating the given time-based subset of the event list.
 * @param {number} startTime Start time.
 * @param {number} endTime End time.
 * @param {boolean=} opt_startAtRoot Whether to start at the enclosing root
 *     scope.
 * @return {!wtf.db.EventIterator} Iterator.
 */
wtf.db.EventList.prototype.beginTimeRange = function(
    startTime, endTime, opt_startAtRoot) {
  var startIndex = opt_startAtRoot ?
      this.getIndexOfRootScopeIncludingTime(startTime) :
      this.getIndexOfEventNearTime(startTime);
  var endIndex = this.getIndexOfEventNearTime(endTime);
  if (endIndex < startIndex) {
    endIndex = startIndex;
  }
  return this.beginEventRange(startIndex, endIndex);
};


/**
 * Begins iterating the given event index-based subset of the event list.
 * @param {number} startIndex Start index.
 * @param {number} endIndex End index.
 * @return {!wtf.db.EventIterator} Iterator.
 */
wtf.db.EventList.prototype.beginEventRange = function(startIndex, endIndex) {
  return new wtf.db.EventIterator(
      this, startIndex, endIndex, startIndex);
};


/**
 * Gets the index of the event near the given time.
 * If there is no event at the given time the one before it is returned.
 * @param {number} time Time.
 * @return {number} Event index.
 */
wtf.db.EventList.prototype.getIndexOfEventNearTime = function(time) {
  time *= 1000;
  var eventData = this.eventData;
  var low = 0;
  var high = this.count - 1;
  while (low < high) {
    var mid = ((low + high) / 2) | 0;
    var o = mid * wtf.db.EventStruct.STRUCT_SIZE;
    var midValue = eventData[o + wtf.db.EventStruct.TIME];
    if (midValue < time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low ? low - 1 : 0;
};


/**
 * Gets an iterator on the event near the given time.
 * @param {number} time Time.
 * @return {!wtf.db.EventIterator} Iterator.
 */
wtf.db.EventList.prototype.getEventNearTime = function(time) {
  var id = this.getIndexOfEventNearTime(time);
  return this.getEvent(id);
};


/**
 * Gets the index of the first root scope including the given time.
 * This is useful when drawing to ensure that scopes intersecting the viewport
 * are visible. If no root scope is found that includes the given time then the
 * behavior will be like {@see #getIndexOfEventNearTime}.
 * @param {number} time Time to ensure is included.
 * @return {number} Event ID or 0 if not found.
 */
wtf.db.EventList.prototype.getIndexOfRootScopeIncludingTime = function(time) {
  var nearId = this.getIndexOfEventNearTime(time);
  if (!nearId) {
    return 0;
  }
  time *= 1000;

  var eventData = this.eventData;
  var i = nearId;
  while (i >= 0) {
    // Move to the root scope.
    var o = i * wtf.db.EventStruct.STRUCT_SIZE;
    var depth = eventData[o + wtf.db.EventStruct.DEPTH];
    while (depth-- > 0) {
      o = i * wtf.db.EventStruct.STRUCT_SIZE;
      i = eventData[o + wtf.db.EventStruct.PARENT];
    }
    o = i * wtf.db.EventStruct.STRUCT_SIZE;

    // If it's a scope, probably found!
    if (!!eventData[o + wtf.db.EventStruct.END_TIME]) {
      // Found a root scope.
      var endTime = eventData[o + wtf.db.EventStruct.END_TIME];
      if (endTime < time) {
        // Root scope ends before the requested time - just return near ID.
        return nearId;
      } else {
        // Root scope includes the time.
        return i;
      }
    }

    i--;
  }

  return nearId;
};


/**
 * Gets an iterator for the given event.
 * @param {number} id Event ID.
 * @return {!wtf.db.EventIterator} Iterator.
 */
wtf.db.EventList.prototype.getEvent = function(id) {
  return new wtf.db.EventIterator(this, id, id, id);
};


goog.exportSymbol(
    'wtf.db.EventList',
    wtf.db.EventList);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getCount',
    wtf.db.EventList.prototype.getCount);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getFirstEventTime',
    wtf.db.EventList.prototype.getFirstEventTime);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getLastEventTime',
    wtf.db.EventList.prototype.getLastEventTime);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getTotalEventCount',
    wtf.db.EventList.prototype.getTotalEventCount);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getMaximumScopeDepth',
    wtf.db.EventList.prototype.getMaximumScopeDepth);
goog.exportProperty(
    wtf.db.EventList.prototype, 'dump',
    wtf.db.EventList.prototype.dump);
goog.exportProperty(
    wtf.db.EventList.prototype, 'begin',
    wtf.db.EventList.prototype.begin);
goog.exportProperty(
    wtf.db.EventList.prototype, 'beginTimeRange',
    wtf.db.EventList.prototype.beginTimeRange);
goog.exportProperty(
    wtf.db.EventList.prototype, 'beginEventRange',
    wtf.db.EventList.prototype.beginEventRange);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getIndexOfEventNearTime',
    wtf.db.EventList.prototype.getIndexOfEventNearTime);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getEventNearTime',
    wtf.db.EventList.prototype.getEventNearTime);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getIndexOfRootScopeIncludingTime',
    wtf.db.EventList.prototype.getIndexOfRootScopeIncludingTime);
goog.exportProperty(
    wtf.db.EventList.prototype, 'getEvent',
    wtf.db.EventList.prototype.getEvent);
