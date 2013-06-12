/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview No-op transport types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.transports.NullWriteTransport');

goog.require('wtf.io.WriteTransport');



/**
 * Write-only no-op transport base type.
 * @constructor
 * @extends {wtf.io.WriteTransport}
 */
wtf.io.transports.NullWriteTransport = function() {
  goog.base(this);
};
goog.inherits(wtf.io.transports.NullWriteTransport, wtf.io.WriteTransport);


/**
 * @override
 */
wtf.io.transports.NullWriteTransport.prototype.write = function(data) {
  // No-op.
};


/**
 * @override
 */
wtf.io.transports.NullWriteTransport.prototype.flush = function() {
  // No-op.
};
