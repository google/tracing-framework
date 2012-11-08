/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Function generator utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.util.FunctionBuilder');

goog.require('goog.asserts');



/**
 * Function builder utility class.
 * A reusable type that efficiently produces new functions. Designed to be
 * subclassed to provide the real logic work.
 *
 * @constructor
 */
wtf.util.FunctionBuilder = function() {
  /**
   * True when inside of a build.
   * @type {boolean}
   * @private
   */
  this.isBuilding_ = false;

  /**
   * Current list of added arguments.
   * @type {!Array.<string>}
   * @private
   */
  this.currentArgs_ = [];

  /**
   * Current list of added source lines.
   * @type {!Array.<string>}
   * @private
   */
  this.currentSource_ = [];
};


/**
 * Whether function building is supported.
 * Cached on first use.
 * @type {boolean|undefined}
 * @private
 */
wtf.util.FunctionBuilder.isSupported_ = undefined;


/**
 * Gets a value indicating whether function building is supported natively.
 * @return {boolean} True if the functions built will be native.
 */
wtf.util.FunctionBuilder.isSupported = function() {
  if (wtf.util.FunctionBuilder.isSupported_ === undefined) {
    wtf.util.FunctionBuilder.isSupported_ = true;
    try {
      new Function('');
    } catch (e) {
      wtf.util.FunctionBuilder.isSupported_ = false;
    }
  }
  return wtf.util.FunctionBuilder.isSupported_;
};


/**
 * Begins building a new function.
 */
wtf.util.FunctionBuilder.prototype.begin = function() {
  goog.asserts.assert(!this.isBuilding_);
  goog.asserts.assert(!this.currentArgs_.length);
  goog.asserts.assert(!this.currentSource_.length);

  this.isBuilding_ = true;

  this.append('"use strict";');
};


/**
 * Adds an argument to the argument list.
 * @param {string} name Argument name.
 */
wtf.util.FunctionBuilder.prototype.addArgument = function(name) {
  goog.asserts.assert(this.isBuilding_);
  this.currentArgs_.push(name);
};


/**
 * Appends lines to the function.
 * Each line will be separated by a newline.
 * @param {...string} var_arg String lines.
 */
wtf.util.FunctionBuilder.prototype.append = function(var_arg) {
  goog.asserts.assert(this.isBuilding_);

  for (var n = 0; n < arguments.length; n++) {
    this.currentSource_.push(arguments[n]);
  }
};


/**
 * Ends the function builder and produces a new function.
 * @param {string} name Function name. Used for debugging.
 * @return {!Function} A new function.
 */
wtf.util.FunctionBuilder.prototype.end = function(name) {
  goog.asserts.assert(this.isBuilding_);

  // Combine all source code with newlines.
  var combinedSource = this.currentSource_.join('\n');

  // Build function.
  var fn = new Function(this.currentArgs_, combinedSource);
  if (goog.DEBUG) {
    fn['displayName'] = name;
  }

  // Reset state.
  this.currentArgs_.length = 0;
  this.currentSource_.length = 0;
  this.isBuilding_ = false;

  return fn;
};
