/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Transport abstract base types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.ReadTransport');

goog.require('goog.events');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.io.DataFormat');



/**
 * Read-only transport base type.
 * A transport is the lowest-level primitive for IO. It provides a normalized
 * reading/writing API for a resource such as a URL endpoint or file.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.io.ReadTransport = function() {
  goog.base(this);

  /**
   * Preferred data format used when passing data to targets.
   * @type {wtf.io.DataFormat}
   * @protected
   */
  this.format = wtf.io.DataFormat.STRING;

  /**
   * Whether the transport is paused.
   * @type {boolean}
   * @protected
   */
  this.paused = true;
};
goog.inherits(wtf.io.ReadTransport, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.io.ReadTransport.prototype.disposeInternal = function() {
  this.emitEndEvent();
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the preferred data format for data read from the transport.
 * @return {wtf.io.DataFormat} Data format value.
 */
wtf.io.ReadTransport.prototype.getPreferredFormat = function() {
  return this.format;
};


/**
 * Sets the preferred data format for data read from the transport.
 * @param {wtf.io.DataFormat} value Data format value.
 */
wtf.io.ReadTransport.prototype.setPreferredFormat = function(value) {
  this.format = value;
};


/**
 * Resumes receiving data.
 */
wtf.io.ReadTransport.prototype.resume = function() {
  this.paused = false;
};


/**
 * Signals that the transport will receive no more data.
 */
wtf.io.ReadTransport.prototype.end = function() {
  goog.dispose(this);
};


/**
 * Fires a progress event.
 * @param {number} loaded Loaded amount, in bytes.
 * @param {number} total Total amount, in bytes.
 * @protected
 */
wtf.io.ReadTransport.prototype.emitProgressEvent = function(loaded, total) {
  this.emitEvent(wtf.io.ReadTransport.EventType.PROGRESS, loaded, total);
};


/**
 * Fires an data receive event.
 * @param {!wtf.io.BlobData} data Data value.
 * @protected
 */
wtf.io.ReadTransport.prototype.emitReceiveData = function(data) {
  this.emitEvent(wtf.io.ReadTransport.EventType.RECEIVE_DATA, data);
};


/**
 * Fires an error event.
 * @param {!Error} e Error object.
 * @protected
 */
wtf.io.ReadTransport.prototype.emitErrorEvent = function(e) {
  this.emitEvent(wtf.io.ReadTransport.EventType.ERROR, e);
};


/**
 * Fires an end event.
 * @protected
 */
wtf.io.ReadTransport.prototype.emitEndEvent = function() {
  this.emitEvent(wtf.io.ReadTransport.EventType.END);
};


/**
 * Events fired by {@see wtf.io.ReadTransport}.
 * @enum {string}
 */
wtf.io.ReadTransport.EventType = {
  /**
   * Fires occasionally during load, but not guaranteed.
   * Args: [loaded bytes, total bytes].
   */
  PROGRESS: goog.events.getUniqueId('progress'),

  /**
   * Fires when a new data blob is received.
   * Args: [wtf.io.BlobData].
   */
  RECEIVE_DATA: goog.events.getUniqueId('receive_data'),

  /**
   * Fires when an error occurs.
   * Args: [error object].
   */
  ERROR: goog.events.getUniqueId('error'),

  /**
   * Fires when the transport has completed.
   * Args: [].
   */
  END: goog.events.getUniqueId('end')
};
