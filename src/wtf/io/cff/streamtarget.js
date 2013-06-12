/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Stream target base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.StreamTarget');

goog.require('wtf.io.cff.StreamBase');



/**
 * Stream target abstract base type.
 * @param {!wtf.io.WriteTransport} transport Target write transport.
 * @constructor
 * @extends {wtf.io.cff.StreamBase}
 */
wtf.io.cff.StreamTarget = function(transport) {
  goog.base(this);

  /**
   * Write transport where data is written to.
   * @type {!wtf.io.WriteTransport}
   * @private
   */
  this.transport_ = transport;
};
goog.inherits(wtf.io.cff.StreamTarget, wtf.io.cff.StreamBase);


/**
 * @override
 */
wtf.io.cff.StreamTarget.prototype.disposeInternal = function() {
  goog.dispose(this.transport_);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the transport this stream is writing to.
 * @return {!wtf.io.WriteTransport} Transport.
 * @protected
 */
wtf.io.cff.StreamTarget.prototype.getTransport = function() {
  return this.transport_;
};


/**
 * Writes a chunk to the target.
 * The data is copied into the write buffer during this call and can be
 * modified/reused immediately afterwards.
 * @param {!wtf.io.cff.Chunk} chunk Chunk to write.
 */
wtf.io.cff.StreamTarget.prototype.writeChunk = goog.abstractMethod;


/**
 * Ends the stream and writes the stream epilogue.
 */
wtf.io.cff.StreamTarget.prototype.end = goog.abstractMethod;


/**
 * Event types for {@see wtf.io.cff.StreamTarget}.
 * @enum {string}
 */
wtf.io.cff.StreamTarget.EventType = {
};
