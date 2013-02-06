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

goog.require('goog.asserts');
goog.require('wgxpath.Node');
goog.require('wtf.data.EventFlag');
goog.require('wtf.util');



/**
 * Scope tracking utility.
 * A stateful object that is used to help tracking scopes.
 * @constructor
 * @implements {wgxpath.Node}
 */
wtf.analysis.Scope = function() {
  // TODO(benvanik): set owner document
  /**
   * @type {wgxpath.Node}
   */
  this.rootNode = null;

  /**
   * Analysis-session-unique ID.
   * @type {number}
   * @private
   */
  this.id_ = wtf.analysis.Scope.nextId_++;

  /**
   * Name, populated from enter event when set.
   * @type {string}
   * @private
   */
  this.name_ = '';

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
   * Cached attributes list.
   * This contains only those attributes that we show to the user regularly.
   * Generated on demand by {@see #cacheAttributes_}.
   * @type {Array.<!wgxpath.Attr>}
   * @private
   */
  this.userAttrs_ = null;

  /**
   * Cached attributes list.
   * Generated on demand by {@see #cacheAttributes_}.
   * @type {Array.<!wgxpath.Attr>}
   * @private
   */
  this.allAttrs_ = null;

  /**
   * Cached attributes mapped by name.
   * Generated on demand by {@see #cacheAttributes_}.
   * @type {Object.<!wgxpath.Attr>}
   * @private
   */
  this.allAttrsByName_ = null;

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
   * Total time of all children, including system time.
   * @type {number}
   * @private
   */
  this.totalChildTime_ = 0;

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
 * @override
 */
wtf.analysis.Scope.prototype.toString = function() {
  return this.name_;
};


/**
 * Gets an ID that can be used to track the scope during the analysis session.
 * @return {number} Analysis session unique ID.
 */
wtf.analysis.Scope.prototype.getId = function() {
  return this.id_;
};


/**
 * Gets the scope event type name.
 * @return {string} Event type name.
 */
wtf.analysis.Scope.prototype.getName = function() {
  return this.name_;
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
  this.name_ = e.eventType.name;

  this.userAttrs_ = null;
  this.allAttrsByName_ = null;

  this.enterEvent_ = e;
};


/**
 * Gets the time the scope was entered, if it was.
 * @return {number} Time of enter or 0.
 */
wtf.analysis.Scope.prototype.getEnterTime = function() {
  return this.enterEvent_ ? this.enterEvent_.time : 0;
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
  this.userAttrs_ = null;
  this.allAttrsByName_ = null;

  this.leaveEvent_ = e;
};


/**
 * Gets the time the scope was left, if it was.
 * @return {number} Time of leave or 0.
 */
wtf.analysis.Scope.prototype.getLeaveTime = function() {
  return this.leaveEvent_ ? this.leaveEvent_.time : 0;
};


/**
 * Adds a data event.
 * This events arguments will be used when building the scope argument list.
 * @param {!wtf.analysis.Event} e Event to add.
 */
wtf.analysis.Scope.prototype.addDataEvent = function(e) {
  this.userAttrs_ = null;
  this.allAttrsByName_ = null;

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
  // TODO(benvanik): cache this object separately?
  this.cacheAttributes_();
  if (!this.userAttrs_) {
    return null;
  }
  var data = {};
  for (var n = 0; n < this.userAttrs_.length; n++) {
    var attr = this.userAttrs_[n];
    data[attr.getNodeName()] = attr.getNodeValue();
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
 * @return {number} Total duration of the scope excluding system time.
 */
wtf.analysis.Scope.prototype.getUserDuration = function() {
  if (this.enterEvent_ && this.leaveEvent_) {
    return this.leaveEvent_.time - this.enterEvent_.time -
        this.totalChildSystemTime_;
  }
  return 0;
};


/**
 * Gets the duration of the scope minus its children and system time.
 * @return {number} Total duration of the scope excluding children.
 */
wtf.analysis.Scope.prototype.getOwnDuration = function() {
  if (this.enterEvent_ && this.leaveEvent_) {
    return this.leaveEvent_.time - this.enterEvent_.time - this.totalChildTime_;
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
 * Computes various cached times.
 * This should be called whenever any children are added.
 */
wtf.analysis.Scope.prototype.computeTimes = function() {
  this.userAttrs_ = null;
  this.allAttrsByName_ = null;

  this.totalChildTime_ = 0;
  for (var n = 0; n < this.children_.length; n++) {
    this.totalChildTime_ += this.children_[n].getTotalDuration();
  }
};


/**
 * Subtracts this scopes duration from all of its ancestors.
 * This can be used on system scopes to make the user time of ancestors less
 * than their total time.
 */
wtf.analysis.Scope.prototype.adjustSystemTime = function() {
  this.userAttrs_ = null;
  this.allAttrsByName_ = null;

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


/**
 * Gets an informative string about a scope.
 * @param {!wtf.analysis.Scope} scope Target scope.
 * @return {string} Info string.
 */
wtf.analysis.Scope.getInfoString = function(scope) {
  var totalTime = wtf.util.formatTime(scope.getTotalDuration());
  var times = totalTime;
  if (scope.getTotalDuration() - scope.getOwnDuration()) {
    var ownTime = wtf.util.formatTime(scope.getOwnDuration());
    times += ' (' + ownTime + ')';
  }

  var enter = scope.getEnterEvent();
  var eventType = enter.eventType;
  var lines = [
    times + ': ' + eventType.name
  ];

  wtf.util.addArgumentLines(lines, scope.getData());

  return lines.join('\n');
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getNodeType = function() {
  return wgxpath.NodeType.SCOPE;
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getNodePosition = function() {
  return this.enterEvent_ ? this.enterEvent_.getPosition() : 0;
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getNodeName = function() {
  // TODO(benvanik): cache lowercase name
  return this.name_.toLowerCase();
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getNodeValue = function() {
  // TODO(benvanik): something meaningful?
  return '';
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getRootNode = function() {
  goog.asserts.assert(this.rootNode);
  return this.rootNode;
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getParentNode = function() {
  return this.parent_;
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getPreviousSiblingNode = function() {
  goog.asserts.fail('not implemented');
  return null;
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getNextSiblingNode = function() {
  goog.asserts.fail('not implemented');
  return null;
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.gatherChildNodes = function(
    nodeset, opt_test, opt_attrName, opt_attrValue) {
  for (var n = 0; n < this.children_.length; n++) {
    // TODO(benvanik): add instance events
    var child = this.children_[n];
    if (!opt_test || opt_test.matches(child)) {
      if (!opt_attrName ||
          wgxpath.Node.attrMatches(child, opt_attrName, opt_attrValue)) {
        nodeset.add(child);
      }
    }
  }
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.gatherDescendantNodes = function(
    nodeset, opt_test, opt_attrName, opt_attrValue) {
  // TODO(benvanik): find a way to get instances in here!
  function recurse(scope) {
    for (var n = 0; n < scope.children_.length; n++) {
      var child = scope.children_[n];
      if (!opt_test || opt_test.matches(child)) {
        if (!opt_attrName ||
            wgxpath.Node.attrMatches(child, opt_attrName, opt_attrValue)) {
          nodeset.add(child);
        }
      }
      if (child.children_ && child.children_.length) {
        recurse(child);
      }
    }
  };
  recurse(this);
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getAttributes = function() {
  this.cacheAttributes_();
  return this.allAttrs_;
};


/**
 * @override
 */
wtf.analysis.Scope.prototype.getAttribute = function(name) {
  this.cacheAttributes_();
  return this.allAttrsByName_[name];
};


/**
 * Caches attributes onto the scope.
 * No-op when already cached.
 * @private
 */
wtf.analysis.Scope.prototype.cacheAttributes_ = function() {
  if (this.allAttrsByName_) {
    return;
  }

  var userAttrs = [];
  var allAttrs = [];
  var attrsByName = {};
  var attrIndex = 0;
  var attr;

  // Common attributes for scopes.
  // Ideally we'd have these as implicit values, or use functions instead.
  attr = new wgxpath.Attr(this, allAttrs.length,
      'time', this.getEnterTime());
  allAttrs.push(attr);
  attrsByName[attr.getNodeName().toLowerCase()] = attr;
  attr = new wgxpath.Attr(this, allAttrs.length,
      'timeEnd', this.getLeaveTime());
  allAttrs.push(attr);
  attrsByName[attr.getNodeName().toLowerCase()] = attr;
  attr = new wgxpath.Attr(this, allAttrs.length,
      'totalTime', this.getTotalDuration());
  allAttrs.push(attr);
  attrsByName[attr.getNodeName().toLowerCase()] = attr;
  attr = new wgxpath.Attr(this, allAttrs.length,
      'ownTime', this.getOwnDuration());
  allAttrs.push(attr);
  attrsByName[attr.getNodeName().toLowerCase()] = attr;

  if (this.enterEvent_) {
    var argTypes = this.enterEvent_.eventType.args;
    for (var n = 0; n < argTypes.length; n++) {
      var arg = argTypes[n];
      attr = new wgxpath.Attr(this, allAttrs.length,
          arg.name, this.enterEvent_.args[arg.name]);
      userAttrs.push(attr);
      allAttrs.push(attr);
      attrsByName[attr.getNodeName().toLowerCase()] = attr;
    }
  }

  if (this.dataEvents_) {
    for (var n = 0; n < this.dataEvents_.length; n++) {
      var e = this.dataEvents_[n];
      if (e.eventType.flags & wtf.data.EventFlag.INTERNAL) {
        // name-value pair from the builtin appending functions.
        attr = new wgxpath.Attr(this, allAttrs.length,
            e.args['name'], e.args['value']);
        userAttrs.push(attr);
        allAttrs.push(attr);
        attrsByName[attr.getNodeName().toLowerCase()] = attr;
      } else {
        // Custom appender, use args.
        for (var m = 0; m < e.eventType.args.length; m++) {
          var arg = e.eventType.args[m];
          attr = new wgxpath.Attr(this, allAttrs.length,
              arg.name, e.args[arg.name]);
          userAttrs.push(attr);
          allAttrs.push(attr);
          attrsByName[attr.getNodeName().toLowerCase()] = attr;
        }
      }
    }
  }

  this.userAttrs_ = userAttrs.length ? userAttrs : null;
  this.allAttrs_ = allAttrs.length ? allAttrs : null;
  this.allAttrsByName_ = attrsByName;
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
