/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Platform abstraction layer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.pal.IPlatform');



/**
 * Platform abstraction interface.
 *
 * @interface
 */
wtf.pal.IPlatform = function() {};


/**
 * Gets the directory the tool was launched from.
 * @return {string} Working directory.
 */
wtf.pal.IPlatform.prototype.getWorkingDirectory = goog.nullFunction;


/**
 * Reads a file from the given path as a utf8 string.
 * @param {string} path File path.
 * @return {string?} File contents.
 */
wtf.pal.IPlatform.prototype.readTextFile = goog.nullFunction;


/**
 * Reads a file from the given path as a binary blob.
 * @param {string} path File path.
 * @return {wtf.io.ByteArray?} File contents.
 */
wtf.pal.IPlatform.prototype.readBinaryFile = goog.nullFunction;


/**
 * Writes a file to the given path as a utf8 string.
 * @param {string} path File path.
 * @param {string} contents File contents.
 * @param {string=} opt_mimeType File mime type.
 */
wtf.pal.IPlatform.prototype.writeTextFile = goog.nullFunction;


/**
 * Writes a file to the given path as a binary blob.
 * @param {string} path File path.
 * @param {!(wtf.io.ByteArray|Blob)} contents File contents.
 * @param {string=} opt_mimeType File mime type.
 */
wtf.pal.IPlatform.prototype.writeBinaryFile = goog.nullFunction;
