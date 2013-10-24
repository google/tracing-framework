/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension/app API externs.
 *
 * @author benvanik@google.com (Ben Vanik)
 * @externs
 */


/**
 * @typedef {{
 *   addListener: function(!Function),
 *   removeListener: function(!Function)
 * }}
 */
var ChromeEvent;


// var chrome;


chrome.runtime;


/** @type {string} */
chrome.runtime.id;


/** @type {!ChromeEvent} */
chrome.runtime.onStartup;


/** @type {!ChromeEvent} */
chrome.runtime.onInstalled;


/** @type {!ChromeEvent} */
chrome.runtime.onSuspend;


chrome.app;
chrome.app.runtime;


/** @type {!ChromeEvent} */
chrome.app.runtime.onLaunched;


/**
 * @typedef {{
 *   contentWindow: !Window,
 *   focus: !function()
 * }}
 */
var ChromeAppWindow;


/**
 * @param {string} url
 * @param {!Object} options
 * @param {!function(!ChromeAppWindow)} callback
 */
chrome.app.window.create = function(url, options, callback) {};



chrome.socket;


/**
 * @param {!function(!Array.<{name: string, address: string}>)} callback
 */
chrome.socket.getNetworkList = function(callback) {};


/**
 * @param {string} type
 * @param {!Object} options
 * @param {!function(!{socketId: number})} callback
 */
chrome.socket.create = function(type, options, callback) {};


/**
 * @param {number} socketId
 */
chrome.socket.destroy = function(socketId) {};


/**
 * @param {number} socketId
 * @param {string} hostname
 * @param {number} port
 * @param {!function(number)} callback
 */
chrome.socket.listen = function(socketId, hostname, port, callback) {};


/**
 * @param {number} socketId
 * @param {!function(!{socketId: number, result: number})} callback
 */
chrome.socket.accept = function(socketId, callback) {};


/**
 * @param {number} socketId
 * @param {number|undefined} bufferSize
 * @param {!function({resultCode: number, data: ArrayBuffer})} callback
 */
chrome.socket.read = function(socketId, bufferSize, callback) {};


/**
 * @param {number} socketId
 * @param {!ArrayBuffer} buffer
 * @param {!function(!{bytesWritten: number})} callback
 */
chrome.socket.write = function(socketId, buffer, callback) {};



/**
 * @noalias
 * @constructor
 */
var ChromePort;


/**
 * @type {string}
 */
ChromePort.prototype.name;


/**
 * @param {!Object} msg
 */
ChromePort.prototype.postMessage = function(msg) {};


/**
 * @type {!ChromeEvent}
 */
ChromePort.prototype.onMessage;


/**
 * @type {!ChromeEvent}
 */
ChromePort.prototype.onDisconnect;



chrome.extension;


/**
 * @param {string} extensionId
 * @param {Object=} opt_connectInfo
 */
chrome.extension.connect = function(extensionId, opt_connectInfo) {};


/**
 * @type {!ChromeEvent}
 */
chrome.extension.onConnectExternal;
