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
function require(name) {}



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
 * @param {string} event
 * @param {!Function} listener
 */
NodeEventEmitter.prototype.once = function(event, listener) {};



/**
 * @constructor
 * @extends {NodeEventEmitter}
 * @noalias
 */
var NodeProcessModule;


/** @type {!Array.<string>} */
NodeProcessModule.prototype.argv;


/** @type {number} */
NodeProcessModule.prototype.pid;


/** @type {string} */
NodeProcessModule.prototype.arch;


/** @type {string} */
NodeProcessModule.prototype.platform;


/** @type {string} */
NodeProcessModule.prototype.title;


/** @type {string} */
NodeProcessModule.prototype.version;


/**
 * @return {string}
 */
NodeProcessModule.prototype.cwd = function() {};


NodeProcessModule.prototype.exit = function() {};


/**
 * @type {!NodeProcessModule}
 */
var process;



/**
 * @param {number} length
 * @constructor
 * @noalias
 */
function Buffer(length) {}


/**
 * @type {number}
 */
Buffer.prototype.length;


/**
 * @param {string} value
 * @return {number}
 */
Buffer.byteLength = function(value) {};


/**
 * @return {string}
 */
Buffer.prototype.toString = function() {};


/**
 * @param {string} value
 * @param {number=} opt_offset
 * @return {number}
 */
Buffer.prototype.write = function(value, opt_offset) {};


/**
 * @param {!Buffer} target
 * @param {number=} opt_offset
 * @param {number=} opt_start
 * @param {number=} opt_end
 */
Buffer.prototype.copy = function(target, opt_offset, opt_start, opt_end) {};



/**
 * @constructor
 * @extends {NodeEventEmitter}
 * @noalias
 */
function NodeReadStream() {}


/**
 * @param {!Buffer} buffer
 * @return {boolean}
 */
NodeReadStream.prototype.write = function(buffer) {};


NodeReadStream.prototype.end = function() {};
NodeReadStream.prototype.destroy = function() {};



/**
 * @constructor
 * @extends {NodeEventEmitter}
 * @noalias
 */
function NodeWriteStream() {}


/**
 * @param {!Buffer} buffer
 * @return {boolean}
 */
NodeWriteStream.prototype.write = function(buffer) {};


NodeWriteStream.prototype.end = function() {};
NodeWriteStream.prototype.destroySoon = function() {};




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


/**
 * @param {string} path
 * @param {Object=} opt_options
 * @return {!NodeReadStream}
 */
NodeFsModule.prototype.createReadStream = function(path, opt_options) {};


/**
 * @param {string} path
 * @param {Object=} opt_options
 * @return {!NodeWriteStream}
 */
NodeFsModule.prototype.createWriteStream = function(path, opt_options) {};


/**
 * @param {string} path
 * @param {string} flags
 * @param {number=} opt_mode
 * @return {number}
 */
NodeFsModule.prototype.openSync = function(path, flags, opt_mode) {};


/**
 * @param {number} fd
 */
NodeFsModule.prototype.closeSync = function(fd) {};


/**
 * @param {number} fd
 */
NodeFsModule.prototype.fsyncSync = function(fd) {};


/**
 * @param {number} fd
 * @param {!Buffer} buffer
 * @param {number} offset
 * @param {number} length
 * @param {number|null} position
 */
NodeFsModule.prototype.writeSync = function(
    fd, buffer, offset, length, position) {};
