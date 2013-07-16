/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Node.js platform abstraction layer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.pal.NodePlatform');

goog.require('wtf.pal.IPlatform');



/**
 * Node.js platform abstraction layer.
 * @constructor
 * @implements {wtf.pal.IPlatform}
 */
wtf.pal.NodePlatform = function() {
  /**
   * @type {string}
   * @private
   */
  this.workingDirectory_ = process.cwd();

  /**
   * Node 'fs' modulle.
   * @type {!NodeFsModule}
   * @private
   */
  this.fs_ = /** @type {!NodeFsModule} */ (require('fs'));
};


/**
 * @override
 */
wtf.pal.NodePlatform.prototype.getWorkingDirectory = function() {
  return this.workingDirectory_;
};


/**
 * @override
 */
wtf.pal.NodePlatform.prototype.readTextFile = function(path) {
  try {
    return /** @type {string} */ (this.fs_.readFileSync(path, 'utf8'));
  } catch (e) {
    return null;
  }
};


/**
 * @override
 */
wtf.pal.NodePlatform.prototype.readBinaryFile = function(path) {
  var nodeData = null;
  try {
    nodeData = /** @type {!Buffer} */ (this.fs_.readFileSync(path));
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
wtf.pal.NodePlatform.prototype.writeTextFile = function(
    path, contents, opt_mimeType) {
  this.fs_.writeFileSync(path, contents, 'utf8');
};


/**
 * @override
 */
wtf.pal.NodePlatform.prototype.writeBinaryFile = function(
    path, contents, opt_mimeType) {
  // TODO(benvanik): a better way to convert
  var nodeData = new Buffer(contents.length);
  for (var n = 0; n < nodeData.length; n++) {
    nodeData[n] = contents[n];
  }
  this.fs_.writeFileSync(path, nodeData);
};
