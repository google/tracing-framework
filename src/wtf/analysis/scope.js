/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Scope tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.Scope');

goog.require('wtf.data.EventFlag');



/**
 * Scope tracking utility.
 * A stateful object that is used to help tracking scopes.
 * @constructor
 */
wtf.analysis.Scope = function() {
  /**
   * Analysis-session-unique ID.
   * @type {number}
   * @private
   */
  this.id_ = wtf.analysis.Scope.nextId_++;

  /**
   * Enter event for the scope.
   * @type {wtf.analysis.ScopeEvent}
   * @private
   */
  this.enterEvent_ = null;

  /**
   * Leave event for the scope.
   * @type {wtf.analysis.Event}
   * @private
   */
  this.leaveEvent_ = null;

  /**
   * A list of events that add data to this scope.
   * @type {Array.<!wtf.analysis.Event>}
   * @private
   */
  this.dataEvents_ = null;

  /**
   * Parent scope, if this is not a root.
   * @type {wtf.analysis.Scope}
   * @private
   */
  this.parent_ = null;

  /**
   * Scope depth (distance from the root).
   * @type {number}
   * @private
   */
  this.depth_ = 0;

  /**
   * Child scopes, if any.
   * @type {!Array.<!wtf.analysis.Scope>}
   * @private
   */
  this.children_ = [];

  /**
   * Total amount of time of all child system times.
   * @type {number}
   * @private
   */
  this.totalChildSystemTime_ = 0;

  /**
   * Rendering data used by applications.
   * This is only used as storage and may be unpopulated.
   * @type {Object|number|string}
   * @private
   */
  this.renderData_ = null;
};


/**
 * ID allocator for session-unique scope IDs.
 * @type {number}
 * @private
 */
wtf.analysis.Scope.nextId_ = 0;


/**
 * Gets an ID that can be used to track the scope during the analysis session.
 * @return {number} Analysis session unique ID.
 */
wtf.analysis.Scope.prototype.getId = function() {
  return this.id_;
};


/**
 * Gets the enter event for the scope.
 * @return {wtf.analysis.ScopeEvent} Enter event, if any.
 */
wtf.analysis.Scope.prototype.getEnterEvent = function() {
  return this.enterEvent_;
};


/**
 * Sets the enter event for the scope.
 * @param {!wtf.analysis.ScopeEvent} e Event.
 */
wtf.analysis.Scope.prototype.setEnterEvent = function(e) {
  this.enterEvent_ = e;
};


/**
 * Gets the leave event for the scope.
 * @return {wtf.analysis.Event} Leave event, if any.
 */
wtf.analysis.Scope.prototype.getLeaveEvent = function() {
  return this.leaveEvent_;
};


/**
 * Sets the leave event for the scope.
 * @param {!wtf.analysis.Event} e Event.
 */
wtf.analysis.Scope.prototype.setLeaveEvent = function(e) {
  this.leaveEvent_ = e;
};


/**
 * Adds a data event.
 * This events arguments will be used when building the scope argument list.
 * @param {!wtf.analysis.Event} e Event to add.
 */
wtf.analysis.Scope.prototype.addDataEvent = function(e) {
  if (!this.dataEvents_) {
    this.dataEvents_ = [e];
  } else {
    this.dataEvents_.push(e);
  }
};


/**
 * Gets the scope data as a key-value map.
 * This is all scope enter arguments as well as any data appended by events.
 * @return {Object} Scope arguments/data, if any.
 */
wtf.analysis.Scope.prototype.getData = function() {
  var data = {};
  if (this.enterEvent_) {
    var argTypes = this.enterEvent_.eventType.args;
    for (var n = 0; n < argTypes.length; n++) {
      var arg = argTypes[n];
      data[arg.name] = this.enterEvent_.args[arg.name];
    }
  }
  if (this.dataEvents_) {
    for (var n = 0; n < this.dataEvents_.length; n++) {
      var e = this.dataEvents_[n];
      if (e.eventType.flags & wtf.data.EventFlag.INTERNAL) {
        // name-value pair from the builtin appending functions.
        data[e.args['name']] = goog.global.JSON.parse(e.args['json']);
      } else {
        // Custom appender, use args.
        for (var m = 0; m < e.eventType.args.length; m++) {
          var arg = e.eventType.args[m];
          data[arg.name] = e.args[arg.name];
        }
      }
    }
  }
  return data;
};


/**
 * Gets the parent scope, if this is not a root.
 * @return {wtf.analysis.Scope} Parent scope, if any.
 */
wtf.analysis.Scope.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Gets the depth (distance from root) of this scope.
 * @return {number} Scope depth.
 */
wtf.analysis.Scope.prototype.getDepth = function() {
  return this.depth_;
};


/**
 * Gets the duration of the scope.
 * This may exclude tracing time.
 * @return {number} Total duration of the scope including system time.
 */
wtf.analysis.Scope.prototype.getTotalDuration = function() {
  if (this.enterEvent_ && this.leaveEvent_) {
    return this.leaveEvent_.time - this.enterEvent_.time;
  }
  return 0;
};


/**
 * Gets the duration of the scope minus system time.
 * @return {number} TOtal duration of the scope excluding system time.
 */
wtf.analysis.Scope.prototype.getUserDuration = function() {
  if (this.enterEvent_ && this.leaveEvent_) {
    return this.leaveEvent_.time - this.enterEvent_.time -
        this.totalChildSystemTime_;
  }
  return 0;
};


/**
 * Adds a child scope.
 * @param {!wtf.analysis.Scope} child Child scope.
 */
wtf.analysis.Scope.prototype.addChild = function(child) {
  child.parent_ = this;
  child.depth_ = this.depth_ + 1;
  this.children_.push(child);
};


/**
 * Gets a list of all child scopes.
 * @return {!Array.<!wtf.analysis.Scope>} Child scopes. Do not modify.
 */
wtf.analysis.Scope.prototype.getChildren = function() {
  return this.children_;
};


/**
 * Subtracts this scopes duration from all of its ancestors.
 * This can be used on system scopes to make the user time of ancestors less
 * than their total time.
 */
wtf.analysis.Scope.prototype.adjustSystemTime = function() {
  var duration = this.getTotalDuration();
  this.totalChildSystemTime_ = duration;
  var scope = this.parent_;
  while (scope) {
    scope.totalChildSystemTime_ += duration;
    scope = scope.parent_;
  }
};


/**
 * Gets the application-defined render data of the scope.
 * @return {Object|number|string} Render data, if any.
 */
wtf.analysis.Scope.prototype.getRenderData = function() {
  return this.renderData_;
};


/**
 * Sets the application-defined render data of the scope.
 * @param {Object|number|string} value New render data value.
 */
wtf.analysis.Scope.prototype.setRenderData = function(value) {
  this.renderData_ = value;
};


goog.exportSymbol(
    'wtf.analysis.Scope',
    wtf.analysis.Scope);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getId',
    wtf.analysis.Scope.prototype.getId);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getEnterEvent',
    wtf.analysis.Scope.prototype.getEnterEvent);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getLeaveEvent',
    wtf.analysis.Scope.prototype.getLeaveEvent);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getData',
    wtf.analysis.Scope.prototype.getData);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getParent',
    wtf.analysis.Scope.prototype.getParent);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getDepth',
    wtf.analysis.Scope.prototype.getDepth);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getTotalDuration',
    wtf.analysis.Scope.prototype.getTotalDuration);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getUserDuration',
    wtf.analysis.Scope.prototype.getUserDuration);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getChildren',
    wtf.analysis.Scope.prototype.getChildren);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'getRenderData',
    wtf.analysis.Scope.prototype.getRenderData);
goog.exportProperty(
    wtf.analysis.Scope.prototype, 'setRenderData',
    wtf.analysis.Scope.prototype.setRenderData);
