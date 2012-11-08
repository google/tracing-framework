/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Analysis session instance.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.Session');

goog.require('goog.Disposable');
goog.require('wtf.analysis.sources.BinaryTraceSource');
goog.require('wtf.io.MemoryReadStream');



/**
 * An active analysis session.
 * Sessions manage analysis control and aggregate event data.
 *
 * @param {!wtf.analysis.TraceListener} traceListener Trace listener target.
 * @param {!Object} options Options object.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.analysis.Session = function(traceListener, options) {
  goog.base(this);

  /**
   * Trace listener.
   * Receives events from streams.
   * @type {!wtf.analysis.TraceListener}
   * @private
   */
  this.traceListener_ = traceListener;

  /**
   * All active trace sources, each modelling a stream.
   * They are all owned and will be disposed when the session ends.
   * @type {!Array.<!wtf.analysis.TraceSource>}
   * @private
   */
  this.traceSources_ = [];
};
goog.inherits(wtf.analysis.Session, goog.Disposable);


/**
 * Gets the target trace listener that receives events.
 * @return {!wtf.analysis.TraceListener} Target trace listener.
 */
wtf.analysis.Session.prototype.getTraceListener = function() {
  return this.traceListener_;
};


/**
 * Adds a trace source to the session.
 * @param {!wtf.analysis.TraceSource} traceSource Trace source to add to the
 *     session.
 */
wtf.analysis.Session.prototype.addTraceSource = function(traceSource) {
  // Add to session.
  this.traceSources_.push(traceSource);
  this.registerDisposable(traceSource);
};


/**
 * Adds a streaming source.
 * @param {!wtf.io.ReadStream} stream Read stream.
 */
wtf.analysis.Session.prototype.addStreamingSource = function(stream) {
  this.addTraceSource(new wtf.analysis.sources.BinaryTraceSource(
      this.getTraceListener(), stream));
};


/**
 * Adds a binary data source as an immediately-available stream.
 * @param {!wtf.io.ByteArray} data Input data.
 */
wtf.analysis.Session.prototype.addBinarySource = function(data) {
  // Create a stream wrapper for the input data.
  var readStream = new wtf.io.MemoryReadStream();
  readStream.addData(data);
  this.addTraceSource(new wtf.analysis.sources.BinaryTraceSource(
      this.getTraceListener(), readStream));
};


/**
 * Adds a JSON data source as an immediately-available stream.
 * @param {!Object} data Input data.
 */
wtf.analysis.Session.prototype.addJsonSource = function(data) {
  // TODO(benvanik): JSON sources
  throw Error('Session.addJsonSource not implemented');
};
