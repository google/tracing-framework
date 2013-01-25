// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview A class implementing the NameTest construct.
 */

goog.provide('wgxpath.NameTest');

goog.require('wgxpath.NodeType');



/**
 * Constructs a NameTest based on the xpath grammar:
 * http://www.w3.org/TR/xpath/#NT-NameTest
 *
 * @param {string} name Name to be tested.
 * @constructor
 * @implements {wgxpath.NodeTest}
 */
wgxpath.NameTest = function(name) {
  /**
   * @type {string}
   * @private
   */
  this.name_ = name.toLowerCase();
};


/**
 * @override
 */
wgxpath.NameTest.prototype.matches = function(node) {
  var type = node.getNodeType();
  switch (type) {
    case wgxpath.NodeType.DATABASE:
    case wgxpath.NodeType.ZONE:
    case wgxpath.NodeType.SCOPE:
    case wgxpath.NodeType.INSTANCE:
    case wgxpath.NodeType.ATTRIBUTE:
      return this.name_ == '*' || this.name_ == node.getNodeName();
    default:
      return false;
  }
};


/**
 * @override
 */
wgxpath.NameTest.prototype.getName = function() {
  return this.name_;
};


/**
 * @override
 */
wgxpath.NameTest.prototype.toString = function() {
  return this.toStringIndented();
};


/**
 * @override
 */
wgxpath.NameTest.prototype.toStringIndented = function(opt_indent) {
  var indent = opt_indent || '';
  return indent + 'nametest: ' + this.name_;
};
