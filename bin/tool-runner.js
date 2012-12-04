#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tool runner script.
 * Used to prepare the node environment and launch tools.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

// TODO(benvanik): support 'release' mode - load a compiled analysis lib.

// Import Closure Library and deps.js.
require('../src/wtf/bootstrap/node').importClosureLibrary([
  'wtf_js-deps.js'
]);

var args = process.argv.slice(2);

// Disable asserts unless debugging - asserts cause all code to deopt.
// TODO(benvanik): real options parser stuff
var debugIndex = args.indexOf('--debug');
if (debugIndex == -1) {
  goog.DEBUG = false;
  goog.require('goog.asserts');
  goog.asserts.assert = function(condition) {
    return condition;
  };
} else {
  goog.require('goog.asserts');
  goog.asserts.assert = function(condition, opt_message) {
    console.assert(condition, opt_msessage);
    return condition;
  };
  args.splice(debugIndex, 1);
}

// Load WTF and configure options.
goog.require('wtf');
wtf.NODE = true;
goog.require('wtf.analysis.exports');
goog.require('wtf.tools.util');


/**
 * @typedef {!function(!wtf.pal.IPlatform, !Array.<string>):
 *     (number|!goog.async.Deferred)}
 */
var ToolRunFunction;


/**
 * Launches the given tool function.
 * @param {!ToolRunFunction} toolFn Tool run function.
 * @return {number} Return code.
 */
exports.launch = function(toolFn) {
  // Setup platform abstraction layer.
  var platform = createPlatformAbstractionLayer();

  // Execute the tool, potentially async.
  var returnValue = toolFn(platform, args);
  if (goog.isNumber(returnValue)) {
    process.exit(returnValue);
  } else {
    returnValue.addCallbacks(function() {
      process.exit(0);
    }, function(arg) {
      process.exit(arg);
    });
  }
};


function createPlatformAbstractionLayer() {
  goog.require('wtf.pal.IPlatform');

  /**
   * @constructor
   * @implements {!wtf.pal.IPlatform}
   */
  var NodePlatform = function() {
    goog.base(this);

    /**
     * @type {string}
     * @private
     */
    this.workingDirectory_ = process.cwd();
  };
  goog.inherits(NodePlatform, wtf.pal.IPlatform);


  /**
   * @override
   */
  NodePlatform.prototype.getWorkingDirectory = function() {
    return this.workingDirectory_;
  };


  /**
   * @override
   */
  NodePlatform.prototype.readTextFile = function(path) {
    var fs = require('fs');

    try {
      return fs.readFileSync(path, 'utf8');
    } catch (e) {
      return null;
    }
  };


  /**
   * @override
   */
  NodePlatform.prototype.readBinaryFile = function(path) {
    var fs = require('fs');

    var nodeData = null;
    try {
      nodeData = fs.readFileSync(path);
    } catch (e) {
      return null;
    }

    // TODO(benvanik): a better way to convert
    var data = new Uint8Array(nodeData.length);
    for (var n = 0; n < data.length; n++) {
      data[n] = nodeData[n];
    }

    return data;
  };


  /**
   * @override
   */
  NodePlatform.prototype.writeTextFile = function(path, contents) {
    var fs = require('fs');

    fs.writeFileSync(path, contents, 'utf8');
  };


  /**
   * @override
   */
  NodePlatform.prototype.writeBinaryFile = function(path, contents) {
    var fs = require('fs');

    // TODO(benvanik): a better way to convert
    var nodeData = new Buffer(contents.length);
    for (var n = 0; n < nodeData.length; n++) {
      nodeData[n] = contents[n];
    }

    fs.writeFileSync(path, nodeData);
  };

  return new NodePlatform();
};
