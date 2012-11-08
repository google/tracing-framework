/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview No-op write stream.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.NullWriteStream');

goog.require('wtf.io.WriteStream');



/**
 * No-op write stream.
 *
 * @constructor
 * @extends {wtf.io.WriteStream}
 */
wtf.io.NullWriteStream = function() {
  goog.base(this);
};
goog.inherits(wtf.io.NullWriteStream, wtf.io.WriteStream);


/**
 * @override
 */
wtf.io.NullWriteStream.prototype.write = function(
    buffer, returnBufferCallback, opt_selfObj) {
  // Always pretend the write occurs.
  return true;
};


/**
 * @override
 */
wtf.io.NullWriteStream.prototype.flush = function() {
};
