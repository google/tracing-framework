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
