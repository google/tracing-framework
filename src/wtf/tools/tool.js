/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Abstract tool type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.tools.Tool');



/**
 * Abstract tool.
 *
 * @param {!wtf.util.IPlatform} platform Platform abstraction layer.
 * @constructor
 */
wtf.tools.Tool = function(platform) {
  /**
   * Platform abstraction layer.
   * @type {!wtf.util.IPlatform}
   * @protected
   */
  this.platform = platform;
};


/**
 * Gets the platform abstraction layer used by the tool.
 * @return {!wtf.util.IPlatform} Platform abstraction layer.
 */
wtf.tools.Tool.prototype.getPlatform = function() {
  return this.platform;
};


/**
 * Runs the tool.
 * @param {!Array.<string>} args Command line arguments.
 * @return {number|!goog.async.Deferred} Return code or a deferred that is
 *     called back when the tool exits.
 */
wtf.tools.Tool.prototype.run = goog.abstractMethod;
