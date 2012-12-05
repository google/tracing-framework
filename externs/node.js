/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Node.js API externs.
 *
 * @author benvanik@google.com (Ben Vanik)
 * @externs
 */


/**
 * @param {string} name
 * @return {!Object}
 */
function require(name) {};


/**
 * @constructor
 */
var NodeEventEmitter;
/**
 * @param {string} event
 * @param {!Function} listener
 */
NodeEventEmitter.prototype.on = function(event, listener) {};


/**
 * @constructor
 * @extends {NodeEventEmitter}
 * @noalias
 */
var NodeProcessModule;
/**
 * @return {string}
 */
NodeProcessModule.prototype.cwd = function() {};
/**
 * @type {!NodeProcessModule}
 */
var process;


/**
 * @param {number} length
 * @constructor
 * @noalias
 */
function Buffer(length) {};
/**
 * @type {number}
 */
Buffer.prototype.length;


/**
 * @constructor
 * @noalias
 */
var NodeFsModule;
/**
 * @param {string} path
 * @param {string=} opt_encoding
 * @return {string|Buffer}
 */
NodeFsModule.prototype.readFileSync = function(path, opt_encoding) {};
/**
 * @param {string} path
 * @param {string|!Buffer} data
 * @param {string=} opt_encoding
 */
NodeFsModule.prototype.writeFileSync = function(path, data, opt_encoding) {};
