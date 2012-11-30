/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Generic browser platform abstraction layer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.pal.BrowserPlatform');

goog.require('wtf.pal.IPlatform');



/**
 * Chrome extension platform abstraction layer implementation.
 * @constructor
 * @implements {wtf.pal.IPlatform}
 */
wtf.pal.BrowserPlatform = function() {
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.getWorkingDirectory = function() {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.readTextFile = function(path) {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.readBinaryFile = function(path) {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.writeTextFile = function(path, contents) {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.writeBinaryFile = function(path, contents) {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.getNetworkInterfaces = function(
    callback, opt_scope) {
  throw new Error();
};


/**
 * @override
 */
wtf.pal.BrowserPlatform.prototype.createListenSocket =
    function(port, opt_hostname) {
  throw new Error();
};
