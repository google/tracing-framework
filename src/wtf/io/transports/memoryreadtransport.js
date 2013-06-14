/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Memory read transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.MemoryReadTransport');

goog.require('goog.asserts');
goog.require('goog.fs.FileReader');
goog.require('wtf.io.Blob');
goog.require('wtf.io.DataFormat');
goog.require('wtf.io.ReadTransport');
goog.require('wtf.timing');



/**
 * Read-only memory transport base type.
 * Uses enforced waits on dispatch to mimic a real async transport.
 *
 * @constructor
 * @extends {wtf.io.ReadTransport}
 */
wtf.io.transports.MemoryReadTransport = function() {
  goog.base(this);

  /**
   * Whether a dispatch is pending.
   * Used to prevent duplicate timeouts.
   * @type {boolean}
   * @private
   */
  this.dispatchPending_ = false;

  /**
   * Data waiting to be dispatched.
   * @type {!Array.<!wtf.io.BlobData>}
   * @private
   */
  this.pendingData_ = [];

  /**
   * Number of pending async adds.
   * @type {number}
   * @private
   */
  this.pendingAdds_ = 0;

  /**
   * Whether all data has been added and the transport is ended.
   * This is used to wait on emitting the end event until all data has been
   * dispatched.
   * @type {boolean}
   * @private
   */
  this.pendingEnd_ = false;
};
goog.inherits(wtf.io.transports.MemoryReadTransport, wtf.io.ReadTransport);


/**
 * Pretend this is an async transport by using timed waits between all read
 * events. This slows things down a bit but makes it easier to detect code paths
 * that assume synchronous event dispatch.
 * @type {boolean}
 * @const
 * @private
 */
wtf.io.transports.MemoryReadTransport.PRETEND_ASYNC_ = true;


/**
 * @override
 */
wtf.io.transports.MemoryReadTransport.prototype.resume = function() {
  goog.base(this, 'resume');
  this.scheduleDispatch_();
};


/**
 * @override
 */
wtf.io.transports.MemoryReadTransport.prototype.end = function() {
  this.pendingEnd_ = true;
  this.scheduleDispatch_();
};


/**
 * Adds more data to the transport.
 * The event dispatch are scheduled asynchronously.
 * @param {!wtf.io.BlobData} data Blob data.
 */
wtf.io.transports.MemoryReadTransport.prototype.addData = function(data) {
  // If the data is in blob form we need to convert it first.
  if (wtf.io.Blob.isBlob(data)) {
    data = /** @type {!Blob} */ (wtf.io.Blob.toNative(
        /** @type {!wtf.io.Blob} */ (data)));
  }
  if (goog.global['Blob'] && data instanceof Blob) {
    switch (this.format) {
      case wtf.io.DataFormat.STRING:
        this.pendingAdds_++;
        goog.fs.FileReader.readAsText(data).addCallback(function(value) {
          this.pendingAdds_--;
          this.pendingData_.push(value);
          this.scheduleDispatch_();
        }, this);
        break;
      case wtf.io.DataFormat.ARRAY_BUFFER:
        this.pendingAdds_++;
        goog.fs.FileReader.readAsArrayBuffer(data).addCallback(function(value) {
          this.pendingAdds_--;
          this.pendingData_.push(value);
          this.scheduleDispatch_();
        }, this);
        break;
      case wtf.io.DataFormat.BLOB:
        this.pendingData_.push(data);
        this.scheduleDispatch_();
        break;
      default:
        goog.asserts.fail('Unknown data format.');
        break;
    }
  } else {
    // TODO(benvanik): other conversion modes.
    switch (this.format) {
      case wtf.io.DataFormat.STRING:
        goog.asserts.assert(typeof data == 'string');
        break;
      case wtf.io.DataFormat.ARRAY_BUFFER:
        goog.asserts.assert(
            data instanceof ArrayBuffer ||
            (data.buffer && data.buffer instanceof ArrayBuffer));
        break;
      case wtf.io.DataFormat.BLOB:
        goog.asserts.assert(data instanceof Blob);
        break;
      default:
        goog.asserts.fail('Unknown data format.');
        break;
    }
    this.pendingData_.push(data);
    this.scheduleDispatch_();
  }
};


/**
 * Schedules an async data dispatch.
 * @private
 */
wtf.io.transports.MemoryReadTransport.prototype.scheduleDispatch_ = function() {
  if (this.paused) {
    return;
  }
  if (this.dispatchPending_) {
    return;
  }
  this.dispatchPending_ = true;

  // Approximate async transports.
  if (wtf.io.transports.MemoryReadTransport.PRETEND_ASYNC_) {
    wtf.timing.setImmediate(this.dispatch_, this);
  } else {
    this.dispatch_();
  }
};


/**
 * Dispatches any pending data to the target.
 * @private
 */
wtf.io.transports.MemoryReadTransport.prototype.dispatch_ = function() {
  this.dispatchPending_ = false;
  if (this.paused) {
    return;
  }

  // If whoever is handling the data is also queuing up data, this will loop
  // forever...
  while (this.pendingData_.length) {
    var data = this.pendingData_.pop();
    this.emitReceiveData(data);
  }

  if (!this.pendingAdds_ &&
      !this.pendingData_.length &&
      this.pendingEnd_) {
    // Done!
    goog.dispose(this);
  }
};
