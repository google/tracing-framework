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
goog.require('wtf.timing');



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
  wtf.timing.setTimeout(0, function() {
    returnBufferCallback.call(opt_selfObj, buffer);
  });
};


/**
 * @override
 */
wtf.io.NullWriteStream.prototype.flush = function() {
};
