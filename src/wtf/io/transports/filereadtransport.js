/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview File read transport type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.FileReadTransport');

goog.require('wtf.io.ReadTransport');



/**
 * Read-only file transport base type.
 *
 * @constructor
 * @extends {wtf.io.ReadTransport}
 */
wtf.io.transports.FileReadTransport = function() {
  goog.base(this);

  //   /**
  //    * Whether a dispatch is pending.
  //    * Used to prevent duplicate timeouts.
  //    * @type {boolean}
  //    * @private
  //    */
  //   this.dispatchPending_ = false;

  //   /**
  //    * Data waiting to be dispatched.
  //    * @type {!Array.<!wtf.io.BlobData>}
  //    * @private
  //    */
  //   this.pendingData_ = [];

  //   // Add any initial data.
  //   if (opt_data) {
  //     this.pendingData_.push(opt_data);
  //   }

  //   // Schedule a dispatch if needed.
  //   if (this.pendingData_.length) {
  //     this.scheduleDispatch_();
  //   }
};
goog.inherits(wtf.io.transports.FileReadTransport, wtf.io.ReadTransport);


// /**
//  * @override
//  */
// wtf.io.transports.FileReadTransport.prototype.setEventTarget = function(
//     target) {
//   goog.base(this, 'setEventTarget', target);
//   this.scheduleDispatch_();
// };


// /**
//  * Adds more data to the transport.
//  * The event dispatch are scheduled asynchronously.
//  * @param {!wtf.io.BlobData} data Blob data.
//  */
// wtf.io.transports.FileReadTransport.prototype.addData = function(data) {
//   this.pendingData_.push(data);
//   this.scheduleDispatch_();
// };


// /**
//  * Schedules an async data dispatch.
//  * @private
//  */
// wtf.io.transports.FileReadTransport.prototype.scheduleDispatch_ = function() {
//   if (!this.target) {
//     return;
//   }
//   if (this.dispatchPending_) {
//     return;
//   }
//   this.dispatchPending_ = true;
//   wtf.timing.setImmediate(this.dispatch_, this);
// };


// /**
//  * Dispatches any pending data to the target.
//  * @private
//  */
// wtf.io.transports.FileReadTransport.prototype.dispatch_ = function() {
//   this.dispatchPending_ = false;
//   if (!this.target) {
//     return;
//   }

//   // If whoever is handling the data is also queuing up data, this will loop
//   // forever...
//   while (this.pendingData_.length) {
//     var data = this.pendingData_.pop();
//     this.target.dataReceived(data);
//   }
// };
