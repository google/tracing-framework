// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Node utilities.
 */

goog.provide('wgxpath.Node');

goog.require('goog.array');
goog.require('goog.dom.NodeType');
goog.require('goog.userAgent');


/** @typedef {!(Node)} */
wgxpath.Node = {};


/**
 * Returns whether two nodes are equal.
 *
 * @param {wgxpath.Node} a The first node.
 * @param {wgxpath.Node} b The second node.
 * @return {boolean} Whether the nodes are equal.
 */
wgxpath.Node.equal = function(a, b) {
  return (a == b);
};


/**
 * Returns the string-value of the required type from a node.
 *
 * @param {!wgxpath.Node} node The node to get value from.
 * @return {string} The value required.
 */
wgxpath.Node.getValueAsString = function(node) {
  var t = null, type = node.nodeType;
  // goog.dom.getTextContent doesn't seem to work
  if (type == goog.dom.NodeType.ELEMENT) {
    t = node.textContent;
    t = (t == undefined || t == null) ? node.innerText : t;
    t = (t == undefined || t == null) ? '' : t;
  }
  if (typeof t != 'string') {
    if (type == goog.dom.NodeType.DOCUMENT ||
        type == goog.dom.NodeType.ELEMENT) {
      node = (type == goog.dom.NodeType.DOCUMENT) ?
          node.documentElement : node.firstChild;
      var i = 0, stack = [];
      for (t = ''; node;) {
        do {
          if (node.nodeType != goog.dom.NodeType.ELEMENT) {
            t += node.nodeValue;
          }
          stack[i++] = node; // push
        } while (node = node.firstChild);
        while (i && !(node = stack[--i].nextSibling)) {}
      }
    } else {
      t = node.nodeValue;
    }
  }
  return '' + t;
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
 * Returns if the attribute matches the given value.
 *
 * @param {!wgxpath.Node} node The node to get value from.
 * @param {?string} name The attribute name to match, if any.
 * @param {?string} value The attribute value to match, if any.
 * @return {boolean} Whether the node matches the attribute, if any.
 */
wgxpath.Node.attrMatches = function(node, name, value) {
  // No attribute.
  if (goog.isNull(name)) {
    return true;
  }
  // TODO(user): If possible, figure out why this throws an exception in some
  // cases on IE < 9.
  try {
    if (!node.getAttribute) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return value == null ? !!node.getAttribute(name) :
      (node.getAttribute(name, 2) == value);
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
  return wgxpath.Node.getDescendantNodesIEPre9_(
      test, node, attrName, attrValue, nodeset);
};


/**
 * Returns the descendants of a node for browsers other than IE.
 *
 * @private
 * @param {!wgxpath.NodeTest} test A NodeTest for matching nodes.
 * @param {!wgxpath.Node} node The node to get descendants from.
 * @param {?string} attrName The attribute name to match, if any.
 * @param {?string} attrValue The attribute value to match, if any.
 * @param {!wgxpath.NodeSet} nodeset The node set to add descendants to.
 * @return {!wgxpath.NodeSet} The nodeset with descendants.
 */
wgxpath.Node.getDescendantNodesGeneric_ = function(test, node,
    attrName, attrValue, nodeset) {
  if (node.getElementsByName && attrValue && attrName == 'name' &&
      !goog.userAgent.IE) {
    var nodes = node.getElementsByName(attrValue);
    goog.array.forEach(nodes, function(node) {
      if (test.matches(node)) {
        nodeset.add(node);
      }
    });
  } else if (node.getElementsByClassName && attrValue && attrName == 'class') {
    var nodes = node.getElementsByClassName(attrValue);
    goog.array.forEach(nodes, function(node) {
      if (node.className == attrValue && test.matches(node)) {
        nodeset.add(node);
      }
    });
  } else if (test instanceof wgxpath.KindTest) {
    wgxpath.Node.doRecursiveAttrMatch_(test, node, attrName,
        attrValue, nodeset);
  } else if (node.getElementsByTagName) {
    var nodes = node.getElementsByTagName(test.getName());
    goog.array.forEach(nodes, function(node) {
      if (wgxpath.Node.attrMatches(node, attrName, attrValue)) {
        nodeset.add(node);
      }
    });
  }
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
  return wgxpath.Node.getChildNodesGeneric_(
      test, node, attrName, attrValue, nodeset);
};


/**
 * Returns the child nodes of a node genericly.
 *
 * @private
 * @param {!wgxpath.NodeTest} test A NodeTest for matching nodes.
 * @param {!wgxpath.Node} node The node to get child nodes from.
 * @param {?string} attrName The attribute name to match, if any.
 * @param {?string} attrValue The attribute value to match, if any.
 * @param {!wgxpath.NodeSet} nodeset The node set to add child nodes to.
 * @return {!wgxpath.NodeSet} The nodeset with child nodes.
 */
wgxpath.Node.getChildNodesGeneric_ = function(test, node, attrName,
    attrValue, nodeset) {
  for (var current = node.firstChild; current; current = current.nextSibling) {
    if (wgxpath.Node.attrMatches(current, attrName, attrValue)) {
      if (test.matches(current)) {
        nodeset.add(current);
      }
    }
  }
  return nodeset;
};


/**
 * Returns whether a getting descendants/children call
 * needs special handling on IE browsers.
 *
 * @private
 * @param {!wgxpath.NodeTest} test A NodeTest for matching nodes.
 * @param {!wgxpath.Node} node The root node to start the recursive call on.
 * @param {?string} attrName The attribute name to match, if any.
 * @param {?string} attrValue The attribute value to match, if any.
 * @param {!wgxpath.NodeSet} nodeset The NodeSet to add nodes to.
 */
wgxpath.Node.doRecursiveAttrMatch_ = function(test, node,
    attrName, attrValue, nodeset) {
  for (var n = node.firstChild; n; n = n.nextSibling) {
    if (wgxpath.Node.attrMatches(n, attrName, attrValue) &&
        test.matches(n)) {
      nodeset.add(n);
    }
    wgxpath.Node.doRecursiveAttrMatch_(test, n, attrName,
        attrValue, nodeset);
  }
};


/**
 * Returns whether a getting descendants/children call
 * needs special handling on IE browsers.
 *
 * @private
 * @param {!wgxpath.NodeTest} test A NodeTest for matching nodes.
 * @param {?string} attrName The attribute name to match, if any.
 * @return {boolean} Whether the call needs special handling.
 */
wgxpath.Node.doesNeedSpecialHandlingIEPre9_ = function(test, attrName) {
  return test instanceof wgxpath.NameTest ||
      test.getType() == goog.dom.NodeType.COMMENT ||
      (!!attrName && goog.isNull(test.getType()));
};


/**
 * Returns a fixed name of a NodeTest for IE browsers.
 *
 * @private
 * @param {!wgxpath.NodeTest} test A NodeTest.
 * @return {string} The name of the NodeTest.
 */
wgxpath.Node.getNameFromTestIEPre9_ = function(test) {
  if (test instanceof wgxpath.KindTest) {
    if (test.getType() == goog.dom.NodeType.COMMENT) {
      return '!';
    } else if (goog.isNull(test.getType())) {
      return '*';
    }
  }
  return test.getName();
};
