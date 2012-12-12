/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Zone-based index.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.ZoneIndex');

goog.require('wtf.analysis.ScopeEvent');
goog.require('wtf.analysis.db.EventList');
goog.require('wtf.data.EventClass');
goog.require('wtf.data.EventFlag');



/**
 * An in-memory index of events by the zone they occur in.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener.
 * @param {!wtf.analysis.Zone} zone Zone this index matches.
 * @constructor
 * @extends {wtf.analysis.db.EventList}
 */
wtf.analysis.db.ZoneIndex = function(traceListener, zone) {
  goog.base(this);

  /**
   * Zone this index is matching.
   * @type {!wtf.analysis.Zone}
   * @private
   */
  this.zone_ = zone;

  /**
   * Accumulated total time in root scopes in this zone.
   * @type {number}
   * @private
   */
  this.rootTotalTime_ = 0;

  /**
   * Accumulated user time in root scopes in this zone.
   * @type {number}
   * @private
   */
  this.rootUserTime_ = 0;

  // Hacky, but stash the well-known event types that we will be comparing
  // with to dramatically improve performance.
  /**
   * Lookup for common event types.
   * @type {!Object.<wtf.analysis.EventType>}
   * @private
   */
  this.eventTypes_ = {
    scopeLeave: traceListener.getEventType('wtf.scope.leave')
  };

  /**
   * The current open scope inside of an insertion block.
   * This is used to quickly append scopes while streaming in-order.
   * It is cleared when the scope depth reaches zero or a batch ends. If it is
   * not set then an event insert should search to find the right scope (it may
   * be out of order).
   * @type {wtf.analysis.Scope}
   * @private
   */
  this.currentScope_ = null;

  /**
   * The time of the last event added in-order.
   * @type {number}
   * @private
   */
  this.lastAddEventTime_ = 0;

  /**
   * A list of out-of-order adds in the current batch.
   * This will have their scopes set properly at batch end.
   * @type {!Array.<!wtf.analysis.Event>}
   * @private
   */
  this.pendingOutOfOrderEvents_ = [];

  /**
   * Scopes that have the system flag set in the current batch.
   * Ancestor scopes will have their user times adjusted at batch end.
   * @type {!Array.<!wtf.analysis.Scope>}
   * @private
   */
  this.pendingSystemScopes_ = [];
};
goog.inherits(wtf.analysis.db.ZoneIndex, wtf.analysis.db.EventList);


/**
 * Gets the zone this index is matching.
 * @return {!wtf.analysis.Zone} Zone.
 */
wtf.analysis.db.ZoneIndex.prototype.getZone = function() {
  return this.zone_;
};


/**
 * Gets the total amount of time spent in any scope in this zone, including
 * system time.
 * @return {number} Total time.
 */
wtf.analysis.db.ZoneIndex.prototype.getRootTotalTime = function() {
  return this.rootTotalTime_;
};


/**
 * Gets the total amount of time spent in any scope in this zone, excluding
 * system time.
 * @return {number} Total time.
 */
wtf.analysis.db.ZoneIndex.prototype.getRootUserTime = function() {
  return this.rootUserTime_;
};


/**
 * @override
 */
wtf.analysis.db.ZoneIndex.prototype.beginInserting = function() {
  wtf.analysis.db.EventList.prototype.beginInserting.call(this);
  this.currentScope_ = null;
  this.lastAddEventTime_ = this.getLastEventTime();
};


/**
 * @override
 */
wtf.analysis.db.ZoneIndex.prototype.insertEvent = function(e) {
  if (e.zone == this.zone_) {
    // Here be dragons...
    // This attempts to insert scopes fast (by looking at the current scope)
    // while also supported out-of-order adds to existing scopes by queuing them
    // for later.
    if (e.time < this.lastAddEventTime_) {
      // Event is out of order - add to the pending list.
      this.pendingOutOfOrderEvents_.push(e);
    } else {
      this.lastAddEventTime_ = e.time;
      var eventType = e.eventType;
      if (eventType.eventClass == wtf.data.EventClass.SCOPE) {
        // Scope enter event.
        if (this.currentScope_) {
          this.currentScope_.addChild(
              /** @type {!wtf.analysis.Scope} */ (e.scope));
        }
        this.currentScope_ = e.scope;
        if (eventType.flags & wtf.data.EventFlag.SYSTEM_TIME) {
          this.pendingSystemScopes_.push(e.scope);
        }
      } else if (eventType == this.eventTypes_.scopeLeave) {
        // Scope leave event.
        // Leaves the current scope, if any. Unmatched leaves are ignored.
        var scope = this.currentScope_;
        e.setScope(scope);
        if (scope) {
          scope.setLeaveEvent(e);
          this.currentScope_ = scope.getParent();
        }
      } else if (eventType.flags & wtf.data.EventFlag.APPEND_SCOPE_DATA) {
        if (this.currentScope_) {
          this.currentScope_.addDataEvent(e);
        }
      } else {
        // Attach the event to the current scope.
        if (this.currentScope_) {
          e.setScope(this.currentScope_);
        }
      }
    }

    // We manually call base method instead of using goog.base because this
    // method is called often enough to have a major impact on load time
    // in debug mode.
    wtf.analysis.db.EventList.prototype.insertEvent.call(this, e);
  }
};


/**
 * @override
 */
wtf.analysis.db.ZoneIndex.prototype.endInserting = function() {
  this.currentScope_ = null;

  // Process out-of-order events.
  // TODO(benvanik): a more generalized solution that handles reverse lists.
  var currentScope = null;
  for (var n = 0; n < this.pendingOutOfOrderEvents_.length; n++) {
    var e = this.pendingOutOfOrderEvents_[n];
    var eventType = e.eventType;
    if (eventType.eventClass == wtf.data.EventClass.SCOPE) {
      var parentScope = this.findEnclosingScope(e.time);
      if (parentScope) {
        parentScope.addChild(
            /** @type {!wtf.analysis.Scope} */ (e.scope));
      }
      currentScope = e.scope;
      if (eventType.flags & wtf.data.EventFlag.SYSTEM_TIME) {
        this.pendingSystemScopes_.push(e.scope);
      }
    } else if (eventType == this.eventTypes_.scopeLeave) {
      e.setScope(currentScope);
      if (currentScope) {
        currentScope.setLeaveEvent(e);
        currentScope = null;
      }
    } else if (eventType.flags & wtf.data.EventFlag.APPEND_SCOPE_DATA) {
      if (currentScope) {
        currentScope.addDataEvent(e);
      }
    } else {
      e.setScope(currentScope);
    }
  }
  this.pendingOutOfOrderEvents_.length = 0;

  // Reconcile pending system time scopes by subtracing their duratino from
  // their ancestors.
  // This must be done here as out of order events could have added scopes
  // and such.
  for (var n = 0; n < this.pendingSystemScopes_.length; n++) {
    var scope = this.pendingSystemScopes_[n];
    scope.adjustSystemTime();
  }
  this.pendingSystemScopes_.length = 0;

  wtf.analysis.db.EventList.prototype.endInserting.call(this);

  // TODO(benvanik): don't waste so much time.
  // Compute root times. This could be done a bit smarter.
  this.rootTotalTime_ = 0;
  this.rootUserTime_ = 0;
  this.forEach(Number.MIN_VALUE, Number.MAX_VALUE, function(e) {
    if (e instanceof wtf.analysis.ScopeEvent &&
        e.scope.getDepth() == 0) {
      this.rootTotalTime_ += e.scope.getTotalDuration();
      this.rootUserTime_ += e.scope.getUserDuration();
    }
  }, this);
};


goog.exportProperty(
    wtf.analysis.db.ZoneIndex.prototype, 'getZone',
    wtf.analysis.db.ZoneIndex.prototype.getZone);
goog.exportProperty(
    wtf.analysis.db.ZoneIndex.prototype, 'getRootTotalTime',
    wtf.analysis.db.ZoneIndex.prototype.getRootTotalTime);
goog.exportProperty(
    wtf.analysis.db.ZoneIndex.prototype, 'getRootUserTime',
    wtf.analysis.db.ZoneIndex.prototype.getRootUserTime);
