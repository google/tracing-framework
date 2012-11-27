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

goog.provide('wtf.analysis.EventTypeBuilder');

goog.require('wtf.io.Buffer');
goog.require('wtf.util.FunctionBuilder');



/**
 * Analysis event function builder.
 * Builds the various event tracing functions used exclusively by the
 * analysis library.
 *
 * @constructor
 * @extends {wtf.util.FunctionBuilder}
 */
wtf.analysis.EventTypeBuilder = function() {
  goog.base(this);

  /**
   * Names of compiled members on {@see wtf.io.Buffer}.
   * @type {!Object.<string>}
   * @private
   */
  this.bufferNames_ = wtf.io.Buffer.getNameMap();
};
goog.inherits(wtf.analysis.EventTypeBuilder, wtf.util.FunctionBuilder);


/**
 * Generates an event argument parsing function.
 * @param {!wtf.analysis.EventType} eventType Event type.
 * @return {wtf.analysis.EventType.ParseFunction} Generated function based on
 *     class.
 */
wtf.analysis.EventTypeBuilder.prototype.generate = function(eventType) {
  if (!wtf.util.FunctionBuilder.isSupported()) {
    // Fallback to non-codegen version.
    var args = eventType.args;
    return function(buffer) {
      var value = {};
      for (var n = 0; n < args.length; n++) {
        var arg = args[n];
        value[arg.name] = arg.read(buffer);
      }
      return value;
    };
  }

  this.begin();
  this.addArgument('buffer');

  // Storage for data.
  // Would be nice to avoid this or do it more compactly.
  this.append('var value = {};');

  // Parse data arguments.
  for (var n = 0; n < eventType.args.length; n++) {
    var arg = eventType.args[n];
    var targetName = 'value["' + arg.name + '"]';
    this.append(arg.getReadSource(this.bufferNames_, targetName) + ';');
  }

  this.append('return value;');

  return this.end(eventType.toString());
};
