/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Control service endpoint.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.background.ServiceEndpoint');

goog.require('goog.events');
goog.require('wtf.events.EventEmitter');



/**
 * Abstract service endpoint type.
 * Service endpoints listen on some channel and dispatch incoming messages.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.app.background.ServiceEndpoint = function() {
  goog.base(this);
};
goog.inherits(wtf.app.background.ServiceEndpoint, wtf.events.EventEmitter);


/**
 * Emits a new snapshot.
 * @param {string} contentType Snapshot content type.
 * @param {!Uint8Array} data Snapshot data.
 * @protected
 */
wtf.app.background.ServiceEndpoint.prototype.emitSnapshot = function(
    contentType, data) {
  this.emitEvent(wtf.app.background.ServiceEndpoint.EventType.SNAPSHOT,
      contentType, data);
};


/**
 * Emits a new streaming session.
 * @param {string} sessionId Session ID.
 * @param {string} streamId Stream ID.
 * @param {string} contentType Session content type.
 * @protected
 */
wtf.app.background.ServiceEndpoint.prototype.emitStreamCreated = function(
    sessionId, streamId, contentType) {
  this.emitEvent(wtf.app.background.ServiceEndpoint.EventType.STREAM_CREATED,
      sessionId, streamId, contentType);
};


/**
 * Emits a stream session data append.
 * @param {string} sessionId Session ID.
 * @param {string} streamId Stream ID.
 * @param {!wtf.io.ByteArray} data Data buffer.
 * @protected
 */
wtf.app.background.ServiceEndpoint.prototype.emitStreamAppended = function(
    sessionId, streamId, data) {
  this.emitEvent(wtf.app.background.ServiceEndpoint.EventType.STREAM_APPENDED,
      sessionId, streamId, data);
};


/**
 * Service endpoint events.
 * @enum {string}
 */
wtf.app.background.ServiceEndpoint.EventType = {
  /**
   * Incoming snapshot data.
   */
  SNAPSHOT: goog.events.getUniqueId('snapshot'),

  /**
   * New session stream created.
   * Receives the session ID, stream ID, and content type.
   */
  STREAM_CREATED: goog.events.getUniqueId('stream_created'),

  /**
   * Session stream data append.
   * Receives the session ID, stream ID, and the data buffer.
   */
  STREAM_APPENDED: goog.events.getUniqueId('stream_appended')
};
