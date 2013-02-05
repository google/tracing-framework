// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Node utilities.
 */

goog.provide('wgxpath.Node');
goog.provide('wgxpath.Attr');

goog.require('goog.array');
goog.require('wgxpath.NodeType');


/**
 * @interface
 */
wgxpath.Node = function() {};


/**
 * Gets the type of the node.
 * @return {wgxpath.NodeType} Node type.
 */
wgxpath.Node.prototype.getNodeType = goog.nullFunction;


/**
 * Gets the position of the node in its parent container.
 * @return {number} Node position.
 */
wgxpath.Node.prototype.getNodePosition = goog.nullFunction;


/**
 * Gets a lower-case name of the node.
 * @return {string} Name.
 */
wgxpath.Node.prototype.getNodeName = goog.nullFunction;


/**
 * Gets a computed value of the node.
 * @return {(string|number|boolean)} Value.
 */
wgxpath.Node.prototype.getNodeValue = goog.nullFunction;


/**
 * Gets the root node of the tree.
 * @return {!wgxpath.Node} Root node.
 */
wgxpath.Node.prototype.getRootNode = goog.nullFunction;


/**
 * Gets the parent node.
 * @return {wgxpath.Node} Parent node.
 */
wgxpath.Node.prototype.getParentNode = goog.nullFunction;


/**
 * Gets the previous sibling.
 * @return {wgxpath.Node} Previous sibling, if any.
 */
wgxpath.Node.prototype.getPreviousSiblingNode = goog.nullFunction;


/**
 * Gets the next sibling.
 * @return {wgxpath.Node} Next sibling, if any.
 */
wgxpath.Node.prototype.getNextSiblingNode = goog.nullFunction;


/**
 * Gathers all child nodes that match the given node test (if set) or
 * attribute test (if set).
 *
 * @param {!wgxpath.NodeSet} nodeset The node set to add matches to.
 * @param {wgxpath.NodeTest} opt_test A NodeTest for matching nodes.
 * @param {?string=} opt_attrName The attribute name to match, if any.
 * @param {?(string|boolean|number)=} opt_attrValue The attribute value to
 *     match, if any.
 */
wgxpath.Node.prototype.gatherChildNodes = goog.nullFunction;


/**
 * Gathers all descendant nodes that match the given node test (if set) or
 * attribute test (if set).
 *
 * @param {!wgxpath.NodeSet} nodeset The node set to add matches to.
 * @param {wgxpath.NodeTest} opt_test A NodeTest for matching nodes.
 * @param {?string=} opt_attrName The attribute name to match, if any.
 * @param {?(string|boolean|number)=} opt_attrValue The attribute value to
 *     match, if any.
 */
wgxpath.Node.prototype.gatherDescendantNodes = goog.nullFunction;


/**
 * Gets all attributes.
 * @return {Array.<!wgxpath.Attr>} Attributes, if any.
 */
wgxpath.Node.prototype.getAttributes = goog.nullFunction;


/**
 * Gets an attribute with the given name.
 * @param {string} name Attribute name.
 * @return {wgxpath.Attr} Attribute, if found.
 */
wgxpath.Node.prototype.getAttribute = goog.nullFunction;



/**
 * Attribute wrapper.
 *
 * @constructor
 * @implements {wgxpath.Node}
 * @param {!wgxpath.Node} parent Parent node.
 * @param {number} position The source position in the parent node.
 * @param {string} nodeName The name of the attribute node.
 * @param {(string|number|boolean)} nodeValue The value of the attribute node.
 */
wgxpath.Attr = function(parent, position, nodeName, nodeValue) {
  /**
   * @type {!wgxpath.Node}
   * @private
   */
  this.parent_ = parent;

  /**
   * @type {number}
   * @private
   */
  this.position_ = position;

  /**
   * @type {string}
   * @private
   */
  this.nodeName_ = nodeName;

  /**
   * @type {(string|number|boolean)}
   * @private
   */
  this.nodeValue_ = nodeValue;
};


/**
 * @override
 */
wgxpath.Attr.prototype.toString = function() {
  return this.nodeName_ + ': ' + this.nodeValue_;
};


/**
 * @override
 */
wgxpath.Attr.prototype.getNodeType = function() {
  return wgxpath.NodeType.ATTRIBUTE;
};


/**
 * @override
 */
wgxpath.Attr.prototype.getNodePosition = function() {
  return this.position_;
};


/**
 * @override
 */
wgxpath.Attr.prototype.getNodeName = function() {
  return this.nodeName_;
};


/**
 * @override
 */
wgxpath.Attr.prototype.getNodeValue = function() {
  return this.nodeValue_;
};


/**
 * Gets the root node of the tree.
 * @return {!wgxpath.Node} Root node.
 */
wgxpath.Attr.prototype.getRootNode = function() {
  return this.parent_.getRootNode();
};


/**
 * @override
 */
wgxpath.Attr.prototype.getParentNode = function() {
  return this.parent_;
};


/**
 * @override
 */
wgxpath.Attr.prototype.getPreviousSiblingNode = function() {
  goog.asserts.fail('not implemented');
  return null;
};


/**
 * @override
 */
wgxpath.Attr.prototype.getNextSiblingNode = function() {
  goog.asserts.fail('not implemented');
  return null;
};


/**
 * @override
 */
wgxpath.Attr.prototype.gatherChildNodes = goog.nullFunction;


/**
 * @override
 */
wgxpath.Attr.prototype.gatherDescendantNodes = goog.nullFunction;


/**
 * @override
 */
wgxpath.Attr.prototype.getAttributes = function() {
  return null;
};


/**
 * @override
 */
wgxpath.Attr.prototype.getAttribute = function(name) {
  return null;
};



/**
 * Returns whether two nodes are equal.
 *
 * @param {wgxpath.Node} a The first node.
 * @param {wgxpath.Node} b The second node.
 * @return {boolean} Whether the nodes are equal.
 */
wgxpath.Node.equal = function(a, b) {
  return a == b;
};


/**
 * Finds the node with the given ID in the document.
 *
 * @param {!wgxpath.Node} node Any node in the document.
 * @param {string} id ID to look for.
 * @return {wgxpath.Node?} Node, if found.
 */
wgxpath.Node.getNodeById = function(node, id) {
  // TODO(benvanik): find event by ID
  // var doc = node.getRootNode();
  // return doc.getElementById(id);
  goog.asserts.fail('not implemented');
  return null;
};


/**
 * Returns the string-value of the required type from a node.
 *
 * @param {!wgxpath.Node} node The node to get value from.
 * @return {string} The value required.
 */
wgxpath.Node.getValueAsString = function(node) {
  return '' + node.getNodeValue();
  // TODO(benvanik): getValueAsString that does something better?
  // var t = null;
  // if (type == goog.dom.NodeType.ELEMENT) {
  //   t = node.textContent;
  //   t = (t == undefined || t == null) ? node.innerText : t;
  //   t = (t == undefined || t == null) ? '' : t;
  // }
  // if (typeof t != 'string') {
  //   if (type == goog.dom.NodeType.DOCUMENT ||
  //       type == goog.dom.NodeType.ELEMENT) {
  //     node = wgxpath.Node.getFirstChild(node)
  //     var i = 0, stack = [];
  //     for (t = ''; node;) {
  //       do {
  //         if (wgxpath.Node.getNodeType(node) != goog.dom.NodeType.ELEMENT) {
  //           t += node.nodeValue;
  //         }
  //         stack[i++] = node; // push
  //       } while (node = wgxpath.Node.getFirstChild(node));
  //       while (i && !(node = wgxpath.Node.getNextSibling(stack[--i]))) {}
  //     }
  //   } else {
  //     t = node.nodeValue;
  //   }
  // }
  // return '' + t;
};


/**
 * Returns the string-value of the required type from a node, casted to number.
 *
 * @param {!wgxpath.Node} node The node to get value from.
 * @return {number} The value required.
 */
wgxpath.Node.getValueAsNumber = function(node) {
  return +wgxpath.Node.getValueAsString(node);
};


/**
 * Returns the string-value of the required type from a node, casted to boolean.
 *
 * @param {!wgxpath.Node} node The node to get value from.
 * @return {boolean} The value required.
 */
wgxpath.Node.getValueAsBool = function(node) {
  return !!wgxpath.Node.getValueAsString(node);
};


/**
 * Adds all attributes of the node to the given nodeset.
 * @param {!wgxpath.Node} node Node.
 * @param {!wgxpath.NodeSet} nodeset Target nodeset.
 */
wgxpath.Node.addAllAttributes = function(node, nodeset) {
  var attrs = node.getAttributes();
  if (attrs) {
    nodeset.extend(attrs);
  }
};


/**
 * Adds the given named attribute of the node to the given nodeset.
 * @param {!wgxpath.Node} node Node.
 * @param {string} name Attribute name.
 * @param {!wgxpath.NodeSet} nodeset Target nodeset.
 */
wgxpath.Node.addNamedAttribute = function(node, name, nodeset) {
  var attr = node.getAttribute(name);
  if (attr) {
    nodeset.add(attr);
  }
};


/**
 * Returns if the attribute matches the given value.
 *
 * @param {!wgxpath.Node} node The node to get value from.
 * @param {?string=} opt_name The attribute name to match.
 * @param {?(string|number|boolean)=} opt_value The attribute value to match,
 *     if any.
 * @return {boolean} Whether the node matches the attribute, if any.
 */
wgxpath.Node.attrMatches = function(node, opt_name, opt_value) {
  if (!opt_name) {
    return true;
  }
  var attr = node.getAttribute(opt_name);
  if (opt_value) {
    return attr ? attr.nodeValue_ == opt_value : false;
  } else {
    return !!attr;
  }
};


/**
 * Compares the order of two nodes.
 * @param {!wgxpath.Node} a The first node to compare.
 * @param {!wgxpath.Node} b The second node to compare.
 * @return {number} 0 if the nodes are the same node, a negative number if a
 *     is before b, and a positive number if b is before a.
 */
wgxpath.Node.compareNodeOrder = function(a, b) {
  if (a == b) {
    return 0;
  }
  var ap = a.getNodeType() == wgxpath.NodeType.ATTRIBUTE ?
      a.getParentNode().getNodePosition() + 1 / (a.getNodePosition() + 1) :
      a.getNodePosition();
  var bp = b.getNodeType() == wgxpath.NodeType.ATTRIBUTE ?
      b.getParentNode().getNodePosition() + 1 / (b.getNodePosition() + 1) :
      b.getNodePosition();
  return ap - bp;
};


/**
 * Returns true if the given node contains the other node as a descendant.
 * @param {!wgxpath.Node} parent Node.
 * @param {!wgxpath.Node} descendant Possible descendant node.
 * @return {boolean} True if otherNode is within node.
 */
wgxpath.Node.contains = function(parent, descendant) {
  var node = descendant;
  while (node && parent != node) {
    node = node.getParentNode();
  }
  return node == parent;
};


/**
 * Returns the descendants of a node.
 *
 * @param {!wgxpath.NodeTest} test A NodeTest for matching nodes.
 * @param {!wgxpath.Node} node The node to get descendants from.
 * @param {?string=} opt_attrName The attribute name to match, if any.
 * @param {?string=} opt_attrValue The attribute value to match, if any.
 * @param {!wgxpath.NodeSet=} opt_nodeset The node set to add descendants to.
 * @return {!wgxpath.NodeSet} The nodeset with descendants.
 */
wgxpath.Node.getDescendantNodes = function(test, node, opt_attrName,
    opt_attrValue, opt_nodeset) {
  var nodeset = opt_nodeset || new wgxpath.NodeSet();
  var attrName = goog.isString(opt_attrName) ? opt_attrName : null;
  var attrValue = goog.isString(opt_attrValue) ? opt_attrValue : null;

  // TODO(benvanik): getDescendantNodesGeneric_
  // if (node.getElementsByName && attrValue && attrName == 'name' &&
  //     !goog.userAgent.IE) {
  //   var nodes = node.getElementsByName(attrValue);
  //   goog.array.forEach(nodes, function(node) {
  //     if (test.matches(node)) {
  //       nodeset.add(node);
  //     }
  //   });

  // If we are matching everything avoid passing down the test, as it
  // is just a waste of time.
  var nodeTest = test;
  if (!test.getName() || test.getName() == '*') {
    nodeTest = null;
  }

  node.gatherDescendantNodes(nodeset, nodeTest, attrName, attrValue);
  return nodeset;
};


/**
 * Returns the child nodes of a node.
 *
 * @param {!wgxpath.NodeTest} test A NodeTest for matching nodes.
 * @param {!wgxpath.Node} node The node to get child nodes from.
 * @param {?string=} opt_attrName The attribute name to match, if any.
 * @param {?string=} opt_attrValue The attribute value to match, if any.
 * @param {!wgxpath.NodeSet=} opt_nodeset The node set to add child nodes to.
 * @return {!wgxpath.NodeSet} The nodeset with child nodes.
 */
wgxpath.Node.getChildNodes = function(test, node,
    opt_attrName, opt_attrValue, opt_nodeset) {
  var nodeset = opt_nodeset || new wgxpath.NodeSet();
  var attrName = goog.isString(opt_attrName) ? opt_attrName : null;
  var attrValue = goog.isString(opt_attrValue) ? opt_attrValue : null;

  // If we are matching everything avoid passing down the test, as it
  // is just a waste of time.
  var nodeTest = test;
  if (!test.getName() || test.getName() == '*') {
    nodeTest = null;
  }

  node.gatherChildNodes(nodeset, nodeTest, attrName, attrValue);
  return nodeset;
};
