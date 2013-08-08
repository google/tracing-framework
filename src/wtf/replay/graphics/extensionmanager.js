/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview ExtensionManager. Manages extensions and verifies support for
 * them.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ExtensionManager');

goog.require('goog.Disposable');
goog.require('goog.object');
goog.require('goog.string');



/**
 * Verifies if extensions are supported and tries to retrieve other extensions
 * that perform the same function if not.
 *
 * @param {!wtf.replay.graphics.ContextPool} contextPool Pool of contexts.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.replay.graphics.ExtensionManager = function(contextPool) {
  goog.base(this);

  /**
   * The context pool.
   * @type {!wtf.replay.graphics.ContextPool}
   * @private
   */
  this.contextPool_ = contextPool;

  /**
   * The set of supported extensions.
   * @type {!Object.<boolean>}
   * @private
   */
  this.supportedExtensions_ = this.getSupportedExtensions_();
};
goog.inherits(wtf.replay.graphics.ExtensionManager, goog.Disposable);


/**
 * A list of potential extension prefixes.
 * @const
 * @type {!Array.<string>}
 */
wtf.replay.graphics.ExtensionManager.PREFIXES = ['MOZ_', 'WEBKIT_'];


/**
 * Gets the set of supported extensions.
 * @return {!Object.<boolean>} The set of supported extensions.
 * @private
 */
wtf.replay.graphics.ExtensionManager.prototype.getSupportedExtensions_ =
    function() {
  var gl = this.contextPool_.getContext('webgl') ||
      this.contextPool_.getContext('experimental-webgl');
  if (!gl) {
    throw new Error('Unable to get WebGL context.');
  }
  var extensionList = gl.getSupportedExtensions();
  var supportedExtensions = goog.object.createSet(extensionList);
  this.contextPool_.releaseContext(gl);
  return supportedExtensions;
};


/**
 * Gets a related extension name supported by the user agent. Returns the same
 * extension if the user agent supports it. If no related extension is
 * supported by the user agent, returns null.
 * @param {string} extensionName The name of the extension to check.
 * @return {string?} The name of a related supported extension or null if one
 *     does not exist.
 */
wtf.replay.graphics.ExtensionManager.prototype.getRelatedExtension =
    function(extensionName) {
  // If this extension is supported, return the same name back.
  // This is a common result, so we should optimize for it.
  if (this.supportedExtensions_[extensionName]) {
    return extensionName;
  }

  // Strip off the extension's prefix if there is one.
  var listOfPrefixes = wtf.replay.graphics.ExtensionManager.PREFIXES;
  for (var i = 0; i < listOfPrefixes.length; ++i) {
    if (goog.string.startsWith(extensionName, listOfPrefixes[i])) {
      // Take off the prefix. Try testing without it.
      extensionName = extensionName.substring(listOfPrefixes[i].length);
      if (this.supportedExtensions_[extensionName]) {
        return extensionName;
      }

      // If one prefix matched, the other prefixes can't.
      break;
    }
  }

  // Try adding prefixes and testing.
  for (var i = 0; i < listOfPrefixes.length; ++i) {
    var prefixedExtensionName = listOfPrefixes[i] + extensionName;
    if (this.supportedExtensions_[prefixedExtensionName]) {
      return prefixedExtensionName;
    }
  }

  // This extension is not supported, and we can't find a related extension.
  return null;
};
