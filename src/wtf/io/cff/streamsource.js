/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Stream source base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.StreamSource');

goog.require('goog.events');
goog.require('wtf.io.ReadTransport');
goog.require('wtf.io.cff.StreamBase');



/**
 * Stream source abstract base type.
 * @param {!wtf.io.ReadTransport} transport Source read transport.
 * @constructor
 * @extends {wtf.io.cff.StreamBase}
 */
wtf.io.cff.StreamSource = function(transport) {
  goog.base(this);

  /**
   * Read transport where data is sourced from.
   * @type {!wtf.io.ReadTransport}
   * @private
   */
  this.transport_ = transport;

  this.transport_.addListener(
      wtf.io.ReadTransport.EventType.RECEIVE_DATA,
      function(data) {
        try {
          this.dataReceived(data);
        } catch (e) {
          this.emitErrorEvent(e);
        }
      }, this);
  this.transport_.addListener(
      wtf.io.ReadTransport.EventType.END,
      this.ended, this);
  this.transport_.addListener(
      wtf.io.ReadTransport.EventType.ERROR,
      this.emitErrorEvent, this);
};
goog.inherits(wtf.io.cff.StreamSource, wtf.io.cff.StreamBase);


/**
 * @override
 */
wtf.io.cff.StreamSource.prototype.disposeInternal = function() {
  goog.dispose(this.transport_);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the transport this stream is reading from.
 * @return {!wtf.io.ReadTransport} Transport.
 * @protected
 */
wtf.io.cff.StreamSource.prototype.getTransport = function() {
  return this.transport_;
};


/**
 * Resumes receiving data from the transport.
 */
wtf.io.cff.StreamSource.prototype.resume = function() {
  this.transport_.resume();
};


/**
 * Handles incoming data from the transport.
 * The data will be in the format preferred by the source, if one was set.
 * @param {!wtf.io.BlobData} data Blob data.
 * @protected
 */
wtf.io.cff.StreamSource.prototype.dataReceived = goog.abstractMethod;


/**
 * Handles incoming data source ends.
 * No more data will arrive after this.
 * @protected
 */
wtf.io.cff.StreamSource.prototype.ended = goog.nullFunction;


/**
 * Emits a chunk receive event.
 * @param {!wtf.io.cff.Chunk} chunk New chunk.
 * @protected
 */
wtf.io.cff.StreamSource.prototype.emitChunkReceivedEvent = function(chunk) {
  this.emitEvent(wtf.io.cff.StreamSource.EventType.CHUNK_RECEIVED, chunk);
};


/**
 * Emits an error event.
 * @param {!Error} e Error object.
 * @protected
 */
wtf.io.cff.StreamSource.prototype.emitErrorEvent = function(e) {
  this.emitEvent(wtf.io.cff.StreamSource.EventType.ERROR, e);
};


/**
 * Emits an end event.
 * @protected
 */
wtf.io.cff.StreamSource.prototype.emitEndEvent = function() {
  this.emitEvent(wtf.io.cff.StreamSource.EventType.END);
};


/**
 * Event types for {@see wtf.io.cff.StreamSource}.
 * @enum {string}
 */
wtf.io.cff.StreamSource.EventType = {
  /**
   * A new chunk was received from the source.
   * Args: [wtf.io.cff.Chunk].
   */
  CHUNK_RECEIVED: goog.events.getUniqueId('chunk_received'),

  /**
   * An error occurred in the underlying transport or while parsing.
   * Args: [error object].
   */
  ERROR: goog.events.getUniqueId('error'),

  /**
   * Stream ended and no more chunks will be received.
   * Args: [].
   */
  END: goog.events.getUniqueId('end')
};
